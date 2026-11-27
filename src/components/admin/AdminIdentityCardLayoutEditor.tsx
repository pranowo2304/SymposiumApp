import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Eye,
  EyeOff,
  LayoutTemplate,
  Move,
  QrCode,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import {
  IdentityCardFieldConfig,
  IdentityCardLayoutConfig,
  SymposiumInfo,
} from '../../types';
import {
  DEFAULT_IDENTITY_CARD_LAYOUT,
  IDENTITY_CARD_LAYOUT_PRESETS,
  normalizeIdentityCardLayout,
} from '../../utils/identityCardLayout';
import { getThemePalette } from '../../utils/themeColors';

type EditableFieldKey =
  | 'name'
  | 'idRegistrant'
  | 'qrCode'
  | 'institution'
  | 'roleTicket'
  | 'title';

interface AdminIdentityCardLayoutEditorProps {
  eventInfo: SymposiumInfo;
  layout?: IdentityCardLayoutConfig;
  templateUrlOverride?: string;
  templateLabel?: string;
  sampleTicketLabel?: string;
  onChangeLayout: (nextLayout: IdentityCardLayoutConfig, saveImmediately?: boolean) => void;
  onShowToast: (msg: string) => void;
}

const FIELD_META: Array<{ key: EditableFieldKey; label: string; shortLabel: string }> = [
  { key: 'name', label: 'Nama Peserta', shortLabel: 'Nama' },
  { key: 'idRegistrant', label: 'ID Registrant', shortLabel: 'ID_Registrant' },
  { key: 'qrCode', label: 'QR Code', shortLabel: 'QR Code' },
  { key: 'institution', label: 'Institusi / RS', shortLabel: 'Institusi' },
  { key: 'roleTicket', label: 'Peran & Tiket', shortLabel: 'Tiket' },
  { key: 'title', label: 'Gelar / Keterangan', shortLabel: 'Gelar' },
];

const TEXT_COLOR_SWATCHES = [
  { hex: '#0f172a', label: 'Hitam Slate' },
  { hex: '#ffffff', label: 'Putih' },
  { hex: '#059669', label: 'Hijau Emerald' },
  { hex: '#1e3a8a', label: 'Biru Navy' },
  { hex: '#b45309', label: 'Emas Amber' },
  { hex: '#475569', label: 'Abu Gelap' },
  { hex: '#fde68a', label: 'Kuning Muda' },
];

export const AdminIdentityCardLayoutEditor: React.FC<AdminIdentityCardLayoutEditorProps> = ({
  eventInfo,
  layout: propLayout,
  templateUrlOverride,
  templateLabel,
  sampleTicketLabel,
  onChangeLayout,
  onShowToast,
}) => {
  const layout = normalizeIdentityCardLayout(propLayout);
  const palette = getThemePalette(eventInfo);
  const activeTemplateUrl =
    templateUrlOverride !== undefined
      ? templateUrlOverride
      : eventInfo.customIdentityCardUrl || '';
  const [selectedField, setSelectedField] = useState<EditableFieldKey>('name');
  const [sampleQrUrl, setSampleQrUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const canvasBoxRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    field: EditableFieldKey;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    QRCode.toDataURL('731', {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setSampleQrUrl)
      .catch(() => {});
  }, []);

  const updateField = <K extends EditableFieldKey>(
    key: K,
    patch: Partial<IdentityCardLayoutConfig[K]>
  ) => {
    const next: IdentityCardLayoutConfig = {
      ...layout,
      [key]: {
        ...layout[key],
        ...patch,
      },
    };
    onChangeLayout(next, false);
  };

  const handlePointerDownField = (
    e: React.PointerEvent<HTMLDivElement>,
    fieldKey: EditableFieldKey
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedField(fieldKey);
    const current = layout[fieldKey];
    dragStateRef.current = {
      field: fieldKey,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: current.x,
      origY: current.y,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const box = canvasBoxRef.current;
    if (!drag || !box) return;

    const rect = box.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaXPercent = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - drag.startClientY) / rect.height) * 100;

    let nextX = Math.round((drag.origX + deltaXPercent) * 10) / 10;
    let nextY = Math.round((drag.origY + deltaYPercent) * 10) / 10;

    // Gentle magnetic snap to center (50%) when within 1.4%
    if (Math.abs(nextX - 50) <= 1.4) nextX = 50;

    nextX = Math.max(2, Math.min(98, nextX));
    nextY = Math.max(3, Math.min(97, nextY));

    updateField(drag.field, { x: nextX, y: nextY } as any);
  };

  const handlePointerUp = () => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      setIsDragging(false);
    }
  };

  const getFieldSampleText = (key: Exclude<EditableFieldKey, 'qrCode'>): string => {
    switch (key) {
      case 'name':
        return 'Drh. Iis Sulistiyani';
      case 'idRegistrant':
        return 'ID_Registrant: 731';
      case 'title':
        return 'Symposium - Member ADHPHKI';
      case 'institution':
        return 'RS Hewan Pendidikan';
      case 'roleTicket':
        return sampleTicketLabel ? `Peserta · ${sampleTicketLabel}` : 'Peserta · Simposium Full Pass';
    }
  };

  const getTextAlignTransform = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'translate(-50%, -50%)';
    if (align === 'right') return 'translate(-100%, -50%)';
    return 'translate(0%, -50%)';
  };

  const activeField = layout[selectedField];
  const isQrSelected = selectedField === 'qrCode';
  const activeTextField = !isQrSelected ? (activeField as IdentityCardFieldConfig) : null;

  return (
    <div className="pt-4 border-t border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <LayoutTemplate className="w-4 h-4 text-sky-400" />
            <span>
              Atur Posisi Field pada Template Kartu ID
              {templateLabel ? ` — ${templateLabel}` : ''}
            </span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Geser (drag &amp; drop) langsung Nama, ID_Registrant, QR Code, atau field lainnya di atas pratinjau kartu, lalu klik Simpan Posisi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onChangeLayout(DEFAULT_IDENTITY_CARD_LAYOUT, true);
              onShowToast('Posisi field kartu ID dikembalikan ke setelan standar.');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeLayout(layout, true);
              onShowToast('Posisi field kartu identitas berhasil disimpan & diterapkan!');
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Posisi</span>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {IDENTITY_CARD_LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              onChangeLayout(preset.layout, true);
              onShowToast(`Preset "${preset.label}" diterapkan!`);
            }}
            className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate">{preset.label}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              {preset.description}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Interactive Drag & Drop Card Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            ref={canvasBoxRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ containerType: 'inline-size' }}
            className="relative w-full max-w-[300px] aspect-[760/1080] rounded-2xl overflow-hidden border-2 border-slate-700 bg-white shadow-2xl select-none touch-none"
          >
            {/* Background: Uploaded Template or Default Theme Card */}
            {activeTemplateUrl ? (
              <img
                src={activeTemplateUrl}
                alt={templateLabel ? `Template ${templateLabel}` : 'Template Kartu ID'}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 bg-white pointer-events-none">
                <div
                  className="w-full h-[20.4%]"
                  style={{
                    background: `linear-gradient(135deg, #0f172a 0%, ${palette.primaryHex || '#059669'} 100%)`,
                  }}
                />
                <div
                  className="absolute bottom-0 inset-x-0 h-[1.5%]"
                  style={{ backgroundColor: palette.primaryHex || '#059669' }}
                />
              </div>
            )}

            {/* Optional Event Header Band */}
            {layout.showEventHeader && (
              <div
                className={`absolute top-0 inset-x-0 h-[20.4%] px-[5%] flex items-center gap-[3%] pointer-events-none ${
                  activeTemplateUrl ? 'bg-slate-950/70' : ''
                }`}
              >
                {eventInfo.logoUrl && (
                  <div className="w-[10cqw] h-[10cqw] rounded-[2cqw] bg-white p-[0.8cqw] shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={eventInfo.logoUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[2.1cqw] font-bold text-emerald-200 tracking-wide">
                    KARTU IDENTITAS PESERTA
                  </div>
                  <div className="text-[3.1cqw] font-bold text-white truncate">
                    {eventInfo.title || 'Simposium & Workshop'}
                  </div>
                  <div className="text-[2.1cqw] text-slate-300 truncate">
                    {eventInfo.dateString || eventInfo.dates?.day1}
                  </div>
                </div>
              </div>
            )}

            {/* Optional Frosted White Content Panel */}
            {layout.showContentBackdrop && (
              <div
                className="absolute left-[3.5%] right-[3.5%] rounded-[3cqw] bg-white/90 border border-slate-200/90 pointer-events-none"
                style={{
                  top: layout.showEventHeader ? '22%' : '4%',
                  bottom: '3.5%',
                }}
              />
            )}

            {/* Center Alignment Guide Line while Dragging */}
            {isDragging && (
              <div className="absolute inset-y-0 left-1/2 w-px bg-sky-400/70 border-l border-dashed border-sky-300 pointer-events-none z-20" />
            )}

            {/* Draggable Text Fields */}
            {(['name', 'idRegistrant', 'title', 'institution', 'roleTicket'] as const).map(
              (key) => {
                const cfg = layout[key];
                if (!cfg.visible) return null;
                const isSelected = selectedField === key;
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handlePointerDownField(e, key)}
                    style={{
                      left: `${cfg.x}%`,
                      top: `${cfg.y}%`,
                      transform: getTextAlignTransform(cfg.align),
                      fontSize: `${(cfg.fontSize / 760) * 100}cqw`,
                      color: cfg.color,
                      textAlign: cfg.align,
                    }}
                    className={`absolute z-10 max-w-[90%] px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing whitespace-nowrap font-bold leading-tight transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-sky-400 bg-sky-500/15 shadow-sm'
                        : 'hover:ring-1 hover:ring-sky-400/70'
                    }`}
                    title={`Geser ${FIELD_META.find((m) => m.key === key)?.label}`}
                  >
                    {getFieldSampleText(key)}
                  </div>
                );
              }
            )}

            {/* Draggable QR Code */}
            {layout.qrCode.visible && (
              <div
                onPointerDown={(e) => handlePointerDownField(e, 'qrCode')}
                style={{
                  left: `${layout.qrCode.x}%`,
                  top: `${layout.qrCode.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${(layout.qrCode.size / 760) * 100}%`,
                }}
                className={`absolute z-10 flex flex-col items-center cursor-grab active:cursor-grabbing rounded-xl transition-shadow ${
                  layout.qrCode.showFrame
                    ? 'bg-slate-50 border border-slate-300 p-[2.6cqw] shadow-sm'
                    : 'p-1'
                } ${
                  selectedField === 'qrCode'
                    ? 'ring-2 ring-sky-400 shadow-md'
                    : 'hover:ring-1 hover:ring-sky-400/70'
                }`}
                title="Geser posisi QR Code"
              >
                {sampleQrUrl ? (
                  <img
                    src={sampleQrUrl}
                    alt="QR Sample"
                    className="w-full aspect-square object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full aspect-square bg-slate-200 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                {layout.qrCode.showCaption && (
                  <div className="mt-[1cqw] text-center pointer-events-none">
                    <div className="text-[1.7cqw] font-bold text-slate-500 leading-none">
                      NO. ID_REGISTRANT
                    </div>
                    <div className="text-[3cqw] font-mono font-bold text-slate-900 leading-tight">
                      731
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Move className="w-3 h-3 text-sky-400" />
            <span>Tarik elemen di atas untuk memindahkan posisinya</span>
          </span>
        </div>

        {/* Field Controls Panel */}
        <div className="lg:col-span-7 space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
          {/* Global Template Overlay Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() =>
                onChangeLayout({ ...layout, showEventHeader: !layout.showEventHeader }, false)
              }
              className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                layout.showEventHeader
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>Header Event Bawaan</span>
              {layout.showEventHeader ? (
                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeLayout(
                  { ...layout, showContentBackdrop: !layout.showContentBackdrop },
                  false
                )
              }
              className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                layout.showContentBackdrop
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>Panel Putih Transparan</span>
              {layout.showContentBackdrop ? (
                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </button>
          </div>

          {/* Field Selector Pills */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5">
              Pilih Field untuk Diatur:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_META.map((item) => {
                const isSelected = selectedField === item.key;
                const isVisible = layout[item.key].visible;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedField(item.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isVisible ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Field Editor */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-white">
                {FIELD_META.find((m) => m.key === selectedField)?.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateField(selectedField, { visible: !activeField.visible } as any)
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer ${
                  activeField.visible
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {activeField.visible ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Tampil</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Disembunyikan</span>
                  </>
                )}
              </button>
            </div>

            {/* X / Y Position Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Posisi Horizontal (X)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sky-300">{activeField.x}%</span>
                    <button
                      type="button"
                      onClick={() => updateField(selectedField, { x: 50 } as any)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 cursor-pointer"
                      title="Tengahkan horizontal (50%)"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={2}
                  max={98}
                  step={0.5}
                  value={activeField.x}
                  onChange={(e) =>
                    updateField(selectedField, { x: parseFloat(e.target.value) } as any)
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Posisi Vertikal (Y)</span>
                  <span className="font-mono font-bold text-sky-300">{activeField.y}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={97}
                  step={0.5}
                  value={activeField.y}
                  onChange={(e) =>
                    updateField(selectedField, { y: parseFloat(e.target.value) } as any)
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Text-specific styling vs QR-specific styling */}
            {activeTextField ? (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                      <span>Ukuran Font</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {activeTextField.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={54}
                      step={1}
                      value={activeTextField.fontSize}
                      onChange={(e) =>
                        updateField(selectedField, {
                          fontSize: parseInt(e.target.value, 10),
                        } as any)
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-300 mb-1">Perataan Teks</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { value: 'left', icon: AlignLeft, label: 'Kiri' },
                          { value: 'center', icon: AlignCenter, label: 'Tengah' },
                          { value: 'right', icon: AlignRight, label: 'Kanan' },
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const active = activeTextField.align === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              updateField(selectedField, { align: opt.value } as any)
                            }
                            className={`py-1.5 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-sky-600 border-sky-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-300 mb-1.5">Warna Teks</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {TEXT_COLOR_SWATCHES.map((sw) => {
                      const isCurrent =
                        activeTextField.color.toLowerCase() === sw.hex.toLowerCase();
                      return (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => updateField(selectedField, { color: sw.hex } as any)}
                          title={sw.label}
                          style={{ backgroundColor: sw.hex }}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer ${
                            isCurrent
                              ? 'border-sky-400 ring-2 ring-sky-400/50 scale-110'
                              : 'border-slate-600'
                          }`}
                        >
                          {isCurrent && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                sw.hex === '#ffffff' || sw.hex === '#fde68a'
                                  ? 'text-slate-900'
                                  : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={activeTextField.color}
                        onChange={(e) =>
                          updateField(selectedField, { color: e.target.value } as any)
                        }
                        className="w-4 h-4 bg-transparent border-0 p-0 cursor-pointer"
                      />
                      <span className="font-mono text-[10px]">{activeTextField.color}</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span>Ukuran Kotak QR Code</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {layout.qrCode.size}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={420}
                    step={5}
                    value={layout.qrCode.size}
                    onChange={(e) =>
                      updateField('qrCode', { size: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateField('qrCode', { showFrame: !layout.qrCode.showFrame })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between cursor-pointer ${
                      layout.qrCode.showFrame
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Bingkai Putih QR</span>
                    <span>{layout.qrCode.showFrame ? 'Aktif' : 'Mati'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateField('qrCode', { showCaption: !layout.qrCode.showCaption })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between cursor-pointer ${
                      layout.qrCode.showCaption
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Label ID di Bawah QR</span>
                    <span>{layout.qrCode.showCaption ? 'Aktif' : 'Mati'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
