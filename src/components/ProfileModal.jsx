import React from 'react';
import { X, Award, Shield, CheckCircle, LogOut } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onLogout }) {
  if (!isOpen || !user) return null;

  const isAkinci = user.status === 'Onaylı';

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0d1425] border border-blue-500/30 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white"><X size={24} /></button>

        <div className="text-center mb-8">
          <div className={`w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center ${isAkinci ? 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]' : 'bg-slate-800'}`}>
            <Award size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase">{user.full_name}</h2>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            {isAkinci ? 'Saha Operatörü (Akıncı)' : 'Kayıtlı Vatandaş'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Akıncı XP</p>
            <p className="text-xl font-bold text-white">{user.akinci_xp || 0}</p>
          </div>
          <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Güven Skoru</p>
            <p className="text-xl font-bold text-green-400">%{user.trust_score || 100}</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border mb-8 ${isAkinci ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
          <div className="flex items-center gap-3">
             <Shield className={isAkinci ? 'text-green-400' : 'text-yellow-400'} size={20} />
             <div>
               <p className="text-xs font-bold text-white">Adli Sicil Durumu</p>
               <p className="text-[10px] text-slate-400 uppercase">{user.status || 'İnceleniyor'}</p>
             </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Karargah Bağlantısını Kes
        </button>
      </div>
    </div>
  );
}