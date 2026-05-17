import React, { useState } from 'react';
import { MapPin, Clock, MessageCircle, Search, Trash2, Zap, ArrowRight } from 'lucide-react';
import { toast } from './ToastSystem';

const CATEGORY_CONFIG = {
  'Gıda': {
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>)
  },
  'İlaç & Tıbbi Malzeme': {
    color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>)
  },
  'Kıyafet & Tekstil': {
    color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>)
  },
  'Eşya': {
    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>)
  },
  'Elektronik': {
    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>)
  },
  'Gönüllü': {
    color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)
  },
};

const DEFAULT_CONFIG = {
  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',
  icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>)
};

export default function SignalList({ signals, currentUser, onSignalClick, onStartChat, onRequestTask, onDeleteSignal }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

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
      s.beneficiary_note?.toLowerCase().includes(q)
    );
  });

  // ✅ Güçlendirilmiş own kontrolü
  const isOwn = (signal) =>
    currentUser &&
    (parseInt(signal.citizen_id) === parseInt(currentUser.id) ||
     String(signal.citizen_id) === String(currentUser.id));

  const isAssignedToMe = (signal) =>
    currentUser &&
    (parseInt(signal.assigned_to) === parseInt(currentUser.id) ||
     String(signal.assigned_to) === String(currentUser.id));

  return (
    <div className="space-y-4 w-full">

      {/* Başlık + Arama + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Operasyon Listesi</h3>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-blue-200">
            {filteredSignals.length} Sinyal
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ara — kategori, kişi, not..."
              className="w-full bg-white border border-[#ddd8d0] px-4 py-2.5 pl-9 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
            )}
          </div>

          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1 shrink-0">
            <button onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map(signal => {
            const cfg = CATEGORY_CONFIG[signal.category_name] || DEFAULT_CONFIG;
            const own = isOwn(signal);
            const assignedToMe = isAssignedToMe(signal);

            return (
              <div key={signal.id} className="group bg-white rounded-2xl border border-[#ece8e2] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="h-2 w-full" style={{ background: own ? '#7c3aed' : cfg.color }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: own ? '#ede9fe' : cfg.bg, color: own ? '#7c3aed' : cfg.color, border: `1.5px solid ${own ? '#c4b5fd' : cfg.border}` }}>
                        {own ? <MapPin size={16} /> : cfg.icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">{signal.category_name || 'Genel'}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: own ? '#7c3aed' : cfg.color }}>
                          {signal.urgency_level === 'Kritik' ? '🛡️ Akıncı' : '👤 Vatandaş'}
                          {own && ' · Sizin'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {signal.status === 'Beklemede' ? (
                        <span className="text-[8px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-600 border border-amber-200 uppercase">Onay Bekleniyor</span>
                      ) : signal.assigned_to ? (
                        <span className="text-[8px] font-black px-2 py-1 rounded-full bg-green-100 text-green-600 border border-green-200 uppercase">
                          {assignedToMe ? '⚡ Görev Sende' : '✓ Üstlenildi'}
                        </span>
                      ) : (
                        <span className="text-[8px] font-black px-2 py-1 rounded-full bg-blue-100 text-blue-600 border border-blue-200 uppercase">Açık</span>
                      )}
                    </div>
                  </div>

                  {signal.description && (
                    <div className="px-3 py-2 rounded-xl mb-3 border"
                      style={{ background: own ? '#f5f3ff' : cfg.bg, borderColor: own ? '#ddd6fe' : cfg.border }}>
                      <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-2">"{signal.description}"</p>
                    </div>
                  )}

                  {signal.beneficiary_note && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-3 truncate">
                      <MapPin size={9} className="shrink-0 text-amber-400" />{signal.beneficiary_note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black"
                        style={{ background: own ? '#7c3aed' : cfg.color }}>
                        {(signal.full_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      {signal.full_name || 'Anonim'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={9} />
                      {signal.created_at ? new Date(signal.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>

                  {/* ✅ Aksiyonlar */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#f1ece6] flex-wrap">
                    {own ? (
                      // ✅ KENDİ SİNYALİ — sadece sil
                      <button
                        onClick={() => { if (window.confirm('Bu sinyali silmek istiyor musunuz?')) onDeleteSignal && onDeleteSignal(signal.id); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-500 text-red-400 hover:text-white border border-red-200 text-[10px] font-black uppercase transition-all active:scale-95"
                      >
                        <Trash2 size={12} /> Sinyali Sil
                      </button>
                    ) : (
                      <>
                        {/* ✅ Atanmamış — Yardım Teklif Et */}
                        {currentUser && !signal.assigned_to && signal.status === 'Açık' && (
                          <button
                            onClick={() => onRequestTask && onRequestTask(signal.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-200 text-[10px] font-black uppercase transition-all active:scale-95"
                          >
                            <Zap size={12} /> Yardım Et
                          </button>
                        )}
                        {/* ✅ Başkasına atanmış ama ben değilim — İletişime Geç */}
                        {currentUser && signal.assigned_to && !assignedToMe && (
                          <button
                            onClick={() => onStartChat && onStartChat(signal)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200 text-[10px] font-black uppercase transition-all active:scale-95"
                          >
                            <MessageCircle size={12} /> İletişim
                          </button>
                        )}
                        {/* ✅ Bana atanmış — Mesajlaş */}
                        {currentUser && assignedToMe && (
                          <button
                            onClick={() => onStartChat && onStartChat(signal)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-500 text-green-500 hover:text-white border border-green-200 text-[10px] font-black uppercase transition-all active:scale-95"
                          >
                            <MessageCircle size={12} /> Mesajlaş
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => onSignalClick && onSignalClick(parseFloat(signal.latitude), parseFloat(signal.longitude))}
                      className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200 text-[10px] font-bold uppercase transition-all active:scale-95"
                    >
                      Harita <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LİSTE */}
      {view === 'list' && (
        <div className="space-y-2">
          {filteredSignals.map(signal => {
            const cfg = CATEGORY_CONFIG[signal.category_name] || DEFAULT_CONFIG;
            const own = isOwn(signal);
            const assignedToMe = isAssignedToMe(signal);

            return (
              <div key={signal.id} className="group flex items-center gap-4 bg-white rounded-2xl border border-[#ece8e2] p-4 hover:shadow-md transition-all duration-200">
                <div className="w-1 h-12 rounded-full shrink-0" style={{ background: own ? '#7c3aed' : cfg.color }} />

                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: own ? '#ede9fe' : cfg.bg, color: own ? '#7c3aed' : cfg.color, border: `1.5px solid ${own ? '#c4b5fd' : cfg.border}` }}>
                  {own ? <MapPin size={16} /> : cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800">{signal.category_name || 'Genel'}</span>
                    <span className="text-[9px] font-semibold uppercase" style={{ color: own ? '#7c3aed' : cfg.color }}>
                      {signal.urgency_level === 'Kritik' ? 'Akıncı' : 'Vatandaş'}
                    </span>
                    {signal.status === 'Beklemede' && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 uppercase">Onay</span>
                    )}
                    {own && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200 uppercase">Sizin</span>
                    )}
                  </div>
                  {signal.description && (
                    <p className="text-[10px] text-slate-500 italic truncate mt-0.5">"{signal.description}"</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-400 font-semibold">{signal.full_name || 'Anonim'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[9px] text-slate-400">
                      {signal.created_at ? new Date(signal.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}
                    </span>
                  </div>
                </div>

                {/* ✅ Liste butonları */}
                <div className="flex items-center gap-2 shrink-0">
                  {own ? (
                    <button onClick={() => { if (window.confirm('Silmek istiyor musunuz?')) onDeleteSignal && onDeleteSignal(signal.id); }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-500 text-red-400 hover:text-white border border-red-200 transition-all active:scale-95"
                      title="Sinyali Sil">
                      <Trash2 size={13} />
                    </button>
                  ) : (
                    <>
                      {currentUser && !signal.assigned_to && signal.status === 'Açık' && (
                        <button onClick={() => onRequestTask && onRequestTask(signal.id)}
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-200 transition-all active:scale-95"
                          title="Yardım Teklif Et">
                          <Zap size={13} />
                        </button>
                      )}
                      {currentUser && signal.assigned_to && !assignedToMe && (
                        <button onClick={() => onStartChat && onStartChat(signal)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-400 hover:text-slate-700 border border-slate-200 transition-all active:scale-95"
                          title="İletişime Geç">
                          <MessageCircle size={13} />
                        </button>
                      )}
                      {currentUser && assignedToMe && (
                        <button onClick={() => onStartChat && onStartChat(signal)}
                          className="p-2 rounded-xl bg-green-50 hover:bg-green-500 text-green-500 hover:text-white border border-green-200 transition-all active:scale-95"
                          title="Mesajlaş">
                          <MessageCircle size={13} />
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => onSignalClick && onSignalClick(parseFloat(signal.latitude), parseFloat(signal.longitude))}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-slate-200 transition-all active:scale-95"
                    title="Haritada Göster">
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredSignals.length === 0 && (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#ece8e2] shadow-sm">
          {search ? (
            <div className="space-y-3">
              <Search className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">"{search}" için sonuç yok</p>
              <button onClick={() => setSearch('')} className="text-[10px] text-blue-500 font-bold uppercase hover:text-blue-600">Aramayı Temizle</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" width="28" height="28">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktif sinyal bulunmuyor</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}