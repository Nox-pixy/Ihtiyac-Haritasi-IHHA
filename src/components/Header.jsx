import React from 'react';
import { Radar, AlertTriangle, User as UserIcon, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

export default function Header({ onLogin, onRegister, onIhbar, currentUser, onLogout, onProfileOpen }) {
  return (
    <header className="p-4 flex justify-between items-center border-b border-blue-500/10 backdrop-blur-xl sticky top-0 z-[2000] bg-[#0a0f1d]/80">
      
      {/* Sol Kısım: Logo ve Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Radar className="text-blue-500 animate-pulse" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tighter uppercase leading-none text-blue-100">
            İHHA Karargah
          </h1>
          <p className="text-[9px] text-slate-500 font-black tracking-[0.2em] uppercase mt-1">
            Operasyon Merkezi
          </p>
        </div>
      </div>
      
      {/* Sağ Kısım: İşlem Butonları ve Kullanıcı Paneli */}
      <div className="flex items-center gap-3">
        
        {/* İhbar Butonu - Kırmızı Alarm Teması */}
        <button 
          onClick={onIhbar}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg font-bold text-xs transition-all uppercase shadow-lg shadow-red-900/20 active:scale-95"
        >
          <AlertTriangle size={18} /> İhbar Bırak
        </button>

        <div className="h-8 w-px bg-white/5 mx-1" />

        {/* Dinamik Alan: Giriş Yapılmışsa Kullanıcı Kartı, Yapılmamışsa Giriş/Kayıt */}
        {currentUser ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Kullanıcı Durum Bilgisi (Statik Görünüm) */}
            <div className="hidden md:flex flex-col items-end mr-1">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${currentUser.status === 'Onaylı' ? 'text-blue-400' : 'text-yellow-500'}`}>
                  {currentUser.status === 'Onaylı' ? 'Akıncı' : 'Vatandaş'}
                </span>
                {currentUser.status === 'Onaylı' && <ShieldCheck size={10} className="text-blue-400" />}
              </div>
              <span className="text-xs font-bold text-slate-200">{currentUser.full_name}</span>
            </div>

            {/* Hesabım / Profil Tetikleyici Menü */}
            <div className="group relative">
              <button className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-inner group-hover:border-blue-500/50">
                <UserIcon size={20} />
              </button>
              
              {/* Dropdown Menu (Hover ile açılır) */}
              <div className="absolute right-0 mt-2 w-52 bg-[#0d1425] border border-blue-500/20 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-[3000] translate-y-2 group-hover:translate-y-0">
                
                {/* Güven Puanı Göstergesi */}
                <div className="p-3 border-b border-white/5 mb-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Güven Skoru</p>
                    <span className="text-[9px] font-bold text-blue-400">100/100</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
                  </div>
                </div>
                
                {/* Profil Detayları Butonu (App.jsx'teki modalı açar) */}
                <button 
                  onClick={onProfileOpen}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-500/10 transition text-slate-300 flex items-center gap-2 group/item"
                >
                  <div className="w-1 h-1 rounded-full bg-blue-500 group-hover/item:scale-150 transition-all" />
                  Profil Detayları
                </button>
                
                <div className="h-px bg-white/5 my-1" />

                {/* Çıkış Yap Butonu */}
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center justify-between group/logout"
                >
                  <span>Güvenli Çıkış</span>
                  <LogOut size={14} className="group-hover/logout:translate-x-1 transition-transform" />
                </button>

              </div>
            </div>
          </div>
        ) : (
          /* Giriş Yapılmamışsa Görünecek Kısım */
          <div className="flex items-center gap-2">
            <button 
              onClick={onLogin}
              className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-blue-400 transition uppercase tracking-widest"
            >
              Giriş Yap
            </button>

            <button 
              onClick={onRegister}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] font-black transition shadow-lg shadow-blue-900/40 uppercase tracking-widest border border-blue-400/30 text-white active:scale-95"
            >
              Kayıt Ol
            </button>
          </div>
        )}
      </div>
    </header>
  );
}