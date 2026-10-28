import { Exhibitor } from '../types';

export const EXHIBITORS_DATA: Exhibitor[] = [
  {
    id: "ex-1",
    name: "PT Kalbe Farma Tbk",
    boothNumber: "A-01",
    category: "Farmasi",
    zone: "Zona A (Main Pharma Hall)",
    tagline: "Inovasi Terapi Kardiovaskular, Metabolik & Nutrisi Klinis Terintegrasi",
    description: "Perusahaan farmasi terkemuka di Indonesia yang menghadirkan portofolio lengkap terapi kardiovaskular, antidiabetes generasi terbaru, serta produk nutrisi klinis untuk pemulihan pasien kritis.",
    featuredProducts: [
      "Statin & Antihipertensi Kombinasi Dosis Tetap",
      "Solusi Nutrisi Enteral & Parenteral ICU",
      "Biosimilar & Onkologi Terarah"
    ],
    contactEmail: "medinfo@kalbe.co.id",
    website: "https://www.kalbe.co.id",
    phone: "+62 21 4287 3888",
    demoSchedule: "Pukul 10:00 & 13:30 WIB: Diskusi Klinis Nutrisi ICU Bersama Konsultan",
    highlight: "Sedia Sampel Edukasi Medis & Brosur PNPK Terbaru"
  },
  {
    id: "ex-2",
    name: "GE Healthcare Indonesia",
    boothNumber: "B-01",
    category: "Alat Medis & Diagnostik",
    zone: "Zona B (Diagnostic & Imaging Pavilion)",
    tagline: "Teknologi Point-of-Care Ultrasound (POCUS) & Pencitraan Kardiak Presisi",
    description: "Menampilkan mesin ultrasound portable generasi Vscan Air™ nirkabel, sistem ekokardiografi Vivid™ Ultra Edition, dan solusi radiologi AI untuk deteksi stroke cepat.",
    featuredProducts: [
      "Vscan Air™ Wireless Dual-Probe POCUS (Curved & Linear)",
      "Vivid T9 Ultra Edition Echocardiography",
      "Revolution™ Apex CT AI-Powered Scanner"
    ],
    contactEmail: "contact.indonesia@gehealthcare.com",
    website: "https://www.gehealthcare.co.id",
    phone: "+62 21 5795 3888",
    demoSchedule: "Hands-on Trial: Uji Coba Probe Nirkabel POCUS Setiap Jam Break",
    highlight: "Voucher Pelatihan Workshop POCUS Simposium"
  },
  {
    id: "ex-3",
    name: "PT Dexa Medica",
    boothNumber: "A-02",
    category: "Farmasi",
    zone: "Zona A (Main Pharma Hall)",
    tagline: "Keahlian Riset Herbal Modern (DLBS) & Obat Preskripsi Berkualitas",
    description: "Dexa Medica memamerkan lini produk kardiovaskular, antidiabetik oral, antiinfeksi, serta Obat Modern Asli Indonesia (OMAI) yang telah teruji klinis.",
    featuredProducts: [
      "Inlacin® (DLBS3233 untuk Resistensi Insulin)",
      "Redacid® (DLBS2411 untuk Dispepsia & GERD)",
      "Antiplatelet & ARB Kualitas Ekspor"
    ],
    contactEmail: "medical.affairs@dexagroup.com",
    website: "https://www.dexa-medica.com",
    demoSchedule: "Pukul 11:30 WIB: Mini-Lecture Fitofarmaka Teruji Klinis",
    highlight: "Konsultasi Interaktif dengan Tim Farmakolog Medis"
  },
  {
    id: "ex-4",
    name: "Siemens Healthineers Indonesia",
    boothNumber: "B-02",
    category: "Alat Medis & Diagnostik",
    zone: "Zona B (Diagnostic & Imaging Pavilion)",
    tagline: "Transformasi Pelayanan Kesehatan Presisi Melalui AI & Kedokteran Digital",
    description: "Menghadirkan solusi imaging intervensi mutakhir, laboratorium diagnostik otomatis berkecepatan tinggi, dan platform analisis radiologi berbasis kecerdasan buatan.",
    featuredProducts: [
      "Artis zee Biplane Angiography System untuk Kateterisasi",
      "MAGNETOM Free.Max MRI He-Free",
      "Atellica® Solution Clinical Chemistry & Immunoassay"
    ],
    contactEmail: "healthcare.id@siemens-healthineers.com",
    website: "https://www.siemens-healthineers.com/id",
    demoSchedule: "Pukul 14:00 WIB: Simulasi VR Kateterisasi Vaskular Stroke",
    highlight: "Simulasi Virtual Reality (VR) Tindakan Trombektomi"
  },
  {
    id: "ex-5",
    name: "Mindray Medical Indonesia",
    boothNumber: "B-03",
    category: "Alat Medis & Diagnostik",
    zone: "Zona B (Diagnostic & Imaging Pavilion)",
    tagline: "Solusi Monitor Pasien Kritis, Ventilator, dan Sistem Anestesi Terintegrasi",
    description: "Penyedia global terpercaya untuk peralatan pemantauan pasien di ICU dan OK, defibrilator cerdas BeneHeart D30, dan ventilator non-invasif ramah klinisi.",
    featuredProducts: [
      "BeneHeart D30 Defibrillator & Monitor",
      "SV300 Ventilator Transport & ICU",
      "M-Connect IT Solution Integrasi Rekam Medis"
    ],
    contactEmail: "service.id@mindray.com",
    website: "https://www.mindray.com/id",
    demoSchedule: "Uji Simulasi Resusitasi Jantung Paru Real-time Feedback",
    highlight: "Alat Demo Defibrilator Siap Dicoba Langsung"
  },
  {
    id: "ex-6",
    name: "PT Kimia Farma Tbk",
    boothNumber: "A-03",
    category: "Farmasi",
    zone: "Zona A (Main Pharma Hall)",
    tagline: "Kemandirian Bahan Baku Obat dan Layanan Kesehatan Komprehensif",
    description: "BUMN Farmasi terbesar di Indonesia dengan ekosistem kesehatan terpadu: pabrik obat modern, apotek jaringan nasional, dan laboratorium klinik terakreditasi.",
    featuredProducts: [
      "Obat Esensial & Generik Berstandar CPOB",
      "Layanan Vaksinasi Dewasa & Skrining Preventif",
      "Bahan Baku Obat (BBO) Produksi Dalam Negeri"
    ],
    contactEmail: "contact@kimiafarma.co.id",
    website: "https://www.kimiafarma.co.id",
    demoSchedule: "Pukul 10:30 WIB: Skrining Profil Lipid & Gula Darah Gratis",
    highlight: "Pemeriksaan Kesehatan Singkat Gratis Bagi Peserta"
  },
  {
    id: "ex-7",
    name: "Olympus Medical Systems Indonesia",
    boothNumber: "B-04",
    category: "Alat Medis & Diagnostik",
    zone: "Zona B (Diagnostic & Imaging Pavilion)",
    tagline: "Teknologi Endoskopi Saluran Cerna NBI & Visualisasi Bedah 4K 3D",
    description: "Standar emas dunia dalam video endoskopi gastrointestinal EVIS X1 dengan Narrow Band Imaging (NBI) untuk deteksi dini neoplasia dan sistem laparoskopi bedah digestif 4K.",
    featuredProducts: [
      "EVIS X1 Endoscopy System dengan Dual Focus",
      "VISERA ELITE III 4K 3D Surgical Imaging",
      "Perangkat Hemostasis Elektrosurgikal Thunderbeat"
    ],
    contactEmail: "med-service@olympus.co.id",
    website: "https://www.olympus.co.id",
    demoSchedule: "Hands-on Model Endoskopi Simulator: Deteksi Polip Saluran Cerna",
    highlight: "Simulator Endoskopi Interaktif untuk Dokter Spesialis"
  },
  {
    id: "ex-8",
    name: "Halodoc HealthTech & MedAI Solutions",
    boothNumber: "D-01",
    category: "Teknologi & AI",
    zone: "Zona D (Digital Health & AI Hub)",
    tagline: "Ekosistem Telemedisin Terpadu, Rujukan Digital & Integrasi SATUSEHAT",
    description: "Membantu dokter dan klinik bertransformasi digital: integrasi Rekam Medis Elektronik (RME) standar Kemenkes, telekonsultasi dokter spesialis, dan asisten klinis AI.",
    featuredProducts: [
      "Halodoc Clinic RME Cloud Berstandar SatuSehat",
      "AI Scribe Transkripsi Catatan Medis Dokter",
      "Layanan Telekonsultasi Rujukan Lintas Faskes"
    ],
    contactEmail: "partner@halodoc.com",
    website: "https://www.halodoc.com",
    demoSchedule: "Pukul 11:00 & 15:00 WIB: Live Demo AI Medical Scribe",
    highlight: "Uji Coba Gratis RME Cloud 3 Bulan untuk Praktek Mandiri"
  },
  {
    id: "ex-9",
    name: "RS Jantung dan Pembuluh Darah Harapan Kita",
    boothNumber: "C-01",
    category: "Rumah Sakit & Lab",
    zone: "Zona C (Hospital & Academic Network)",
    tagline: "Pusat Rujukan Kardiovaskular Nasional & Program Pelatihan Klinis",
    description: "Informasi rujukan bedah jantung terbuka, fellowship intervensi kardiologi, fellowship elektrofisiologi, dan pendaftaran riset multi-senter nasional.",
    featuredProducts: [
      "Informasi Alur Rujukan Kasus Jantung Kompleks",
      "Program Pendidikan Kedokteran Berkelanjutan (P2KB)",
      "Buku Panduan Tata Laksana ACS Harapan Kita"
    ],
    contactEmail: "info@pjnhk.go.id",
    website: "https://www.pjnhk.go.id",
    demoSchedule: "Pukul 13:00 WIB: Sharing Session Jalur Fellowship Kardiologi 2026",
    highlight: "Konsultasi Program Fellowship & Riset Jantung"
  },
  {
    id: "ex-10",
    name: "Penerbit Buku Kedokteran EGC & IDI Publishing",
    boothNumber: "C-02",
    category: "Rumah Sakit & Lab",
    zone: "Zona C (Hospital & Academic Network)",
    tagline: "Literatur Kedokteran Terpercaya, Panduan Praktik Klinis & Atlas Anatomi",
    description: "Menyediakan buku teks referensi kedokteran terbaru edisi 2026, PNPK Kemenkes RI, panduan EKG klinis, manual gawat darurat bedah, dan akses E-Book kedokteran.",
    featuredProducts: [
      "Buku Saku Kedaruratan Kardiovaskular ACLS 2026",
      "Atlas Anatomi Manusia Sobotta & Netter",
      "Panduan Terapi Penyakit Dalam Harrison Edisi Terjemahan"
    ],
    contactEmail: "pemasaran@egc-medbooks.com",
    website: "https://www.egc-medbooks.com",
    demoSchedule: "Bazar Buku Medis Buka Penuh Sepanjang Hari",
    highlight: "Diskon Khusus Simposium Hingga 35% Semua Buku Kedokteran"
  }
];
