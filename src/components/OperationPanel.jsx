import React, { useState } from 'react';
import { Send, AlertTriangle, Layers, Activity, Search, MapPin, CheckCircle2 } from 'lucide-react';

export default function OperationPanel({ currentUser, selectedLocation, onIhbarSubmit, onLocationSelect }) {
  const [desc, setDesc] = useState('');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCat, setSelectedCat] = useState(1);
  const [opMode, setOpMode] = useState('Vatandaş');
  // ✅ Çözümlenen kısa adres — beneficiary_note'a yazılacak
  const [resolvedAddress, setResolvedAddress] = useState('');

  const staticCategories = [
    { id: 1, name: 'Gıda' },
    { id: 2, name: 'İlaç & Tıbbi Malzeme' },
    { id: 3, name: 'Kıyafet & Tekstil' },
    { id: 4, name: 'Eşya' },
    { id: 5, name: 'Elektronik' },
    { id: 6, name: 'Gönüllü' }
  ];

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!address) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=tr`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        onLocationSelect(parseFloat(data[0].lat), parseFloat(data[0].lon));
        // ✅ display_name'den ilk 3 parçayı al — "Kadıköy, İstanbul, Türkiye" gibi
        const parts = data[0].display_name.split(',');
        const short = parts.slice(0, 3).map(p => p.trim()).join(', ');
        setResolvedAddress(short);
      } else {
        alert('Adres bulunamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('GPS Arama Hatası:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) return alert('Haritadan konum seçin veya adres arayın.');
    const payload = {
      category_id: parseInt(selectedCat),
      description: desc,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      urgency_level: opMode === 'Akıncı' ? 'Kritik' : 'Normal',
      status: 'Beklemede',
      is_for_self: true,
      // ✅ Çözümlenen adres varsa onu, yoksa kullanıcının yazdığı adresi kullan
      beneficiary_note: resolvedAddress || address || ''
    };
    const isSuccess = await onIhbarSubmit(payload);
    if (isSuccess) {
      setDesc('');
      setAddress('');
      setResolvedAddress('');
    }
  };

  const inputClass = "w-full bg-white border border-[#ddd8d0] p-3.5 rounded-xl outline-none text-xs font-semibold text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400 shadow-sm";
  const labelClass = "text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest";

  return (
    <div className="bg-white border border-[#ddd8d0] rounded-3xl p-7 shadow-md relative overflow-hidden animate-in zoom-in-95 duration-300">

      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-3xl pointer-events-none" />

      {/* Üst Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-7 pb-6 border-b border-[#ece8e2]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-500 border border-blue-200 shadow-sm">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800">Sinyal Operasyon Merkezi</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <Activity size={9} className="text-blue-400 animate-pulse" />
              Statü: {opMode === 'Akıncı' ? 'Saha Personeli' : 'Vatandaş Erişimi'}
            </p>
          </div>
        </div>

        {/* GPS Durum */}
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-[10px] font-black tracking-wide transition-all duration-500 ${
          selectedLocation
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-amber-50 border-amber-200 text-amber-600'
        }`}>
          {selectedLocation
            ? <CheckCircle2 size={13} className="shrink-0" />
            : <MapPin size={13} className="shrink-0 animate-bounce" />
          }
          {selectedLocation
            ? `📍 GPS Kilitlendi: ${selectedLocation.lat.toFixed(3)}, ${selectedLocation.lng.toFixed(3)}`
            : 'Haritadan konum seçin'
          }
        </div>
      </div>

      <div className="space-y-6 relative">

        {/* Adres Arama */}
        <div className="space-y-2">
          <label className={labelClass}>Yazılı Adres Girişi</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Şehir, ilçe, sokak veya bina adı..."
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  // ✅ Adres değişince çözümlenen adresi sıfırla
                  if (resolvedAddress) setResolvedAddress('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e)}
                className={`${inputClass} pl-10`}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            </div>
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={isSearching || !address}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-6 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:text-slate-800 transition-all border border-[#ddd8d0] shadow-sm whitespace-nowrap"
            >
              {isSearching ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Aranıyor
                </span>
              ) : 'Konum Bul'}
            </button>
          </div>

          {/* ✅ Çözümlenen adres göster */}
          {resolvedAddress ? (
            <p className="text-[10px] text-green-600 font-bold ml-1 flex items-center gap-1">
              <CheckCircle2 size={11} /> {resolvedAddress}
            </p>
          ) : (
            <p className="text-[9px] text-slate-400 font-semibold ml-1">
              veya haritaya tıklayarak konum seçin
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

          {/* Yardım Türü */}
          <div className="lg:col-span-3 space-y-2">
            <label className={labelClass}>Yardım Türü</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none`}
              style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center'}}
            >
              {staticCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Operasyon Modu */}
          <div className="lg:col-span-2 space-y-2">
            <label className={labelClass}>Mod</label>
            <select
              value={opMode}
              onChange={(e) => setOpMode(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none font-bold ${
                opMode === 'Akıncı' ? '!text-blue-600' : '!text-green-600'
              }`}
              style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center'}}
            >
              <option value="Vatandaş">Vatandaş</option>
              <option value="Akıncı">Akıncı</option>
            </select>
          </div>

          {/* İhtiyaç Notu */}
          <div className="lg:col-span-5 space-y-2">
            <label className={labelClass}>İhtiyaç Notu</label>
            <input
              type="text"
              placeholder="Adminin görmesi için kısa bir not ekleyin..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Gönder */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={!selectedLocation}
              className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                selectedLocation
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-[#ddd8d0]'
              }`}
            >
              <Send size={14} />
              Gönder
            </button>
          </div>
        </form>
      </div>

      {/* Alt Footer */}
      <div className="mt-6 pt-5 border-t border-[#ece8e2] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">
            Tüm sinyaller güvenlik amacıyla{' '}
            <span className="text-blue-500 font-black">Admin Denetimi</span>'nden geçmektedir.
          </p>
        </div>
        <span className="text-[9px] font-mono text-slate-300 uppercase tracking-[0.2em]">
          Karargah Bağlantısı: Stabil
        </span>
      </div>
    </div>
  );
}