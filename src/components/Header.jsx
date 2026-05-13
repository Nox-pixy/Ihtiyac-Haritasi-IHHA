import React, { useState } from 'react';
import { Radar, AlertTriangle, User as UserIcon, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

export default function Header({ onLogin, onRegister, onIhbar, currentUser, onLogout, onProfileOpen }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="p-4 flex justify-between items-center border-b border-blue-500/10 backdrop-blur-xl sticky top-0 z-[2000] bg-[#0a0f1d]/80">
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Radar className="text-blue-500 animate-pulse" size={22} />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tighter uppercase leading-none text-blue-100">İHHA</h1>
          <p className="text-[8px] text-slate-500 font-black tracking-[0.2em] uppercase hidden md:block">Operasyon Merkezi</p>
        </div>
      </div>

      {/* Desktop Sağ */}
      <div className="hidden md:flex items-center gap-3">
        <button onClick={onIhbar} className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg font-bold text-xs transition-all uppercase shadow-lg active:scale-95">
          <AlertTriangle size={16} /> İhbar Bırak
        </button>
        <div className="h-8 w-px bg-white/5 mx-1" />
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-1">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${currentUser.status === 'Onaylı' ? 'text-blue-400' : 'text-yellow-500'}`}>
                  {currentUser.status === 'Onaylı' ? 'Akıncı' : 'Vatandaş'}
                </span>
                {currentUser.status === 'Onaylı' && <ShieldCheck size={10} className="text-blue-400" />}
              </div>
              <span className="text-xs font-bold text-slate-200">{currentUser.full_name}</span>
            </div>
            <div className="group relative">
              <button className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                <UserIcon size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-52 bg-[#0d1425] border border-blue-500/20 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-[3000] translate-y-2 group-hover:translate-y-0">
                <div className="p-3 border-b border-white/5 mb-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Güven Skoru</p>
                    <span className="text-[9px] font-bold text-blue-400">100/100</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
                  </div>
                </div>
                <button onClick={onProfileOpen} className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-500/10 transition text-slate-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" /> Profil Detayları
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={onLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center justify-between">
                  <span>Güvenli Çıkış</span>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-blue-400 transition uppercase tracking-widest">Giriş Yap</button>
            <button onClick={onRegister} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] font-black transition shadow-lg uppercase border border-blue-400/30 text-white active:scale-95">Kayıt Ol</button>
          </div>
        )}
      </div>

      {/* Mobil Sağ */}
      <div className="flex md:hidden items-center gap-2">
        <button onClick={onIhbar} className="p-2 bg-red-600/90 text-white rounded-lg active:scale-95">
          <AlertTriangle size={18} />
        </button>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-white/5 text-slate-400 rounded-lg">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a0f1d]/98 border-b border-white/10 p-4 space-y-3 md:hidden z-[2001] shadow-2xl backdrop-blur-xl">
          {currentUser ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white">
                  {currentUser.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{currentUser.full_name}</p>
                  <p className={`text-[9px] font-black uppercase ${currentUser.status === 'Onaylı' ? 'text-blue-400' : 'text-yellow-500'}`}>
                    {currentUser.status === 'Onaylı' ? '🛡️ Akıncı' : '👤 Vatandaş'}
                  </p>
                </div>
              </div>
              <button onClick={() => { onProfileOpen(); setMobileMenuOpen(false); }} className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-slate-300 text-left uppercase tracking-widest">
                👤 Profil Detayları
              </button>
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full p-3 bg-red-500/10 rounded-xl text-xs font-bold text-red-400 text-left uppercase tracking-widest">
                🔒 Güvenli Çıkış
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest">
                Giriş Yap
              </button>
              <button onClick={() => { onRegister(); setMobileMenuOpen(false); }} className="w-full p-3 bg-blue-600 rounded-xl text-xs font-black text-white uppercase tracking-widest">
                Kayıt Ol
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}