import { Room } from '../types';

export const DEFAULT_ROOMS_DATA: Room[] = [
  // --- GROUND FLOOR (LANTAI DASAR) - WORKSHOP ROOMS ---
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
    description: "Ruang Workshop Versus - MASS Hunt (From Pixel to Cell) di Lantai Ground Floor dengan stasiun USG beresolusi tinggi dan mikroskop sitologi.",
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
    description: "Ruang Workshop Vet Nurse - Nurse Excellence Track di Lantai Ground Floor untuk pelatihan kompetensi paramedis veteriner, triase darurat, dan monitoring intensif.",
    facilities: ["Manekin Resusitasi Kritis Hewan", "Monitor Anestesi Multi-Parameter", "Infusion & Syringe Pump Station", "Sound System HD", "AC Sentral"],
    type: "workshop"
  },

  // --- LANTAI 1 - PLENARY, PARALLEL & EXHIBITION ---
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
    description: "Ballroom Pleno utama di Lantai 1 untuk sesi Plenary Lectures, WSAVA Keynote, Pembukaan Resmi, dan Sidang Musyawarah Nasional V ADHPHKI.",
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
    description: "Area pameran farmasi veteriner, peralatan bedah hewan, USG, anestesi hewan, coffee break networking, dan meja registrasi barcode QR.",
    facilities: ["Booth Pameran Farmasi Veteriner", "Coffee Break Counter", "Meja Registrasi Barcode QR", "Helpdesk SKP PDHI"],
    type: "facility"
  }
];
