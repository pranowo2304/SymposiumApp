export interface Speaker {
  id: string;
  name: string;
  title: string;
  institution: string;
  photoUrl: string;
  bio: string;
  specialty: string;
  email?: string;
  talkTitle?: string;
}

export interface Session {
  id: string;
  day: string; // e.g. "Workshop (28 Nov)", "Hari I", "Hari II", "Hari III"
  date: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "09:30"
  timeString: string; // e.g. "08:00 - 09:30 WIB"
  title: string;      // Tema Sesi / Judul Simposium
  category: string;   // e.g. "Kardiologi", "Neurologi", "Workshop Pre-Congress"
  type: 'Plenary Session' | 'Simposium Paralel' | 'Workshop Hands-On' | 'Keynote Lecture' | 'Panel Discussion';
  room: string;       // Data Ruangan, e.g. "Ballroom Amartapura A", "Antareja Room"
  floor: string;      // e.g. "Ground Floor", "Lantai 1"
  roomColor: string;  // Tailwind color tag
  moderator: string;
  speakers: Speaker[];
  abstract: {
    background: string;
    clinicalUpdates: string[];
    conclusion: string;
  };
  keyTakeaways?: string[];
  capacity?: number;
}

export interface SymposiumInfo {
  title: string;
  subtitle: string;
  theme: string;
  location: string;
  venueAddress: string;
  city?: string;
  dates: {
    workshop?: string;
    day1: string;
    day2: string;
    day3?: string;
    [key: string]: string | undefined;
  };
  dateString?: string;
  logoUrl?: string;
  themeColor?: 'medical-navy' | 'gold-amber' | 'cyan-teal' | 'emerald-green' | 'crimson-ruby' | 'royal-indigo';
  organizer: string;
  accreditation: string; // e.g. "32 SKP PB PDHI"
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
}

export interface Participant {
  id: string;
  email: string;
  name: string;
  title?: string;
  npaIdi?: string;
  institution: string;
  role: 'Dokter Spesialis' | 'Dokter Umum' | 'Residen' | 'Mahasiswa Kedokteran' | 'Panitia' | 'Peserta';
  phone?: string;
  ticketType?: 'Simposium Full Pass' | 'Workshop Only' | 'All-Access (Simposium + Workshop)' | 'VIP / Speaker';
  badgeId: string;
  registeredAt?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  sessionTitle: string;
  room: string;
  timestamp: string;
  skpPoints: number;
  participantName: string;
  badgeId: string;
  day: string;
}

export interface Exhibitor {
  id: string;
  name: string;
  boothNumber: string;
  category: 'Farmasi' | 'Alat Medis & Diagnostik' | 'Teknologi & AI' | 'Rumah Sakit & Lab';
  zone: string;
  tagline: string;
  description: string;
  featuredProducts: string[];
  contactEmail?: string;
  website?: string;
  phone?: string;
  demoSchedule?: string;
  highlight?: string;
}

export interface Room {
  id: string;
  name: string;
  shortName: string;
  floor: 'Lantai Dasar' | 'Lantai Atas' | 'Lantai 1' | 'Lantai 2' | 'Lantai 3' | string;
  capacity: number;
  description: string;
  facilities: string[];
  type: 'ballroom' | 'hall' | 'auditorium' | 'workshop' | 'facility';
  color?: string;
  badgeBg?: string;
  x?: number;
  y?: number;
}

export interface ChatReply {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  isOfficial?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderName: string;
  senderRole: 'Peserta' | 'Dokter Spesialis' | 'Dokter Umum' | 'Residen' | 'Moderator' | 'Pembicara' | 'Panitia';
  senderInstitution?: string;
  message: string;
  timestamp: string;
  isQuestion: boolean;
  targetSpeaker?: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isAnswered?: boolean;
  answer?: {
    answeredBy: string;
    answerText: string;
    timestamp: string;
  };
  replies?: ChatReply[];
  tag?: string;
}

export type BroadcastType = 'info' | 'warning' | 'urgent' | 'success';

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  category: string;
  actionTab?: string;
  actionLabel?: string;
  durationSeconds: number; // 0 for persistent until closed
  sound: boolean;
  timestamp: number;
  sentBy?: string;
}

