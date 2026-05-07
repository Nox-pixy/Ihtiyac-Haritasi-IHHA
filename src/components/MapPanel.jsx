import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPanel() {
  return (
    <div className="relative h-[400px] w-full bg-[#0d1425] rounded-3xl border border-blue-500/20 overflow-hidden shadow-2xl z-0">
      <MapContainer center={[40.1885, 29.0610]} zoom={12} style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    </div>
  );
}