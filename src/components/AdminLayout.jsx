import React, { useState } from 'react';
import { Shield, LayoutDashboard, Users, Radio, BarChart3, Settings, LogOut } from 'lucide-react';

export default function AdminLayout({ children, user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-[#050810] text-slate-200">
      {/* Sol Sidebar */}
      <aside className="w-64 bg-[#0a0f1d] border-r border-white/5 flex flex-col">
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <Shield className="text-red-500" size={24} />
          <h1 className="font-black uppercase tracking-tighter text-red-50">İHHA Karargah</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest transition-all">
            <Radio size={18} /> Sinyal Denetimi
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest transition-all">
            <Users size={18} /> Kullanıcı Onayı
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest transition-all">
            <BarChart3 size={18} /> İstatistikler
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-3 px-2">
             <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
               {user?.full_name?.charAt(0)}
             </div>
             <div className="text-[10px] font-bold uppercase truncate">{user?.full_name}</div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-all">
             <LogOut size={18} /> Çıkış Yap
           </button>
        </div>
      </aside>

      {/* Sağ Ana İçerik */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}