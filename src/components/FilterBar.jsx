import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Box, Utensils, Stethoscope, Shirt, Home, Zap, HeartHandshake,
  Shield, User, ChevronDown, Navigation, Locate, Search, MapPin, RefreshCw, CheckCircle2, Globe
} from 'lucide-react';
import { toast } from './ToastSystem';

export default function FilterBar({ onFilterChange, userLocation }) {
  const [filters, setFilters] = useState({
    userType: 'Hepsi',
    category: 'Hepsi',
    rangeMode: 'Çap',
    radius: 1,
    location: { city: '', district: '', neighborhood: '', displayName: '' },
    center: null,
    geoJson: null 
  });
  
  const [activeMenu, setActiveMenu] = useState(null);
  const [regionQuery, setRegionQuery] = useState('');
  const [regionResults, setRegionResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [turkeyData, setTurkeyData] = useState([]); 
  const [isLoadingTurkey, setIsLoadingTurkey] = useState(true);

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

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

  useEffect(() => {
    onFilterChangeRef.current(filters);
  }, [filters]);

  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        const sortedData = data.data.sort((a,b) => a.name.localeCompare(b.name, 'tr'));
        setTurkeyData(sortedData);
        setIsLoadingTurkey(false);
      })
      .catch(err => {
        console.error("Türkiye API hatası", err);
        setIsLoadingTurkey(false);
      });
  }, []);

  const toggleMenu = (menuName) => setActiveMenu(activeMenu === menuName ? null : menuName);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (regionQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(regionQuery)}&countrycodes=tr&polygon_geojson=1&limit=5`);
          const data = await res.json();
          setRegionResults(data || []);
        } catch (error) {
          setRegionResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setRegionResults([]);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [regionQuery]);

  const handleManualSelection = async (type, value) => {
    let newLocation = { ...filters.location, [type]: value };
    if (type === 'city') newLocation = { city: value, district: '', neighborhood: '', displayName: value };
    if (type === 'district') newLocation = { ...newLocation, neighborhood: '', displayName: `${value}, ${newLocation.city}` };

    setFilters(prev => ({ ...prev, location: newLocation }));

    const searchQuery = `${newLocation.district ? newLocation.district + ',' : ''} ${newLocation.city}, Türkiye`;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=tr&polygon_geojson=1&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        processRegionData(data[0], newLocation, type === 'district');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const processRegionData = (item, locationObj = null, closeMenu = true) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const finalLocation = locationObj || {
      city: '', district: '', neighborhood: '', 
      displayName: item.display_name
    };
    setFilters(prev => ({
      ...prev,
      rangeMode: 'Bölge',
      location: finalLocation,
      center: { lat, lng },
      geoJson: item.geojson 
    }));
    if (closeMenu) {
      setRegionQuery('');
      setRegionResults([]);
      setActiveMenu(null);
    }
  };

  // ✅ Tüm Ülke seçimi
  const handleTumUlke = () => {
    setFilters(prev => ({
      ...prev,
      rangeMode: 'TümÜlke',
      radius: 999,
      center: { lat: 39.0, lng: 35.0 },
      location: { city: '', district: '', neighborhood: '', displayName: 'Tüm Türkiye' },
      geoJson: null
    }));
    setActiveMenu(null);
    toast.info('Tüm Türkiye genelinde tarama yapılıyor.');
  };

  const rangeLabel = () => {
    if (filters.rangeMode === 'TümÜlke') return '🇹🇷 Tüm Türkiye';
    if (filters.rangeMode === 'Çap') return `${filters.radius} KM Tarama`;
    return filters.location.displayName || 'Bölge Seç';
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#0d1425]/80 p-3 md:p-4 rounded-2xl border border-blue-500/10 shadow-2xl backdrop-blur-md relative z-[2000] text-left">
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }`}</style>
      
      <div className="flex items-center gap-2 text-blue-500/50 mr-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <Filter size={16} /> Filtrele:
      </div>

      {/* Kullanıcı Tipi */}
      <div className="relative w-full sm:w-auto sm:min-w-[160px]">
        <button onClick={() => toggleMenu('type')} className="w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-blue-500/50 text-white">
          <div className="flex items-center gap-2 italic">{userTypes.find(t => t.label === filters.userType)?.icon} {filters.userType}</div>
          <ChevronDown size={14} className={`shrink-0 transition-transform ${activeMenu === 'type' ? 'rotate-180' : ''}`} />
        </button>
        {activeMenu === 'type' && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[2001]">
            {userTypes.map(t => (
              <button key={t.label} onClick={() => { setFilters({...filters, userType: t.label}); setActiveMenu(null); }} className="w-full p-3 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white text-left flex items-center gap-2 border-b border-white/5">
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kategori */}
      <div className="relative w-full sm:w-auto sm:min-w-[180px]">
        <button onClick={() => toggleMenu('cat')} className="w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-blue-500/50 text-white">
          <div className="flex items-center gap-2 text-blue-400">{categories.find(c => c.label === filters.category)?.icon} {filters.category}</div>
          <ChevronDown size={14} className={`shrink-0 transition-transform ${activeMenu === 'cat' ? 'rotate-180' : ''}`} />
        </button>
        {activeMenu === 'cat' && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[2001]">
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              {categories.map(c => (
                <button key={c.label} onClick={() => { setFilters({...filters, category: c.label}); setActiveMenu(null); }} className="w-full p-3 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white text-left flex items-center gap-2 border-b border-white/5">
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bölge & Menzil */}
      <div className="relative w-full sm:w-auto sm:min-w-[280px]">
        <button
          onClick={() => toggleMenu('range')}
          className={`w-full flex items-center justify-between bg-[#0a0f1d] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            filters.rangeMode === 'TümÜlke' ? 'text-yellow-400 hover:border-yellow-500/50' : 'text-green-400 hover:border-green-500/50'
          }`}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {filters.rangeMode === 'TümÜlke' ? <Globe size={16} className="shrink-0" /> : <Navigation size={16} className="rotate-45 shrink-0" />}
            <span className="truncate">{rangeLabel()}</span>
          </div>
          <ChevronDown size={14} className={`shrink-0 transition-transform ${activeMenu === 'range' ? 'rotate-180' : ''}`} />
        </button>
        
        {activeMenu === 'range' && (
          <div className="absolute top-full left-0 mt-2 w-full sm:w-[420px] bg-[#0d1425] border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl z-[2001] p-4 space-y-4">
            
            {/* ✅ 3 mod: Çap, Bölge, Tüm Ülke */}
            <div className="flex p-1.5 bg-[#0a0f1d] border border-white/5 rounded-xl gap-1">
              <button
                onClick={() => setFilters({...filters, rangeMode: 'Çap', center: null, geoJson: null, radius: 1})}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filters.rangeMode === 'Çap' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >📍 Çap</button>
              <button
                onClick={() => setFilters({...filters, rangeMode: 'Bölge'})}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filters.rangeMode === 'Bölge' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >🗺️ Bölge</button>
              <button
                onClick={handleTumUlke}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filters.rangeMode === 'TümÜlke' ? 'bg-yellow-500 text-black' : 'text-slate-500'}`}
              >🇹🇷 Tüm Ülke</button>
            </div>

            {filters.rangeMode === 'Çap' && (
              <div className="space-y-4 bg-[#0a0f1d] p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Menzil</span>
                  <span className="text-blue-400">{filters.radius} KM</span>
                </div>
                <input type="range" min="1" max="50" value={filters.radius} onChange={(e) => setFilters({...filters, radius: parseInt(e.target.value)})} className="w-full h-1.5 bg-blue-900/50 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <button onClick={() => setActiveMenu(null)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500">Uygula</button>
              </div>
            )}

            {filters.rangeMode === 'Bölge' && (
              <div className="space-y-4">
                <div className="relative">
                  <input type="text" placeholder="İl, İlçe veya Mahalle yazın..." value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)} className="w-full bg-[#0a0f1d] border border-white/10 p-3 pl-10 rounded-xl text-xs outline-none focus:border-blue-500 text-white" />
                  <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  {isSearching && <RefreshCw className="absolute right-3 top-3.5 text-blue-500 animate-spin" size={16} />}
                </div>

                {regionResults.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar bg-[#0a0f1d] border border-white/5 rounded-xl">
                    {regionResults.map(item => (
                      <button key={item.place_id} onClick={() => processRegionData(item)} className="w-full text-left p-3 text-[11px] text-slate-300 hover:bg-blue-600 hover:text-white border-b border-white/5">
                        <MapPin size={14} className="inline mr-2 text-blue-500" /> {item.display_name}
                      </button>
                    ))}
                  </div>
                ) : regionQuery.length === 0 && (
                  <div className="space-y-2 bg-[#0a0f1d] p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center mb-2">Veya Listeden Seçin</p>
                    {isLoadingTurkey ? (
                      <RefreshCw className="mx-auto animate-spin text-slate-500" size={16} />
                    ) : !filters.location.city ? (
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {turkeyData.map(city => (
                          <button key={city.name} onClick={() => handleManualSelection('city', city.name)} className="p-2.5 text-[11px] font-bold text-slate-300 bg-white/5 hover:bg-blue-600 rounded-lg text-left truncate">{city.name}</button>
                        ))}
                      </div>
                    ) : !filters.location.district ? (
                      <div className="space-y-2">
                        <button onClick={() => setFilters({...filters, location: { city: '', district: '', neighborhood: '', displayName: '' }})} className="w-full p-2 text-[9px] font-black text-red-400 bg-red-400/10 rounded-lg uppercase">← Şehre Dön</button>
                        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {turkeyData.find(c => c.name === filters.location.city)?.districts.map(dist => (
                            <button key={dist.name} onClick={() => handleManualSelection('district', dist.name)} className="p-2 text-[11px] font-bold text-slate-300 bg-white/5 hover:bg-blue-600 rounded-lg text-left truncate">{dist.name}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center p-4">
                        <CheckCircle2 className="mx-auto text-green-500 mb-2" size={28} />
                        <p className="text-xs text-white font-bold">{filters.location.displayName}</p>
                        <button onClick={() => setFilters({...filters, location: { ...filters.location, district: '' }})} className="w-full p-2 text-[9px] font-black text-red-400 bg-red-400/10 rounded-lg uppercase mt-2">← İlçeye Dön</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Tüm Ülke seçildiğinde bilgi mesajı */}
            {filters.rangeMode === 'TümÜlke' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-center space-y-2">
                <Globe className="mx-auto text-yellow-400" size={28} />
                <p className="text-xs font-black text-yellow-400 uppercase">Tüm Türkiye Taranıyor</p>
                <p className="text-[9px] text-slate-500 font-bold">Tüm aktif sinyaller gösteriliyor</p>
                <button
                  onClick={() => setFilters({...filters, rangeMode: 'Çap', radius: 1, center: null, location: { city: '', district: '', neighborhood: '', displayName: '' }})}
                  className="w-full p-2 text-[9px] font-black text-red-400 bg-red-400/10 rounded-lg uppercase"
                >
                  Filtreyi Sıfırla
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Konum Butonu */}
      <button
        onClick={() => {
          if (userLocation) {
            toast.info("Konumunuza odaklanılıyor...");
          } else {
            toast.warning("Konum izni verilmedi.");
          }
        }}
        className="ml-auto p-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all border border-blue-500/20 group"
      >
        <Locate size={18} className="group-active:scale-90" />
      </button>
    </div>
  );
}