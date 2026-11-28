import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Set payload limit to 50mb to handle high-resolution PDF documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize GoogleGenAI SDK with required user-agent header
function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI PDF Schedule extraction endpoint
app.post('/api/ai/extract-schedule-pdf', async (req: Request, res: Response) => {
  try {
    const {
      pdfBase64,
      mimeType = 'application/pdf',
      fileName = 'jadwal.pdf',
      rawText,
      targetDayHint = '',
      customHint = '',
    } = req.body || {};

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({
        success: false,
        error: 'Harap sertakan file PDF jadwal atau teks jadwal terlebih dahulu.',
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi pada environment server.',
      });
    }

    let cleanBase64 = '';
    if (pdfBase64) {
      cleanBase64 = String(pdfBase64).replace(/^data:[^;]+;base64,/, '').trim();
      const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
      if (approxBytes > 20 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Ukuran file PDF melebihi batas maksimum 20 MB untuk analisis langsung AI. Mohon kompres atau pecah PDF per hari terlebih dahulu.',
        });
      }
    }

    const systemInstruction = `Anda adalah sistem ekstraksi jadwal simposium/konferensi/workshop medis dan ilmiah berpresisi tinggi.
Tugas Anda adalah membaca DOKUMEN PDF ATAU TEKS yang diberikan secara teliti dari HALAMAN PERTAMA HINGGA HALAMAN TERAKHIR, lalu mengekstrak SEMUA sesi secara AKURAT DAN APA ADANYA (VERBATIM) sesuai isi dokumen.

ATURAN WAJIB (SANGAT PENTING):
1. DILARANG MENGARANG DATA (STRICT FIDELITY):
   - Ekstrak HANYA sesi, judul, jam, tanggal, ruangan, pembicara, gelar, institusi, dan moderator yang BENAR-BENAR TERTULIS di dalam dokumen.
   - Jangan pernah mengganti nama ruangan, tanggal, atau pembicara dengan data contoh/asumsi dari luar dokumen.
   - Jika institusi, gelar tambahan, moderator, atau abstrak tidak tertulis di dokumen, biarkan sebagai string kosong "" atau array kosong [].
2. TABEL MULTI-KOLOM & SESI PARALEL:
   - Jadwal simposium umumnya berbentuk tabel dengan baris = slot waktu dan kolom = ruangan/track (misal: Ballroom A, Ballroom B, Room 1, Room 2, Foyer, dll).
   - Perhatikan header kolom ruangan dengan cermat! Setiap sel yang terisi pada kolom berbeda di slot waktu yang sama WAJIB dibuat menjadi objek sesi TERPISAH dengan nama ruangan sesuai kolomnya dan jam sesuai barisnya.
   - Jika satu sel digabung (merged cell) melintasi semua kolom (misal Registrasi, Opening Ceremony, Coffee Break, ISHOMA/Lunch, Plenary), buat 1 objek sesi dengan ruangan yang tertulis (atau "Main Hall / Ballroom" jika tidak tertulis).
3. SEMUA HALAMAN & SEMUA HARI:
   - Periksa seluruh halaman PDF dari awal sampai akhir. Jangan berhenti di halaman pertama atau memotong sesi di bagian bawah tabel.
   - Identifikasi label hari ("day") secara akurat sesuai dokumen:
     * Gunakan "Hari I" untuk Hari 1 / Day 1 / Hari Pertama
     * Gunakan "Hari II" untuk Hari 2 / Day 2 / Hari Kedua
     * Gunakan "Hari III" untuk Hari 3 / Day 3 / Hari Ketiga
     * Gunakan "Hari IV" untuk Hari 4 / Day 4 / Hari Keempat
     * Untuk pre-congress / workshop di hari terpisah, gunakan label yang jelas seperti "Workshop (28 Nov)" atau "Pre-Congress" sesuai tulisan di dokumen.
   - Catat tanggal lengkap ("date") persis seperti tertulis di dokumen (misal "Sabtu, 28 November 2026" atau "29 Nov 2026"). Jika tidak tertulis, isi "".
4. FORMAT WAKTU (24 JAM):
   - Konversi jam ke format "HH:mm" (contoh: "08.00" -> "08:00", "8.30" -> "08:30", "13.15" -> "13:15").
   - Isi "timeString" dengan format "HH:mm - HH:mm WIB" (atau gunakan zona waktu WITA/WIT jika tertulis di dokumen).
   - Jika hanya ada jam mulai tanpa jam selesai (misal "19.00 - selesai"), perkirakan endTime secara wajar atau tulis jam selesai berdasarkan baris berikutnya, dan pertahankan teks asli di timeString jika perlu.
5. PEMBICARA & MODERATOR:
   - Ekstrak semua nama pembicara secara verbatim lengkap dengan gelar depan & belakang (Prof., Dr., dr., drh., Sp.B, Ph.D, DVM, dll).
   - Jika dalam 1 sesi terdapat lebih dari 1 pembicara/panelis, masukkan SEMUANYA ke array "speakers".
   - Jika sesi adalah Registrasi, Coffee Break, Lunch/ISHOMA, atau pameran tanpa pembicara, biarkan "speakers": [].
6. TIPE SESI ("type"):
   - Pilih salah satu yang paling sesuai: "Plenary Session", "Simposium Paralel", "Workshop Hands-On", "Keynote Lecture", "Panel Discussion".
7. ABSTRAK / SUB-MATERI:
   - Jika satu blok sesi memiliki daftar sub-topik / poin bahasan di dalam sel, masukkan ke "abstract.clinicalUpdates". Jika tidak ada abstrak/sub-topik di PDF, biarkan "abstract.background": "" dan "abstract.clinicalUpdates": [].`;

    const extraHints: string[] = [];
    if (targetDayHint && targetDayHint !== 'auto') {
      extraHints.push(
        `PETUNJUK HARI DARI ADMIN: Jika dokumen tidak menyebutkan pembagian hari secara eksplisit, gunakan "${targetDayHint}" sebagai nilai field "day" untuk sesi di dokumen ini.`
      );
    }
    if (customHint && String(customHint).trim()) {
      extraHints.push(`CATATAN TAMBAHAN DARI ADMIN: ${String(customHint).trim()}`);
    }

    const promptText = [
      `Ekstrak SEMUA sesi jadwal dari dokumen "${fileName}" secara lengkap, berurutan dari jam paling pagi hingga paling malam di setiap hari dan setiap halaman.`,
      `Pastikan setiap kolom ruangan paralel pada jam yang sama diekstrak sebagai sesi terpisah dengan ruangan, jam, judul, dan nama pembicara yang 100% sesuai isi dokumen.`,
      ...extraHints,
    ].join('\n\n');

    const contents: any[] = [];
    if (cleanBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      });
      contents.push({
        text: promptText,
      });
    } else {
      contents.push({
        text: `${promptText}\n\nTeks Dokumen Jadwal Lengkap:\n${rawText}`,
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        eventName: { type: Type.STRING, description: 'Nama acara/simposium sesuai judul di dokumen (kosongkan jika tidak tertulis)' },
        eventDate: { type: Type.STRING, description: 'Rentang atau tanggal kegiatan sesuai dokumen (kosongkan jika tidak tertulis)' },
        venue: { type: Type.STRING, description: 'Nama lokasi/hotel/gedung sesuai dokumen (kosongkan jika tidak tertulis)' },
        summary: { type: Type.STRING, description: 'Ringkasan singkat dalam bahasa Indonesia mengenai jumlah sesi, hari, dan ruangan yang ditemukan di dokumen' },
        detectedRooms: {
          type: Type.ARRAY,
          description: 'Daftar unik ruangan/hall yang benar-benar muncul pada dokumen',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              shortName: { type: Type.STRING },
              floor: { type: Type.STRING },
              capacity: { type: Type.INTEGER },
            },
            required: ['name'],
          },
        },
        detectedSpeakers: {
          type: Type.ARRAY,
          description: 'Daftar unik pembicara/narasumber yang benar-benar muncul pada dokumen',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              institution: { type: Type.STRING },
              specialty: { type: Type.STRING },
            },
            required: ['name'],
          },
        },
        sessions: {
          type: Type.ARRAY,
          description: 'Daftar lengkap semua sesi dari seluruh halaman, hari, dan kolom ruangan paralel dalam dokumen',
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: 'Label hari, misal: "Hari I", "Hari II", "Hari III", "Workshop (28 Nov)", atau "Pre-Congress"' },
              date: { type: Type.STRING, description: 'Tanggal sesi persis seperti di dokumen, misal "Minggu, 29 November 2026"' },
              startTime: { type: Type.STRING, description: 'Jam mulai format 24 jam HH:mm, misal "08:00"' },
              endTime: { type: Type.STRING, description: 'Jam selesai format 24 jam HH:mm, misal "09:30"' },
              timeString: { type: Type.STRING, description: 'Rentang waktu, misal "08:00 - 09:30 WIB"' },
              title: { type: Type.STRING, description: 'Judul/nama kegiatan atau topik sesi persis sesuai dokumen' },
              category: { type: Type.STRING, description: 'Kategori/track/bidang topik jika tertulis di dokumen' },
              type: { type: Type.STRING, description: 'Salah satu: Plenary Session, Simposium Paralel, Workshop Hands-On, Keynote Lecture, Panel Discussion' },
              room: { type: Type.STRING, description: 'Nama ruangan/hall persis sesuai header kolom atau keterangan di dokumen' },
              floor: { type: Type.STRING, description: 'Lantai ruangan jika tertulis di dokumen, kosongkan jika tidak ada' },
              moderator: { type: Type.STRING, description: 'Nama moderator jika tertulis di dokumen, kosongkan jika tidak ada' },
              speakers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Nama lengkap pembicara beserta gelar sesuai dokumen' },
                    title: { type: Type.STRING, description: 'Jabatan/gelar singkat jika tertulis di dokumen' },
                    institution: { type: Type.STRING, description: 'Institusi/asal rumah sakit/universitas jika tertulis di dokumen' },
                    specialty: { type: Type.STRING, description: 'Bidang spesialisasi jika tertulis di dokumen' },
                    talkTitle: { type: Type.STRING, description: 'Judul materi spesifik pembicara jika berbeda dari judul sesi' },
                  },
                  required: ['name'],
                },
              },
              abstract: {
                type: Type.OBJECT,
                properties: {
                  background: { type: Type.STRING },
                  clinicalUpdates: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  conclusion: { type: Type.STRING },
                },
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'startTime', 'endTime', 'room', 'day'],
          },
        },
      },
      required: ['sessions'],
    };

    // Active Gemini models: gemini-4-hydrogen (multimodal PDF table understanding), fallback to gemini-3.1-flash-lite
    const modelAttempts: Array<{ name: string; thinkingLevel?: ThinkingLevel }> = [
      { name: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.MEDIUM },
      { name: 'gemini-3.1-flash-lite' },
    ];

    let lastError: any = null;
    let responseText = '';
    let usedModel = '';

    for (const attempt of modelAttempts) {
      try {
        const config: any = {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens: 32768,
        };
        if (attempt.thinkingLevel) {
          config.thinkingConfig = { thinkingLevel: attempt.thinkingLevel };
        }

        const response = await ai.models.generateContent({
          model: attempt.name,
          contents,
          config,
        });

        responseText = response.text || '';
        if (responseText.trim()) {
          usedModel = attempt.name;
          console.log(`AI PDF schedule extraction succeeded using model: ${attempt.name}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${attempt.name} failed during PDF extraction:`, err?.message || err);
        lastError = err;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!responseText.trim()) {
      throw lastError || new Error('AI tidak mengembalikan hasil ekstraksi dari file PDF tersebut.');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsedData = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } else {
        throw new Error('Respons AI tidak berformat JSON yang valid. Coba ulangi ekstraksi atau pecah PDF jika halamannya terlalu banyak.');
      }
    }

    if (Array.isArray(parsedData)) {
      parsedData = { sessions: parsedData };
    } else if (!parsedData.sessions && Array.isArray(parsedData.jadwal)) {
      parsedData.sessions = parsedData.jadwal;
    } else if (!parsedData.sessions && parsedData.data) {
      parsedData.sessions = Array.isArray(parsedData.data)
        ? parsedData.data
        : parsedData.data.sessions || [];
    }

    if (!Array.isArray(parsedData.sessions) || parsedData.sessions.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'AI tidak menemukan daftar sesi jadwal di dalam PDF tersebut. Pastikan PDF berisi teks atau gambar tabel jadwal yang terbaca jelas.',
      });
    }

    return res.json({
      success: true,
      data: parsedData,
      usedModel,
    });
  } catch (error: any) {
    console.error('Error during AI schedule extraction:', error);
    const msg = String(error?.message || '');
    const status = Number(error?.status || error?.statusCode || 0);

    if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) {
      return res.status(429).json({
        success: false,
        error: 'Batas permintaan AI Gemini sedang tercapai (rate limit/kuota). Mohon tunggu beberapa saat lalu coba ekstrak kembali.',
      });
    }

    if (status === 400 || msg.toLowerCase().includes('invalid argument') || msg.toLowerCase().includes('unable to process input')) {
      return res.status(400).json({
        success: false,
        error: 'File PDF tidak dapat diproses oleh AI (kemungkinan file rusak, terenkripsi/terproteksi password, atau format tidak standar).',
      });
    }

    return res.status(500).json({
      success: false,
      error: msg || 'Gagal mengekstrak jadwal dari file PDF dengan AI. Silakan coba kembali.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
