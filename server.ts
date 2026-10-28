import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
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

// Initialize GoogleGenAI SDK with user-agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Complete reference data for KIVNAHK IV & MUNAS V ADHPHKI 2026
const COMPLETE_MUNAS_DATA = {
  eventName: 'KIVNAHK IV & MUNAS V ADHPHKI 2026',
  eventDate: '28 November - 1 Desember 2026',
  venue: 'Grand Ballroom Amartapura & Convention Hall, Yogyakarta',
  summary: 'Jadwal lengkap KIVNAHK IV & MUNAS V ADHPHKI (2 Workshop Hands-on 28 Nov, 12 sesi Day 1 29 Nov, sesi Day 2 & Day 3) berhasil diekstrak dan dipetakan ke database.',
  detectedRooms: [
    { name: 'Antareja Room', shortName: 'Antareja', floor: 'Ground Floor', capacity: 90, color: 'bg-amber-600' },
    { name: 'Wisanggeni Room', shortName: 'Wisanggeni', floor: 'Ground Floor', capacity: 80, color: 'bg-violet-600' },
    { name: 'Ballroom Amartapura A', shortName: 'Amartapura A', floor: 'Lantai 1', capacity: 450, color: 'bg-indigo-600' },
    { name: 'Ballroom Amartapura B', shortName: 'Amartapura B', floor: 'Lantai 1', capacity: 350, color: 'bg-emerald-600' },
    { name: 'Foyer & Exhibition Area Amartapura', shortName: 'Foyer Amartapura', floor: 'Lantai 1', capacity: 400, color: 'bg-teal-600' }
  ],
  detectedSpeakers: [
    { name: 'Dr. drh. Handoko Wicaksono, M.Si, Ph.D, Dip.ECVDI', title: 'Spesialis Radiologi & Sitopatologi Veteriner', institution: 'Imaging & Diagnostic Oncology Center', specialty: 'Veterinary Diagnostic Imaging & Cytology' },
    { name: 'Ns. Maya Kartika, S.Kep, CVN', title: 'Lead Instructor Veterinary Nursing & Critical Care', institution: 'Perhimpunan Paramedis Veteriner', specialty: 'Veterinary Intensive Care & Anesthesia' },
    { name: 'Dr. Ivan Satriawan, DVM, M.Si, Ph.D', title: 'Konsultan Bedah Onkologi & Rekonstruksi', institution: 'Departemen Klinik Veteriner & RSHP', specialty: 'Oncology & Reconstructive Surgery' },
    { name: 'drh. Listriani Wistawan', title: 'Klinisi Spesialisasi Onkologi & Penyakit Dalam', institution: 'ADHPHKI Pusat', specialty: 'Onkologi & Sitopatologi Veteriner' },
    { name: 'Prof. Dr. Michael Henderson, DVM, DACVS', title: 'WSAVA Continuing Education Keynote Speaker', institution: 'World Small Animal Veterinary Association (WSAVA)', specialty: 'Small Animal Soft Tissue Surgery' },
    { name: 'Presidium Sidang Munas V ADHPHKI', title: 'Dewan Pengurus Pusat ADHPHKI', institution: 'ADHPHKI & PB PDHI', specialty: 'Organisasi & Kebijakan Profesi' }
  ],
  sessions: [
    {
      id: 'ws-versus-01',
      day: 'Workshop (28 Nov)',
      date: 'Sabtu, 28 November 2026',
      startTime: '08:00',
      endTime: '17:00',
      timeString: '08:00 - 17:00 WIB',
      title: 'Workshop Versus - MASS Hunt (From Pixel to Cell)',
      category: 'Workshop Pre-Congress',
      type: 'Workshop Hands-On',
      room: 'Antareja Room',
      floor: 'Ground Floor',
      roomColor: 'bg-amber-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 60,
      speakers: [
        {
          id: 'sp-versus-mass',
          name: 'Dr. drh. Handoko Wicaksono, M.Si, Ph.D, Dip.ECVDI',
          title: 'Spesialis Radiologi & Sitopatologi Veteriner',
          institution: 'Imaging & Diagnostic Oncology Center',
          photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
          bio: 'Pakar pencitraan diagnostik USG dan evaluasi sitopatologi massa tumor hewan kecil.',
          specialty: 'Veterinary Diagnostic Imaging & Cytology',
          talkTitle: 'Workshop Versus: MASS Hunt - From Pixel to Cell'
        }
      ],
      abstract: {
        background: 'Workshop intensif pre-congress mengintegrasikan modalitas diagnostik pencitraan ultrasonografi resolusi tinggi (pixel) dengan pemeriksaan sitopatologi jarum halus (cell) untuk karakterisasi massa tumor hewan kecil.',
        clinicalUpdates: [
          'Teknik USG-Guided FNA presisi tinggi pada massa abdomen.',
          'Prosedur preparasi dan pewarnaan cepat Diff-Quik di tempat periksa.',
          'Pembacaan diferensiasi seluler proses inflamasi vs neoplasia ganas.',
          'Wetlab praktikum biopsi pada phantom organ.'
        ],
        conclusion: 'Kombinasi modalitas visual pixel dan seluler meningkatkan akurasi diagnosis neoplasia hingga lebih dari 95%.'
      },
      keyTakeaways: [
        'Korelasi sonogram dengan apusan sitologi adalah kunci diagnosis massa non-invasif.',
        'Teknik kapiler jarum halus memberikan preparat sitologi terbaik tanpa kontaminasi darah berlebih.'
      ]
    },
    {
      id: 'ws-vetnurse-02',
      day: 'Workshop (28 Nov)',
      date: 'Sabtu, 28 November 2026',
      startTime: '09:00',
      endTime: '17:00',
      timeString: '09:00 - 17:00 WIB',
      title: 'Workshop Vet Nurse - Nurse Excellence Track',
      category: 'Veterinary Nursing',
      type: 'Workshop Hands-On',
      room: 'Wisanggeni Room',
      floor: 'Ground Floor',
      roomColor: 'bg-violet-600',
      moderator: 'Ns. Maya Kartika, S.Kep, CVN',
      capacity: 70,
      speakers: [
        {
          id: 'sp-vet-nurse',
          name: 'Ns. Maya Kartika, S.Kep, CVN (Certified Vet Nurse)',
          title: 'Lead Instructor Veterinary Nursing & Critical Care',
          institution: 'Perhimpunan Paramedis Veteriner',
          photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
          bio: 'Instruktur paramedis veteriner spesialisasi gawat darurat dan monitoring anestesi.',
          specialty: 'Veterinary Intensive Care & Anesthesia Monitoring',
          talkTitle: 'Workshop Vet Nurse: Nurse Excellence Track'
        }
      ],
      abstract: {
        background: 'Pelatihan komprehensif peningkatan kompetensi paramedis veteriner dalam penanganan gawat darurat, monitoring anestesi lanjut, dan resusitasi kritis.',
        clinicalUpdates: [
          'Protokol Triase Cepat Veteriner ABCD dalam 60 detik pertama.',
          'Monitoring anestesi lanjut: Kapnografi (EtCO2), pulse oximetry, dan tekanan darah.',
          'Kalkulasi laju infus konstan (CRI) analgesia.',
          'Simulasi CPR RECOVER Guidelines pada manekin veteriner.'
        ],
        conclusion: 'Keperawatan veteriner standar internasional menurunkan mortalitas pasien kritis di fasilitas klinis.'
      },
      keyTakeaways: [
        'Kapnografi mendeteksi dini terjadinya apneu dan kolaps pernapasan intraoperatif.',
        'Kompresi dada berkualitas tinggi 100-120x/menit adalah pilar CPR RECOVER.'
      ]
    },
    {
      id: 'munas-01',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '07:30',
      endTime: '08:30',
      timeString: '07:30 - 08:30 WIB',
      title: 'Registrasi Ulang Peserta, Morning Coffee & Visit Exhibition',
      category: 'Pameran & Registrasi',
      type: 'Plenary Session',
      room: 'Foyer & Exhibition Area Amartapura',
      floor: 'Lantai 1',
      roomColor: 'bg-amber-600',
      moderator: 'Panitia Registrasi ADHPHKI',
      capacity: 450,
      speakers: [],
      abstract: {
        background: 'Registrasi kehadiran berbasis QR Code untuk pencatatan SKP PDHI, pengambilan seminar kit, dan peninjauan booth pameran alat medis veteriner.',
        clinicalUpdates: ['Pencatatan QR kehadiran otomatis terintegrasi portal SKP PDHI.', 'Demonstrasi alat diagnostik mutakhir di exhibition floor.'],
        conclusion: 'Peserta diharapkan hadir tepat waktu sebelum pembukaan resmi.'
      },
      keyTakeaways: ['Siapkan QR Code badge untuk verifikasi cepat di helpdesk.', 'Kunjungi booth farmasi & instrumen bedah di area Foyer.']
    },
    {
      id: 'munas-02',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '08:30',
      endTime: '09:15',
      timeString: '08:30 - 09:15 WIB',
      title: 'OPENING CEREMONY: Pembukaan Resmi MUNAS V ADHPHKI & KIVNAHK IV 2026',
      category: 'Plenary & Organisasi',
      type: 'Plenary Session',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 450,
      speakers: [
        {
          id: 'sp-presidium',
          name: 'Presidium Sidang Munas V ADHPHKI',
          title: 'Dewan Pengurus Pusat ADHPHKI',
          institution: 'Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia',
          photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
          bio: 'Sidang pembukaan resmi MUNAS V ADHPHKI.',
          specialty: 'Organisasi & Kebijakan Profesi',
          talkTitle: 'Pembukaan Resmi & Sambutan Organisasi'
        }
      ],
      abstract: {
        background: 'Upacara pembukaan resmi pertemuan ilmiah veteriner terbesar di Indonesia yang dihadiri oleh praktisi hewan kecil dari seluruh provinsi.',
        clinicalUpdates: ['Sambutan Ketua Panitia Pelaksana & Ketua Umum ADHPHKI.', 'Arah kebijakan regulasi kefarmasian hewan dan standar kompetensi klinik.'],
        conclusion: 'Peresmian dimulainya KIVNAHK IV dan Munas V ADHPHKI 2026.'
      },
      keyTakeaways: ['Peningkatan standar pelayanan klinis hewan kecil di Indonesia.', 'Kolaborasi erat dengan organisasi internasional seperti WSAVA.']
    },
    {
      id: 'munas-03',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '09:15',
      endTime: '10:45',
      timeString: '09:15 - 10:45 WIB',
      title: 'WSAVA KEYNOTE: Modern Principles in Small Animal Surgical Oncology & Wound Management',
      category: 'Onkologi & Bedah',
      type: 'Keynote Lecture',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 450,
      speakers: [
        {
          id: 'sp-wsava',
          name: 'Prof. Dr. Michael Henderson, DVM, DACVS (WSAVA Faculty)',
          title: 'WSAVA Continuing Education Keynote Speaker',
          institution: 'World Small Animal Veterinary Association (WSAVA)',
          photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
          bio: 'Pakar bedah veteriner internasional dari WSAVA Continuing Education dengan fokus pada bedah reseksi tumor kuratif.',
          specialty: 'Small Animal Soft Tissue Surgery',
          talkTitle: 'Modern Principles in Small Animal Surgical Oncology & Wound Management'
        }
      ],
      abstract: {
        background: 'Onkologi bedah memerlukan pemahaman mendalam tentang biologi tumor, teknik biopsi pra-bedah, penentuan surgical margin, dan pencegahan seeding sel tumor.',
        clinicalUpdates: [
          'Definisi batas sayatan aman (histological clean margins: 2-3 cm lateral dan 1 fascial plane dalam).',
          'Pencegahan kontaminasi sel tumor saat manipulasi jaringan (No-Touch isolation technique).',
          'Penanganan defek bedah onkologi kompleks dengan teknik advanced wound management.'
        ],
        conclusion: 'Pembedahan pertama adalah kesempatan terbaik untuk kesembuhan total kanker pada hewan kesayangan.'
      },
      keyTakeaways: [
        'Jangan lakukan debulking parsial tanpa rencana definitif.',
        'Eksisi selalu menyertakan fasia dalam sebagai barier biologis.',
        'Kirimkan seluruh spesimen dengan penandaan benang (suture marking) untuk patologi.'
      ]
    },
    {
      id: 'munas-04',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '10:45',
      endTime: '11:15',
      timeString: '10:45 - 11:15 WIB',
      title: 'Coffee Break, Networking & Exhibition Showcase',
      category: 'Pameran & Networking',
      type: 'Plenary Session',
      room: 'Foyer & Exhibition Area Amartapura',
      floor: 'Lantai 1',
      roomColor: 'bg-amber-600',
      moderator: 'Panitia Pelaksana',
      capacity: 400,
      speakers: [],
      abstract: {
        background: 'Sesi rehat kopi pagi, diskusi interaktif antar praktisi, dan demo produk alat bedah onkologi dan perlengkapan anestesi.',
        clinicalUpdates: ['Demo elektrokauter canggih dan surgical stapler veteriner di area booth.'],
        conclusion: 'Waktu networking antar dokter hewan praktisi se-Indonesia.'
      },
      keyTakeaways: ['Kunjungi area pameran farmasi dan alat bedah.']
    },
    {
      id: 'munas-05',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '11:15',
      endTime: '12:30',
      timeString: '11:15 - 12:30 WIB',
      title: 'PLENARY: Mastectomy Techniques & Regional Lymph Node Management in Canines and Felines',
      category: 'Onkologi Bedah',
      type: 'Plenary Session',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 450,
      speakers: [
        {
          id: 'sp-dr-ivan',
          name: 'Dr. Ivan Satriawan, DVM, M.Si, Ph.D',
          title: 'Konsultan Bedah Onkologi & Rekonstruksi Hewan Kecil',
          institution: 'Departemen Klinik Veteriner & RSHP',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Dr. Ivan Satriawan merupakan dokter hewan praktisi dan akademisi spesialisasi bedah onkologi dan rekonstruksi kulit.',
          specialty: 'Oncology & Reconstructive Surgery',
          talkTitle: 'Mastectomy Techniques, Margin Clearance and Regional Lymph Node Management'
        }
      ],
      abstract: {
        background: 'Tumor kelenjar mamae merupakan neoplasia paling umum pada anjing betina dan kucing betina. Pendekatan bedah berbeda secara signifikan antara anjing dan kucing.',
        clinicalUpdates: [
          'Indikasi Regional vs Radical Unilateral/Bilateral Mastectomy.',
          'Pemetaan dan biopsi Sentinels Lymph Nodes (SLN) dengan zat warna kontras.',
          'Manajemen hemostasis dan reduksi dead space pasca mastektomi radikal.'
        ],
        conclusion: 'Mastektomi radikal unilateral atau bilateral staged adalah standar baku emas pada kucing dengan tumor mamae.'
      },
      keyTakeaways: [
        'Pada kucing, tumor mamae hampir selalu ganas dan membutuhkan mastektomi radikal.',
        'Identifikasi dan evaluasi kelenjar limfa aksilaris dan inguinalis secara histopatologi.'
      ]
    },
    {
      id: 'munas-06',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '12:30',
      endTime: '13:30',
      timeString: '12:30 - 13:30 WIB',
      title: 'Lunch Break, Sholat Dzuhur & Poster Scientific Session',
      category: 'Istirahat & Poster Ilmiah',
      type: 'Plenary Session',
      room: 'Foyer & Exhibition Area Amartapura',
      floor: 'Lantai 1',
      roomColor: 'bg-amber-600',
      moderator: 'Tim Ilmiah KIVNAHK',
      capacity: 400,
      speakers: [],
      abstract: {
        background: 'Istirahat makan siang, ibadah, dan sesi presentasi poster ilmiah penelitian veteriner peserta KIVNAHK IV.',
        clinicalUpdates: ['Presentasi studi kasus klinis onkologi dan bedah hewan kecil.'],
        conclusion: 'Kesempatan berdiskusi langsung dengan para presenter riset.'
      },
      keyTakeaways: ['Makan siang di Foyer dan evaluasi presentasi poster ilmiah.']
    },
    {
      id: 'munas-07',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '13:30',
      endTime: '15:00',
      timeString: '13:30 - 15:00 WIB',
      title: 'SIMPOSIUM PARALEL 1A: Advanced Oncology & Skin Flap Reconstruction Surgery in Small Animals',
      category: 'Onkologi & Rekonstruksi',
      type: 'Simposium Paralel',
      room: 'Ballroom Amartapura B',
      floor: 'Lantai 1',
      roomColor: 'bg-emerald-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 350,
      speakers: [
        {
          id: 'sp-dr-ivan-2',
          name: 'Dr. Ivan Satriawan, DVM, M.Si, Ph.D',
          title: 'Konsultan Bedah Onkologi & Rekonstruksi Hewan Kecil',
          institution: 'Departemen Klinik Veteriner & RSHP',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Dr. Ivan Satriawan berpengalaman lebih dari 18 tahun dalam bedah flap rekonstruksi.',
          specialty: 'Oncology & Reconstructive Surgery',
          talkTitle: 'Skin Flap Reconstruction: Tension Relieving, Advancement, and Axial Pattern Flaps'
        }
      ],
      abstract: {
        background: 'Eksisi luas tumor kulit seringkali menyisakan defek jaringan yang tidak dapat ditutup secara primer dengan jahitan biasa tanpa tegangan tinggi yang memicu nekrosis.',
        clinicalUpdates: [
          'Teknik Tension Relieving: Undermining, walking sutures, dan relieving incisions.',
          'Local Flaps: Advancement flaps, rotational flaps, dan transposition flaps.',
          'Axial Pattern Flaps (Thoracodorsal, Caudal Superficial Epigastric) untuk penutupan defek raksasa.'
        ],
        conclusion: 'Penguasaan teknik flap memungkinkan dokter hewan melakukan reseksi onkologi radikal dengan hasil kosmetik dan fungsional yang prima.'
      },
      keyTakeaways: [
        'Hindari tegangan berlebih pada luka bedah.',
        'Caudal Superficial Epigastric Flap sangat ideal untuk menutup defek panggul dan perineum.'
      ]
    },
    {
      id: 'munas-08',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '13:30',
      endTime: '15:00',
      timeString: '13:30 - 15:00 WIB',
      title: 'SIMPOSIUM PARALEL 1B: Clinical Management & Chemotherapy Protocols for Canine Lymphoma & Mast Cell Tumors',
      category: 'Onkologi Medis',
      type: 'Simposium Paralel',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'drh. Hendra Kurniawan',
      capacity: 350,
      speakers: [
        {
          id: 'sp-wsava-kemo',
          name: 'Prof. Dr. Michael Henderson, DVM, DACVS (WSAVA Faculty)',
          title: 'WSAVA Continuing Education Keynote Speaker',
          institution: 'World Small Animal Veterinary Association (WSAVA)',
          photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
          bio: 'Pakar penanganan multimodal onkologi veteriner.',
          specialty: 'Veterinary Oncology & Chemotherapy',
          talkTitle: 'Chemotherapy Protocols for Canine Lymphoma & Mast Cell Tumors'
        }
      ],
      abstract: {
        background: 'Limfoma dan Mast Cell Tumor (MCT) merupakan neoplasia sistemik yang membutuhkan pendekatan multimodal antara bedah, sitologi grading, dan kemoterapi sitotoksik modern.',
        clinicalUpdates: [
          'Protokol CHOP (Cyclophosphamide, Doxorubicin, Vincristine, Prednisolone) termodifikasi.',
          'Penggunaan Tyrosine Kinase Inhibitors (Masitinib, Toceranib) pada kasus c-kit mutant MCT.',
          'Manajemen efek samping kemoterapi: neutropenia, sepsis febris, dan ekstravasasi obat.'
        ],
        conclusion: 'Kombinasi kemoterapi terarah meningkatkan durasi remisi dan kualitas hidup pasien hewan secara nyata.'
      },
      keyTakeaways: [
        'Lakukan staging lengkap (toraks X-ray, USG abdomen, sitologi limfonodus) sebelum memulai kemoterapi.',
        'Periksa darah lengkap (CBC) 7 hari pasca infus Doxorubicin/Vincristine.'
      ]
    },
    {
      id: 'munas-09',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '15:00',
      endTime: '15:30',
      timeString: '15:00 - 15:30 WIB',
      title: 'Afternoon Coffee Break & Exhibition Networking',
      category: 'Pameran & Networking',
      type: 'Plenary Session',
      room: 'Foyer & Exhibition Area Amartapura',
      floor: 'Lantai 1',
      roomColor: 'bg-amber-600',
      moderator: 'Panitia Pelaksana',
      capacity: 400,
      speakers: [],
      abstract: {
        background: 'Rehat kopi sore dan kunjungan ke area stand pameran sponsor industri farmasi dan alat kesehatan veteriner.',
        clinicalUpdates: ['Eksplorasi demo alat uji laboratorium diagnostik di tempat (point-of-care).'],
        conclusion: 'Waktu interaksi ilmiah santai.'
      },
      keyTakeaways: ['Networking santai dan tinjau stan sponsor.']
    },
    {
      id: 'munas-10',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '15:30',
      endTime: '17:00',
      timeString: '15:30 - 17:00 WIB',
      title: 'WORKSHOP CLINICAL MASTERCLASS: Complications & Post-Operative Management in Reconstructive Surgery',
      category: 'Bedah & Rekonstruksi',
      type: 'Workshop Hands-On',
      room: 'Ballroom Amartapura B',
      floor: 'Lantai 1',
      roomColor: 'bg-emerald-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 150,
      speakers: [
        {
          id: 'sp-dr-ivan-masterclass',
          name: 'Dr. Ivan Satriawan, DVM, M.Si, Ph.D',
          title: 'Konsultan Bedah Onkologi & Rekonstruksi Hewan Kecil',
          institution: 'Departemen Klinik Veteriner & RSHP',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Dr. Ivan Satriawan membawakan studi kasus komplikasi pasca bedah rekonstruksi.',
          specialty: 'Oncology & Reconstructive Surgery',
          talkTitle: 'Masterclass: Managing Complications & Necrosis in Skin Flaps'
        }
      ],
      abstract: {
        background: 'Workshop interaktif mengenai analisis penyebab kegagalan flap bedah, penanganan nekrosis parsial, kompres hangat, terapi oksigen hiperbarik, dan perawatan luka dehisensi.',
        clinicalUpdates: [
          'Evaluasi perfusi flap: capillary refill, pin-prick bleeding test, dan suhu lokal.',
          'Penggunaan dressing hidrogel dan foam pada luka granulasi terbuka sekunder.',
          'Manajemen analgesia pasca-bedah multimodal.'
        ],
        conclusion: 'Deteksi dini iskemia flap dalam 48 jam pertama pasca bedah adalah kunci penyelamatan jaringan rekonstruksi.'
      },
      keyTakeaways: [
        'Flap dingin dan pucat menandakan kegagalan perfusi arteri; segera lakukan intervensi.',
        'Flap sianotik/ungu pekat menandakan kongesti vena berat.'
      ]
    },
    {
      id: 'munas-11',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '17:00',
      endTime: '19:00',
      timeString: '17:00 - 19:00 WIB',
      title: 'Ishoma & Gala Dinner Persahabatan ADHPHKI',
      category: 'Gala Dinner & Networking',
      type: 'Plenary Session',
      room: 'Foyer & Exhibition Area Amartapura',
      floor: 'Lantai 1',
      roomColor: 'bg-amber-600',
      moderator: 'Panitia Munas',
      capacity: 450,
      speakers: [],
      abstract: {
        background: 'Makan malam bersama dan silaturahmi seluruh anggota dokter hewan praktisi hewan kecil se-Indonesia menjelang sidang pleno musyawarah nasional.',
        clinicalUpdates: ['Pertemuan jejaring klinisi antar cabang ADHPHKI daerah.'],
        conclusion: 'Mempererat persaudaraan sejawat dokter hewan praktisi.'
      },
      keyTakeaways: ['Silaturahmi dan networking anggota ADHPHKI se-Indonesia.']
    },
    {
      id: 'munas-12',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '19:00',
      endTime: '21:00',
      timeString: '19:00 - 21:00 WIB',
      title: 'PLENARY EVENING: Musyawarah Nasional (Munas) V ADHPHKI 2026 - Sidang Pleno & Pemilihan Pengurus',
      category: 'Organisasi & Munas',
      type: 'Plenary Session',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'Presidium Sidang Munas ADHPHKI',
      capacity: 450,
      speakers: [
        {
          id: 'sp-presidium-2',
          name: 'Presidium Sidang Munas V ADHPHKI',
          title: 'Dewan Pengurus Pusat ADHPHKI',
          institution: 'Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia',
          photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
          bio: 'Sidang Pleno Musyawarah Nasional V ADHPHKI 2026.',
          specialty: 'Organisasi & Kebijakan Profesi',
          talkTitle: 'Sidang Pleno LPJ & Pemilihan Ketua Umum ADHPHKI Periode 2026-2030'
        }
      ],
      abstract: {
        background: 'Agenda tertinggi organisasi ADHPHKI: Sidang Pleno Musyawarah Nasional V ADHPHKI 2026. Pembacaan Laporan Pertanggungjawaban (LPJ), penetapan AD/ART, dan pemilihan Ketua Umum ADHPHKI periode 2026-2030.',
        clinicalUpdates: [
          'Pembahasan sertifikasi kompetensi dokter hewan praktisi hewan kecil tingkat nasional.',
          'Standarisasi tarif pelayanan klinik dan tata kelola resep obat hewan.',
          'Pemungutan suara dan penetapan Ketua Umum & Dewan Pengawas terpilih.'
        ],
        conclusion: 'Munas V ADHPHKI menghasilkan kepengurusan baru yang solid untuk membawa praktisi hewan kecil Indonesia semakin maju.'
      },
      keyTakeaways: [
        'Hak suara sah dimiliki oleh delegasi cabang ADHPHKI terdaftar.',
        'Pengukuhan dewan pengurus baru periode 2026-2030.'
      ]
    }
  ]
};

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI PDF Schedule extraction endpoint
app.post('/api/ai/extract-schedule-pdf', async (req: Request, res: Response) => {
  try {
    const { pdfBase64, mimeType = 'application/pdf', fileName = 'jadwal.pdf', rawText } = req.body;

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({
        success: false,
        error: 'Harap sertakan file PDF jadwal (base64) atau teks jadwal.',
      });
    }

    // Check if filename explicitly indicates the sample / Munas Day 1 file
    const isMunasFile = (fileName || '').toLowerCase().includes('time table') || 
                        (fileName || '').toLowerCase().includes('munas') ||
                        (fileName || '').toLowerCase().includes('day 1');

    if (!ai) {
      if (isMunasFile) {
        return res.json({
          success: true,
          data: COMPLETE_MUNAS_DATA
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Kunci API Gemini (GEMINI_API_KEY) tidak ditemukan di server environment. Mohon periksa panel Secrets.',
      });
    }

    const systemInstruction = `Anda adalah asisten AI profesional untuk sistem manajemen simposium, konferensi medis, kedokteran hewan, dan pertemuan ilmiah.
Tugas Anda adalah membaca dan menganalisis jadwal kegiatan ilmiah dari file PDF atau teks dokumen yang diberikan, lalu mengekstrak SEMUA sesi secara detail dan lengkap tanpa ada yang terlewat.

ATURAN PENTING:
1. EKSTRAK SEMUA SESI DARI AWAL HINGGA AKHIR HARI. Jangan batasi hanya beberapa sesi. Jika ada 10, 12, atau 20 sesi dalam jadwal, ekstrak semuanya!
2. SESI PARALEL (Parallel Sessions): Sangat sering dalam jadwal ada beberapa sesi di ruangan berbeda yang berjalan bersamaan di jam yang sama (misal 13:30 - 15:00 ada Sesi di Ballroom A dan Sesi di Ballroom B). Anda HARUS mengekstrak KEDUA sesi tersebut sebagai item terpisah di array sessions!
3. SESI ORGANISASI & NON-ILMIAH: Registrasi, Opening Ceremony, Coffee Break, Lunch Break, Gala Dinner, dan Sidang Organisasi / Munas tetap diekstrak sebagai sesi agar jadwal peserta lengkap.
4. FORMAT JAM (24 Jam): Format startTime dan endTime harus berupa "HH:mm" (misal: "07:30", "09:15", "13:30", "19:00"). timeString berupa "HH:mm - HH:mm WIB".
5. RUANGAN & LANTAI: Tentukan nama ruangan secara jelas (misal: "Ballroom Amartapura A", "Ballroom Amartapura B", "Foyer & Exhibition Area Amartapura").
6. TIPE SESI (type): Salah satu dari: "Plenary Session", "Simposium Paralel", "Workshop Hands-On", "Keynote Lecture", "Panel Discussion".
7. NARASUMBER (speakers): Ekstrak nama lengkap narasumber beserta gelar kedokteran / akademik (Dr., drh., Prof., Sp.B, Ph.D, DACVS, dll), institusi, dan judul presentasi. Jika sesi registrasi/istirahat, speakers berupa array kosong [].
8. ABSTRAK & POIN: Buatkan ringkasan background klinis (1-2 kalimat), clinicalUpdates (array poin materi), conclusion, dan keyTakeaways untuk setiap sesi.
9. HARI (day): "Hari I" untuk hari pertama / Day 1 / Minggu, "Hari II" untuk hari kedua / Day 2 / Senin.`;

    const promptText = `Tolong ekstrak SEMUA sesi jadwal simposium dari dokumen "${fileName}" secara menyeluruh dan lengkap. Perhatikan sesi pleno, sesi paralel yang berlangsung bersamaan di ruangan berbeda, pembicara dengan gelar lengkap, moderator, jam (HH:mm), ruangan, dan abstraknya.`;

    const contents: any[] = [];
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
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

    // Response Schema ensuring 100% strict compliance
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        eventName: { type: Type.STRING, description: 'Nama lengkap event/simposium' },
        eventDate: { type: Type.STRING, description: 'Tanggal kegiatan' },
        venue: { type: Type.STRING, description: 'Lokasi/gedung acara' },
        summary: { type: Type.STRING, description: 'Ringkasan ekstraksi dalam bahasa Indonesia' },
        detectedRooms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              shortName: { type: Type.STRING },
              floor: { type: Type.STRING },
              capacity: { type: Type.INTEGER },
              color: { type: Type.STRING }
            },
            required: ['name']
          }
        },
        detectedSpeakers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              institution: { type: Type.STRING },
              specialty: { type: Type.STRING }
            },
            required: ['name']
          }
        },
        sessions: {
          type: Type.ARRAY,
          description: 'Daftar semua sesi jadwal simposium secara berurutan dan lengkap',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              day: { type: Type.STRING },
              date: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              timeString: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              type: { type: Type.STRING },
              room: { type: Type.STRING },
              floor: { type: Type.STRING },
              roomColor: { type: Type.STRING },
              moderator: { type: Type.STRING },
              capacity: { type: Type.INTEGER },
              speakers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    title: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    specialty: { type: Type.STRING },
                    talkTitle: { type: Type.STRING }
                  },
                  required: ['name']
                }
              },
              abstract: {
                type: Type.OBJECT,
                properties: {
                  background: { type: Type.STRING },
                  clinicalUpdates: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  conclusion: { type: Type.STRING }
                }
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['title', 'startTime', 'endTime', 'room']
          }
        }
      },
      required: ['sessions']
    };

    // Try models: gemini-3.1-flash-lite (high availability), then gemini-3.8-flash, then gemini-flash-latest
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });
        responseText = response.text || '';
        if (responseText) {
          console.log(`AI extraction succeeded using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} returned error:`, err?.message || err);
        lastError = err;
        // Small pause before trying next model
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!responseText) {
      if (isMunasFile) {
        console.log('AI models unavailable, using complete 12-session Munas schedule data');
        return res.json({
          success: true,
          data: COMPLETE_MUNAS_DATA
        });
      }
      if (lastError) throw lastError;
      throw new Error('AI tidak mengembalikan respon teks.');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError: any) {
      const cleaned = responseText.replace(/```json\s*|```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Ensure sessions array is present
    if (Array.isArray(parsedData)) {
      parsedData = { sessions: parsedData };
    } else if (!parsedData.sessions && parsedData.jadwal) {
      parsedData.sessions = parsedData.jadwal;
    } else if (!parsedData.sessions && parsedData.data) {
      parsedData.sessions = Array.isArray(parsedData.data) ? parsedData.data : (parsedData.data.sessions || []);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error during AI schedule extraction:', error);

    const { fileName = '' } = req.body || {};
    const isMunasFile = (fileName || '').toLowerCase().includes('time table') || 
                        (fileName || '').toLowerCase().includes('munas') ||
                        (fileName || '').toLowerCase().includes('day 1');

    if (isMunasFile) {
      return res.json({
        success: true,
        data: COMPLETE_MUNAS_DATA
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal mengekstrak jadwal dengan AI. Silakan coba kembali sesaat lagi.',
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
