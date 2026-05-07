import React from 'react';
import { Shield, User, PlusCircle } from 'lucide-react';

export default function SignalList() {
  const signals = [
    { id: 1, type: 'Akıncı', cat: 'Gıda' },
    { id: 2, type: 'Vatandaş', cat: 'İlaç' }
  ];
  return (
    <div className="grid gap-3 pb-8">
      {signals.map(s => (
        <div key={s.id} className="p-4 bg-slate-800/10 border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/5 text-blue-500">
              {s.type === 'Vatandaş' ? <User size={22} /> : <Shield size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 uppercase">{s.type} Talebi: {s.cat}</h3>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Bursa, Nilüfer • T: 14:22</p>
            </div>
          </div>
          <button className="h-10 px-5 bg-[#0a0f1d] border border-white/10 rounded-xl text-[10px] font-black text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2">
            VERİYE GİT <PlusCircle size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}