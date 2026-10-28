import { ChatMessage } from '../types';

export const INITIAL_CHAT_DATABASE: Record<string, ChatMessage[]> = {
  'session-101': [
    {
      id: 'chat-101-1',
      sessionId: 'session-101',
      senderName: 'Prof. dr. Teguh Ranakusuma, Sp.N(K)',
      senderRole: 'Moderator',
      senderInstitution: 'Moderator Sesi',
      message: 'Selamat pagi Bapak/Ibu Sejawat. Sesi Plenary Keynote Kardiologi & Neurologi telah dibuka. Silakan ajukan pertanyaan klinis melalui tab ini atau beri upvote pada pertanyaan rekan sejawat untuk diprioritaskan saat sesi diskusi tanya-jawab.',
      timestamp: '08:05 WIB',
      isQuestion: false,
      upvotes: 18,
      tag: 'Pengumuman Moderator'
    },
    {
      id: 'chat-101-2',
      sessionId: 'session-101',
      senderName: 'dr. Dimas Wahyudi, Sp.JP',
      senderRole: 'Dokter Spesialis',
      senderInstitution: 'RSUD dr. Soedarso Pontianak',
      message: 'Izin bertanya kepada Prof. Bambang Sutrisno terkait rekomendasi DAPT jangka pendek (1 bulan) pada pasien sindrom koroner akut dengan risiko perdarahan tinggi (HBR). Apakah monoterapi P2Y12 inhibitor (Ticagrelor vs Clopidogrel) lebih diunggulkan pasca PCI?',
      timestamp: '08:24 WIB',
      isQuestion: true,
      targetSpeaker: 'Prof. dr. Bambang Sutrisno, Sp.JP(K), FIHA, FACC',
      upvotes: 15,
      isAnswered: true,
      tag: 'Kardiologi & DAPT',
      answer: {
        answeredBy: 'Prof. dr. Bambang Sutrisno, Sp.JP(K), FIHA, FACC',
        answerText: 'Pertanyaan sangat bagus dr. Dimas. Pada pasien HBR pasca-DES generasi baru, monoterapi Ticagrelor 90 mg bid pasca DAPT 1–3 bulan terbukti menurunkan risiko perdarahan mayor tanpa meningkatkan kejadian iskemia berulang (berdasarkan trial TWILIGHT). Namun jika ada kendala biaya/intoleransi, Clopidogrel tetap merupakan opsi yang valid.',
        timestamp: '08:42 WIB'
      }
    },
    {
      id: 'chat-101-3',
      sessionId: 'session-101',
      senderName: 'dr. Siti Rahmawati',
      senderRole: 'Dokter Umum',
      senderInstitution: 'Puskesmas Gambir Jakarta',
      message: 'Kepada dr. Ratna Setyowati, untuk faskes primer yang belum memiliki CT Scan canggih, screening Code Stroke apa yang paling reliabel sebelum merujuk pasien ke RS dengan fasilitas trombektomi mekanik dalam window 4.5 jam?',
      timestamp: '08:35 WIB',
      isQuestion: true,
      targetSpeaker: 'dr. Ratna Setyowati, Sp.N(K), FANA',
      upvotes: 21,
      isAnswered: true,
      tag: 'Protokol Faskes Primer',
      answer: {
        answeredBy: 'dr. Ratna Setyowati, Sp.N(K), FANA',
        answerText: 'dr. Siti, gunakan FAST atau skala RACE (Rapid Arterial Occlusion Evaluation) / LAMS untuk deteksi oklusi pembuluh darah besar (LVO). Hubungi RS rujukan via telemedicine Code Stroke saat pasien masih di ambulans agar tim radiologi dan kateterisasi siap sebelum pasien tiba.',
        timestamp: '08:50 WIB'
      }
    },
    {
      id: 'chat-101-4',
      sessionId: 'session-101',
      senderName: 'dr. Kevin Sanjaya',
      senderRole: 'Residen',
      senderInstitution: 'FKUI - RSCM',
      message: 'Slide presentasi dr. Ratna tentang mismatch perfusion CT sangat informatif dan membuka wawasan baru tentang window period di atas 6 jam! 👍',
      timestamp: '08:48 WIB',
      isQuestion: false,
      upvotes: 7,
      tag: 'Apresiasi Materi'
    }
  ],
  'session-102': [
    {
      id: 'chat-102-1',
      sessionId: 'session-102',
      senderName: 'dr. Lukman Hakim, Sp.PD-KGEH',
      senderRole: 'Moderator',
      senderInstitution: 'Moderator Sesi',
      message: 'Sesi Simposium Gastroenterologi Darurat dimulai. Rekan sejawat dapat menuliskan kasus perdarahan SCBA yang sedang dihadapi di klinik/RS.',
      timestamp: '09:50 WIB',
      isQuestion: false,
      upvotes: 9
    },
    {
      id: 'chat-102-2',
      sessionId: 'session-102',
      senderName: 'dr. Farhan Maulana, Sp.PD',
      senderRole: 'Dokter Spesialis',
      senderInstitution: 'RSUD Al-Ihsan Bandung',
      message: 'Mohon pencerahan Dr. Hendra Wijaya mengenai target pemberian transfusi eritrosit restriktif (Hb 7-8 g/dL). Bagaimana bila pasien memiliki riwayat sindrom koroner aktif bersamaan dengan melena masif?',
      timestamp: '10:05 WIB',
      isQuestion: true,
      targetSpeaker: 'Dr. dr. Hendra Wijaya, Sp.PD-KGEH, FINASIM',
      upvotes: 12,
      isAnswered: true,
      tag: 'Transfusi & Hemodinamik',
      answer: {
        answeredBy: 'Dr. dr. Hendra Wijaya, Sp.PD-KGEH, FINASIM',
        answerText: 'Khusus pasien dengan acute coronary syndrome (ACS) bersamaan perdarahan SCBA, batas target transfusi dinaikkan menjadi Hb 8–9 g/dL untuk mencegah iskemia miokard sekunder, dengan monitoring hemodinamik ketat.',
        timestamp: '10:18 WIB'
      }
    }
  ],
  'ws-101': [
    {
      id: 'chat-ws1-1',
      sessionId: 'ws-101',
      senderName: 'dr. Budi Hartono, Sp.An-TI, FIP',
      senderRole: 'Pembicara',
      senderInstitution: 'Instruktur Utama Workshop',
      message: 'Selamat datang di Workshop USG Point-of-Care (POCUS). Setiap stasiun sudah dilengkapi phantom dan probe curvilinear & linear. Jika ada kendala knobology USG, silakan tanyakan langsung ke asisten instruktur di meja.',
      timestamp: '13:00 WIB',
      isQuestion: false,
      upvotes: 14,
      tag: 'Instruksi Praktik'
    },
    {
      id: 'chat-ws1-2',
      sessionId: 'ws-101',
      senderName: 'dr. Maya Indriani',
      senderRole: 'Dokter Umum',
      senderInstitution: 'RS Pratama Flores',
      message: 'Izin bertanya dok, bagaimana cara membedakan gambaran pneumotoraks dengan atelectasis pada visualisasi pleura lung slide di mode M-mode USG?',
      timestamp: '13:25 WIB',
      isQuestion: true,
      targetSpeaker: 'dr. Budi Hartono, Sp.An-TI, FIP',
      upvotes: 8,
      tag: 'Teknik USG Paru',
      isAnswered: true,
      answer: {
        answeredBy: 'dr. Budi Hartono, Sp.An-TI, FIP',
        answerText: 'Pada pneumotoraks, lung sliding hilang dan pada M-mode tampak Barcode sign (Stratosphere sign). Pada atelektasis, lung pulse masih dapat terdeteksi seirama detak jantung. Kita akan demokan langsung di Phantom Stasiun 3.',
        timestamp: '13:35 WIB'
      }
    }
  ]
};

const STORAGE_KEY_PREFIX = 'simposium_livechat_';

export function getSessionChatMessages(sessionId: string, sessionTitle?: string, moderator?: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse chat messages from localStorage:', e);
  }

  // Pre-seeded or generic fallback
  if (INITIAL_CHAT_DATABASE[sessionId]) {
    return INITIAL_CHAT_DATABASE[sessionId];
  }

  // Generic welcoming announcement for any other session or admin-created session
  const defaultWelcome: ChatMessage[] = [
    {
      id: `chat-${sessionId}-intro`,
      sessionId,
      senderName: moderator || 'Moderator Sesi',
      senderRole: 'Moderator',
      senderInstitution: 'Panitia Ilmiah Simposium 2026',
      message: `Selamat datang di forum Live Chat & Diskusi untuk sesi "${sessionTitle || 'Sesi Simposium'}". Silakan ketik pertanyaan Anda untuk narasumber atau moderator di kolom bawah. Berikan dukungan (upvote) untuk pertanyaan terpenting!`,
      timestamp: 'Baru saja',
      isQuestion: false,
      upvotes: 5,
      tag: 'Informasi Resmi'
    }
  ];

  return defaultWelcome;
}

export function saveSessionChatMessages(sessionId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat messages:', e);
  }
}

export function addSessionChatMessage(sessionId: string, message: ChatMessage): ChatMessage[] {
  const current = getSessionChatMessages(sessionId);
  const updated = [...current, message];
  saveSessionChatMessages(sessionId, updated);
  return updated;
}

export function toggleMessageUpvote(sessionId: string, messageId: string): ChatMessage[] {
  const current = getSessionChatMessages(sessionId);
  const updated = current.map(msg => {
    if (msg.id === messageId) {
      const isUpvoted = !msg.hasUpvoted;
      return {
        ...msg,
        hasUpvoted: isUpvoted,
        upvotes: isUpvoted ? msg.upvotes + 1 : Math.max(0, msg.upvotes - 1)
      };
    }
    return msg;
  });
  saveSessionChatMessages(sessionId, updated);
  return updated;
}

export function answerSessionQuestion(
  sessionId: string,
  messageId: string,
  answerText: string,
  answeredBy: string
): ChatMessage[] {
  const current = getSessionChatMessages(sessionId);
  const updated = current.map(msg => {
    if (msg.id === messageId) {
      return {
        ...msg,
        isAnswered: true,
        answer: {
          answeredBy,
          answerText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        }
      };
    }
    return msg;
  });
  saveSessionChatMessages(sessionId, updated);
  return updated;
}

export function replyToChatMessage(
  sessionId: string,
  messageId: string,
  replyText: string,
  senderName: string,
  senderRole: string
): ChatMessage[] {
  const current = getSessionChatMessages(sessionId);
  const updated = current.map(msg => {
    if (msg.id === messageId) {
      const newReply = {
        id: 'reply-' + Date.now(),
        senderName,
        senderRole,
        message: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      };
      return {
        ...msg,
        replies: [...(msg.replies || []), newReply]
      };
    }
    return msg;
  });
  saveSessionChatMessages(sessionId, updated);
  return updated;
}
