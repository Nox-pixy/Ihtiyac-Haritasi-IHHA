import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🎨 ÖZEL İKON TANIMLAMALARI
const akinciIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const vatandasIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hedefIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 🛰️ HARİTA HAREKET YÖNETİCİSİ
function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 14, { animate: true, duration: 1.5 });
    }
  }, [target, map]);
  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export default function MapPanel({ onSelectLocation, externalLocation, filters, signals, currentUser, onStartChat, onAssignTask }) {
  const bursaMerkez = [40.1885, 29.0610];

  // Filtreleme: Statüsü 'Açık' olanları göster
  const activeSignals = Array.isArray(signals) ? signals.filter(s => s.status === 'Açık' || s.status === 'Beklemede') : [];

  return (
    <div className="relative h-[600px] w-full bg-[#0d1425] rounded-[2.5rem] border border-blue-500/20 overflow-hidden shadow-2xl z-0 text-left">
      <MapContainer 
        center={bursaMerkez} 
        zoom={13} 
        className="h-full w-full"
        style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        <FlyToLocation target={externalLocation || filters?.center} />
        <MapClickHandler onLocationSelect={onSelectLocation} />
        
        {/* Bölge Sınırları */}
        {filters?.geoJson && (
          <GeoJSON 
            key={JSON.stringify(filters.geoJson)} 
            data={filters.geoJson} 
            style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.15 }} 
          />
        )}

        {/* Tarama Çapı */}
        {filters?.rangeMode === 'Çap' && externalLocation?.lat && (
          <Circle
            center={[externalLocation.lat, externalLocation.lng]}
            radius={filters.radius * 1000}
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', weight: 2, dashArray: '10, 10' }}
          />
        )}

        {/* Seçili Konum */}
        {externalLocation && externalLocation.lat && (
          <Marker position={[externalLocation.lat, externalLocation.lng]} icon={hedefIcon}>
            <Popup className="karargah-popup">
              <div className="p-1 font-bold text-blue-600">Hedef Tarama Merkezi</div>
            </Popup>
          </Marker>
        )}

        {/* SİNYAL PİNLERİ */}
        {activeSignals.map((signal) => (
          <Marker 
            key={signal.id} 
            position={[parseFloat(signal.latitude), parseFloat(signal.longitude)]}
            icon={signal.urgency_level === 'Kritik' ? akinciIcon : vatandasIcon}
          >
            <Popup className="karargah-popup">
              <div className="p-3 min-w-[220px] bg-[#0d1425] text-white text-left">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black uppercase text-blue-400">
                    {signal.category_name || "Genel"}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    signal.urgency_level === 'Kritik' 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' 
                    : 'bg-red-500/20 text-red-400 border-red-500/20'
                  }`}>
                    {signal.urgency_level === 'Kritik' ? '🛡️ AKINCI' : '👤 VATANDAŞ'}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Gönderen: <span className="text-white">{signal.full_name}</span></p>
                  <p className="text-xs text-slate-200 italic bg-white/5 p-2 rounded">
                    "{signal.description}"
                  </p>
                  {signal.assigned_to && (
                    <p className="text-[8px] text-green-400 font-bold mt-2 uppercase tracking-tighter">
                      ⚡ Birim tarafından üstlenildi
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => onStartChat && onStartChat(signal)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all"
                  >
                    💬 İletişime Geç
                  </button>
                  
                  {currentUser && !signal.assigned_to && (
                    <button 
                      onClick={() => onAssignTask && onAssignTask(signal.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-all shadow-lg shadow-blue-900/40"
                    >
                      ⚡ Görevi Üstlen
                    </button>
                  )}

                  {signal.assigned_to === currentUser?.id && (
                    <div className="w-full bg-white/5 text-green-500 text-[9px] font-black uppercase py-2 rounded-xl text-center border border-green-500/20">
                      ✅ Görev Sende
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-6 right-6 z-[1000] bg-[#0a0f1d]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {activeSignals.length} AKTİF SİNYAL
          </span>
        </div>
      </div>
    </div>
  );
}