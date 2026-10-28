import { Session, Speaker, Room, SymposiumInfo } from '../types';

export const MUNAS_ADHPHKI_EVENT_INFO: SymposiumInfo = {
  title: "KIVNAHK IV & MUNAS V ADHPHKI 2026",
  subtitle: "Konferensi Ilmiah Veteriner Nasional Hewan Kecil Ke-4 & Musyawarah Nasional V ADHPHKI",
  theme: "Advancements in Small Animal Clinical Practice, Oncology, Reconstructive Surgery & Veterinary Nursing",
  location: "Grand Ballroom Amartapura & Convention Hall",
  venueAddress: "Jl. Palagan Tentara Pelajar No. 1, Yogyakarta",
  city: "D.I. Yogyakarta",
  dateString: "28 November - 1 Desember 2026",
  dates: {
    workshop: "Sabtu, 28 November 2026",
    day1: "Minggu, 29 November 2026",
    day2: "Senin, 30 November 2026",
    day3: "Selasa, 1 Desember 2026"
  },
  organizer: "Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia (ADHPHKI) & PB PDHI",
  accreditation: "32 SKP PB PDHI (Perhimpunan Dokter Hewan Indonesia)",
  logoUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&auto=format&fit=crop&q=80",
  themeColor: "emerald-green"
};

export const MUNAS_ROOMS: Room[] = [
  // --- GROUND FLOOR (LANTAI DASAR) WORKSHOP ROOMS ---
  {
    id: "Antareja Room",
    name: "Antareja Room",
    shortName: "Antareja",
    floor: "Ground Floor",
    capacity: 90,
    x: 28,
    y: 35,
    color: "bg-amber-600",
    badgeBg: "bg-amber-600 text-white",
    description: "Ruang Workshop Versus - MASS Hunt (From Pixel to Cell) di Lantai Ground Floor dengan stasiun USG resolusi tinggi dan mikroskop sitologi.",
    facilities: ["Stasiun USG High-Resolution", "Kamera Mikroskop Digital Live Feed", "Layar Delay Proyektor HD", "Meja Praktikum Biopsi", "AC Sentral"],
    type: "workshop"
  },
  {
    id: "Wisanggeni Room",
    name: "Wisanggeni Room",
    shortName: "Wisanggeni",
    floor: "Ground Floor",
    capacity: 80,
    x: 72,
    y: 35,
    color: "bg-violet-600",
    badgeBg: "bg-violet-600 text-white",
    description: "Ruang Workshop Vet Nurse - Nurse Excellence Track di Lantai Ground Floor untuk pelatihan kompetensi paramedis veteriner dan monitoring intensif.",
    facilities: ["Manekin Resusitasi Kritis Hewan", "Monitor Anestesi Multi-Parameter", "Infusion & Syringe Pump Station", "Sound System HD", "AC Sentral"],
    type: "workshop"
  },

  // --- LANTAI 1 PLENARY & PARALLEL SESSIONS ---
  {
    id: "Ballroom Amartapura A",
    name: "Ballroom Amartapura A",
    shortName: "Amartapura A",
    floor: "Lantai 1",
    capacity: 450,
    x: 28,
    y: 40,
    color: "bg-indigo-600",
    badgeBg: "bg-indigo-600 text-white",
    description: "Ballroom Pleno utama di Lantai 1 untuk sesi WSAVA Keynote, Plenary Lectures, dan Sidang Musyawarah Nasional V ADHPHKI.",
    facilities: ["Videotron LED 4K 16x4m", "Dual Projector Delay", "Sound System Akustik", "Podium Presidium", "Wireless Mic"],
    type: "ballroom"
  },
  {
    id: "Ballroom Amartapura B",
    name: "Ballroom Amartapura B",
    shortName: "Amartapura B",
    floor: "Lantai 1",
    capacity: 350,
    x: 72,
    y: 40,
    color: "bg-emerald-600",
    badgeBg: "bg-emerald-600 text-white",
    description: "Ruang simposium paralel & clinical session di Lantai 1 untuk Oncology, Reconstructive Surgery, Masterclass, dan Clinical Updates.",
    facilities: ["Layar LED Wall", "Surgical Camera Live Feed", "Sound System HD", "Kamera Siaran Langsung"],
    type: "ballroom"
  },
  {
    id: "Foyer & Exhibition Amartapura",
    name: "Foyer & Exhibition Area Amartapura",
    shortName: "Foyer Amartapura",
    floor: "Lantai 1",
    capacity: 300,
    x: 50,
    y: 75,
    color: "bg-teal-600",
    badgeBg: "bg-teal-600 text-white",
    description: "Area pameran farmasi veteriner, peralatan bedah hewan, USG, anestesi hewan, coffee break networking, dan registrasi QR.",
    facilities: ["Booth Pameran Farmasi Veteriner", "Coffee Break Counter", "Meja Registrasi Barcode QR", "Helpdesk SKP PDHI"],
    type: "facility"
  }
];

export const MUNAS_SPEAKERS: Record<string, Speaker> = {
  sp_versus_mass: {
    id: "sp-versus-mass",
    name: "Dr. drh. Handoko Wicaksono, M.Si, Ph.D, Dip.ECVDI",
    title: "Spesialis Radiologi & Sitopatologi Veteriner",
    institution: "Imaging & Diagnostic Oncology Center - RSHP",
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    specialty: "Veterinary Diagnostic Imaging & Cytology",
    talkTitle: "Workshop Versus: MASS Hunt - From Pixel to Cell (Diagnostic Imaging to Fine Needle Cytology)",
    bio: "Pakar pencitraan diagnostik ultrasonografi dan evaluasi sitopatologi massa tumor hewan kecil dengan pengalaman klinis dan pelatihan internasional."
  },
  sp_vet_nurse: {
    id: "sp-vet-nurse",
    name: "Ns. Maya Kartika, S.Kep, CVN (Certified Vet Nurse)",
    title: "Lead Instructor Veterinary Nursing & Critical Care",
    institution: "Perhimpunan Paramedis Veteriner & RSH Pendidikan",
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    specialty: "Veterinary Intensive Care & Anesthesia Monitoring",
    talkTitle: "Workshop Vet Nurse: Nurse Excellence Track - Emergency Triage, Critical Monitoring & Patient Care",
    bio: "Instruktur senior paramedis veteriner tersertifikasi dengan fokus pada manajemen triase gawat darurat, monitoring anestesi lanjut, dan protokol ICU hewan kecil."
  },
  dr_ivan: {
    id: "dr-ivan-satriawan",
    name: "Dr. Ivan Satriawan, DVM, M.Si, Ph.D",
    title: "Konsultan Bedah Onkologi & Rekonstruksi Hewan Kecil",
    institution: "Departemen Klinik Veteriner & Rumah Sakit Hewan Pendidikan",
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    specialty: "Oncology & Reconstructive Surgery",
    talkTitle: "Surgical Oncology: Mastectomy Techniques, Margin Clearance and Advanced Skin Flap Reconstruction",
    bio: "Dr. Ivan Satriawan merupakan dokter hewan praktisi dan akademisi spesialisasi bedah jaringan lunak, onkologi, dan teknik flap rekonstruksi kulit pada anjing dan kucing dengan pengalaman klinis dan riset lebih dari 18 tahun."
  },
  drh_listriani: {
    id: "drh-listriani-wistawan",
    name: "drh. Listriani Wistawan",
    title: "Klinisi Spesialisasi Onkologi & Penyakit Dalam Hewan Kecil",
    institution: "ADHPHKI Pusat & Klinik Hewan Khusus Onkologi",
    photoUrl: "https://images.unsplash.com/photo-1594824813566-88855ce78347?w=400&auto=format&fit=crop&q=80",
    specialty: "Onkologi & Sitopatologi Veteriner",
    talkTitle: "Moderator Sesi Onkologi & Penatalaksanaan Klinis Neoplasia",
    bio: "drh. Listriani Wistawan aktif sebagai pembicara dan moderator nasional dalam penanganan sitologi diagnostik tumor dan terapi suportif onkologi veteriner."
  },
  wsava_speaker: {
    id: "wsava-speaker",
    name: "Prof. Dr. Michael Henderson, DVM, DACVS (WSAVA Faculty)",
    title: "WSAVA Continuing Education Keynote Speaker",
    institution: "World Small Animal Veterinary Association (WSAVA)",
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    specialty: "Small Animal Soft Tissue Surgery",
    talkTitle: "WSAVA Keynote: Modern Principles in Small Animal Surgical Oncology & Wound Management",
    bio: "Pakar bedah veteriner internasional dari WSAVA Continuing Education dengan fokus pada bedah reseksi tumor kuratif dan manajemen luka bedah kompleks."
  },
  presidium_munas: {
    id: "presidium-munas",
    name: "Presidium Sidang Munas V ADHPHKI",
    title: "Dewan Pengurus Pusat ADHPHKI",
    institution: "Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia",
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    specialty: "Organisasi & Kebijakan Profesi",
    talkTitle: "Musyawarah Nasional V ADHPHKI 2026: Laporan Pertanggungjawaban & Pemilihan Ketua Umum",
    bio: "Sidang tertinggi organisasi ADHPHKI untuk membahas kode etik praktisi hewan kecil, standardisasi pelayanan klinik, serta pemilihan kepengurusan nasional periode 2026-2030."
  }
};

export const MUNAS_SESSIONS: Session[] = [
  // ============================================================
  // PRE-CONGRESS WORKSHOP: SABTU, 28 NOVEMBER 2026
  // ============================================================
  {
    id: "ws-versus-01",
    day: "Workshop (28 Nov)",
    date: "Sabtu, 28 November 2026",
    startTime: "08:00",
    endTime: "17:00",
    timeString: "08:00 - 17:00 WIB",
    title: "Workshop Versus - MASS Hunt (From Pixel to Cell)",
    category: "Workshop Pre-Congress",
    type: "Workshop Hands-On",
    room: "Antareja Room",
    floor: "Ground Floor",
    roomColor: "bg-amber-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 60,
    speakers: [MUNAS_SPEAKERS.sp_versus_mass],
    abstract: {
      background: "Workshop intensif pre-congress yang mengintegrasikan modalitas diagnostik pencitraan ultrasonografi beresolusi tinggi (pixel) dengan pemeriksaan sitopatologi jarum halus (cell) secara real-time untuk karakterisasi massa neoplasia dan lesi organ hewan kecil.",
      clinicalUpdates: [
        "Teknik Ultrasound-Guided Fine Needle Aspiration (USG-FNA) presisi tinggi pada organ cavum abdomen dan massa jaringan lunak.",
        "Prosedur pembuatan preparat apus sitologi, fiksasi optimal, dan pewarnaan cepat Diff-Quik di meja periksa.",
        "Pembacaan sitopatologis pola seluler: diferensiasi proses supuratif, granulomatosa, hiperplasia, adenoma, dan keganasan karsinoma/sarkoma.",
        "Hands-on wetlab langsung menggunakan phantom organ dan spesimen sitologi klinis."
      ],
      conclusion: "Kombinasi modalitas visual pixel dan seluler meningkatkan ketepatan diagnosis neoplasia pre-bedah hingga di atas 95%."
    },
    keyTakeaways: [
      "Korelasi sonogram dengan apusan sitologi adalah kunci diagnosis massa non-invasif.",
      "Teknik non-aspirasi jarum halus (kapiler) memberikan preparat sitologi terbaik tanpa kontaminasi eritrosit berlebih.",
      "Selalu lakukan grading batas massa sebelum menentukan margin eksisi bedah."
    ]
  },
  {
    id: "ws-vetnurse-02",
    day: "Workshop (28 Nov)",
    date: "Sabtu, 28 November 2026",
    startTime: "09:00",
    endTime: "17:00",
    timeString: "09:00 - 17:00 WIB",
    title: "Workshop Vet Nurse - Nurse Excellence Track",
    category: "Veterinary Nursing",
    type: "Workshop Hands-On",
    room: "Wisanggeni Room",
    floor: "Ground Floor",
    roomColor: "bg-violet-600",
    moderator: "Ns. Maya Kartika, S.Kep, CVN",
    capacity: 70,
    speakers: [MUNAS_SPEAKERS.sp_vet_nurse],
    abstract: {
      background: "Pelatihan komprehensif peningkatan kompetensi paramedis veteriner dan perawat hewan dalam penanganan gawat darurat, monitoring anestesi lanjut, serta manajemen resusitasi kritis di instalasi rawat inap dan bedah.",
      clinicalUpdates: [
        "Protokol Triase Cepat Veteriner (Metode ABCD: Airway, Breathing, Circulation, Disability) dalam 60 detik pertama kedatangan pasien kritis.",
        "Monitoring Anestesi Lanjut: Interpretasi kurva kapnografi (EtCO2), pulse oximetry (SpO2), pemantauan tekanan darah non-invasif, dan EKG 3-lead.",
        "Manajemen infus cairan resusitasi kristaloid/koloid dan kalkulasi laju infus konstan (Constant Rate Infusion - CRI) analgesia multimodal.",
        "Hands-on simulasi Cardiopulmonary Resuscitation (CPR RECOVER Guidelines) pada manekin veteriner."
      ],
      conclusion: "Keperawatan veteriner berstandar internasional secara nyata menurunkan mortalitas anestesi dan meningkatkan kelangsungan hidup pasien kritis."
    },
    keyTakeaways: [
      "Kapnografi merupakan tanda paling dini mendeteksi hipoventilasi, apneu, dan cardiac arrest intraoperatif.",
      "Kompresi dada berkualitas tinggi pada CPR anjing/kucing memerlukan kedalaman 1/3-1/2 diameter dada dengan laju 100-120x/menit.",
      "Pencatatan rekam medis terpadu vital signs menjamin kesinambungan terapi rawat inap."
    ]
  },

  // ============================================================
  // KIVNAHK IV & MUNAS V ADHPHKI: HARI I (MINGGU, 29 NOV 2026)
  // ============================================================
  {
    id: "munas-01",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "07:30",
    endTime: "08:30",
    timeString: "07:30 - 08:30 WIB",
    title: "Registrasi Ulang Peserta, Morning Coffee & Visit Exhibition",
    category: "Pameran & Registrasi",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-amber-600",
    moderator: "Panitia Registrasi ADHPHKI",
    capacity: 450,
    speakers: [],
    abstract: {
      background: "Registrasi kehadiran berbasis QR Code untuk pencatatan SKP PDHI, pengambilan seminar kit, dan peninjauan booth pameran alat medis veteriner.",
      clinicalUpdates: [
        "Pencatatan QR kehadiran otomatis terintegrasi portal SKP PDHI.",
        "Demonstrasi alat diagnostik mutakhir di exhibition floor."
      ],
      conclusion: "Peserta diharapkan hadir tepat waktu sebelum pembukaan resmi."
    },
    keyTakeaways: [
      "Siapkan QR Code badge untuk verifikasi cepat di helpdesk.",
      "Kunjungi booth farmasi & instrumen bedah di area Foyer."
    ]
  },
  {
    id: "munas-02",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "08:30",
    endTime: "09:15",
    timeString: "08:30 - 09:15 WIB",
    title: "OPENING CEREMONY: Pembukaan Resmi MUNAS V ADHPHKI & KIVNAHK IV 2026",
    category: "Plenary & Organisasi",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.presidium_munas],
    abstract: {
      background: "Upacara pembukaan resmi pertemuan ilmiah veteriner terbesar di Indonesia yang dihadiri oleh praktisi hewan kecil dari seluruh provinsi.",
      clinicalUpdates: [
        "Sambutan Ketua Panitia Pelaksana & Ketua Umum ADHPHKI.",
        "Arah kebijakan regulasi kefarmasian hewan dan standar kompetensi klinik."
      ],
      conclusion: "Peresmian dimulainya KIVNAHK IV dan Munas V ADHPHKI 2026."
    },
    keyTakeaways: [
      "Peningkatan standar pelayanan klinis hewan kecil di Indonesia.",
      "Kolaborasi erat dengan organisasi internasional seperti WSAVA."
    ]
  },
  {
    id: "munas-03",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "09:15",
    endTime: "10:45",
    timeString: "09:15 - 10:45 WIB",
    title: "WSAVA KEYNOTE: Modern Principles in Small Animal Surgical Oncology & Wound Management",
    category: "Onkologi & Bedah",
    type: "Keynote Lecture",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.wsava_speaker],
    abstract: {
      background: "Onkologi bedah memerlukan pemahaman mendalam tentang biologi tumor, teknik biopsi pra-bedah, penentuan surgical margin, dan pencegahan seeding sel tumor.",
      clinicalUpdates: [
        "Definisi batas sayatan aman (histological clean margins: 2-3 cm lateral dan 1 fascial plane dalam).",
        "Pencegahan kontaminasi sel tumor saat manipulasi jaringan (No-Touch isolation technique).",
        "Penanganan defek bedah onkologi kompleks dengan teknik advanced wound management."
      ],
      conclusion: "Pembedahan pertama adalah kesempatan terbaik untuk kesembuhan total kanker pada hewan kesayangan."
    },
    keyTakeaways: [
      "Jangan lakukan debulking parsial tanpa rencana definitif.",
      "Eksisi selalu menyertakan fasia dalam sebagai barier biologis.",
      "Kirimkan seluruh spesimen dengan penandaan benang (suture marking) untuk patologi."
    ]
  },
  {
    id: "munas-04",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "10:45",
    endTime: "11:15",
    timeString: "10:45 - 11:15 WIB",
    title: "Coffee Break, Networking & Exhibition Showcase",
    category: "Pameran & Networking",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-amber-600",
    moderator: "Panitia Pelaksana",
    capacity: 400,
    speakers: [],
    abstract: {
      background: "Sesi rehat kopi pagi, diskusi interaktif antar praktisi, dan demo produk alat bedah onkologi dan perlengkapan anestesi.",
      clinicalUpdates: ["Demo elektrokauter canggih dan surgical stapler veteriner di area booth."],
      conclusion: "Waktu networking antar dokter hewan praktisi se-Indonesia."
    }
  },
  {
    id: "munas-05",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "11:15",
    endTime: "12:30",
    timeString: "11:15 - 12:30 WIB",
    title: "PLENARY: Mastectomy Techniques & Regional Lymph Node Management in Canines and Felines",
    category: "Onkologi Bedah",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.dr_ivan, MUNAS_SPEAKERS.wsava_speaker],
    abstract: {
      background: "Tumor kelenjar mamae merupakan neoplasia paling umum pada anjing betina dan kucing betina. Pendekatan bedah berbeda secara signifikan antara anjing (sering jinak/lokal) dan kucing (>85% maligna agresif).",
      clinicalUpdates: [
        "Indikasi Regional vs Radical Unilateral/Bilateral Mastectomy pada anjing vs kucing.",
        "Pemetaan dan biopsi Sentinels Lymph Nodes (SLN) dengan zat warna kontras dan palpasi.",
        "Manajemen hemostasis dan reduksi dead space pasca mastektomi radikal."
      ],
      conclusion: "Mastektomi radikal unilateral atau bilateral staged adalah standar baku emas pada kucing dengan tumor mamae."
    },
    keyTakeaways: [
      "Pada kucing, tumor mamae hampir selalu ganas dan membutuhkan mastektomi radikal.",
      "Identifikasi dan evaluasi kelenjar limfa aksilaris dan inguinalis secara histopatologi.",
      "Pemasangan drain tertutup aktif (Jackson-Pratt) direkomendasikan pada dead space luas."
    ]
  },
  {
    id: "munas-06",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "12:30",
    endTime: "13:30",
    timeString: "12:30 - 13:30 WIB",
    title: "Lunch Break, Sholat Dzuhur & Poster Scientific Session",
    category: "Istirahat & Poster Ilmiah",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-amber-600",
    moderator: "Tim Ilmiah KIVNAHK",
    capacity: 400,
    speakers: [],
    abstract: {
      background: "Istirahat makan siang, ibadah, dan sesi presentasi poster ilmiah penelitian veteriner peserta KIVNAHK IV.",
      clinicalUpdates: ["Presentasi studi kasus klinis onkologi dan bedah hewan kecil."],
      conclusion: "Kesempatan berdiskusi langsung dengan para presenter riset."
    }
  },
  {
    id: "munas-07",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "13:30",
    endTime: "15:00",
    timeString: "13:30 - 15:00 WIB",
    title: "SIMPOSIUM PARALEL 1A: Advanced Oncology & Skin Flap Reconstruction Surgery in Small Animals",
    category: "Onkologi & Rekonstruksi",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura B",
    floor: "Lantai 1",
    roomColor: "bg-emerald-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 350,
    speakers: [MUNAS_SPEAKERS.dr_ivan],
    abstract: {
      background: "Eksisi luas tumor kulit atau dinding tubuh seringkali menyisakan defek jaringan yang tidak dapat ditutup secara primer dengan jahitan biasa tanpa tegangan tinggi yang memicu nekrosis tepi.",
      clinicalUpdates: [
        "Teknik Tension Relieving: Undermining, walking sutures, dan relieving incisions.",
        "Local Flaps: Advancement flaps, rotational flaps, dan transposition flaps pada ekstremitas.",
        "Axial Pattern Flaps (Thoracodorsal, Caudal Superficial Epigastric, dan Omocervical flap) untuk penutupan defek raksasa."
      ],
      conclusion: "Penguasaan teknik flap vaskularisasi mandiri memungkinkan dokter hewan melakukan reseksi onkologi radikal dengan hasil kosmetik dan fungsional yang prima."
    },
    keyTakeaways: [
      "Hindari tegangan berlebih pada luka; tegangan memicu dehisensi dan kegagalan bedah.",
      "Caudal Superficial Epigastric Flap sangat ideal untuk menutup defek panggul dan perineum.",
      "Pertahankan integritas arteri dan vena kutaneus mayor penyokong axial pattern flap."
    ]
  },
  {
    id: "munas-08",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "13:30",
    endTime: "15:00",
    timeString: "13:30 - 15:00 WIB",
    title: "SIMPOSIUM PARALEL 1B: Clinical Management & Chemotherapy Protocols for Canine Lymphoma & Mast Cell Tumors",
    category: "Onkologi Medis",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Hendra Kurniawan",
    capacity: 350,
    speakers: [MUNAS_SPEAKERS.wsava_speaker],
    abstract: {
      background: "Limfoma dan Mast Cell Tumor (MCT) merupakan neoplasia sistemik yang membutuhkan pendekatan multimodal antara bedah, sitologi grading, dan kemoterapi sitotoksik modern.",
      clinicalUpdates: [
        "Protokol CHOP (Cyclophosphamide, Doxorubicin, Vincristine, Prednisolone) termodifikasi.",
        "Penggunaan Tyrosine Kinase Inhibitors (Masitinib, Toceranib) pada kasus c-kit mutant MCT.",
        "Manajemen efek samping kemoterapi: neutropenia, sepsis febris, dan ekstravasasi obat."
      ],
      conclusion: "Kombinasi kemoterapi terarah meningkatkan durasi remisi dan kualitas hidup pasien hewan secara nyata."
    },
    keyTakeaways: [
      "Lakukan staging lengkap (toraks X-ray, USG abdomen, sitologi limfonodus) sebelum memulai kemo.",
      "Periksa darah lengkap (CBC) 7 hari pasca infus Doxorubicin/Vincristine.",
      "Gunakan alat pelindung diri lengkap dalam penanganan obat antineoplastik."
    ]
  },
  {
    id: "munas-09",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "15:00",
    endTime: "15:30",
    timeString: "15:00 - 15:30 WIB",
    title: "Afternoon Coffee Break & Exhibition Networking",
    category: "Pameran & Networking",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-amber-600",
    moderator: "Panitia Pelaksana",
    capacity: 400,
    speakers: [],
    abstract: {
      background: "Rehat kopi sore dan kunjungan ke area stand pameran sponsor industri farmasi dan alat kesehatan veteriner.",
      clinicalUpdates: ["Eksplorasi demo alat uji laboratorium diagnostik di tempat (point-of-care)."],
      conclusion: "Waktu interaksi ilmiah santai."
    }
  },
  {
    id: "munas-10",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "15:30",
    endTime: "17:00",
    timeString: "15:30 - 17:00 WIB",
    title: "WORKSHOP CLINICAL MASTERCLASS: Complications & Post-Operative Management in Reconstructive Surgery",
    category: "Bedah & Rekonstruksi",
    type: "Workshop Hands-On",
    room: "Ballroom Amartapura B",
    floor: "Lantai 1",
    roomColor: "bg-emerald-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 150,
    speakers: [MUNAS_SPEAKERS.dr_ivan],
    abstract: {
      background: "Workshop interaktif mengenai analisis penyebab kegagalan flap bedah, penanganan nekrosis parsial, kompres hangat, terapi oksigen hiperbarik, dan perawatan luka dehisensi.",
      clinicalUpdates: [
        "Evaluasi perfusi flap: capillary refill, pin-prick bleeding test, dan suhu lokal.",
        "Penggunaan dressing hidrogel dan foam pada luka granulasi terbuka sekunder.",
        "Manajemen analgesia pasca-bedah multimodal (opioid + NSAID + infiltrasi bupivakain)."
      ],
      conclusion: "Deteksi dini iskemia flap dalam 48 jam pertama pasca bedah adalah kunci penyelamatan jaringan rekonstruksi."
    },
    keyTakeaways: [
      "Flap dingin dan pucat menandakan kegagalan perfusi arteri; segera lakukan intervensi.",
      "Flap sianotik/ungu pekat menandakan kongesti vena berat.",
      "Gunakan kolar pelindung Elizabeth untuk mencegah self-trauma hewan."
    ]
  },
  {
    id: "munas-11",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "17:00",
    endTime: "19:00",
    timeString: "17:00 - 19:00 WIB",
    title: "Ishoma & Gala Dinner Persahabatan ADHPHKI",
    category: "Gala Dinner & Networking",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-amber-600",
    moderator: "Panitia Munas",
    capacity: 450,
    speakers: [],
    abstract: {
      background: "Makan malam bersama dan silaturahmi seluruh anggota dokter hewan praktisi hewan kecil se-Indonesia menjelang sidang pleno musyawarah nasional.",
      clinicalUpdates: ["Pertemuan jejaring klinisi antar cabang ADHPHKI daerah."],
      conclusion: "Mempererat persaudaraan sejawat dokter hewan praktisi."
    }
  },
  {
    id: "munas-12",
    day: "Hari I",
    date: "Minggu, 29 November 2026",
    startTime: "19:00",
    endTime: "21:00",
    timeString: "19:00 - 21:00 WIB",
    title: "PLENARY EVENING: Musyawarah Nasional (Munas) V ADHPHKI 2026 - Sidang Pleno & Pemilihan Pengurus",
    category: "Organisasi & Munas",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "Presidium Sidang Munas ADHPHKI",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.presidium_munas],
    abstract: {
      background: "Agenda tertinggi organisasi ADHPHKI: Sidang Pleno Musyawarah Nasional V ADHPHKI 2026. Pembacaan Laporan Pertanggungjawaban (LPJ) Pengurus Pusat periode 2022-2026, penetapan AD/ART, dan pemilihan Ketua Umum ADHPHKI periode 2026-2030.",
      clinicalUpdates: [
        "Pembahasan sertifikasi kompetensi dokter hewan praktisi hewan kecil tingkat nasional.",
        "Standarisasi tarif pelayanan klinik dan tata kelola resep obat hewan.",
        "Pemungutan suara dan penetapan Ketua Umum & Dewan Pengawas terpilih."
      ],
      conclusion: "Munas V ADHPHKI menghasilkan kepengurusan baru yang solid untuk membawa praktisi hewan kecil Indonesia semakin maju dan diakui di kancah internasional."
    },
    keyTakeaways: [
      "Hak suara sah dimiliki oleh delegasi cabang ADHPHKI terdaftar.",
      "Pengukuhan dewan pengurus baru periode 2026-2030.",
      "Rekomendasi strategis untuk program kerja tahun mendatang."
    ]
  },

  // ============================================================
  // KIVNAHK IV & MUNAS V ADHPHKI: HARI II (SENIN, 30 NOV 2026)
  // ============================================================
  {
    id: "munas-d2-01",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "08:00",
    endTime: "09:30",
    timeString: "08:00 - 09:30 WIB",
    title: "SIMPOSIUM PARALEL 3A: Emergency & Critical Care in Small Animal Practice - Triage to Defibrillation",
    category: "Emergency & Critical Care",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 400,
    speakers: [MUNAS_SPEAKERS.sp_vet_nurse],
    abstract: {
      background: "Penatalaksanaan krisis kegawatdaruratan pada anjing dan kucing di instalasi gawat darurat (IGD) veteriner membutuhkan kecepatan identifikasi syok, henti napas, dan kolaps hemodinamik.",
      clinicalUpdates: [
        "Algoritma RECOVER 2.0 untuk resusitasi kardiopulmoner (CPR) veteriner.",
        "Akses vaskular cepat: Vena perifer vs intraosseous (IO) infusion pada pasien pediatrik/kolaps.",
        "Terapi cairan syok bertarget mikro-vaskular dan penggunaan vasopressor norepinefrin dini."
      ],
      conclusion: "Protokol IGD terstandarisasi meningkatkan tingkat Return of Spontaneous Circulation (ROSC) secara signifikan."
    },
    keyTakeaways: [
      "Lakukan triase penilaian primer (ABCD) dalam 60 detik awal.",
      "Rasio kompresi ventilasi 30:2 pada pasien intubasi darurat.",
      "Hindari hiperventilasi yang menurunkan aliran balik vena ke jantung."
    ]
  },
  {
    id: "munas-d2-02",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "08:00",
    endTime: "09:30",
    timeString: "08:00 - 09:30 WIB",
    title: "SIMPOSIUM PARALEL 3B: Advanced Canine & Feline Cardiology - Murmurs, Arrhythmias & Congestive Heart Failure",
    category: "Kardiologi Veteriner",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura B",
    floor: "Lantai 1",
    roomColor: "bg-emerald-600",
    moderator: "Dr. Ivan Satriawan, DVM, M.Si, Ph.D",
    capacity: 350,
    speakers: [MUNAS_SPEAKERS.dr_ivan],
    abstract: {
      background: "Penyakit katup mitral miksomatosa (MMVD) pada anjing dan kardiomiopati hipertrofik (HCM) pada kucing merupakan penyakit kardiovaskular tersering yang berujung pada gagal jantung kongestif.",
      clinicalUpdates: [
        "Pedoman konsensus ACVIM terbaru mengenai staging dan inisiasi pimobendan pada stadium B2.",
        "Pemeriksaan ekokardiografi Doppler cepat di meja periksa (TFAST / Focused Cardiac Ultrasound).",
        "Penanganan edema pulmo akut: Furosemide bertingkat, oksigenasi non-invasif, dan sedasi butorphanol."
      ],
      conclusion: "Diagnosis dini stadium pre-klinis memperpanjang harapan hidup bebas gagal jantung hingga bertahun-tahun."
    },
    keyTakeaways: [
      "Ekokardiografi dan radiografi toraks merupakan modalitas komplementer utama evaluasi MMVD.",
      "Pemeriksaan NT-proBNP bermanfaat untuk skrining kardiomiopati kucing asimtomatik.",
      "Monitoring Respiratory Rate saat istirahat tidur (SRR < 30x/menit) di rumah oleh pemilik."
    ]
  },
  {
    id: "munas-d2-03",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "09:30",
    endTime: "10:00",
    timeString: "09:30 - 10:00 WIB",
    title: "Morning Coffee Break & Oral Poster Presentation Session",
    category: "Pameran & Poster",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-teal-600",
    moderator: "Komite Ilmiah KIVNAHK",
    capacity: 350,
    speakers: [],
    abstract: {
      background: "Rehat pagi, presentasi poster ilmiah hasil riset klinisi muda veteriner, dan kunjungan pameran stan sponsor farmasi.",
      clinicalUpdates: ["Diskusi interaktif poster studi kasus klinis."],
      conclusion: "Ajang pertukaran gagasan riset klinis aplikatif."
    }
  },
  {
    id: "munas-d2-04",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "10:00",
    endTime: "12:00",
    timeString: "10:00 - 12:00 WIB",
    title: "SIMPOSIUM PARALEL 4A: Small Animal Dermatology - Atopic Dermatitis, Cytology & Monoclonal Antibodies",
    category: "Dermatologi Veteriner",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "drh. Listriani Wistawan",
    capacity: 400,
    speakers: [MUNAS_SPEAKERS.drh_listriani],
    abstract: {
      background: "Pruritus kronis dan dermatitis atopik merupakan alasan kunjungan klinis tersering yang membutuhkan pendekatan diagnosis bertahap tanpa over-prescription antibiotik dan steroid.",
      clinicalUpdates: [
        "Pemberian antibodi monoklonal spesifik anti-IL-31 (Lokivetmab) dan Janus Kinase Inhibitor (Oclacitinib).",
        "Pemeriksaan sitologi kulit (tape strip, skin scrape, direct impression) pada infeksi sekunder Malassezia dan Staphylococcus.",
        "Terapi diet eliminasi makanan berprotein terhidrolisis dan pemulihan sawar kulit (topical ceramide/lipids)."
      ],
      conclusion: "Pendekatan multimodal anti-inflamasi tertarget membebaskan hewan dari siklus garuk tanpa efek samping steroid jangka panjang."
    },
    keyTakeaways: [
      "Selalu obati infeksi sekunder bakteri dan ragi sebelum mengevaluasi pruritus atopik primer.",
      "Lokivetmab aman digunakan bersamaan dengan vaksin dan obat sistemik lainnya.",
      "Kepatuhan pemilik dalam terapi topikal dan diet hipoalergenik sangat esensial."
    ]
  },
  {
    id: "munas-d2-05",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "10:00",
    endTime: "12:00",
    timeString: "10:00 - 12:00 WIB",
    title: "SIMPOSIUM PARALEL 4B: Feline Internal Medicine - FIP Antiviral Protocols, CKD & Hyperthyroidism",
    category: "Penyakit Dalam Kucing",
    type: "Simposium Paralel",
    room: "Ballroom Amartapura B",
    floor: "Lantai 1",
    roomColor: "bg-emerald-600",
    moderator: "Dr. Ivan Satriawan, DVM, M.Si, Ph.D",
    capacity: 350,
    speakers: [MUNAS_SPEAKERS.sp_versus_mass],
    abstract: {
      background: "Penyakit dalam kucing memiliki fisiologi dan metabolisme obat yang unik, terutama penanganan Feline Infectious Peritonitis (FIP), Chronic Kidney Disease (CKD), dan hipertiroidisme.",
      clinicalUpdates: [
        "Regimen terapi FIP modern menggunakan analog nukleosida oral (GS-441524 / Molnupiravir): Dosis, durasi, dan monitoring relaps.",
        "Staging CKD berdasarkan pedoman IRIS: Manajemen hipertensi sistemik, proteinuria, dan pengikat fosfat diet.",
        "Diagnosis dini feline hyperthyroidism via serum T4 total dan penanganan medis thiamazole."
      ],
      conclusion: "Tingkat kesembuhan FIP melonjak dari fatalitas mendekati 100% menjadi lebih dari 85% dengan terapi antiviral modern."
    },
    keyTakeaways: [
      "Monitoring biokimia darah (albumin, globulin, A:G ratio) berkala setiap 4 minggu selama terapi FIP.",
      "Pengendalian tekanan darah sistemik pada kucing CKD mencegah ensefalopati dan retinopati hipertensi.",
      "Diet rendah fosfor dan hidrasi adekuat adalah pilar utama preservasi nefron ginjal."
    ]
  },
  {
    id: "munas-d2-06",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "12:00",
    endTime: "13:30",
    timeString: "12:00 - 13:30 WIB",
    title: "Lunch Break, Exhibition Networking & Product Showcase",
    category: "Pameran & Networking",
    type: "Plenary Session",
    room: "Foyer & Exhibition Amartapura",
    floor: "Lantai 1",
    roomColor: "bg-teal-600",
    moderator: "Panitia Pelaksana",
    capacity: 450,
    speakers: [],
    abstract: {
      background: "Makan siang bersama seluruh peserta dan demo langsung teknologi alat bedah serta diagnostik di booth pameran.",
      clinicalUpdates: ["Demo alat uji diagnostik point-of-care."],
      conclusion: "Networking profesional antar klinisi."
    }
  },
  {
    id: "munas-d2-07",
    day: "Hari II",
    date: "Senin, 30 November 2026",
    startTime: "13:30",
    endTime: "16:00",
    timeString: "13:30 - 16:00 WIB",
    title: "SIDANG KOMISI MUNAS V ADHPHKI: Komisi Organisasi, Regulasi, Standar Pelayanan & Rekomendasi Profesi",
    category: "Organisasi & Munas",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "Presidium Sidang Munas ADHPHKI",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.presidium_munas],
    abstract: {
      background: "Rapat kerja sidang komisi Musyawarah Nasional V ADHPHKI terbagi dalam Komisi A (Organisasi & Keanggotaan), Komisi B (Regulasi & Tarif Pelayanan Klinik), dan Komisi C (Pendidikan Berkelanjutan & Sertifikasi Keahlian Praktisi).",
      clinicalUpdates: [
        "Penyusunan standar akreditasi fasilitas pelayanan kesehatan hewan kecil.",
        "Pedoman pembinaan etik dan perlindungan hukum bagi dokter hewan praktisi.",
        "Kurikulum Continuing Professional Development (CPD) bersertifikat nasional."
      ],
      conclusion: "Rumusan keputusan sidang komisi disahkan menjadi garis-garis besar haluan organisasi periode 2026-2030."
    },
    keyTakeaways: [
      "Perumusan standar operasional prosedur klinis hewan kecil.",
      "Harmonisasi regulasi obat hewan dengan kementerian terkait.",
      "Penguatan jejaring cabang ADHPHKI seluruh Indonesia."
    ]
  },

  // ============================================================
  // KIVNAHK IV & MUNAS V ADHPHKI: HARI III (SELASA, 1 DES 2026)
  // ============================================================
  {
    id: "munas-d3-01",
    day: "Hari III",
    date: "Selasa, 1 Desember 2026",
    startTime: "08:30",
    endTime: "10:30",
    timeString: "08:30 - 10:30 WIB",
    title: "SIDANG PLENO TERBUKA: Penetapan Keputusan Munas V ADHPHKI & Pengukuhan Hasil Pemilihan",
    category: "Organisasi & Munas",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "Presidium Sidang Munas ADHPHKI",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.presidium_munas],
    abstract: {
      background: "Sidang pleno terbuka pembacaan dan pengesahan seluruh surat keputusan hasil Munas V ADHPHKI tahun 2026.",
      clinicalUpdates: ["Penandatanganan berita acara persidangan nasional."],
      conclusion: "Seluruh ketetapan Munas V ADHPHKI sah mengikat seluruh anggota."
    }
  },
  {
    id: "munas-d3-02",
    day: "Hari III",
    date: "Selasa, 1 Desember 2026",
    startTime: "10:30",
    endTime: "12:00",
    timeString: "10:30 - 12:00 WIB",
    title: "PELANTIKAN RESMI: Pengurus Pusat ADHPHKI Masa Bakti 2026 - 2030 oleh PB PDHI",
    category: "Organisasi & Munas",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-indigo-600",
    moderator: "Dewan Pengurus PB PDHI",
    capacity: 450,
    speakers: [MUNAS_SPEAKERS.presidium_munas],
    abstract: {
      background: "Prosesi khidmat pelantikan dan pengambilan sumpah jabatan Ketua Umum serta seluruh jajaran Dewan Pengurus Pusat ADHPHKI periode 2026-2030.",
      clinicalUpdates: ["Pidato perdana Ketua Umum ADHPHKI terpilih."],
      conclusion: "Estafet kepemimpinan baru resmi dimulai."
    }
  },
  {
    id: "munas-d3-03",
    day: "Hari III",
    date: "Selasa, 1 Desember 2026",
    startTime: "12:00",
    endTime: "14:00",
    timeString: "12:00 - 14:00 WIB",
    title: "CLOSING CEREMONY KIVNAHK IV 2026 & FAREWELL LUNCHEON",
    category: "Penutupan & Networking",
    type: "Plenary Session",
    room: "Ballroom Amartapura A",
    floor: "Lantai 1",
    roomColor: "bg-emerald-600",
    moderator: "Panitia Pelaksana",
    capacity: 450,
    speakers: [],
    abstract: {
      background: "Upacara resmi penutupan Konferensi Ilmiah Veteriner Nasional Hewan Kecil (KIVNAHK) ke-4 dan perpisahan ramah tamah seluruh delegasi dokter hewan Indonesia.",
      clinicalUpdates: [
        "Pengumuman pemenang Best Oral Presentation dan Best Poster Presentation.",
        "Penyerahan sertifikat SKP PB PDHI kepada delegasi.",
        "Santap siang perpisahan (Farewell Luncheon)."
      ],
      conclusion: "KIVNAHK IV & MUNAS V ADHPHKI 2026 sukses diselenggarakan dengan penuh kebersamaan dan prestasi ilmiah."
    }
  }
];
