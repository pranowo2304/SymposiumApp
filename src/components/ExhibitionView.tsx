import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Sparkles, 
  ExternalLink, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  X, 
  Layers, 
  Info,
  Award
} from 'lucide-react';
import { Exhibitor } from '../types';
import { EXHIBITORS_DATA } from '../data/exhibitorsData';

interface ExhibitionViewProps {
  exhibitors?: Exhibitor[];
  onOpenVenue: () => void;
}

export const ExhibitionView: React.FC<ExhibitionViewProps> = ({ 
  exhibitors,
  onOpenVenue 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);

  const categories = [
    'Semua Kategori',
    'Farmasi',
    'Alat Medis & Diagnostik',
    'Teknologi & AI',
    'Rumah Sakit & Lab'
  ];

  const sourceExhibitors = exhibitors && exhibitors.length > 0 ? exhibitors : EXHIBITORS_DATA;

  const filteredExhibitors = sourceExhibitors.filter((ex) => {
    const matchesCat = selectedCategory === 'Semua Kategori' || ex.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      ex.name.toLowerCase().includes(q) ||
      ex.boothNumber.toLowerCase().includes(q) ||
      ex.tagline.toLowerCase().includes(q) ||
      ex.featuredProducts.some(p => p.toLowerCase().includes(q)) ||
      ex.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-5 animate-in fade-in duration-200">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-2xl p-4 sm:p-6 border border-amber-800/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Store className="w-4 h-4" />
              <span>Pameran Alat Kesehatan & Industri Farmasi</span>
              <span>•</span>
              <span className="text-amber-200">Main Exhibition Hall Foyer</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Medical Expo & Pameran Inovasi Kesehatan 2026
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl leading-relaxed">
              Jelajahi inovasi farmakoterapi mutakhir, perangkat ultrasonografi point-of-care nirkabel, sistem robotik bedah, teknologi rekam medis digital, dan literatur ilmiah kedokteran terkini.
            </p>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 text-center shrink-0">
            <span className="text-[10px] text-amber-300 uppercase font-extrabold block">Partisipan Industri</span>
            <span className="text-xl font-black text-white">{EXHIBITORS_DATA.length} Booth</span>
            <span className="text-[10px] text-amber-200 block">4 Zona Terintegrasi</span>
          </div>
        </div>

        {/* Quick Zone Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-amber-800/60 mt-4 text-xs">
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <span className="text-amber-300 font-bold block">Zona A: Farmasi</span>
            <span className="text-slate-300 text-[11px]">Kalbe, Dexa, Kimia Farma</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <span className="text-amber-300 font-bold block">Zona B: Diagnostic</span>
            <span className="text-slate-300 text-[11px]">GE, Siemens, Olympus, Mindray</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <span className="text-amber-300 font-bold block">Zona C: Rumah Sakit & Buku</span>
            <span className="text-slate-300 text-[11px]">RS Harapan Kita & EGC</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 border border-white/10">
            <span className="text-amber-300 font-bold block">Zona D: HealthTech AI</span>
            <span className="text-slate-300 text-[11px]">Halodoc & RME SatuSehat</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama perusahaan, nomor booth (misal A-01), alat atau obat..."
              className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onOpenVenue}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Lokasi Booth di Denah JCC</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exhibitors List Grid */}
      {filteredExhibitors.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
          <Store className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Booth Ditemukan</h3>
          <p className="text-xs text-slate-500">
            Coba ganti kata kunci pencarian atau pilih kategori lain.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Semua Kategori');
              setSearchQuery('');
            }}
            className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExhibitors.map((ex) => (
            <div
              key={ex.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                {/* Top Badge & Booth ID */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>BOOTH {ex.boothNumber}</span>
                  </span>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {ex.category}
                  </span>
                </div>

                {/* Company Name & Zone */}
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {ex.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{ex.zone}</span>
                  </p>
                </div>

                {/* Tagline */}
                <p className="text-xs font-semibold text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 leading-snug">
                  {ex.tagline}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ex.description}
                </p>

                {/* Featured Products */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Produk & Solusi Utama:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.featuredProducts.map((prod, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Demo schedule or highlight */}
                {ex.demoSchedule && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-200 flex items-start gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ex.demoSchedule}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {ex.highlight && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200 line-clamp-1">
                    ★ {ex.highlight}
                  </span>
                )}

                <button
                  onClick={() => setSelectedExhibitor(ex)}
                  className="ml-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Info Lengkap Booth</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exhibitor Detail Modal */}
      {selectedExhibitor && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedExhibitor(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                    BOOTH {selectedExhibitor.boothNumber}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {selectedExhibitor.category}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedExhibitor.name}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedExhibitor.zone}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedExhibitor(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-xs font-bold text-amber-900 block">
                  {selectedExhibitor.tagline}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Profil & Penawaran Eksklusif
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedExhibitor.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Produk & Inovasi Dipamerkan
                </h4>
                <div className="space-y-1.5">
                  {selectedExhibitor.featuredProducts.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExhibitor.demoSchedule && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Jadwal Presentasi / Live Demo di Booth:
                  </span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{selectedExhibitor.demoSchedule}</span>
                  </p>
                </div>
              )}

              {/* Contact and Website */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
                {selectedExhibitor.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedExhibitor.contactEmail}</span>
                  </div>
                )}
                {selectedExhibitor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedExhibitor.phone}</span>
                  </div>
                )}
                {selectedExhibitor.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <a 
                      href={selectedExhibitor.website} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Kunjungi Website Resmi
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedExhibitor(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
