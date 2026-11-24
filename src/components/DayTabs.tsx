import React from 'react';
import { Calendar, User, LayoutGrid, MapPin } from 'lucide-react';

interface DayTabsProps {
  activeTab: string; // 'Hari I' | 'Hari II' | 'pembicara' | 'ruangan' | 'denah'
  onSelectTab: (tab: string) => void;
  day1Count: number;
  day2Count: number;
}

export const DayTabs: React.FC<DayTabsProps> = ({
  activeTab,
  onSelectTab,
  day1Count,
  day2Count,
}) => {
  return (
    <div className="bg-white border-b border-slate-100 sticky top-[105px] sm:top-[98px] z-20 shadow-2xs">
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        {/* Main Navigation Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-2">
          
          {/* Hari I Tab */}
          <button
            onClick={() => onSelectTab('Hari I')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 border-b-2 ${
              activeTab === 'Hari I'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>HARI I</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'Hari I' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {day1Count}
            </span>
          </button>

          {/* Hari II Tab */}
          <button
            onClick={() => onSelectTab('Hari II')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 border-b-2 ${
              activeTab === 'Hari II'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>HARI II</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'Hari II' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {day2Count}
            </span>
          </button>

          {/* Secondary views */}
          <button
            onClick={() => onSelectTab('ruangan')}
            className={`py-3 px-3 text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap border-b-2 ${
              activeTab === 'ruangan'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ruangan</span>
          </button>

          <button
            onClick={() => onSelectTab('denah')}
            className={`py-3 px-3 text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap border-b-2 ${
              activeTab === 'denah'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Denah Gedung</span>
          </button>

          <button
            onClick={() => onSelectTab('pembicara')}
            className={`py-3 px-3 text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap border-b-2 ${
              activeTab === 'pembicara'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pembicara</span>
          </button>

        </div>
      </div>
    </div>
  );
};
