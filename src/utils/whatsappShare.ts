import { Session, SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';

/**
 * Generates an elegantly formatted WhatsApp message for a symposium session.
 */
export function formatSessionWhatsAppMessage(session: Session, eventInfo?: SymposiumInfo): string {
  const info = eventInfo || SYMPOSIUM_INFO;
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const speakerLines = session.speakers.length > 0
    ? session.speakers.map((sp, idx) => `  ${idx + 1}. *${sp.name}*\n     _${sp.institution}_`).join('\n')
    : '  - _(Daftar narasumber dalam konfirmasi)_';

  const clinicalKeypoints = session.keyTakeaways && session.keyTakeaways.length > 0
    ? `\n\n📌 *Poin Utama Pembahasan:*\n` + session.keyTakeaways.slice(0, 3).map(k => `• ${k}`).join('\n')
    : '';

  const moderatorLine = session.moderator && session.moderator !== '-'
    ? `\n🎙️ *Moderator:* ${session.moderator}`
    : '';

  const categoryTag = session.category ? ` [${session.category}]` : '';

  return `*${info.title.toUpperCase()}*
_${info.theme}_

━━━━━━━━━━━━━━━━━━━━━
📢 *JADWAL SESI ILMIAH*
━━━━━━━━━━━━━━━━━━━━━

*${session.title}*${categoryTag}

🗓️ *Hari/Tanggal:* ${session.day}, ${session.date}
⏰ *Waktu:* ${session.timeString}
📍 *Ruangan:* ${session.room} (${session.floor})
🏢 *Lokasi:* ${info.location}
🔖 *Tipe Sesi:* ${session.type}${moderatorLine}

👨‍⚕️👩‍⚕️ *Narasumber / Pembicara:*
${speakerLines}${clinicalKeypoints}

━━━━━━━━━━━━━━━━━━━━━
💡 *Catatan:* Sesi berakreditasi SKP Kemenkes RI / IDI. Pastikan hadir tepat waktu dan lakukan presensi melalui QR Code di aplikasi simposium.

📲 *Buka Aplikasi Simposium:*
${currentUrl}
`.trim();
}

/**
 * Triggers WhatsApp share either via direct deep link or web fallback.
 * Works seamlessly across mobile (opens WhatsApp app) and desktop (WhatsApp Web).
 */
export function shareSessionToWhatsApp(session: Session, eventInfo?: SymposiumInfo): void {
  const message = formatSessionWhatsAppMessage(session, eventInfo);
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

  // Safe window open handling for iframes and browser security
  const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    // If popup blocked, fallback to direct location or alert
    window.location.href = waUrl;
  }
}
