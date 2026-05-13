import React, { useState, useEffect } from 'react';
import { X, Award, Shield, Activity, CheckCircle2, AlertCircle, LogOut, Trophy, Radio, Clock } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onLogout }) {
  const [tab, setTab] = useState('profile');
  const [leaderboard, setLeaderboard] = useState([]);
  const [mySignals, setMySignals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/leaderboard').then(r => r.json()),
      user?.id ? fetch(`http://localhost:5000/api/my-signals/${user.id}`).then(r => r.json()) : Promise.resolve([])
    ]).then(([lb, ms]) => {
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setMySignals(Array.isArray(ms) ? ms : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const isAkinci = user.status === 'Onaylı';
  const rank = isAkinci ? "Saha Operatörü (Akıncı)" : "Vatandaş (Gözlemci)";
  const myRank = leaderboard.findIndex(u => u.id === user.id) + 1;

  const statusColor = (status) => {
    if (status === 'Açık') return 'text-green-400 bg-green-500/10';
    if (status === 'Beklemede') return 'text-yellow-400 bg-yellow-500/10';
    if (status === 'İptal') return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-white/5';
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0d1425] border border-blue-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        
        {/* Üst Header */}
        <div className="h-24 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-b border-white/5 relative shrink-0">
          <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-white transition z-10">
            <X size={24} />
          </button>
        </div>

        {/* Profil Özeti */}
        <div className="px-8 pt-0 shrink-0">
          <div className="relative -mt-12 mb-4 flex items-end gap-4">
            <div className={`w-24 h-24 rounded-3xl border-4 border-[#0d1425] flex items-center justify-center shadow-2xl shrink-0 ${isAkinci ? 'bg-blue-600' : 'bg-slate-800'}`}>
              <UserIcon size={48} className="text-white" />
            </div>
            <div className="pb-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{user.full_name}</h2>
              <p className={`text-xs font-black uppercase tracking-widest ${isAkinci ? 'text-blue-400' : 'text-slate-500'}`}>
                {rank}
                {myRank > 0 && <span className="ml-2 text-yellow-400">· #{myRank} Sıra</span>}
              </p>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0a0f1d] border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Award size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Akıncı XP</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.akinci_xp || 0}</p>
            </div>
            <div className="bg-[#0a0f1d] border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Shield size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Güven Skoru</span>
              </div>
              <p className="text-2xl font-bold text-white">%{user.trust_score || 100}</p>
            </div>
            <div className="bg-[#0a0f1d] border border-white/5 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Radio size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Sinyal</span>
              </div>
              <p className="text-2xl font-bold text-white">{mySignals.length}</p>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex border-b border-white/5">
            {[
              { key: 'profile', label: 'Profil', icon: Shield },
              { key: 'signals', label: 'Sinyallerim', icon: Radio },
              { key: 'leaderboard', label: 'Liderboard', icon: Trophy },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                  tab === t.key ? 'text-blue-400 border-blue-500' : 'text-slate-600 border-transparent hover:text-slate-400'
                }`}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sekme İçeriği */}
        <div className="flex-1 overflow-y-auto px-8 py-4" style={{scrollbarWidth:'thin',scrollbarColor:'#1e3a5f transparent'}}>

          {/* PROFİL SEKMESİ */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className={`p-6 rounded-3xl border ${isAkinci ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isAkinci ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {isAkinci ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">Adli Sicil Onay Durumu</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {isAkinci ? "Belgeleriniz doğrulandı, saha operasyonlarına katılabilirsiniz." : "Belgeleriniz operatör onayında. Lütfen bekleyiniz."}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${isAkinci ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                    {user.status || 'BEKLEMEDE'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition text-slate-400">
                  Bilgileri Güncelle
                </button>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="px-6 bg-red-600/10 hover:bg-red-600 border border-red-600/20 hover:border-red-600 text-red-500 hover:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
                >
                  <LogOut size={16} /> Çıkış
                </button>
              </div>
            </div>
          )}

          {/* SİNYALLERİM SEKMESİ */}
          {tab === 'signals' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-slate-600 text-xs font-bold uppercase">Yükleniyor...</div>
              ) : mySignals.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
                  <Radio className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-slate-600 text-xs font-bold uppercase">Henüz sinyal göndermediniz.</p>
                </div>
              ) : mySignals.map(signal => (
                <div key={signal.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${statusColor(signal.status)}`}>
                        {signal.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{signal.category_name}</span>
                    </div>
                    <p className="text-xs text-slate-300 italic truncate">"{signal.description?.substring(0, 50)}{signal.description?.length > 50 ? '...' : ''}"</p>
                    <p className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                      <Clock size={10} /> {signal.created_at ? new Date(signal.created_at).toLocaleString('tr-TR') : '--'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 ml-3 shrink-0">#{signal.id}</span>
                </div>
              ))}
            </div>
          )}

          {/* LİDERBOARD SEKMESİ */}
          {tab === 'leaderboard' && (
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-slate-600 text-xs font-bold uppercase">Yükleniyor...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
                  <Trophy className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-slate-600 text-xs font-bold uppercase">Henüz kayıtlı kullanıcı yok.</p>
                </div>
              ) : leaderboard.map((u, i) => (
                <div key={u.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                  u.id === user.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'
                }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    i === 0 ? 'bg-yellow-500 text-black' :
                    i === 1 ? 'bg-slate-400 text-black' :
                    i === 2 ? 'bg-amber-600 text-white' :
                    'bg-white/5 text-slate-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white uppercase truncate">
                      {u.full_name}
                      {u.id === user.id && <span className="ml-2 text-blue-400 text-[9px]">(Sen)</span>}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">
                      {u.identity_doc_status === 'Onaylı' ? '🛡️ Akıncı' : '👤 Vatandaş'} · {u.completed_tasks} görev
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-400">{u.akinci_xp}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase">XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserIcon({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}