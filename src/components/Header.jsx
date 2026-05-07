import React from 'react';
import { Radar, AlertTriangle } from 'lucide-react';

export default function Header({ onLogin, onRegister, onIhbar }) {
  return (
    <header className="p-4 flex justify-between items-center border-b border-blue-500/10 backdrop-blur-xl sticky top-0 z-[2000] bg-[#0a0f1d]/80">
      {/* Sol Kısım: Logo ve Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Radar className="text-blue-500 animate-pulse" size={24} />
        </div>
        <h1 className="text-lg font-bold tracking-tighter uppercase leading-none text-blue-100">
          İHHA Karargah
        </h1>
      </div>
      
      {/* Sağ Kısım: İşlem Butonları */}
      <div className="flex items-center gap-2">
        {/* İhbar Butonu - Kırmızı Alarm Teması */}
        <button 
          onClick={onIhbar}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg font-bold text-xs transition-all uppercase shadow-lg shadow-red-900/20 active:scale-95"
        >
          <AlertTriangle size={18} /> İhbar
        </button>

        <div className="h-8 w-px bg-white/5 mx-2" />

        {/* Giriş Yap - Sade Tema */}
        <button 
          onClick={onLogin}
          className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-blue-400 transition uppercase tracking-widest"
        >
          Giriş Yap
        </button>

        {/* Kayıt Ol - Mavi Operasyon Teması */}
        <button 
          onClick={onRegister}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] font-black transition shadow-lg shadow-blue-900/40 uppercase tracking-widest border border-blue-400/30 text-white active:scale-95"
        >
          Kayıt Ol
        </button>
      </div>
    </header>
  );
}