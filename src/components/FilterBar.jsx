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
  rangeMode: 'TümÜlke',   // ← değişti
  radius: 999,              // ← değişti
  location: { city: '', district: '', neighborhood: '', displayName: 'Tüm Türkiye' },
  center: { lat: 39.0, lng: 35.0 },
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
    { label: 'Hepsi', icon: <Box size={15} /> },
    { label: 'Gıda', icon: <Utensils size={15} /> },
    { label: 'İlaç & Tıbbi Malzeme', icon: <Stethoscope size={15} /> },
    { label: 'Kıyafet & Tekstil', icon: <Shirt size={15} /> },
    { label: 'Eşya', icon: <Home size={15} /> },
    { label: 'Elektronik', icon: <Zap size={15} /> },
    { label: 'Gönüllü', icon: <HeartHandshake size={15} /> },
  ];

  const userTypes = [
    { label: 'Hepsi', icon: <Box size={15} /> },
    { label: 'Akıncılar', icon: <Shield size={15} /> },
    { label: 'Vatandaşlar', icon: <User size={15} /> }
  ];

  useEffect(() => { onFilterChangeRef.current(filters); }, [filters]);

  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        setTurkeyData(data.data.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
        setIsLoadingTurkey(false);
      })
      .catch(() => setIsLoadingTurkey(false));
  }, []);

  const toggleMenu = (menuName) => setActiveMenu(activeMenu === menuName ? null : menuName);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (regionQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(regionQuery)}&countrycodes=tr&polygon_geojson=1&limit=5`);
          setRegionResults(await res.json() || []);
        } catch { setRegionResults([]); }
        finally { setIsSearching(false); }
      } else { setRegionResults([]); }
    }, 600);
    return () => clearTimeout(t);
  }, [regionQuery]);

  const handleManualSelection = async (type, value) => {
    let newLocation = { ...filters.location, [type]: value };
    if (type === 'city') newLocation = { city: value, district: '', neighborhood: '', displayName: value };
    if (type === 'district') newLocation = { ...newLocation, neighborhood: '', displayName: `${value}, ${newLocation.city}` };
    setFilters(prev => ({ ...prev, location: newLocation }));
    setIsSearching(true);
    try {
      const q = `${newLocation.district ? newLocation.district + ',' : ''} ${newLocation.city}, Türkiye`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=tr&polygon_geojson=1&limit=1`);
      const data = await res.json();
      if (data?.length > 0) processRegionData(data[0], newLocation, type === 'district');
    } catch { /* sessiz */ }
    finally { setIsSearching(false); }
  };

  const processRegionData = (item, locationObj = null, closeMenu = true) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const finalLocation = locationObj || { city: '', district: '', neighborhood: '', displayName: item.display_name };
    setFilters(prev => ({ ...prev, rangeMode: 'Bölge', location: finalLocation, center: { lat, lng }, geoJson: item.geojson }));
    if (closeMenu) { setRegionQuery(''); setRegionResults([]); setActiveMenu(null); }
  };

  const handleTumUlke = () => {
    setFilters(prev => ({
      ...prev, rangeMode: 'TümÜlke', radius: 999,
      center: { lat: 39.0, lng: 35.0 },
      location: { city: '', district: '', neighborhood: '', displayName: 'Tüm Türkiye' },
      geoJson: null
    }));
    setActiveMenu(null);
    toast.info('Tüm Türkiye genelinde tarama yapılıyor.');
  };

  const rangeLabel = () => {
    if (filters.rangeMode === 'TümÜlke') return '🇹🇷 Tüm Türkiye';
    if (filters.rangeMode === 'Çap') return `${filters.radius} km tarama`;
    return filters.location.displayName || 'Bölge Seç';
  };

  // Ortak dropdown buton stili
  const dropdownBtnClass = "w-full flex items-center justify-between bg-white border border-[#ddd8d0] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 shadow-sm";
  const dropdownMenuClass = "absolute top-full left-0 right-0 mt-2 bg-white border border-[#ddd8d0] rounded-2xl overflow-hidden shadow-xl z-[2001]";
  const dropdownItemClass = "w-full p-3 text-xs font-semibold text-slate-600 hover:bg-blue-500 hover:text-white text-left flex items-center gap-2 border-b border-[#f1ece6] last:border-0 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 md:p-4 rounded-2xl border border-[#ddd8d0] shadow-sm relative z-[2000] text-left">

      {/* Başlık */}
      <div className="flex items-center gap-2 text-slate-400 mr-1 text-[10px] font-black uppercase tracking-[0.2em] shrink-0">
        <Filter size={14} className="text-blue-400" /> Filtrele:
      </div>

      {/* Kullanıcı Tipi */}
      <div className="relative w-full sm:w-auto sm:min-w-[150px]">
        <button onClick={() => toggleMenu('type')} className={dropdownBtnClass}>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-blue-400">{userTypes.find(t => t.label === filters.userType)?.icon}</span>
            {filters.userType}
          </div>
          <ChevronDown size={13} className={`shrink-0 text-slate-400 transition-transform ${activeMenu === 'type' ? 'rotate-180' : ''}`} />
        </button>
        {activeMenu === 'type' && (
          <div className={dropdownMenuClass}>
            {userTypes.map(t => (
              <button key={t.label} onClick={() => { setFilters({ ...filters, userType: t.label }); setActiveMenu(null); }} className={dropdownItemClass}>
                <span className="text-blue-400">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kategori */}
      <div className="relative w-full sm:w-auto sm:min-w-[170px]">
        <button onClick={() => toggleMenu('cat')} className={dropdownBtnClass}>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{categories.find(c => c.label === filters.category)?.icon}</span>
            <span className="truncate">{filters.category}</span>
          </div>
          <ChevronDown size={13} className={`shrink-0 text-slate-400 transition-transform ${activeMenu === 'cat' ? 'rotate-180' : ''}`} />
        </button>
        {activeMenu === 'cat' && (
          <div className={dropdownMenuClass}>
            <div className="max-h-[260px] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#ddd8d0 transparent'}}>
              {categories.map(c => (
                <button key={c.label} onClick={() => { setFilters({ ...filters, category: c.label }); setActiveMenu(null); }} className={dropdownItemClass}>
                  <span className="text-blue-400">{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bölge & Menzil */}
      <div className="relative w-full sm:w-auto sm:min-w-[240px]">
        <button
          onClick={() => toggleMenu('range')}
          className={`${dropdownBtnClass} ${
            filters.rangeMode === 'TümÜlke'
              ? '!border-amber-300 !bg-amber-50 !text-amber-700 hover:!border-amber-400'
              : '!text-green-700 !border-green-200 !bg-green-50/50 hover:!border-green-400'
          }`}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {filters.rangeMode === 'TümÜlke'
              ? <Globe size={14} className="shrink-0 text-amber-500" />
              : <Navigation size={14} className="rotate-45 shrink-0 text-green-500" />
            }
            <span className="truncate text-xs font-semibold">{rangeLabel()}</span>
          </div>
          <ChevronDown size={13} className={`shrink-0 text-slate-400 transition-transform ${activeMenu === 'range' ? 'rotate-180' : ''}`} />
        </button>

        {activeMenu === 'range' && (
          <div className="absolute top-full left-0 mt-2 w-full sm:w-[400px] bg-white border border-[#ddd8d0] rounded-2xl shadow-xl z-[2001] p-4 space-y-4">

            {/* Mod seçici */}
            <div className="flex p-1 bg-slate-100 border border-[#ece8e2] rounded-xl gap-1">
              <button
                onClick={() => setFilters({ ...filters, rangeMode: 'Çap', center: null, geoJson: null, radius: 1 })}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filters.rangeMode === 'Çap' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >📍 Çap</button>
              <button
                onClick={() => setFilters({ ...filters, rangeMode: 'Bölge' })}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filters.rangeMode === 'Bölge' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >🗺️ Bölge</button>
              <button
                onClick={handleTumUlke}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filters.rangeMode === 'TümÜlke' ? 'bg-amber-400 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >🇹🇷 Ülke</button>
            </div>

            {/* Çap modu */}
            {filters.rangeMode === 'Çap' && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-[#ece8e2]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Menzil</span>
                  <span className="text-sm font-black text-blue-500">{filters.radius} km</span>
                </div>
                <input
                  type="range" min="1" max="50" value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>1 km</span><span>25 km</span><span>50 km</span>
                </div>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition shadow-sm"
                >
                  Uygula
                </button>
              </div>
            )}

            {/* Bölge modu */}
            {filters.rangeMode === 'Bölge' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text" placeholder="İl, ilçe veya mahalle..."
                    value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)}
                    className="w-full bg-white border border-[#ddd8d0] p-3 pl-9 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400"
                  />
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={14} />
                  {isSearching && <RefreshCw className="absolute right-3 top-3.5 text-blue-400 animate-spin" size={14} />}
                </div>

                {regionResults.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto border border-[#ece8e2] rounded-xl overflow-hidden" style={{scrollbarWidth:'thin',scrollbarColor:'#ddd8d0 transparent'}}>
                    {regionResults.map(item => (
                      <button
                        key={item.place_id}
                        onClick={() => processRegionData(item)}
                        className="w-full text-left p-3 text-[11px] text-slate-600 hover:bg-blue-500 hover:text-white border-b border-[#f1ece6] last:border-0 flex items-start gap-2 transition-colors"
                      >
                        <MapPin size={12} className="shrink-0 mt-0.5 text-blue-400" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                ) : regionQuery.length === 0 && (
                  <div className="bg-slate-50 border border-[#ece8e2] rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center mb-3">Listeden Seçin</p>
                    {isLoadingTurkey ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="animate-spin text-blue-400" size={18} />
                      </div>
                    ) : !filters.location.city ? (
                      <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#ddd8d0 transparent'}}>
                        {turkeyData.map(city => (
                          <button
                            key={city.name}
                            onClick={() => handleManualSelection('city', city.name)}
                            className="p-2.5 text-[11px] font-semibold text-slate-600 bg-white hover:bg-blue-500 hover:text-white rounded-xl text-left truncate border border-[#ece8e2] transition-colors shadow-sm"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    ) : !filters.location.district ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => setFilters({ ...filters, location: { city: '', district: '', neighborhood: '', displayName: '' } })}
                          className="w-full p-2 text-[9px] font-black text-red-400 bg-red-50 rounded-xl uppercase border border-red-100 hover:bg-red-100 transition"
                        >
                          ← Şehre Dön
                        </button>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#ddd8d0 transparent'}}>
                          {turkeyData.find(c => c.name === filters.location.city)?.districts.map(dist => (
                            <button
                              key={dist.name}
                              onClick={() => handleManualSelection('district', dist.name)}
                              className="p-2.5 text-[11px] font-semibold text-slate-600 bg-white hover:bg-blue-500 hover:text-white rounded-xl text-left truncate border border-[#ece8e2] transition-colors shadow-sm"
                            >
                              {dist.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-3">
                        <CheckCircle2 className="mx-auto text-green-500" size={28} />
                        <p className="text-sm font-bold text-slate-700">{filters.location.displayName}</p>
                        <button
                          onClick={() => setFilters({ ...filters, location: { ...filters.location, district: '' } })}
                          className="w-full p-2 text-[9px] font-black text-red-400 bg-red-50 rounded-xl uppercase border border-red-100 hover:bg-red-100 transition"
                        >
                          ← İlçeye Dön
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tüm Ülke */}
            {filters.rangeMode === 'TümÜlke' && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl text-center space-y-3">
                <Globe className="mx-auto text-amber-400" size={32} />
                <p className="text-sm font-black text-amber-600 uppercase tracking-wide">Tüm Türkiye Taranıyor</p>
                <p className="text-[10px] text-slate-400 font-semibold">Tüm aktif sinyaller gösteriliyor</p>
                <button
                  onClick={() => setFilters({ ...filters, rangeMode: 'Çap', radius: 1, center: null, location: { city: '', district: '', neighborhood: '', displayName: '' } })}
                  className="w-full p-2.5 text-[10px] font-black text-red-400 bg-red-50 rounded-xl uppercase border border-red-100 hover:bg-red-100 transition"
                >
                  Filtreyi Sıfırla
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Konum butonu */}
      <button
        onClick={() => {
          if (userLocation) { toast.info('Konumunuza odaklanılıyor...'); }
          else { toast.warning('Konum izni verilmedi.'); }
        }}
        className="ml-auto p-2.5 bg-blue-100 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all border border-blue-200 shadow-sm active:scale-95"
        title="Konumuma Git"
      >
        <Locate size={16} />
      </button>
    </div>
  );
}