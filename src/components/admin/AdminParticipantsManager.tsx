import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Mail, 
  ShieldCheck, 
  Building, 
  Phone, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  X,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Participant } from '../../types';
import { 
  registerOrUpdateParticipant, 
  deleteStoredParticipant, 
  importParticipantsFromCSV, 
  exportParticipantsToCSV, 
  resetParticipantsToDefault,
  setActiveParticipant
} from '../../data/participantData';

interface AdminParticipantsManagerProps {
  participants: Participant[];
  onParticipantsChange: (updatedList: Participant[]) => void;
  activeParticipant: Participant;
  onSetActiveParticipant: (participant: Participant) => void;
  onShowToast: (msg: string) => void;
}

export const AdminParticipantsManager: React.FC<AdminParticipantsManagerProps> = ({
  participants,
  onParticipantsChange,
  activeParticipant,
  onSetActiveParticipant,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ticketFilter, setTicketFilter] = useState<string>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);

  // Participant Form state
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formNpaIdi, setFormNpaIdi] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formRole, setFormRole] = useState<Participant['role']>('Dokter Spesialis');
  const [formPhone, setFormPhone] = useState('');
  const [formTicketType, setFormTicketType] = useState<Participant['ticketType']>('Simposium Full Pass');

  // Filter participants
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.npaIdi && p.npaIdi.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesTicket = ticketFilter === 'all' || p.ticketType === ticketFilter;

    return matchesSearch && matchesRole && matchesTicket;
  });

  const handleOpenAdd = () => {
    setEditingParticipant(null);
    setFormEmail('');
    setFormName('');
    setFormTitle('');
    setFormNpaIdi('');
    setFormInstitution('');
    setFormRole('Dokter Spesialis');
    setFormPhone('');
    setFormTicketType('Simposium Full Pass');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setFormEmail(p.email);
    setFormName(p.name);
    setFormTitle(p.title || '');
    setFormNpaIdi(p.npaIdi || '');
    setFormInstitution(p.institution);
    setFormRole(p.role);
    setFormPhone(p.phone || '');
    setFormTicketType(p.ticketType || 'Simposium Full Pass');
    setIsEditModalOpen(true);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formEmail.includes('@')) {
      onShowToast('Mohon masukkan format email yang valid.');
      return;
    }
    if (!formName.trim()) {
      onShowToast('Mohon masukkan nama peserta.');
      return;
    }

    const payload: Participant = {
      id: editingParticipant ? editingParticipant.id : `part-${Date.now()}`,
      email: formEmail.trim().toLowerCase(),
      name: formName.trim(),
      title: formTitle.trim(),
      npaIdi: formNpaIdi.trim(),
      institution: formInstitution.trim() || 'RS / Faskes Peserta',
      role: formRole,
      phone: formPhone.trim(),
      ticketType: formTicketType,
      badgeId: editingParticipant?.badgeId || `ID-SIMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      registeredAt: editingParticipant?.registeredAt || new Date().toISOString().split('T')[0]
    };

    const { participants: updatedList, saved } = registerOrUpdateParticipant(payload);
    onParticipantsChange(updatedList);

    // If currently active participant was modified, update it
    if (activeParticipant.email.toLowerCase() === saved.email.toLowerCase() || activeParticipant.id === saved.id) {
      onSetActiveParticipant(saved);
    }

    onShowToast(`Data peserta "${saved.name}" berhasil disimpan.`);
    setIsEditModalOpen(false);
  };

  const handleDelete = (p: Participant) => {
    const updated = deleteStoredParticipant(p.id);
    onParticipantsChange(updated);
    onShowToast(`Peserta "${p.name}" telah dihapus.`);
    if (activeParticipant.id === p.id && updated.length > 0) {
      onSetActiveParticipant(updated[0]);
    }
  };

  const handleExportCSV = () => {
    const csvData = exportParticipantsToCSV(participants);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_peserta_simposium_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Data peserta berhasil diekspor ke CSV.');
  };

  const handleImportCSVSubmit = () => {
    if (!importCsvText.trim()) {
      onShowToast('Mohon tempelkan atau unggah data CSV terlebih dahulu.');
      return;
    }
    const result = importParticipantsFromCSV(importCsvText);
    setImportResult({
      imported: result.importedCount,
      updated: result.updatedCount,
      errors: result.errors
    });
    onParticipantsChange(result.totalParticipants);
    onShowToast(`Impor selesai: ${result.importedCount} peserta baru, ${result.updatedCount} diperbarui.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportCsvText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    const resetList = resetParticipantsToDefault();
    onParticipantsChange(resetList);
    onSetActiveParticipant(resetList[0]);
    onShowToast('Daftar peserta dikembalikan ke setelan default.');
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Integrasi Identitas & Database
            </span>
            <span className="text-xs text-slate-400">Total: {participants.length} Peserta Terdaftar</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Data Peserta Simposium & Email
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sistem mengenali nama lengkap, gelar, NPA IDI, dan RS peserta secara otomatis berdasarkan alamat email yang dimasukkan. Anda dapat mengimpor data peserta dari spreadsheet atau CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setImportResult(null);
              setImportCsvText('');
              setIsImportModalOpen(true);
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Impor CSV / Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peserta</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors border border-slate-700"
            title="Reset ke data awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active User Highlight Bar */}
      {activeParticipant && (
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900 p-4 rounded-2xl border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {activeParticipant.name ? activeParticipant.name.charAt(0) : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  User Aktif Saat Ini di Aplikasi
                </span>
                <span className="text-xs font-bold text-slate-300">{activeParticipant.role || 'Peserta'}</span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {activeParticipant.name || 'dr. Peserta'}
              </h4>
              <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-blue-300 font-semibold">{activeParticipant.email}</span>
                <span>•</span>
                <span>NPA IDI: {activeParticipant.npaIdi || '-'}</span>
                <span>•</span>
                <span>{activeParticipant.institution}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Badge:</span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-mono font-bold text-amber-300 border border-slate-700">
              {activeParticipant.badgeId || 'ID-SIMP'}
            </span>
          </div>
        </div>
      )}

      {/* Filters and search */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, NPA IDI, RS..."
            className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Kategori Profesi</option>
            <option value="Dokter Spesialis">Dokter Spesialis</option>
            <option value="Dokter Umum">Dokter Umum</option>
            <option value="Residen">Residen</option>
            <option value="Mahasiswa Kedokteran">Mahasiswa Kedokteran</option>
            <option value="Panitia">Panitia</option>
            <option value="Peserta">Peserta</option>
          </select>
        </div>

        <div>
          <select
            value={ticketFilter}
            onChange={(e) => setTicketFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Jenis Tiket</option>
            <option value="All-Access (Simposium + Workshop)">All-Access (Simposium + Workshop)</option>
            <option value="Simposium Full Pass">Simposium Full Pass</option>
            <option value="Workshop Only">Workshop Only</option>
            <option value="VIP / Speaker">VIP / Speaker</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 sm:p-4">Peserta & Email</th>
                <th className="p-3 sm:p-4">Profesi & NPA IDI</th>
                <th className="p-3 sm:p-4">Institusi / RS</th>
                <th className="p-3 sm:p-4">Tiket & Badge</th>
                <th className="p-3 sm:p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Tidak ditemukan peserta dengan kata kunci tersebut.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isActive = !!(activeParticipant && (activeParticipant.id === p.id || (activeParticipant.email && p.email && activeParticipant.email.toLowerCase() === p.email.toLowerCase())));

                  return (
                    <tr key={p.id} className={`hover:bg-slate-900/80 transition-colors ${isActive ? 'bg-blue-950/20' : ''}`}>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {p?.name ? p.name.charAt(0) : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{p?.name || 'Peserta'}</span>
                              {isActive && (
                                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-extrabold border border-emerald-500/30">
                                  AKTIF
                                </span>
                              )}
                            </div>
                            <div className="text-blue-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{p.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {p.role}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          NPA: <strong className="text-slate-200">{p.npaIdi || '-'}</strong>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        <div className="text-slate-200 font-medium">{p.institution}</div>
                        {p.phone && <div className="text-slate-500 text-[11px]">{p.phone}</div>}
                      </td>

                      <td className="p-3 sm:p-4">
                        <div className="text-emerald-400 font-semibold">{p.ticketType || 'Simposium Full Pass'}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{p.badgeId}</div>
                      </td>

                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveParticipant(p);
                              onSetActiveParticipant(p);
                              onShowToast(`Beralih ke akun "${p.name}".`);
                            }}
                            title="Gunakan sebagai akun aktif sekarang"
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isActive 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">{isActive ? 'User Aktif' : 'Pilih Akun'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit data peserta"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p)}
                            title="Hapus peserta"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {editingParticipant ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Alamat Email Peserta (Kunci Identifikasi): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: dokter.nama@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-hidden focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Email ini digunakan peserta untuk mencari profil dan mengidentifikasi kehadiran presensi & sertifikat.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nama Lengkap & Gelar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: dr. Ahmad Pratama, Sp.PD"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">NPA IDI:</label>
                  <input
                    type="text"
                    placeholder="contoh: 289.104/IDI"
                    value={formNpaIdi}
                    onChange={(e) => setFormNpaIdi(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kategori Profesi:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Dokter Spesialis">Dokter Spesialis</option>
                    <option value="Dokter Umum">Dokter Umum</option>
                    <option value="Residen">Residen</option>
                    <option value="Mahasiswa Kedokteran">Mahasiswa Kedokteran</option>
                    <option value="Panitia">Panitia</option>
                    <option value="Peserta">Peserta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Institusi / Rumah Sakit:</label>
                  <input
                    type="text"
                    placeholder="contoh: RSUP Dr. Kariadi"
                    value={formInstitution}
                    onChange={(e) => setFormInstitution(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">No. WhatsApp / Telepon:</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Jenis Tiket:</label>
                <select
                  value={formTicketType}
                  onChange={(e) => setFormTicketType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="All-Access (Simposium + Workshop)">All-Access (Simposium + Workshop)</option>
                  <option value="Simposium Full Pass">Simposium Full Pass</option>
                  <option value="Workshop Only">Workshop Only</option>
                  <option value="VIP / Speaker">VIP / Speaker</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  Simpan Data Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Impor Data Peserta dari CSV / Spreadsheet
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Masukkan daftar email dan nama peserta secara massal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Format Kolom yang Didukung (Pemisah Koma atau Tab):
                </div>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-nowrap">
                  email, nama, institusi, profesi, npa_idi, telepon, tiket
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimal harus ada kolom <strong>email</strong> dan <strong>nama</strong>. Jika email sudah ada sebelumnya di database, datanya akan diperbarui secara otomatis.
                </p>
              </div>

              {/* Upload file or paste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold">
                    Tempelkan Teks CSV / Salin dari Excel:
                  </label>
                  <label className="text-xs text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File .CSV</span>
                    <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder={`email,nama,institusi,profesi,npa_idi\npranowo.tfc@gmail.com,dr. Pranowo,RSUP Kariadi,Dokter Spesialis,301.992/IDI\nahmad@kemenkes.go.id,dr. Ahmad Pratama,RSCM,Dokter Spesialis,289.104/IDI`}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Quick sample buttons */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Contoh template:</span>
                <button
                  type="button"
                  onClick={() => {
                    setImportCsvText(`email,nama,institusi,profesi,npa_idi\npranowo.tfc@gmail.com,dr. Pranowo, Sp.PD,RSUP Dr. Kariadi Semarang,Dokter Spesialis,301.992/IDI\nhendra.wijaya@gmail.com,dr. Hendra Wijaya, Sp.A,RSUD Tangerang,Dokter Spesialis,123.456/IDI\nanita.kusuma@rscm.co.id,dr. Anita Kusuma,FKUI - RSCM,Residen,987.654/IDI`);
                  }}
                  className="text-[11px] text-emerald-400 hover:underline font-bold"
                >
                  Muat Contoh Data
                </button>
              </div>

              {importResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Hasil Impor:</span>
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    • {importResult.imported} peserta baru ditambahkan.<br/>
                    • {importResult.updated} peserta diperbarui.
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="text-[10px] text-amber-300 pt-1 border-t border-emerald-500/20">
                      Catatan / Peringatan: {importResult.errors.join('; ')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleImportCSVSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Proses Impor Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
