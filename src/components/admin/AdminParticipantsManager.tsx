import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Mail,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  UserCheck,
  RotateCcw,
  ArrowRight,
  Table2,
  Sparkles,
  Cloud,
  RefreshCw,
  LogIn,
  QrCode,
} from 'lucide-react';
import { Participant, SymposiumInfo } from '../../types';
import { ParticipantIdentityCard } from '../ParticipantIdentityCard';
import {
  saveStoredParticipants,
  exportParticipantsToCSV,
  resetParticipantsToDefault,
  setActiveParticipant,
  extractParticipantIdRegistrant,
  parseDelimitedSpreadsheetText,
  detectParticipantColumnMapping,
  importParticipantsWithMapping,
  type ParticipantMappingTarget,
} from '../../data/participantData';

interface AdminParticipantsManagerProps {
  participants: Participant[];
  onParticipantsChange: (updatedList: Participant[]) => void;
  activeParticipant: Participant;
  onSetActiveParticipant: (participant: Participant) => void;
  onShowToast: (msg: string) => void;
  eventInfo?: SymposiumInfo;
  isCloudAdmin?: boolean;
  isCloudSyncing?: boolean;
  onForceCloudSync?: () => void;
  onCloudAdminSignIn?: () => void;
}

const DEFAULT_ROLE_OPTIONS = [
  'Dokter Spesialis',
  'Dokter Umum',
  'Residen',
  'Mahasiswa Kedokteran',
  'Panitia',
  'Peserta',
];

const DEFAULT_TICKET_OPTIONS = [
  'All-Access (Simposium + Workshop)',
  'Simposium Full Pass',
  'Workshop Only',
  'VIP / Speaker',
];

const MAPPING_OPTIONS: Array<{ value: ParticipantMappingTarget; label: string }> = [
  { value: 'idRegistrant', label: 'Id_registrant (Kode Login Peserta)' },
  { value: 'email', label: 'Email Peserta (Kunci Login)' },
  { value: 'name', label: 'Nama Lengkap' },
  { value: 'title', label: 'Gelar' },
  { value: 'institution', label: 'Institusi / Rumah Sakit' },
  { value: 'role', label: 'Kategori / Profesi' },
  { value: 'npaIdi', label: 'NPA IDI / No. Anggota' },
  { value: 'phone', label: 'No. HP / WhatsApp' },
  { value: 'ticketType', label: 'Jenis Tiket / Paket' },
  { value: 'badgeId', label: 'ID Badge / No. Peserta' },
  { value: 'custom', label: 'Simpan sebagai Kolom Tambahan' },
  { value: 'ignore', label: 'Abaikan Kolom Ini' },
];

export const AdminParticipantsManager: React.FC<AdminParticipantsManagerProps> = ({
  participants,
  onParticipantsChange,
  activeParticipant,
  onSetActiveParticipant,
  onShowToast,
  eventInfo,
  isCloudAdmin = false,
  isCloudSyncing = false,
  onForceCloudSync,
  onCloudAdminSignIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrModalParticipant, setQrModalParticipant] = useState<Participant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { mode: 'single'; participant: Participant }
    | { mode: 'selected'; ids: string[] }
    | { mode: 'all' }
    | null
  >(null);

  // Edit/Add Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ParticipantMappingTarget[]>([]);
  const [autoGenerateEmail, setAutoGenerateEmail] = useState(false);
  const [importErrorBanner, setImportErrorBanner] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const resultSectionRef = useRef<HTMLDivElement | null>(null);

  // Participant Form state
  const [formIdRegistrant, setFormIdRegistrant] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formNpaIdi, setFormNpaIdi] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formRole, setFormRole] = useState<string>('Dokter Spesialis');
  const [formPhone, setFormPhone] = useState('');
  const [formTicketType, setFormTicketType] = useState<string>('Simposium Full Pass');
  const [formCustomFields, setFormCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  // Dynamic filter options including any custom roles/tickets from imported files
  const availableRoles = useMemo(() => {
    const set = new Set<string>(DEFAULT_ROLE_OPTIONS);
    participants.forEach((p) => {
      if (p.role?.trim()) set.add(p.role.trim());
    });
    return Array.from(set);
  }, [participants]);

  const availableTickets = useMemo(() => {
    const set = new Set<string>(DEFAULT_TICKET_OPTIONS);
    participants.forEach((p) => {
      if (p.ticketType?.trim()) set.add(p.ticketType.trim());
    });
    return Array.from(set);
  }, [participants]);

  // Filter participants (including customFields search)
  const filteredParticipants = participants.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    const customValues = p.customFields
      ? Object.entries(p.customFields)
          .map(([k, v]) => `${k} ${v}`.toLowerCase())
          .join(' ')
      : '';
    const idReg = extractParticipantIdRegistrant(p).toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.institution.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      (idReg && idReg.includes(q)) ||
      (p.badgeId && p.badgeId.toLowerCase().includes(q)) ||
      (p.npaIdi && p.npaIdi.toLowerCase().includes(q)) ||
      customValues.includes(q);

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesTicket = ticketFilter === 'all' || (p.ticketType || 'Simposium Full Pass') === ticketFilter;

    return matchesSearch && matchesRole && matchesTicket;
  });

  // Scroll result into view whenever importResult or importErrorBanner changes
  useEffect(() => {
    if ((importResult || importErrorBanner) && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [importResult, importErrorBanner]);

  const applyParsedTable = (headers: string[], rows: string[][]) => {
    setParsedHeaders(headers);
    setParsedRows(rows);
    setColumnMapping(detectParticipantColumnMapping(headers, rows));
    setImportResult(null);
    setImportErrorBanner(null);
  };

  const extractSheetTable = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      setImportErrorBanner(`Sheet "${sheetName}" tidak ditemukan di file Excel.`);
      return;
    }
    const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    const stringRows = rawMatrix
      .map((r) => (Array.isArray(r) ? r.map((cell) => String(cell ?? '').trim()) : []))
      .filter((r) => r.some((cell) => cell.length > 0));

    if (stringRows.length === 0) {
      setParsedHeaders([]);
      setParsedRows([]);
      setColumnMapping([]);
      setImportErrorBanner(`Sheet "${sheetName}" kosong (tidak ada baris data).`);
      return;
    }

    // Find first row with at least 2 non-empty cells as header (skips title banner rows in Excel)
    let headerIdx = stringRows.findIndex((r) => r.filter((c) => c.length > 0).length >= 2);
    if (headerIdx < 0) headerIdx = 0;

    const headerRow = stringRows[headerIdx];
    const maxCols = Math.max(
      headerRow.length,
      ...stringRows.slice(headerIdx + 1).map((r) => r.length),
      1
    );
    const headers = Array.from(
      { length: maxCols },
      (_, idx) => headerRow[idx]?.trim() || `Kolom ${idx + 1}`
    );
    const dataRows = stringRows.slice(headerIdx + 1).map((r) =>
      Array.from({ length: maxCols }, (_, idx) => (r[idx] ?? '').trim())
    );

    if (dataRows.length === 0) {
      // Treat single-row sheet as 1 data row without header
      const fallbackHeaders = Array.from({ length: maxCols }, (_, idx) => `Kolom ${idx + 1}`);
      applyParsedTable(fallbackHeaders, [
        Array.from({ length: maxCols }, (_, idx) => (headerRow[idx] ?? '').trim()),
      ]);
      return;
    }

    applyParsedTable(headers, dataRows);
  };

  const handleOpenAdd = () => {
    setEditingParticipant(null);
    setFormIdRegistrant('');
    setFormEmail('');
    setFormName('');
    setFormTitle('');
    setFormNpaIdi('');
    setFormInstitution('');
    setFormRole('Dokter Spesialis');
    setFormPhone('');
    setFormTicketType('Simposium Full Pass');
    setFormCustomFields([]);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setFormIdRegistrant(extractParticipantIdRegistrant(p));
    setFormEmail(p.email);
    setFormName(p.name);
    setFormTitle(p.title || '');
    setFormNpaIdi(p.npaIdi || '');
    setFormInstitution(p.institution);
    setFormRole(p.role || 'Peserta');
    setFormPhone(p.phone || '');
    setFormTicketType(p.ticketType || 'Simposium Full Pass');
    setFormCustomFields(
      p.customFields
        ? Object.entries(p.customFields).map(([key, value]) => ({ key, value }))
        : []
    );
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

    const customFieldsRecord: Record<string, string> = {};
    formCustomFields.forEach(({ key, value }) => {
      const k = key.trim().slice(0, 60);
      const v = value.trim().slice(0, 300);
      if (k && v) {
        customFieldsRecord[k] = v;
      }
    });

    const cleanEmail = formEmail.trim().toLowerCase();
    const cleanIdReg = formIdRegistrant.trim().slice(0, 80);
    const payload: Participant = {
      id: editingParticipant ? editingParticipant.id : `part-${Date.now()}`,
      ...(cleanIdReg ? { idRegistrant: cleanIdReg } : {}),
      email: cleanEmail,
      name: formName.trim(),
      title: formTitle.trim(),
      npaIdi: formNpaIdi.trim(),
      institution: formInstitution.trim() || 'RS / Faskes Peserta',
      role: formRole.trim() || 'Peserta',
      phone: formPhone.trim(),
      ticketType: formTicketType.trim() || 'Simposium Full Pass',
      badgeId:
        cleanIdReg ||
        editingParticipant?.badgeId ||
        `ID-SIMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      registeredAt:
        editingParticipant?.registeredAt || new Date().toISOString().split('T')[0],
      ...(Object.keys(customFieldsRecord).length > 0
        ? { customFields: customFieldsRecord }
        : {}),
    };

    const existingIdx = participants.findIndex(
      (p) => p.id === payload.id || p.email.trim().toLowerCase() === cleanEmail
    );
    const updatedList =
      existingIdx >= 0
        ? participants.map((p, i) => (i === existingIdx ? { ...p, ...payload } : p))
        : [payload, ...participants];

    saveStoredParticipants(updatedList);
    onParticipantsChange(updatedList);

    if (
      activeParticipant.email.toLowerCase() === payload.email.toLowerCase() ||
      activeParticipant.id === payload.id
    ) {
      onSetActiveParticipant(payload);
    }

    onShowToast(`Data peserta "${payload.name}" berhasil disimpan.`);
    setIsEditModalOpen(false);
  };

  // Prune selectedIds if participants list changes
  useEffect(() => {
    const validIds = new Set(participants.map((p) => p.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [participants]);

  const executeConfirmedDelete = () => {
    if (!deleteConfirm) return;

    let updated: Participant[] = participants;
    let deletedIds = new Set<string>();
    let toastMsg = '';

    if (deleteConfirm.mode === 'single') {
      const target = deleteConfirm.participant;
      deletedIds.add(target.id);
      updated = participants.filter((item) => item.id !== target.id);
      toastMsg = `Peserta "${target.name}" berhasil dihapus.`;
    } else if (deleteConfirm.mode === 'selected') {
      deletedIds = new Set(deleteConfirm.ids);
      updated = participants.filter((item) => !deletedIds.has(item.id));
      toastMsg = `${deletedIds.size} data peserta terpilih berhasil dihapus.`;
    } else if (deleteConfirm.mode === 'all') {
      deletedIds = new Set(participants.map((p) => p.id));
      updated = [];
      toastMsg = `Seluruh data peserta (${participants.length}) berhasil dihapus.`;
    }

    saveStoredParticipants(updated);
    onParticipantsChange(updated);
    setSelectedIds((prev) => prev.filter((id) => !deletedIds.has(id)));

    if (activeParticipant && deletedIds.has(activeParticipant.id) && updated.length > 0) {
      setActiveParticipant(updated[0]);
      onSetActiveParticipant(updated[0]);
    }

    setDeleteConfirm(null);
    onShowToast(toastMsg);
  };

  const toggleSelectParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredIds = filteredParticipants.map((p) => p.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredIds);
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
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
    URL.revokeObjectURL(url);
    onShowToast('Data peserta berhasil diekspor ke CSV.');
  };

  const handleCsvTextareaChange = (text: string) => {
    setImportCsvText(text);
    setLoadedFileName(null);
    setExcelWorkbook(null);
    setExcelSheetNames([]);
    setSelectedSheetName('');

    if (!text.trim()) {
      setParsedHeaders([]);
      setParsedRows([]);
      setColumnMapping([]);
      setImportResult(null);
      setImportErrorBanner(null);
      return;
    }

    const parsed = parseDelimitedSpreadsheetText(text);
    applyParsedTable(parsed.headers, parsed.rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportErrorBanner(null);
    setImportResult(null);
    setLoadedFileName(file.name);

    const lowerName = file.name.toLowerCase();
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    const reader = new FileReader();
    reader.onerror = () => {
      const msg = `Gagal membaca file "${file.name}". Pastikan file tidak rusak atau terkunci password.`;
      setImportErrorBanner(msg);
      onShowToast(msg);
    };

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            setImportErrorBanner('File Excel tidak memiliki sheet yang dapat dibaca.');
            return;
          }
          setExcelWorkbook(workbook);
          setExcelSheetNames(workbook.SheetNames);
          const firstSheet = workbook.SheetNames[0];
          setSelectedSheetName(firstSheet);
          setImportCsvText('');
          extractSheetTable(workbook, firstSheet);
          onShowToast(`File "${file.name}" terbaca! Periksa pemetaan kolom lalu klik Proses Impor.`);
        } catch (err) {
          console.error('Excel parse error:', err);
          const msg = `Gagal memproses file Excel "${file.name}". Pastikan format .xlsx / .xls valid.`;
          setImportErrorBanner(msg);
          onShowToast(msg);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const text = String(event.target?.result ?? '');
        setExcelWorkbook(null);
        setExcelSheetNames([]);
        setSelectedSheetName('');
        setImportCsvText(text);
        const parsed = parseDelimitedSpreadsheetText(text);
        if (parsed.rows.length === 0) {
          setImportErrorBanner(`File "${file.name}" terbaca, tetapi tidak ditemukan baris data peserta.`);
        } else {
          applyParsedTable(parsed.headers, parsed.rows);
          onShowToast(`File "${file.name}" terbaca (${parsed.rows.length} baris).`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    if (excelWorkbook) {
      extractSheetTable(excelWorkbook, sheetName);
    }
  };

  const handleMappingChange = (colIndex: number, target: ParticipantMappingTarget) => {
    setColumnMapping((prev) => {
      const next = [...prev];
      // Ensure single-value standard fields remain unique (except 'custom' and 'ignore')
      if (target !== 'custom' && target !== 'ignore') {
        for (let i = 0; i < next.length; i++) {
          if (i !== colIndex && next[i] === target) {
            next[i] = 'custom';
          }
        }
      }
      next[colIndex] = target;
      return next;
    });
    setImportErrorBanner(null);
  };

  const handleImportSubmit = () => {
    setImportErrorBanner(null);

    let headers = parsedHeaders;
    let rows = parsedRows;
    let mapping = columnMapping;

    // Fallback parse if user pasted without triggering preview state
    if (rows.length === 0 && importCsvText.trim()) {
      const parsed = parseDelimitedSpreadsheetText(importCsvText);
      headers = parsed.headers;
      rows = parsed.rows;
      mapping = detectParticipantColumnMapping(headers, rows);
      setParsedHeaders(headers);
      setParsedRows(rows);
      setColumnMapping(mapping);
    }

    if (rows.length === 0) {
      const msg =
        'Belum ada data yang dimuat. Silakan unggah file (.xlsx, .xls, .csv) atau tempelkan data dari Excel terlebih dahulu.';
      setImportErrorBanner(msg);
      onShowToast(msg);
      return;
    }

    const hasEmailMapped = mapping.includes('email');
    if (!hasEmailMapped && !autoGenerateEmail) {
      const msg =
        'Kolom "Email Peserta" belum dipetakan. Pilih salah satu kolom sebagai Email Peserta, atau centang opsi pembuatan email otomatis di bawah.';
      setImportErrorBanner(msg);
      onShowToast('Kolom Email belum dipilih pada pemetaan kolom.');
      return;
    }

    const result = importParticipantsWithMapping({
      headers,
      rows,
      mapping,
      existingParticipants: participants,
      autoGeneratePlaceholderEmail: autoGenerateEmail,
    });

    setImportResult({
      imported: result.importedCount,
      updated: result.updatedCount,
      skipped: result.skippedCount,
      errors: result.errors,
    });

    if (result.importedCount > 0 || result.updatedCount > 0) {
      onParticipantsChange(result.totalParticipants);
      onShowToast(
        `Impor berhasil: ${result.importedCount} peserta baru, ${result.updatedCount} diperbarui.`
      );
    } else {
      const msg =
        result.errors[0] ||
        'Tidak ada peserta yang berhasil diimpor. Periksa pemetaan kolom Email & Nama.';
      setImportErrorBanner(msg);
      onShowToast('Impor selesai dengan 0 data valid. Periksa rincian peringatan di modal.');
    }
  };

  const handleResetToDefault = () => {
    const resetList = resetParticipantsToDefault();
    onParticipantsChange(resetList);
    onSetActiveParticipant(resetList[0]);
    onShowToast('Daftar peserta dikembalikan ke setelan default.');
  };

  const openImportModal = () => {
    setImportResult(null);
    setImportErrorBanner(null);
    setImportCsvText('');
    setLoadedFileName(null);
    setExcelWorkbook(null);
    setExcelSheetNames([]);
    setSelectedSheetName('');
    setParsedHeaders([]);
    setParsedRows([]);
    setColumnMapping([]);
    setAutoGenerateEmail(false);
    setIsImportModalOpen(true);
  };

  const emailColMapped = columnMapping.includes('email');
  const previewRows = parsedRows.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Integrasi Identitas &amp; Database
            </span>
            <span className="text-xs text-slate-400">
              Total: {participants.length} Peserta ({participants.filter((p) => Boolean(extractParticipantIdRegistrant(p))).length} punya Id_registrant)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Data Peserta Simposium &amp; Email
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sistem mendukung impor langsung file Excel (.xlsx/.xls) atau CSV dengan struktur kolom apa pun, serta menyinkronkan profil peserta otomatis berdasarkan alamat email saat user login.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peserta</span>
          </button>

          {participants.length > 0 && (
            <button
              type="button"
              onClick={() => setDeleteConfirm({ mode: 'all' })}
              className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
              title="Hapus seluruh daftar peserta"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors border border-slate-700 cursor-pointer"
            title="Reset ke data awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cloud Sync / Cross-device Id_registrant Login Status */}
      {isCloudAdmin ? (
        <div className="bg-emerald-950/50 border border-emerald-500/35 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-200">
              Data <strong className="text-white">Id_registrant</strong> peserta aktif disinkronkan ke Cloud Database agar bisa digunakan login di semua HP/perangkat peserta.
            </span>
          </div>
          {onForceCloudSync && (
            <button
              type="button"
              onClick={onForceCloudSync}
              disabled={isCloudSyncing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Sync Id_registrant ke Cloud'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-amber-950/45 border border-amber-500/40 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-100">
              Data peserta masih tersimpan <strong className="text-white">lokal di perangkat ini</strong>. Hubungkan Google Admin agar peserta bisa login dengan <strong className="text-amber-300">Id_registrant</strong> dari HP/perangkat lain.
            </span>
          </div>
          {onCloudAdminSignIn && (
            <button
              type="button"
              onClick={onCloudAdminSignIn}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Hubungkan Google &amp; Sync Cloud</span>
            </button>
          )}
        </div>
      )}

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
                <span className="text-xs font-bold text-slate-300">
                  {activeParticipant.role || 'Peserta'}
                </span>
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
            <span className="text-xs text-slate-400 hidden sm:inline">Id_registrant:</span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-mono font-bold text-amber-300 border border-slate-700">
              {extractParticipantIdRegistrant(activeParticipant) || activeParticipant.badgeId || 'ID-SIMP'}
            </span>
            <button
              type="button"
              onClick={() => setQrModalParticipant(activeParticipant)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Lihat Kartu Identitas & QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Kartu QR</span>
            </button>
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
            placeholder="Cari nama, email, NPA IDI, RS, kolom tambahan..."
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
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={ticketFilter}
            onChange={(e) => setTicketFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Jenis Tiket</option>
            {availableTickets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-950/50 border border-rose-500/40 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{selectedIds.length} peserta dipilih untuk aksi massal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm({ mode: 'selected', ids: selectedIds })}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 sm:p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    aria-label="Pilih semua peserta yang tampil"
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 sm:p-4">Peserta &amp; Email</th>
                <th className="p-3 sm:p-4">Profesi &amp; NPA IDI</th>
                <th className="p-3 sm:p-4">Institusi / RS &amp; Data Tambahan</th>
                <th className="p-3 sm:p-4">Tiket &amp; Badge</th>
                <th className="p-3 sm:p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {participants.length === 0
                      ? 'Belum ada data peserta. Klik "Tambah Peserta" atau "Impor Excel / CSV" untuk menambahkan.'
                      : 'Tidak ditemukan peserta dengan kata kunci tersebut.'}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isActive = !!(
                    activeParticipant &&
                    (activeParticipant.id === p.id ||
                      (activeParticipant.email &&
                        p.email &&
                        activeParticipant.email.toLowerCase() === p.email.toLowerCase()))
                  );
                  const isSelected = selectedIds.includes(p.id);
                  const customEntries = p.customFields ? Object.entries(p.customFields) : [];

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-900/80 transition-colors ${
                        isSelected
                          ? 'bg-rose-950/20'
                          : isActive
                          ? 'bg-blue-950/20'
                          : ''
                      }`}
                    >
                      <td className="p-3 sm:p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectParticipant(p.id)}
                          aria-label={`Pilih ${p.name}`}
                          className="rounded border-slate-700 bg-slate-900 text-rose-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p?.name ? p.name.charAt(0) : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm">
                                {p?.name || 'Peserta'}
                              </span>
                              {p.title && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  ({p.title})
                                </span>
                              )}
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
                          {p.role || 'Peserta'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          NPA: <strong className="text-slate-200">{p.npaIdi || '-'}</strong>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        <div className="text-slate-200 font-medium">{p.institution}</div>
                        {p.phone && (
                          <div className="text-slate-500 text-[11px]">{p.phone}</div>
                        )}
                        {customEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {customEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300"
                              >
                                <span className="text-slate-500">{k}:</span>{' '}
                                <span className="text-slate-200 font-semibold">{v}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-3 sm:p-4">
                        <div className="text-emerald-400 font-semibold">
                          {p.ticketType || 'Simposium Full Pass'}
                        </div>
                        {extractParticipantIdRegistrant(p) && (
                          <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                            <span>ID: {extractParticipantIdRegistrant(p)}</span>
                          </div>
                        )}
                        {p.badgeId && p.badgeId !== extractParticipantIdRegistrant(p) && (
                          <div className="text-slate-400 font-mono text-[10px] mt-0.5">{p.badgeId}</div>
                        )}
                      </td>

                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveParticipant(p);
                              onSetActiveParticipant(p);
                              onShowToast(`Beralih ke akun "${p.name}".`);
                            }}
                            title="Gunakan sebagai akun aktif sekarang"
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">
                              {isActive ? 'User Aktif' : 'Pilih Akun'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrModalParticipant(p)}
                            title="Lihat & unduh Kartu Identitas + QR Code peserta"
                            className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit data peserta"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ mode: 'single', participant: p })}
                            title="Hapus peserta"
                            className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Hapus</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {editingParticipant ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveParticipant}
              className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Id_registrant (Kode Login Peserta):
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="contoh: ID-SIMP-2026-001 atau REG-1024"
                  value={formIdRegistrant}
                  onChange={(e) => setFormIdRegistrant(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Peserta dapat masuk langsung ke aplikasi menggunakan Id_registrant ini.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Alamat Email Peserta (Kunci Identifikasi):{' '}
                  <span className="text-rose-500">*</span>
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
                  Email ini digunakan untuk mencocokkan profil peserta saat user login dengan Google.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    Nama Lengkap: <span className="text-rose-500">*</span>
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
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Gelar (Opsional):</label>
                  <input
                    type="text"
                    placeholder="contoh: Sp.PD"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
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
                  <label className="block text-slate-300 font-bold mb-1">Kategori / Profesi:</label>
                  <input
                    type="text"
                    list="participant-role-presets"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Dokter Spesialis / Umum / lainnya"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <datalist id="participant-role-presets">
                    {availableRoles.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Institusi / Rumah Sakit:
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: RSUP Dr. Kariadi"
                    value={formInstitution}
                    onChange={(e) => setFormInstitution(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    No. WhatsApp / Telepon:
                  </label>
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
                <input
                  type="text"
                  list="participant-ticket-presets"
                  value={formTicketType}
                  onChange={(e) => setFormTicketType(e.target.value)}
                  placeholder="Simposium Full Pass / Workshop / lainnya"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                />
                <datalist id="participant-ticket-presets">
                  {availableTickets.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              {/* Extra / Custom Fields Section */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">
                    Kolom Tambahan (Data Hasil Impor):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormCustomFields((prev) => [...prev, { key: '', value: '' }])
                    }
                    className="text-[11px] text-blue-400 hover:underline font-bold cursor-pointer"
                  >
                    + Tambah Field
                  </button>
                </div>
                {formCustomFields.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Belum ada kolom tambahan. Kolom ekstra dari Excel/CSV otomatis masuk ke sini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formCustomFields.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormCustomFields((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, key: val } : row))
                            );
                          }}
                          placeholder="Nama Kolom"
                          className="col-span-2 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-[11px]"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormCustomFields((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, value: val } : row))
                            );
                          }}
                          placeholder="Nilai"
                          className="col-span-2 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormCustomFields((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg justify-self-center cursor-pointer"
                          title="Hapus field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                >
                  Simpan Data Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Bulk Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Impor Data Peserta (Excel / CSV Fleksibel)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mendukung struktur kolom apa saja dari file .xlsx, .xls, .csv, atau tempel langsung dari Excel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Upload / Paste Area */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Excel / CSV</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.tsv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {loadedFileName && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                        File: {loadedFileName} ({parsedRows.length} baris)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleCsvTextareaChange(
                        `No;Nama Lengkap;Email;Asal RS / Instansi;Kategori;No HP;Cabang\n1;"dr. Pranowo, Sp.PD";pranowo.tfc@gmail.com;RSUP Dr. Kariadi;Dokter Spesialis;081234567890;Jawa Tengah\n2;"dr. Anita Kusuma";anita.kusuma@rscm.co.id;FKUI - RSCM;Residen;081398765432;DKI Jakarta`
                      );
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Muat Contoh Data Custom
                  </button>
                </div>

                {/* Sheet Selector if Excel workbook has multiple sheets */}
                {excelSheetNames.length > 1 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-400 font-semibold">Pilih Sheet Excel:</span>
                    <select
                      value={selectedSheetName}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      {excelSheetNames.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Atau tempelkan (Copy-Paste) langsung dari Excel / Google Sheets / CSV:
                  </label>
                  <textarea
                    rows={4}
                    value={importCsvText}
                    onChange={(e) => handleCsvTextareaChange(e.target.value)}
                    placeholder={`Tempel data dari Excel di sini (kolom bebas, misal: No, Nama, Email, RS, No HP, Kategori, dll.)`}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Dynamic Column Mapping Section */}
              {parsedHeaders.length > 0 && parsedRows.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>
                        Pemetaan Struktur Kolom ({parsedRows.length} baris siap diimpor)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Kolom ekstra otomatis disimpan sebagai Kolom Tambahan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {parsedHeaders.map((header, colIdx) => {
                      const sampleVal =
                        parsedRows.find((r) => (r[colIdx] || '').trim().length > 0)?.[
                          colIdx
                        ] || '-';
                      const currentTarget = columnMapping[colIdx] || 'custom';

                      return (
                        <div
                          key={`${header}-${colIdx}`}
                          className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                            currentTarget === 'idRegistrant'
                              ? 'bg-emerald-950/35 border-emerald-500/40'
                              : currentTarget === 'email'
                              ? 'bg-blue-950/30 border-blue-500/40'
                              : currentTarget === 'ignore'
                              ? 'bg-slate-900/40 border-slate-800 opacity-70'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-200 truncate" title={header}>
                              {header}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          </div>
                          <select
                            value={currentTarget}
                            onChange={(e) =>
                              handleMappingChange(
                                colIdx,
                                e.target.value as ParticipantMappingTarget
                              )
                            }
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-white font-semibold focus:outline-hidden focus:border-emerald-500"
                          >
                            {MAPPING_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="text-[10px] text-slate-400 truncate">
                            Contoh: <span className="text-slate-300 font-mono">{sampleVal}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Option for files without email column */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoGenerateEmail}
                      onChange={(e) => {
                        setAutoGenerateEmail(e.target.checked);
                        setImportErrorBanner(null);
                      }}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500"
                    />
                    <span className="text-[11px] text-slate-300">
                      Buat email placeholder otomatis (misal <code className="text-emerald-300">nama@peserta.local</code>) jika kolom Email tidak tersedia atau ada baris tanpa email
                      {!emailColMapped && (
                        <span className="text-amber-300 font-semibold">
                          {' '}
                          (Kolom Email belum terdeteksi di file Anda)
                        </span>
                      )}
                    </span>
                  </label>

                  {/* Preview Table */}
                  {previewRows.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Table2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pratinjau {previewRows.length} Baris Pertama:</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-slate-900 text-slate-400">
                            <tr>
                              {parsedHeaders.map((h, i) => (
                                <th key={i} className="px-2 py-1.5 whitespace-nowrap font-bold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 text-slate-300">
                            {previewRows.map((r, rIdx) => (
                              <tr key={rIdx}>
                                {parsedHeaders.map((_, cIdx) => (
                                  <td key={cIdx} className="px-2 py-1.5 whitespace-nowrap">
                                    {r[cIdx] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Error / Import Result Feedback (always scrolled into view) */}
              <div ref={resultSectionRef} className="space-y-2">
                {importErrorBanner && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2 text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">{importErrorBanner}</div>
                  </div>
                )}

                {importResult && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Hasil Impor Data Peserta:</span>
                    </div>
                    <div className="text-[11px] text-emerald-200 space-y-0.5">
                      <div>• {importResult.imported} peserta baru ditambahkan.</div>
                      <div>• {importResult.updated} peserta yang sudah ada diperbarui.</div>
                      {importResult.skipped > 0 && (
                        <div className="text-amber-300">
                          • {importResult.skipped} baris dilewati.
                        </div>
                      )}
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="text-[10px] text-amber-300 pt-1.5 border-t border-emerald-500/20 max-h-24 overflow-y-auto space-y-0.5">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <div key={i}>- {err}</div>
                        ))}
                        {importResult.errors.length > 10 && (
                          <div>...dan {importResult.errors.length - 10} baris lainnya.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-400">
                {parsedRows.length > 0
                  ? `${parsedRows.length} baris siap diproses`
                  : 'Unggah file atau tempel data terlebih dahulu'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Proses Impor Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {deleteConfirm.mode === 'all'
                      ? 'Hapus Semua Data Peserta?'
                      : deleteConfirm.mode === 'selected'
                      ? `Hapus ${deleteConfirm.ids.length} Peserta Terpilih?`
                      : 'Hapus Data Peserta?'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tindakan ini menghapus data secara permanen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 text-xs text-slate-300 space-y-3">
              {deleteConfirm.mode === 'single' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-sm">
                    {deleteConfirm.participant.name}
                  </div>
                  <div className="text-blue-400 font-mono">
                    {deleteConfirm.participant.email}
                  </div>
                  <div className="text-slate-400">
                    {deleteConfirm.participant.institution} • Badge:{' '}
                    {deleteConfirm.participant.badgeId}
                  </div>
                </div>
              )}

              {deleteConfirm.mode === 'selected' && (
                <p className="leading-relaxed">
                  Anda akan menghapus <strong className="text-white">{deleteConfirm.ids.length}</strong> data peserta yang telah dipilih dari daftar dan database Cloud.
                </p>
              )}

              {deleteConfirm.mode === 'all' && (
                <p className="leading-relaxed">
                  Anda akan menghapus seluruh <strong className="text-white">{participants.length}</strong> data peserta dari aplikasi dan database Cloud. Pastikan Anda telah mengekspor cadangan CSV jika diperlukan.
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteConfirm.mode === 'all'
                    ? 'Ya, Hapus Semua'
                    : deleteConfirm.mode === 'selected'
                    ? `Ya, Hapus (${deleteConfirm.ids.length})`
                    : 'Ya, Hapus Peserta'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant QR Identity Card Preview Modal */}
      {qrModalParticipant && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setQrModalParticipant(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-participant-qr-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 id="admin-participant-qr-title" className="font-bold text-white text-sm sm:text-base">
                  Kartu Identitas &amp; QR Code Peserta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalParticipant(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <ParticipantIdentityCard
                participant={qrModalParticipant}
                eventInfo={eventInfo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
