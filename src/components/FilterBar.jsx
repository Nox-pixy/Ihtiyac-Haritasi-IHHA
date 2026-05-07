import React, { useState } from 'react';
import { 
  Filter, Box, Utensils, Stethoscope, Shirt, Home, Zap, HeartHandshake,
  Shield, User, ChevronDown, Navigation, Locate, Search
} from 'lucide-react';

export default function FilterBar() {
  // Filtre State'leri
  const [userType, setUserType] = useState('Hepsi');
  const [activeCategory, setActiveCategory] = useState('Gıda');
  const [rangeMode, setRangeMode] = useState('Çap');
  
  // Menü Açılış State'leri
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [customRadius, setCustomRadius] = useState('');

  const categories = [
    { label: 'Hepsi', icon: <Box size={16} /> },
    { label: 'Gıda', icon: <Utensils size={16} /> },
    { label: 'İlaç & Tıbbi Malzeme', icon: <Stethoscope size={16} /> },
    { label: 'Kıyafet & Tekstil', icon: <Shirt size={16} /> },
    { label: 'Eşya', icon: <Home size={16} /> },
    { label: 'Elektronik', icon: <Zap size={16} /> },
    { label: 'Gönüllü', icon: <HeartHandshake size={16} /> },
  ];

  const userTypes = [
    { label: 'Hepsi', icon: <Box size={16} /> }, 
    { label: 'Akıncılar', icon: <Shield size={16} /> }, 
    { label: 'Vatandaşlar', icon: <User size={16} /> }
  ];

  const handleEnter = (e) => {
    if (e.key === 'Enter') setIsRangeOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md relative">
      {/* Kaydırma Çubuğu Güzelleştirme (Global Stil) */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f1d; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      `}</style>

      <div className="flex items-center gap-2 text-blue-500/50 mr-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <Filter size={16} /> Filtrele:
      </div>

      {/* 1. Rol Filtresi */}
      <div className="relative min-w-[150px]">
        <button 
          onClick={() => {setIsTypeOpen(!isTypeOpen); setIsCatOpen(false); setIsRangeOpen(false);}}
          className="w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-blue-500/50"
        >
          <div className="flex items-center gap-2 italic">
            {userTypes.find(t => t.label === userType)?.icon} {userType}
          </div>
          <ChevronDown size={14} className={isTypeOpen ? 'rotate-180' : ''} />
        </button>
        {isTypeOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[1001]">
            {userTypes.map(t => (
              <button key={t.label} onClick={() => {setUserType(t.label); setIsTypeOpen(false);}} className="w-full p-3 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white text-left flex items-center gap-2 border-b border-white/5 last:border-0">{t.icon} {t.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Kategori Filtresi */}
      <div className="relative min-w-[180px]">
        <button 
          onClick={() => {setIsCatOpen(!isCatOpen); setIsTypeOpen(false); setIsRangeOpen(false);}}
          className="w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-blue-500/50"
        >
          <div className="flex items-center gap-2 text-blue-400">
            {categories.find(c => c.label === activeCategory)?.icon} {activeCategory}
          </div>
          <ChevronDown size={14} className={isCatOpen ? 'rotate-180' : ''} />
        </button>
        {isCatOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[1001]">
            {categories.map(c => (
              <button key={c.label} onClick={() => {setActiveCategory(c.label); setIsCatOpen(false);}} className="w-full p-3 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white text-left flex items-center gap-2 border-b border-white/5 last:border-0">{c.icon} {c.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Menzil & Bölge Filtresi */}
      <div className="relative min-w-[200px]">
        <button 
          onClick={() => {setIsRangeOpen(!isRangeOpen); setIsTypeOpen(false); setIsCatOpen(false);}}
          className="w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold text-green-400 hover:border-green-500/50 transition-all"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <Navigation size={16} className="rotate-45" /> {rangeMode === 'Çap' ? (customRadius ? `${customRadius} KM` : '1 KM') : 'Bursa'}
          </div>
          <ChevronDown size={14} className={isRangeOpen ? 'rotate-180' : ''} />
        </button>
        
        {isRangeOpen && (
          <div className="absolute top-full left-0 mt-2 w-[300px] bg-[#0d1425] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[1001]">
            <div className="flex p-1.5 bg-[#0a0f1d] border-b border-white/5 gap-1">
              <button onClick={() => setRangeMode('Çap')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${rangeMode === 'Çap' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Çap</button>
              <button onClick={() => setRangeMode('Bölge')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${rangeMode === 'Bölge' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Bölge</button>
            </div>
            <div className="p-3">
              <div className="relative">
                <input 
                  type={rangeMode === 'Çap' ? "number" : "text"}
                  placeholder={rangeMode === 'Çap' ? "Özel KM Giriniz..." : "Şehir veya Semt Ara..."}
                  value={rangeMode === 'Çap' ? customRadius : searchTerm}
                  onKeyDown={handleEnter}
                  onChange={(e) => rangeMode === 'Çap' ? setCustomRadius(e.target.value) : setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-white/10 p-2.5 rounded-xl text-[11px] outline-none focus:border-blue-500 font-bold pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   {rangeMode === 'Bölge' && <Search size={14} className="text-slate-500" />}
                   <Locate size={14} className="text-blue-500 cursor-pointer" onClick={() => setIsRangeOpen(false)} />
                </div>
              </div>
              
              {rangeMode === 'Bölge' && (
                <div className="mt-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {searchTerm.length > 0 ? (
                    <div className="p-2 text-[10px] text-slate-500 italic border border-white/5 rounded-lg border-dashed text-center">
                      "{searchTerm}" için sonuçlar API bağlandığında listelenecek...
                    </div>
                  ) : (
                    <div className="p-2 text-[10px] text-slate-600 text-center uppercase font-black tracking-widest opacity-50">
                      Arama Yapın
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}