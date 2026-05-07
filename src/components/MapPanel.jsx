import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Harita ikonlarını düzeltmek için (Standart Leaflet hatasıdır)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPanel({ markers = [] }) {
  return (
    <div className="relative h-[450px] w-full bg-[#0d1425] rounded-3xl border border-blue-500/20 overflow-hidden shadow-2xl z-0">
      <MapContainer 
        center={[40.1885, 29.0610]} 
        zoom={13} 
        className="h-full w-full"
        style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Gelen ihbarları haritada işaretliyoruz */}
        {markers.map((m, index) => (
          <Marker key={index} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-xs font-bold uppercase tracking-tighter">
                {m.type} Talebi: {m.category}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}