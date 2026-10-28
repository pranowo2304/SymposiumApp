import React, { useState } from 'react';
import { User, Search, Building, Mail, ChevronRight, BookOpen } from 'lucide-react';
import { Speaker } from '../types';
import { SPEAKERS_DATABASE } from '../data/symposiumData';

interface SpeakerDirectoryProps {
  speakers?: Speaker[];
  onSelectSpeaker: (speaker: Speaker) => void;
}

export const SpeakerDirectory: React.FC<SpeakerDirectoryProps> = ({ 
  speakers, 
  onSelectSpeaker 
}) => {
  const [search, setSearch] = useState('');

  const allSpeakers = speakers && speakers.length > 0 ? speakers : Object.values(SPEAKERS_DATABASE);

  const filteredSpeakers = allSpeakers.filter(sp =>
    sp.name.toLowerCase().includes(search.toLowerCase()) ||
    sp.title.toLowerCase().includes(search.toLowerCase()) ||
    sp.institution.toLowerCase().includes(search.toLowerCase()) ||
    sp.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-5 animate-in fade-in duration-200">
      
      {/* Search & Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Direktori Pembicara & Narasumber Simposium
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pakar kedokteran, konsultan spesialis, dan guru besar yang mengisi materi simposium.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 self-start sm:self-auto">
            Total {allSpeakers.length} Narasumber
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari narasumber berdasarkan nama, institusi, atau kepakaran..."
            className="w-full bg-slate-50 border border-slate-300 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Speaker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSpeakers.map(sp => (
          <div
            key={sp.id}
            onClick={() => onSelectSpeaker(sp)}
            className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start space-x-3 sm:space-x-4 mb-3">
                <img
                  src={sp.photoUrl}
                  alt={sp.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full mb-1">
                    {sp.specialty}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 leading-snug">
                    {sp.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {sp.title}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center mt-1">
                    <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                    <span className="truncate">{sp.institution}</span>
                  </p>
                </div>
              </div>

              {/* Biografi Singkat Snippet */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <BookOpen className="w-3 h-3 mr-1 text-amber-600" />
                  Biografi Singkat:
                </div>
                <p className="line-clamp-2 leading-relaxed">
                  {sp.bio}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-amber-700">
              <span>Lihat Profil & Jadwal Sesi →</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
