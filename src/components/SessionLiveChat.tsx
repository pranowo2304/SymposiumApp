import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  CheckCircle2, 
  HelpCircle, 
  User, 
  Sparkles, 
  Clock, 
  ChevronUp, 
  CornerDownRight, 
  Check, 
  Filter, 
  Flame, 
  MessageCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Session, ChatMessage, ChatReply } from '../types';
import { 
  getSessionChatMessages, 
  saveSessionChatMessages, 
  toggleMessageUpvote, 
  answerSessionQuestion,
  replyToChatMessage
} from '../data/liveChatData';

interface SessionLiveChatProps {
  session: Session;
  currentUserName?: string;
  currentUserRole?: string;
}

export const SessionLiveChat: React.FC<SessionLiveChatProps> = ({
  session,
  currentUserName = 'dr. Ahmad Pratama, Sp.PD',
  currentUserRole = 'Peserta'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getSessionChatMessages(session.id, session.title, session.moderator);
  });

  const [filterType, setFilterType] = useState<'all' | 'questions' | 'popular' | 'unanswered'>('all');
  const [inputText, setInputText] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(true);
  const [targetSpeaker, setTargetSpeaker] = useState<string>(
    session.speakers[0]?.name || session.moderator || 'Moderator'
  );
  
  // Custom sender name & role for the user
  const [senderName, setSenderName] = useState(currentUserName);
  const [senderRole, setSenderRole] = useState<'Peserta' | 'Dokter Spesialis' | 'Dokter Umum' | 'Residen'>(
    'Dokter Spesialis'
  );

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Answering as speaker/moderator modal/drawer
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerInputText, setAnswerInputText] = useState('');
  const [answeringAs, setAnsweringAs] = useState<string>(
    session.speakers[0]?.name || session.moderator
  );

  // Simulated live participant counter for this room
  const [onlineCount] = useState(() => Math.floor(65 + Math.random() * 85));

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync when session changes
  useEffect(() => {
    setMessages(getSessionChatMessages(session.id, session.title, session.moderator));
    setTargetSpeaker(session.speakers[0]?.name || session.moderator || 'Moderator');
    setAnsweringAs(session.speakers[0]?.name || session.moderator);
  }, [session.id]);

  // Sync when currentUser changes
  useEffect(() => {
    if (currentUserName) setSenderName(currentUserName);
    if (currentUserRole) setSenderRole(currentUserRole as any);
  }, [currentUserName, currentUserRole]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newMessage: ChatMessage = {
      id: `chat-${session.id}-${Date.now()}`,
      sessionId: session.id,
      senderName: senderName.trim() || 'Peserta Simposium',
      senderRole: senderRole,
      senderInstitution: 'Peserta Simposium 2026',
      message: inputText.trim(),
      timestamp: currentTime,
      isQuestion: isQuestionMode,
      targetSpeaker: isQuestionMode ? targetSpeaker : undefined,
      upvotes: 1,
      hasUpvoted: true,
      tag: isQuestionMode ? 'Pertanyaan Sesi' : 'Diskusi Terbuka'
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    saveSessionChatMessages(session.id, updated);
    setInputText('');

    // Smooth scroll down
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // If it's a question, simulate acknowledgment from Moderator after 3 seconds
    if (isQuestionMode) {
      setTimeout(() => {
        setMessages(prev => {
          // Check if question still exists
          const targetQ = prev.find(m => m.id === newMessage.id);
          if (!targetQ) return prev;

          const updatedWithAck = prev.map(m => {
            if (m.id === newMessage.id && !m.replies?.length) {
              const ackReply: ChatReply = {
                id: `reply-ack-${Date.now()}`,
                senderName: session.moderator,
                senderRole: 'Moderator Sesi',
                message: `Pertanyaan telah dicatat dan akan dibahas pada sesi tanya-jawab dengan ${targetSpeaker}.`,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                isOfficial: true
              };
              return {
                ...m,
                replies: [...(m.replies || []), ackReply]
              };
            }
            return m;
          });
          saveSessionChatMessages(session.id, updatedWithAck);
          return updatedWithAck;
        });
      }, 3500);
    }
  };

  const handleToggleUpvote = (messageId: string) => {
    const updated = toggleMessageUpvote(session.id, messageId);
    setMessages(updated);
  };

  const handleSubmitAnswer = (messageId: string) => {
    if (!answerInputText.trim()) return;
    const updated = answerSessionQuestion(session.id, messageId, answerInputText.trim(), answeringAs);
    setMessages(updated);
    setAnsweringQuestionId(null);
    setAnswerInputText('');
  };

  const handleSubmitReply = (messageId: string) => {
    if (!replyText.trim()) return;
    const updated = replyToChatMessage(session.id, messageId, replyText.trim(), senderName, senderRole);
    setMessages(updated);
    setReplyingToId(null);
    setReplyText('');
  };

  const handleQuickInsert = (text: string) => {
    setInputText(prev => (prev ? `${prev} ${text}` : text));
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (filterType === 'questions') return msg.isQuestion;
    if (filterType === 'unanswered') return msg.isQuestion && !msg.isAnswered;
    return true;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (filterType === 'popular') {
      return b.upvotes - a.upvotes;
    }
    // Default by order
    return 0;
  });

  const questionCount = messages.filter(m => m.isQuestion).length;
  const unansweredCount = messages.filter(m => m.isQuestion && !m.isAnswered).length;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-150">
      {/* Top Banner: Status Live & Rooms Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>Live Diskusi & Q&A Sesi</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-300 font-semibold lowercase tracking-normal">
                  {onlineCount} peserta terhubung
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {session.room} • Moderator: <strong className="text-white font-medium">{session.moderator}</strong>
              </p>
            </div>
          </div>

          <div className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-slate-200 border border-white/10 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Moderasi Aktif</span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="mt-3 pt-3 border-t border-slate-700/80 flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semua ({messages.length})
          </button>

          <button
            onClick={() => setFilterType('questions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'questions'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Tanya Pembicara ({questionCount})</span>
          </button>

          <button
            onClick={() => setFilterType('popular')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'popular'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Terpopuler</span>
          </button>

          {unansweredCount > 0 && (
            <button
              onClick={() => setFilterType('unanswered')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterType === 'unanswered'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Belum Terjawab ({unansweredCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="space-y-3.5 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-1">
        {sortedMessages.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">Belum Ada Pesan untuk Filter Ini</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Jadilah yang pertama mengajukan pertanyaan klinis atau memulai diskusi untuk sesi ini.
            </p>
          </div>
        ) : (
          sortedMessages.map((msg) => {
            const isUserSender = msg.senderName === senderName;
            return (
              <div 
                key={msg.id}
                className={`rounded-2xl p-3.5 sm:p-4 transition-all ${
                  msg.isQuestion
                    ? msg.isAnswered
                      ? 'bg-emerald-50/40 border-2 border-emerald-200'
                      : 'bg-blue-50/40 border-2 border-blue-200'
                    : 'bg-slate-50/80 border border-slate-200'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      msg.senderRole === 'Moderator'
                        ? 'bg-purple-600 text-white'
                        : msg.senderRole === 'Pembicara'
                        ? 'bg-blue-600 text-white'
                        : msg.senderRole === 'Dokter Spesialis'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {msg.senderName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {msg.senderName}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                          msg.senderRole === 'Moderator'
                            ? 'bg-purple-100 text-purple-800'
                            : msg.senderRole === 'Pembicara'
                            ? 'bg-blue-100 text-blue-800'
                            : msg.senderRole === 'Dokter Spesialis'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {msg.senderInstitution && `${msg.senderInstitution} • `}{msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Upvote Button */}
                  <button
                    onClick={() => handleToggleUpvote(msg.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                      msg.hasUpvoted
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                    title="Beri Upvote agar pertanyaan diangkat oleh moderator"
                  >
                    <ThumbsUp className={`w-3 h-3 ${msg.hasUpvoted ? 'fill-white' : ''}`} />
                    <span>{msg.upvotes}</span>
                  </button>
                </div>

                {/* Target Speaker Badge if question */}
                {msg.isQuestion && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-900 text-[10px] font-bold">
                      <HelpCircle className="w-3 h-3 text-blue-600" />
                      Ditujukan ke: {msg.targetSpeaker || 'Narasumber / Moderator'}
                    </span>

                    {msg.isAnswered ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Sudah Terjawab
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Menunggu Diskusi Q&A
                      </span>
                    )}

                    {msg.tag && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                        #{msg.tag}
                      </span>
                    )}
                  </div>
                )}

                {/* Main Message Text */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                  {msg.message}
                </p>

                {/* Verified Answer Section if Answered */}
                {msg.answer && (
                  <div className="mt-3 bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-300 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 mb-1.5 text-xs text-emerald-800 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Jawaban Resmi dari {msg.answer.answeredBy}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {msg.answer.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      {msg.answer.answerText}
                    </p>
                  </div>
                )}

                {/* Nested Replies List */}
                {msg.replies && msg.replies.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-2">
                    {msg.replies.map(rep => (
                      <div key={rep.id} className="flex items-start space-x-2 text-xs bg-white/80 p-2 rounded-lg border border-slate-100">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              {rep.senderName} 
                              {rep.senderRole && (
                                <span className="text-[10px] font-normal text-slate-500 ml-1">
                                  ({rep.senderRole})
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">{rep.timestamp}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-xs leading-normal">{rep.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Bar (Reply & Answer buttons) */}
                <div className="mt-2.5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setReplyingToId(replyingToId === msg.id ? null : msg.id);
                        setAnsweringQuestionId(null);
                      }}
                      className="text-[11px] text-slate-500 hover:text-blue-700 font-semibold flex items-center gap-1 py-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{replyingToId === msg.id ? 'Batal Balas' : 'Balas Komentar'}</span>
                    </button>

                    {msg.isQuestion && !msg.isAnswered && (
                      <button
                        onClick={() => {
                          setAnsweringQuestionId(answeringQuestionId === msg.id ? null : msg.id);
                          setReplyingToId(null);
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 py-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{answeringQuestionId === msg.id ? 'Batal Menjawab' : 'Jawab sebagai Narasumber/Moderator'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Answer Form Box (For Speaker / Moderator simulation) */}
                {answeringQuestionId === msg.id && (
                  <div className="mt-2.5 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Tulis Jawaban Langsung untuk Pertanyaan Ini
                      </span>
                      <select
                        value={answeringAs}
                        onChange={(e) => setAnsweringAs(e.target.value)}
                        className="text-xs bg-white border border-indigo-200 rounded-lg p-1 text-slate-700"
                      >
                        {session.speakers.map(sp => (
                          <option key={sp.id} value={sp.name}>{sp.name} (Pembicara)</option>
                        ))}
                        <option value={session.moderator}>{session.moderator} (Moderator)</option>
                      </select>
                    </div>

                    <textarea
                      value={answerInputText}
                      onChange={(e) => setAnswerInputText(e.target.value)}
                      placeholder={`Ketik penjelasan klinis atas nama ${answeringAs}...`}
                      rows={2}
                      className="w-full text-xs p-2 rounded-lg border border-indigo-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAnsweringQuestionId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitAnswer(msg.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                      >
                        Terbitkan Jawaban
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Reply Form Box */}
                {replyingToId === msg.id && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis tanggapan untuk komentar ini..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmitReply(msg.id);
                        }
                      }}
                      className="flex-1 text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitReply(msg.id)}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-2xs shrink-0"
                    >
                      Kirim
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Pill Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-400 mr-1">Pertanyaan Cepat:</span>
        <button
          type="button"
          onClick={() => handleQuickInsert('Izin bertanya dok mengenai dosis penyesuaian pada gangguan ginjal/eGFR rendah...')}
          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
        >
          💊 Dosis pada eGFR rendah
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert('Apakah ada kontraindikasi absolut tindakan ini pada pasien lansia?')}
          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
        >
          ⚠️ Kontraindikasi lansia
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert('Bagaimana protokol rujukan cepat dari Puskesmas/Faskes 1?')}
          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
        >
          🏥 Protokol Faskes 1
        </button>
      </div>

      {/* Send Message / Question Form Box */}
      <form onSubmit={handleSendMessage} className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-300 space-y-2.5">
        
        {/* Toggle Mode: Q&A (Pertanyaan Pembicara) vs Diskusi Umum */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 p-0.5 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsQuestionMode(true)}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                isQuestionMode
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tanya Pembicara (Q&A)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuestionMode(false)}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                !isQuestionMode
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Diskusi / Komentar</span>
            </button>
          </div>

          {/* User Identity Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Nama Anda..."
              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 max-w-[130px] sm:max-w-[170px]"
              title="Ubah nama tampilan pengirim"
            />
          </div>
        </div>

        {/* Target Speaker Selector when in Question Mode */}
        {isQuestionMode && (
          <div className="flex items-center gap-2 text-xs bg-blue-50/70 p-2 rounded-xl border border-blue-100 text-blue-900">
            <span className="font-bold text-blue-800 shrink-0">Ajukan ke:</span>
            <select
              value={targetSpeaker}
              onChange={(e) => setTargetSpeaker(e.target.value)}
              className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-hidden"
            >
              {session.speakers.map((sp) => (
                <option key={sp.id} value={sp.name}>
                  {sp.name} ({sp.specialty || 'Narasumber'})
                </option>
              ))}
              <option value={`Moderator (${session.moderator})`}>
                Moderator Sesi ({session.moderator})
              </option>
              <option value="Semua Panelis & Pembicara">
                Semua Panelis & Pembicara
              </option>
            </select>
          </div>
        )}

        {/* Text Area & Submit Button */}
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isQuestionMode
                ? `Ketik pertanyaan klinis Anda untuk ${targetSpeaker}...`
                : 'Tulis komentar atau tanggapan diskusi untuk peserta lain...'
            }
            rows={2}
            className="flex-1 p-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              inputText.trim()
                ? isQuestionMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>Tekan <strong>Enter</strong> untuk mengirim. Semua pertanyaan akan tampil di layar moderator.</span>
          <span>Etika Medis Berkelanjutan</span>
        </p>

      </form>
    </div>
  );
};
