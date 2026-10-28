import React from 'react';
import { Filter, DoorOpen, Stethoscope, RotateCcw } from 'lucide-react';
import { ROOMS_LIST, CATEGORIES_LIST } from '../data/symposiumData';

interface FilterSectionProps {
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onResetFilters: () => void;
  totalResults: number;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedRoom,
  onSelectRoom,
  selectedCategory,
  onSelectCategory,
  onResetFilters,
  totalResults
}) => {
  const hasActiveFilter = selectedRoom !== 'all' || selectedCategory !== 'Semua Kategori';

  return (
    <div className="bg-white/90 backdrop-blur border-b border-slate-200 py-2.5 px-3 sm:px-4 sticky top-[108px] z-20 shadow-xs">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
          <div className="flex items-center text-slate-500 font-medium mr-1 text-[11px] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 mr-1 text-sky-600" />
            <span>Filter:</span>
          </div>

          {/* Room Filter Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedRoom}
              onChange={(e) => onSelectRoom(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            >
              {ROOMS_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.floor !== 'Semua' ? `(${r.floor})` : ''}
                </option>
              ))}
            </select>
            <DoorOpen className="w-3.5 h-3.5 absolute left-2.5 top-2 text-sky-600 pointer-events-none" />
            <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>

          {/* Specialty Category Filter Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            >
              {CATEGORIES_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Stethoscope className="w-3.5 h-3.5 absolute left-2.5 top-2 text-indigo-600 pointer-events-none" />
            <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilter && (
            <button
              onClick={onResetFilters}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-medium flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-[11px] font-medium text-slate-500 ml-auto">
          Menampilkan <span className="font-bold text-slate-800">{totalResults}</span> Sesi Sesuai Filter
        </div>

      </div>
    </div>
  );
};
