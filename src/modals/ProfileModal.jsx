import React from 'react';
import { X, Award, Shield, Activity, Calendar, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onLogout }) {
  if (!isOpen || !user) return null;

  // Rütbe Belirleme Mantığı
  const isAkinci = user.status === 'Onaylı';
  const rank = isAkinci ? "Saha Operatörü (Akıncı)" : "Vatandaş (Gözlemci)";

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0d1425] border border-blue-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        
        {/* Üst Header / Kapak Alanı */}
        <div className="h-32 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-b border-white/5 relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-white transition z-10">
            <X size={24} />
          </button>
        </div>

        {/* Profil Bilgileri */}
        <div className="px-10 pb-10">
          <div className="relative -mt-16 mb-6 flex items-end gap-6">
            {/* Profil Resmi Yerine İkon */}
            <div className={`w-32 h-32 rounded-3xl border-4 border-[#0d1425] flex items-center justify-center shadow-2xl ${isAkinci ? 'bg-blue-600' : 'bg-slate-800'}`}>
              <UserIcon size={64} className="text-white" />
            </div>
            <div className="pb-2">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{user.full_name}</h2>
              <p className={`text-xs font-black uppercase tracking-widest ${isAkinci ? 'text-blue-400' : 'text-slate-500'}`}>{rank}</p>
            </div>
          </div>

          {/* İstatistik Paneli (8 Tablodaki Veriler) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0a0f1d] border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Award size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Akıncı XP</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.akinci_xp || 0}</p>
            </div>

            <div className="bg-[#0a0f1d] border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Güven Skoru</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.trust_score || 100}</p>
            </div>

            <div className="bg-[#0a0f1d] border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Activity size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Saha Görevi</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>

          {/* Adli Sicil Durumu Kutusu */}
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

          {/* Alt Aksiyonlar */}
          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition">
              Bilgileri Güncelle
            </button>
            <button 
              onClick={() => { onLogout(); onClose(); }}
              className="px-6 bg-red-600/10 hover:bg-red-600 border border-red-600/20 hover:border-red-600 text-red-500 hover:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// İkon Çakışması Engelleme
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