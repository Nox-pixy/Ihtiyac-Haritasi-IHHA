import React, { useState } from 'react';
import { MapPin, Send, Navigation, AlertTriangle } from 'lucide-react';

export default function OperationPanel({ currentUser, selectedLocation, onIhbarSubmit }) {
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('1'); // Varsayılan Gıda
  const [urgency, setUrgency] = useState('Normal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) return alert("Lütfen haritadan bir nokta seçin!");
    
    onIhbarSubmit({
      category_id: category,
      description: desc,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      urgency_level: urgency,
      is_for_self: true
    });
  };

  return (
    <div className="bg-[#0d1425] border border-blue-500/20 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
          <Navigation size={20} />
        </div>
        <h3 className="font-black uppercase tracking-tighter text-blue-100">Sinyal Operasyon Paneli</h3>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Kategori Seçimi */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Yardım Türü</label>
          <select 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none text-xs font-bold text-blue-100 focus:border-blue-500 transition"
          >
            <option value="1">Gıda Yardımı</option>
            <option value="2">Kıyafet / Barınma</option>
            <option value="3">Lojistik Destek</option>
            <option value="4">Tıbbi Yardım</option>
          </select>
        </div>

        {/* Açıklama */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Durum Özeti</label>
          <input 
            type="text" 
            placeholder="İhtiyacı kısaca belirtin..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none text-xs font-bold text-blue-100 focus:border-blue-500 transition"
          />
        </div>

        {/* Buton ve Konum Bilgisi */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {selectedLocation ? '📍 Konum Seçildi' : '❌ Konum Bekleniyor'}
            </span>
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
          >
            <Send size={14} /> Sinyal Gönder
          </button>
        </div>
      </form>

      <div className="mt-4 flex items-center gap-2 px-1">
        <AlertTriangle size={12} className="text-yellow-500" />
        <p className="text-[9px] text-slate-400 font-medium">
          Haritaya tıkladığınızda koordinatlar otomatik eşleşir. Manuel adres desteği yakında eklenecektir.
        </p>
      </div>
    </div>
  );
}