import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet ikon fix - Karargah Standartları
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Haritaya tıklandığında koordinatları yakalayan yardımcı bileşen
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export default function MapPanel({ onSelectLocation }) {
  const [signals, setSignals] = useState([]);
  const bursaMerkez = [40.1885, 29.0610];

  // Karargah Sinyal Kulesi: ihha_needs tablosundan canlı veri çekimi
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/signals');
        const data = await response.json();
        setSignals(data);
      } catch (error) {
        console.error("⚠️ Sinyal kulesi bağlantı hatası:", error);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // 30 sn'de bir tazele
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[500px] w-full bg-[#0d1425] rounded-[2.5rem] border border-blue-500/20 overflow-hidden shadow-2xl z-0">
      <MapContainer 
        center={bursaMerkez} 
        zoom={13} 
        className="h-full w-full"
        style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Tıklama Olayını Dinle */}
        <MapClickHandler onLocationSelect={onSelectLocation} />
        
        {/* ihha_needs Sinyallerini Haritaya İşle */}
        {signals.map((signal) => (
          <Marker 
            key={signal.id} 
            position={[parseFloat(signal.latitude), parseFloat(signal.longitude)]}
          >
            <Popup className="karargah-popup">
              <div className="p-2 min-w-[150px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                    {signal.category_name || "İhtiyaç"}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    signal.urgency_level === 'Kritik' || signal.urgency_level === 'Hayati' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {signal.urgency_level}
                  </span>
                </div>
                
                <p className="text-xs text-slate-700 font-medium leading-tight mb-3 italic">
                  "{signal.description}"
                </p>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                  Görevi Üstlen
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sağ Üst Canlı Durum Paneli */}
      <div className="absolute top-6 right-6 z-[1000] bg-[#0a0f1d]/80 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            AKTİF SİNYAL: {signals.length} BİRİM
          </span>
        </div>
      </div>

      {/* Sol Alt Bilgi Notu */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-blue-600/10 backdrop-blur-sm border border-blue-500/20 px-4 py-2 rounded-full">
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
          📍 İhbar için haritaya tıkla
        </span>
      </div>
    </div>
  );
}