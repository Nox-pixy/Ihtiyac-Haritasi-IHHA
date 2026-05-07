import React from 'react';
import { X, MapPin, AlertCircle, Send } from 'lucide-react';

export default function IhbarModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Arka Plan Karartma */}
      <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal İçeriği */}
      <div className="relative w-full max-w-lg bg-[#0d1425] border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white transition">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-red-100">Acil İhbar Formu</h2>
        </div>

        <div className="space-y-5">
          {/* Konum Alanı */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Olay Mahalli</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Adres veya Konum Bilgisi..." 
                className="w-full bg-[#0a0f1d] border border-white/5 p-4 rounded-xl outline-none focus:border-red-500 transition font-bold text-sm pl-12" 
              />
              <MapPin className="absolute left-4 top-4 text-slate-600" size={20} />
            </div>
          </div>

          {/* İhbar Detayı */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">İhbar Detayı</label>
            <textarea 
              rows="4" 
              placeholder="Durumu kısaca açıklayınız (Örn: Gıda ihtiyacı, yol kapanması vb.)"
              className="w-full bg-[#0a0f1d] border border-white/5 p-4 rounded-xl outline-none focus:border-red-500 transition font-bold text-sm resize-none"
            ></textarea>
          </div>

          {/* Gönder Butonu */}
          <button className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition shadow-lg shadow-red-900/40 mt-2 flex items-center justify-center gap-3 text-white">
            İhbarı Merkeze İlet <Send size={16} />
          </button>
          
          <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-tighter">
            * Yanıltıcı ihbarlar sistemden uzaklaştırılmanıza sebep olabilir.
          </p>
        </div>
      </div>
    </div>
  );
}