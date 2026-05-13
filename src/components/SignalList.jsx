import React, { useState } from 'react';
import { Shield, User, MapPin, Clock, ArrowRightCircle, MessageCircle, FileText, CheckCircle2, Search, Trash2, Zap } from 'lucide-react';
import { toast } from './ToastSystem';

export default function SignalList({ signals, currentUser, onSignalClick, onStartChat, onRequestTask, onDeleteSignal }) {
  const [search, setSearch] = useState('');

  const activeSignals = Array.isArray(signals)
    ? signals.filter(s => s.status === 'Açık' || s.status === 'Beklemede')
    : [];

  const filteredSignals = activeSignals.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.description?.toLowerCase().includes(q) ||
      s.category_name?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.beneficiary_note?.toLowerCase().includes(q) ||
      s.urgency_level?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom duration-700">

      {/* Başlık + Arama */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-1">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 shrink-0">
            Operasyon Listesi
          </h3>
          <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[9px] font-black uppercase shrink-0">
            {filteredSignals.length} Sinyal
          </span>
        </div>

        {/* ✅ Arama çubuğu */}
        <div className="relative w-full sm:flex-1 sm:max-w-sm ml-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ara — kategori, kişi, not..."
            className="w-full bg-[#0a0f1d] border border-white/10 px-4 py-2.5 pl-9 rounded-xl text-[11px] font-bold text-white outline-none focus:border-blue-500 transition placeholder:text-slate-600"
          />
          <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-600 hover:text-white transition text-xs font-bold"
            >✕</button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredSignals.map(signal => {
          const isAkinci = signal.urgency_level === 'Kritik';
          const isAssignedToMe = currentUser && parseInt(signal.assigned_to) === parseInt(currentUser.id);
          const isOwn = currentUser && parseInt(signal.citizen_id) === parseInt(currentUser.id);

          return (
            <div
              key={signal.id}
              className={`group p-5 rounded-[1.5rem] border transition-all duration-300 ${
                isOwn
                  ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
                  : isAkinci
                    ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30'
                    : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Sol İkon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    isOwn ? 'bg-violet-500/10 text-violet-400' :
                    isAkinci ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {isOwn ? <MapPin size={20} /> : isAkinci ? <Shield size={20} /> : <User size={20} />}
                  </div>

                  {/* Bilgi */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-xs uppercase tracking-wider text-white">
                        {isAkinci ? '🛡️ AKINCI' : '👤 VATANDAŞ'}: {signal.category_name || 'Genel'}
                      </h4>
                      {isOwn && (
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 uppercase">Sizin</span>
                      )}
                      {signal.status === 'Beklemede' && (
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 uppercase">Onay Bekleniyor</span>
                      )}
                    </div>

                    {signal.description && (
                      <p className="text-[10px] text-slate-400 italic mt-1 truncate max-w-xs flex items-center gap-1">
                        <FileText size={10} className="shrink-0 text-slate-600" />
                        "{signal.description}"
                      </p>
                    )}
                    {signal.beneficiary_note && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                        <MapPin size={10} className="shrink-0 text-yellow-500" />
                        {signal.beneficiary_note}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                        <MapPin size={10} className={isOwn ? 'text-violet-400' : isAkinci ? 'text-blue-500' : 'text-red-500'} />
                        {signal.full_name || 'Gizli Birim'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                        <Clock size={10} />
                        {signal.created_at
                          ? new Date(signal.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                      {signal.assigned_to && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-green-400 uppercase">
                          <CheckCircle2 size={10} />
                          {isAssignedToMe ? 'Görev Sende' : 'Üstlenildi'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ Butonlar */}
                <div className="flex items-center gap-2 shrink-0">

                  {/* Kendi sinyali ise — sil butonu */}
                  {isOwn ? (
                    <button
                      onClick={() => {
                        if (window.confirm('Bu sinyali silmek istiyor musunuz?')) {
                          onDeleteSignal && onDeleteSignal(signal.id);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all active:scale-95"
                      title="Sinyali Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <>
                      {/* ✅ Yardım Teklif Et — atanmamış ve başkasının sinyaliyse */}
                      {currentUser && !signal.assigned_to && signal.status === 'Açık' && (
                        <button
                          onClick={() => {
                            if (!currentUser) { toast.warning('Giriş yapmalısın!'); return; }
                            onRequestTask && onRequestTask(signal.id);
                          }}
                          className="p-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 transition-all active:scale-95"
                          title="Yardım Teklif Et"
                        >
                          <Zap size={15} />
                        </button>
                      )}

                      {/* İletişime Geç — sadece atanmış kişi */}
                      {currentUser && isAssignedToMe && (
                        <button
                          onClick={() => onStartChat && onStartChat(signal)}
                          className="p-2.5 rounded-xl bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 transition-all active:scale-95"
                          title="Mesajlaş"
                        >
                          <MessageCircle size={15} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Haritada Gör */}
                  <button
                    onClick={() => onSignalClick && onSignalClick(parseFloat(signal.latitude), parseFloat(signal.longitude))}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-blue-400 transition-all active:scale-95 border border-white/5"
                    title="Haritada Göster"
                  >
                    <span className="hidden sm:inline">Haritada Gör</span>
                    <ArrowRightCircle size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSignals.length === 0 && (
          <div className="py-10 text-center bg-white/5 rounded-[2rem] border border-white/5">
            {search ? (
              <div className="space-y-2">
                <Search className="mx-auto text-slate-700" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                  "{search}" için sonuç bulunamadı.
                </p>
                <button onClick={() => setSearch('')} className="text-[10px] text-blue-400 font-bold uppercase">
                  Aramayı Temizle
                </button>
              </div>
            ) : (
              <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                Seçili kriterlerde aktif sinyal bulunmuyor.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}