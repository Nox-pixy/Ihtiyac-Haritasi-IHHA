import React, { useState } from 'react';
import { Send, Navigation, AlertTriangle, Layers, Activity, Search, MapPin } from 'lucide-react';

export default function OperationPanel({ currentUser, selectedLocation, onIhbarSubmit, onLocationSelect }) {
  const [desc, setDesc] = useState('');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Karargah Standart Kategorileri: Tam Liste
  const staticCategories = [
    { id: 1, name: 'Gıda' },
    { id: 2, name: 'İlaç & Tıbbi Malzeme' },
    { id: 3, name: 'Kıyafet & Tekstil' },
    { id: 4, name: 'Eşya' },
    { id: 5, name: 'Elektronik' },
    { id: 6, name: 'Gönüllü' }
  ];

  const [selectedCat, setSelectedCat] = useState(1);
  const [opMode, setOpMode] = useState('Vatandaş');

  // Adres Arama Fonksiyonu (OSM Nominatim)
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!address) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        onLocationSelect(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        alert("Karargah Kaydı Bulunamadı: Adresi kontrol edin.");
      }
    } catch (error) {
      console.error("GPS Arama Hatası:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Sinyal Gönderim Fonksiyonu (Senkronize ve Güvenli Protokol)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) return alert("Hata: Koordinat kilitlenmedi! Haritadan seçin veya adres arayın.");
    
    // BACKEND İLE TAM UYUMLU PAYLOAD
    const payload = {
      category_id: parseInt(selectedCat),
      description: desc,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      urgency_level: opMode === 'Akıncı' ? 'Kritik' : 'Normal',
      status: 'Beklemede', // Admin onayı gerektiren statü
      is_for_self: true,
      beneficiary_note: '' // <-- SQL hatasını çözen eksik alan
    };

    // App.jsx'teki fonksiyonun sunucu ile anlaşıp sonuç dönmesini bekle
    const isSuccess = await onIhbarSubmit(payload);
    
    // İşlem SADECE başarılıysa formu ve adres satırını temizle
    if (isSuccess) {
      setDesc('');
      setAddress('');
    }
  };

  return (
    <div className="bg-[#0d1425] border border-blue-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
      
      {/* Üst Panel: Durum Göstergeleri */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-inner">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-blue-50">Sinyal Operasyon Merkezi</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Activity size={10} className="text-blue-500 animate-pulse" /> 
              Statü: {opMode === 'Akıncı' ? 'Saha Personeli' : 'Vatandaş Erişimi'}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black tracking-widest transition-all duration-500 ${selectedLocation ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <MapPin size={14} className={selectedLocation ? 'animate-bounce' : ''} />
          {selectedLocation ? `GPS KİLİTLENDİ: ${selectedLocation.lat.toFixed(3)}` : 'KONUM BEKLENİYOR'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* BÖLÜM 1: Adres Arama */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Yazılı Adres Girişi</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Şehir, sokak veya bina adı giriniz..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/10 p-4 rounded-2xl outline-none text-xs font-bold text-white focus:border-blue-500 transition-all pl-12 shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            </div>
            <button 
              type="button"
              onClick={handleAddressSearch}
              className="bg-[#1a2235] hover:bg-slate-700 px-8 rounded-2xl text-[10px] font-black uppercase text-white transition-all border border-white/5 shadow-xl"
            >
              {isSearching ? '...' : 'Konum Bul'}
            </button>
          </div>
        </div>

        {/* BÖLÜM 2: Sinyal Formu */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Yardım Türü</label>
            <select 
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-white/10 p-4 rounded-2xl outline-none text-xs font-bold text-white focus:border-blue-500 shadow-inner appearance-none cursor-pointer"
            >
              {staticCategories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0d1425]">{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Operasyon Modu</label>
            <select 
              value={opMode}
              onChange={(e) => setOpMode(e.target.value)}
              className={`w-full bg-[#0a0f1d] border border-white/10 p-4 rounded-2xl outline-none text-xs font-bold appearance-none cursor-pointer transition-colors ${
                opMode === 'Akıncı' ? 'text-blue-400' : 'text-green-400'
              }`}
            >
              <option value="Vatandaş">Vatandaş</option>
              <option value="Akıncı">Akıncı</option>
            </select>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">İhtiyaç Notu</label>
            <input 
              type="text" 
              placeholder="Adminin görmesi için kısa bir not ekleyin..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-white/10 p-4 rounded-2xl outline-none text-xs font-bold text-white focus:border-blue-500 shadow-inner placeholder:text-slate-700"
            />
          </div>

          <div className="lg:col-span-2">
            <button 
              type="submit"
              disabled={!selectedLocation}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
                selectedLocation 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Send size={16} /> Gönder
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-600/80" />
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
            Tüm sinyaller güvenlik amacıyla <span className="text-blue-400 font-black">Admin Denetimi</span>'nden geçmektedir.
          </p>
        </div>
        <span className="text-[9px] font-mono text-blue-500/30 uppercase tracking-[0.3em]">
          Karargah Bağlantısı: Stabil
        </span>
      </div>
    </div>
  );
}