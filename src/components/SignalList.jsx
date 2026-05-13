import React from 'react';
import { Shield, User, MapPin, Clock, ArrowRightCircle } from 'lucide-react';

export default function SignalList({ signals, onSignalClick }) {
  // Merkezi veriden gelen sinyalleri statüsüne göre filtrele
  const activeSignals = Array.isArray(signals) ? signals.filter(s => s.status === 'Açık') : [];

  return (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Aktif Operasyon Listesi</h3>
        <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">
          {activeSignals.length} Sinyal
        </span>
      </div>

      <div className="grid gap-3">
        {activeSignals.map(signal => {
          const isAkinci = signal.urgency_level === 'Kritik';
          return (
            <div 
              key={signal.id} 
              className={`group flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300 ${
                isAkinci 
                ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30' 
                : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-5 text-left">
                {/* Sol İkon Alanı */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isAkinci ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {isAkinci ? <Shield size={20} /> : <User size={20} />}
                </div>

                {/* Bilgi Alanı */}
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">
                    {isAkinci ? '🛡️ AKINCI TALEBİ' : '👤 VATANDAŞ TALEBİ'}: {signal.category_name || 'Genel'}
                  </h4>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className={isAkinci ? 'text-blue-500' : 'text-red-500'} /> 
                      {signal.full_name || 'Gizli Birim'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> 
                      {signal.created_at ? new Date(signal.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sağ Buton - Haritadaki Konuma Odaklanır */}
              <button 
                onClick={() => onSignalClick && onSignalClick(parseFloat(signal.latitude), parseFloat(signal.longitude))}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-tighter text-blue-400 transition-all active:scale-95 border border-white/5"
              >
                Veriye Git <ArrowRightCircle size={14} />
              </button>
            </div>
          );
        })}

        {activeSignals.length === 0 && (
          <div className="py-10 text-center bg-white/5 rounded-[2rem] border border-white/5">
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Seçili kriterlerde aktif sinyal bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}