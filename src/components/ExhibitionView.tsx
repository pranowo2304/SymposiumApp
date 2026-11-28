import React, { useMemo, useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Clock, 
  X
} from 'lucide-react';
import { Exhibitor } from '../types';
import { EXHIBITORS_DATA } from '../data/exhibitorsData';

interface ExhibitionViewProps {
  exhibitors?: Exhibitor[];
  onOpenVenue: () => void;
}

const DEFAULT_CATEGORIES = [
  'Farmasi',
  'Alat Medis & Diagnostik',
  'Teknologi & AI',
  'Rumah Sakit & Lab'
];

const getZoneDisplayLabel = (ex: Exhibitor): string => {
  const trimmedZone = (ex.zone || '').trim();
  if (trimmedZone) return trimmedZone;
  const trimmedCategory = (ex.category || '').trim();
  if (trimmedCategory) return trimmedCategory;
  return 'Zona Pameran';
};

const getZoneKey = (ex: Exhibitor): string =>
  getZoneDisplayLabel(ex).toLowerCase();

export const ExhibitionView: React.FC<ExhibitionViewProps> = ({ 
  exhibitors,
  onOpenVenue 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sourceExhibitors = exhibitors !== undefined ? exhibitors : EXHIBITORS_DATA;

  const categories = useMemo(() => {
    const extraCategories = Array.from(
      new Set(
        sourceExhibitors
          .map((ex) => (ex.category || '').trim())
          .filter((cat) => cat && !DEFAULT_CATEGORIES.includes(cat))
      )
    );
    return ['Semua Kategori', ...DEFAULT_CATEGORIES, ...extraCategories];
  }, [sourceExhibitors]);

  const zoneSummaries = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; exhibitors: Exhibitor[] }
    >();

    for (const ex of sourceExhibitors) {
      const label = getZoneDisplayLabel(ex);
      const key = label.toLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.exhibitors.push(ex);
      } else {
        groups.set(key, { key, label, exhibitors: [ex] });
      }
    }

    return Array.from(groups.values())
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'id', { numeric: true, sensitivity: 'base' })
      )
      .map((group) => {
        const sortedBooths = [...group.exhibitors].sort((a, b) =>
          (a.boothNumber || '').localeCompare(b.boothNumber || '', 'id', {
            numeric: true,
            sensitivity: 'base'
          })
        );
        const companies = Array.from(
          new Set(
            sortedBooths
              .map((ex) => (ex.name || '').trim())
              .filter(Boolean)
          )
        );
        return {
          key: group.key,
          label: group.label,
          count: sortedBooths.length,
          companies
        };
      });
  }, [sourceExhibitors]);

  const activeZoneLabel = useMemo(() => {
    if (selectedZone === 'all') return null;
    return zoneSummaries.find((z) => z.key === selectedZone)?.label || null;
  }, [selectedZone, zoneSummaries]);

  const filteredExhibitors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sourceExhibitors
      .filter((ex) => {
        const matchesCat =
          selectedCategory === 'Semua Kategori' || ex.category === selectedCategory;
        const matchesZone =
          selectedZone === 'all' || getZoneKey(ex) === selectedZone;
        const matchesSearch =
          !q ||
          (ex.name || '').toLowerCase().includes(q) ||
          (ex.boothNumber || '').toLowerCase().includes(q) ||
          (ex.zone || '').toLowerCase().includes(q) ||
          (ex.tagline || '').toLowerCase().includes(q) ||
          (ex.featuredProducts || []).some((p) => (p || '').toLowerCase().includes(q)) ||
          (ex.description || '').toLowerCase().includes(q);
        return matchesCat && matchesZone && matchesSearch;
      })
      .sort((a, b) =>
        (a.boothNumber || '').localeCompare(b.boothNumber || '', 'id', {
          numeric: true,
          sensitivity: 'base'
        })
      );
  }, [sourceExhibitors, selectedCategory, selectedZone, searchQuery]);

  const zoneGridClass =
    zoneSummaries.length === 1
      ? 'grid-cols-1'
      : zoneSummaries.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : zoneSummaries.length === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-5">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-2xl p-4 sm:p-6 border border-amber-800/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Store className="w-4 h-4" />
              <span>Pameran Alat Kesehatan & Industri Farmasi</span>
              <span>•</span>
              <span className="text-amber-200">Foyer Amartapura Ballroom • Lantai 1</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Medical Expo & Pameran Inovasi Kesehatan 2026
            </h2>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 text-center shrink-0">
            <span className="text-[10px] text-amber-300 uppercase font-extrabold block">Partisipan Industri</span>
            <span className="text-xl font-black text-white">{sourceExhibitors.length} Booth</span>
            <span className="text-[10px] text-amber-200 block">
              {zoneSummaries.length > 0
                ? `${zoneSummaries.length} Zona Terintegrasi`
                : 'Belum Ada Zona'}
            </span>
          </div>
        </div>

        {/* Dynamic Zone Highlights derived from actual exhibitors */}
        {zoneSummaries.length > 0 && (
          <div className={`grid ${zoneGridClass} gap-2 pt-4 border-t border-amber-800/60 mt-4 text-xs`}>
            {zoneSummaries.map((zone) => {
              const isSelected = selectedZone === zone.key;
              return (
                <button
                  key={zone.key}
                  type="button"
                  onClick={() =>
                    setSelectedZone((prev) => (prev === zone.key ? 'all' : zone.key))
                  }
                  title={zone.companies.join(', ')}
                  className={`text-left rounded-lg p-2.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-300/80 ring-1 ring-amber-300/60'
                      : 'bg-white/10 hover:bg-white/15 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-0.5">
                    <span className="text-amber-300 font-bold leading-snug">
                      {zone.label}
                    </span>
                    <span className="text-[10px] font-bold text-amber-100/90 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                      {zone.count}
                    </span>
                  </div>
                  <span className="text-slate-200 text-[11px] leading-snug block">
                    {zone.companies.length > 0
                      ? zone.companies.join(', ')
                      : 'Belum ada perusahaan terdaftar'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
            <span>Lokasi Booth: Foyer Amartapura (Lt. 1)</span>
          </button>
        </div>

        {/* Category Filter Pills & Active Zone Filter */}
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
          {activeZoneLabel && (
            <button
              onClick={() => setSelectedZone('all')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1"
            >
              <span>Zona: {activeZoneLabel}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Exhibitors List Grid */}
      {filteredExhibitors.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
          <Store className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Booth Ditemukan</h3>
          <p className="text-xs text-slate-500">
            Coba ganti kata kunci pencarian atau pilih kategori/zona lain.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Semua Kategori');
              setSelectedZone('all');
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
                    <span>{getZoneDisplayLabel(ex)}</span>
                  </p>
                </div>

                {/* Tagline */}
                {ex.tagline?.trim() && (
                  <p className="text-xs font-semibold text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 leading-snug">
                    {ex.tagline}
                  </p>
                )}

                {/* Description */}
                {ex.description?.trim() && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                )}

                {/* Featured Products */}
                {(ex.featuredProducts || []).length > 0 && (
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
                )}

                {/* Demo schedule or highlight */}
                {ex.demoSchedule && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-200 flex items-start gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ex.demoSchedule}</span>
                  </div>
                )}
              </div>

              {/* Highlight Footer (only if present) */}
              {ex.highlight?.trim() &&
                ex.highlight.trim().toLowerCase() !== 'sample produk medis gratis' && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200 line-clamp-1">
                      ★ {ex.highlight}
                    </span>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
