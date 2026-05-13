import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { toast } from './ToastSystem';

const TURKEY_BOUNDS = { minLat: 35.8, maxLat: 42.1, minLng: 25.6, maxLng: 44.8 };

const isInTurkey = (lat, lng) => (
  lat >= TURKEY_BOUNDS.minLat && lat <= TURKEY_BOUNDS.maxLat &&
  lng >= TURKEY_BOUNDS.minLng && lng <= TURKEY_BOUNDS.maxLng
);

const akinciIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const vatandasIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const hedefIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const tamamlandiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// ✅ Kendi pini için mor ikon
const kendiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const createDisasterIcon = () => L.divIcon({
  html: `<div style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,0.15);border:3px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(239,68,68,0.5)">⚠</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20], className: ''
});

function FlyToLocation({ target }) {
  const map = useMap();
  const flewRef = useRef(false);
  useEffect(() => {
    if (target && target.lat && target.lng) {
      const zoom = flewRef.current ? 14 : 7;
      map.flyTo([target.lat, target.lng], zoom, { animate: true, duration: 1.5 });
      flewRef.current = true;
    }
  }, [target, map]);
  return null;
}

function MapClickHandler({ onLocationSelect, isOpMode }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!isOpMode) return;
      if (!isInTurkey(lat, lng)) {
        toast.error('Yalnızca Türkiye sınırları içine sinyal eklenebilir!');
        return;
      }
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

function DisasterLayer({ zones }) {
  const map = useMap();
  const layerRef = useRef(null);
  useEffect(() => {
    if (!map || !zones) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    const group = L.layerGroup();
    zones.forEach(zone => {
      const circle = L.circle([parseFloat(zone.latitude), parseFloat(zone.longitude)], {
        radius: zone.radius * 1000, color: '#ef4444', fillColor: '#ef4444',
        fillOpacity: 0.12, weight: 2.5, dashArray: '8, 6'
      });
      const marker = L.marker([parseFloat(zone.latitude), parseFloat(zone.longitude)], { icon: createDisasterIcon() });
      const severityLabel = zone.severity === 'Kritik' ? '🔴 KRİTİK' : zone.severity === 'Yüksek' ? '🟠 YÜKSEK' : zone.severity === 'Orta' ? '🟡 ORTA' : '🔵 DÜŞÜK';
      marker.bindPopup(L.popup({ minWidth: 220 }).setContent(`
        <div style="padding:12px;background:#1a0505;color:white;font-family:sans-serif;min-width:220px;border-radius:8px">
          <p style="font-size:10px;font-weight:900;text-transform:uppercase;color:#ef4444;margin:0 0 6px">⚠ AFET BÖLGESİ</p>
          <p style="font-size:14px;font-weight:900;color:white;margin:0 0 4px">${zone.title}</p>
          ${zone.description ? `<p style="font-size:11px;color:#94a3b8;margin:0 0 8px;font-style:italic">${zone.description}</p>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span style="font-size:9px;font-weight:700;color:#ef4444;background:rgba(239,68,68,0.1);padding:2px 8px;border-radius:999px">${severityLabel}</span>
            <span style="font-size:9px;font-weight:700;color:#94a3b8">📏 ${zone.radius} km yarıçap</span>
          </div>
        </div>
      `));
      group.addLayer(circle);
      group.addLayer(marker);
    });
    map.addLayer(group);
    layerRef.current = group;
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [zones, map]);
  return null;
}

function ClusterLayer({ signals, getIcon, currentUser, onStartChat, onRequestTask, onCompleteTask, onIhbar, onDeleteSignal }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (clusterRef.current) { map.removeLayer(clusterRef.current); clusterRef.current = null; }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true, maxClusterRadius: 60,
      spiderfyOnMaxZoom: true, showCoverageOnHover: false,
    });

    signals.forEach(signal => {
      const isOwn = currentUser && parseInt(signal.citizen_id) === parseInt(currentUser.id);

      const marker = L.marker(
        [parseFloat(signal.latitude), parseFloat(signal.longitude)],
        { icon: getIcon(signal, isOwn) }
      );

      const container = document.createElement('div');
      container.style.cssText = 'padding:12px;min-width:240px;background:#0d1425;color:white;font-family:sans-serif';

      const statusColor = signal.status === 'Tamamlandı' ? '#4ade80' :
                          signal.urgency_level === 'Kritik' ? '#93c5fd' : '#fca5a5';
      const statusBg = signal.status === 'Tamamlandı' ? 'rgba(74,222,128,0.1)' :
                       signal.urgency_level === 'Kritik' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)';
      const statusText = signal.status === 'Tamamlandı' ? '✅ TAMAMLANDI' :
                         signal.urgency_level === 'Kritik' ? '🛡️ AKINCI' : '👤 VATANDAŞ';

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1)">
          <span style="font-size:10px;font-weight:900;text-transform:uppercase;color:#60a5fa">${signal.category_name || 'Genel'}</span>
          <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:999px;background:${statusBg};color:${statusColor}">${statusText}</span>
        </div>
        <div style="margin-bottom:10px;display:flex;flex-direction:column;gap:4px">
          <p style="font-size:9px;color:#64748b;font-weight:900;text-transform:uppercase;margin:0">
            Gönderen: <span style="color:white">${signal.full_name || 'Anonim'}</span>
            ${isOwn ? ' <span style="color:#a78bfa;font-size:8px">(Siz)</span>' : ''}
          </p>
          ${signal.beneficiary_note ? `<p style="font-size:9px;color:#64748b;font-weight:700;margin:0">📍 ${signal.beneficiary_note}</p>` : ''}
          <p style="font-size:11px;color:#cbd5e1;font-style:italic;background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:6px;margin:0">"${signal.description || ''}"</p>
          ${signal.assigned_to && signal.status !== 'Tamamlandı' ? `<p style="font-size:8px;color:#4ade80;font-weight:700;text-transform:uppercase;margin:0">⚡ Görev üstlenildi</p>` : ''}
        </div>
        <div id="popup-actions-${signal.id}" style="display:flex;flex-direction:column;gap:6px"></div>
      `;

      marker.bindPopup(L.popup({ minWidth: 240, maxWidth: 280 }).setContent(container));

      marker.on('popupopen', () => {
        const actionsDiv = document.getElementById(`popup-actions-${signal.id}`);
        if (!actionsDiv) return;
        actionsDiv.innerHTML = '';

        // ✅ KENDİ PİNİ — sadece bilgi + sil butonu
        if (isOwn) {
          const infoDiv = document.createElement('div');
          infoDiv.style.cssText = 'padding:8px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.3);border-radius:10px;text-align:center;font-size:9px;color:#a78bfa;font-weight:900;text-transform:uppercase;margin-bottom:4px';
          infoDiv.innerHTML = '📌 Bu sizin sinyaliniz';
          actionsDiv.appendChild(infoDiv);

          if (signal.status !== 'Tamamlandı') {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑 Sinyali Sil';
            deleteBtn.style.cssText = 'width:100%;background:rgba(239,68,68,0.1);color:#fca5a5;font-size:10px;font-weight:900;text-transform:uppercase;padding:8px 12px;border-radius:10px;border:1px solid rgba(239,68,68,0.2);cursor:pointer';
            deleteBtn.onmouseover = () => { deleteBtn.style.background = '#dc2626'; deleteBtn.style.color = 'white'; };
            deleteBtn.onmouseout = () => { deleteBtn.style.background = 'rgba(239,68,68,0.1)'; deleteBtn.style.color = '#fca5a5'; };
            deleteBtn.onclick = () => {
              if (window.confirm('Bu sinyali silmek istiyor musunuz?')) {
                onDeleteSignal && onDeleteSignal(signal.id);
                marker.closePopup();
              }
            };
            actionsDiv.appendChild(deleteBtn);
          }
          return;
        }

        if (signal.status === 'Tamamlandı') return;

        // İletişime Geç — sadece atanmış kişi mesajlaşabilir
        if (currentUser && parseInt(signal.assigned_to) === parseInt(currentUser.id)) {
          const chatBtn = document.createElement('button');
          chatBtn.innerHTML = '💬 Mesajlaş';
          chatBtn.style.cssText = 'width:100%;background:#16a34a;color:white;font-size:10px;font-weight:900;text-transform:uppercase;padding:8px 12px;border-radius:10px;border:none;cursor:pointer';
          chatBtn.onmouseover = () => chatBtn.style.background = '#15803d';
          chatBtn.onmouseout = () => chatBtn.style.background = '#16a34a';
          chatBtn.onclick = () => { onStartChat && onStartChat(signal); marker.closePopup(); };
          actionsDiv.appendChild(chatBtn);
        }

        // ✅ Görev İsteği Gönder — atanmamışsa
        if (currentUser && !signal.assigned_to) {
          const requestBtn = document.createElement('button');
          requestBtn.innerHTML = '⚡ Yardım Teklif Et';
          requestBtn.style.cssText = 'width:100%;background:#2563eb;color:white;font-size:10px;font-weight:900;text-transform:uppercase;padding:8px 12px;border-radius:10px;border:none;cursor:pointer';
          requestBtn.onmouseover = () => requestBtn.style.background = '#1d4ed8';
          requestBtn.onmouseout = () => requestBtn.style.background = '#2563eb';
          requestBtn.onclick = () => { onRequestTask && onRequestTask(signal.id); marker.closePopup(); };
          actionsDiv.appendChild(requestBtn);
        }

        // Görevi Tamamla
        if (currentUser && parseInt(signal.assigned_to) === parseInt(currentUser.id)) {
          const completeBtn = document.createElement('button');
          completeBtn.innerHTML = '✅ Görevi Tamamla (+50 XP)';
          completeBtn.style.cssText = 'width:100%;background:#15803d;color:white;font-size:10px;font-weight:900;text-transform:uppercase;padding:8px 12px;border-radius:10px;border:none;cursor:pointer';
          completeBtn.onmouseover = () => completeBtn.style.background = '#166534';
          completeBtn.onmouseout = () => completeBtn.style.background = '#15803d';
          completeBtn.onclick = () => { onCompleteTask && onCompleteTask(signal.id); marker.closePopup(); };
          actionsDiv.appendChild(completeBtn);
        }

        // İhbar Et
        const ihbarBtn = document.createElement('button');
        ihbarBtn.innerHTML = '🚨 İhbar Et';
        ihbarBtn.style.cssText = 'width:100%;background:#7f1d1d;color:#fca5a5;font-size:10px;font-weight:900;text-transform:uppercase;padding:8px 12px;border-radius:10px;border:1px solid rgba(239,68,68,0.3);cursor:pointer';
        ihbarBtn.onmouseover = () => { ihbarBtn.style.background = '#dc2626'; ihbarBtn.style.color = 'white'; };
        ihbarBtn.onmouseout = () => { ihbarBtn.style.background = '#7f1d1d'; ihbarBtn.style.color = '#fca5a5'; };
        ihbarBtn.onclick = () => {
          if (!currentUser) { toast.warning('İhbar için giriş yapmalısın!'); return; }
          onIhbar && onIhbar(signal); marker.closePopup();
        };
        actionsDiv.appendChild(ihbarBtn);
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => { if (clusterRef.current) { map.removeLayer(clusterRef.current); clusterRef.current = null; } };
  }, [signals, map, currentUser]);

  return null;
}

export default function MapPanel({ onSelectLocation, externalLocation, filters, signals, currentUser, onStartChat, onRequestTask, onCompleteTask, isOpMode, onIhbar, onDeleteSignal }) {
  const turkiyeMerkez = [39.0, 35.0];
  const [disasterZones, setDisasterZones] = useState([]);

  const activeSignals = Array.isArray(signals)
    ? signals.filter(s => s.status === 'Açık' || s.status === 'Beklemede' || s.status === 'Tamamlandı')
    : [];

  // ✅ Kendi pini mor, diğerleri normal
  const getIcon = (signal, isOwn) => {
    if (isOwn) return kendiIcon;
    if (signal.status === 'Tamamlandı') return tamamlandiIcon;
    return signal.urgency_level === 'Kritik' ? akinciIcon : vatandasIcon;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/disaster-zones')
      .then(r => r.json())
      .then(data => setDisasterZones(Array.isArray(data) ? data : []))
      .catch(() => {});

    let socket = null;
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:5000');
      socket.on('disaster_zone_added', (zone) => {
        setDisasterZones(prev => [...prev, zone]);
        toast.warning(`⚠ Yeni afet bölgesi: ${zone.title}`);
      });
      socket.on('disaster_zone_removed', ({ id }) => {
        setDisasterZones(prev => prev.filter(z => z.id !== parseInt(id)));
      });
    });

    return () => { socket?.disconnect(); };
  }, []);

  return (
    <div className="relative h-[350px] md:h-[600px] w-full bg-[#0d1425] rounded-[2.5rem] border border-blue-500/20 overflow-hidden shadow-2xl z-0 text-left">
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #0d1425 !important;
          border: 1px solid rgba(59,130,246,0.2) !important;
          border-radius: 16px !important;
          box-shadow: 0 0 30px rgba(0,0,0,0.7) !important;
          color: white !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-popup-close-button { color: #64748b !important; top: 8px !important; right: 8px !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-container { font-family: inherit; }
      `}</style>

      <MapContainer
        center={turkiyeMerkez}
        zoom={6}
        className="h-full w-full"
        style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
        maxBounds={[[34.0, 24.0], [43.0, 46.0]]}
        maxBoundsViscosity={0.6}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        <FlyToLocation target={externalLocation || filters?.center} />
        <MapClickHandler onLocationSelect={onSelectLocation} isOpMode={isOpMode} />

        {filters?.geoJson && (
          <GeoJSON
            key={JSON.stringify(filters.geoJson)}
            data={filters.geoJson}
            style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.15 }}
          />
        )}

        {filters?.rangeMode === 'Çap' && externalLocation?.lat && filters.radius !== 999 && (
          <Circle
            center={[externalLocation.lat, externalLocation.lng]}
            radius={filters.radius * 1000}
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', weight: 2, dashArray: '10, 10' }}
          />
        )}

        {externalLocation && externalLocation.lat && (
          <Marker position={[externalLocation.lat, externalLocation.lng]} icon={hedefIcon}>
            <Popup>
              <div style={{ padding: '10px', fontWeight: 'bold', color: '#60a5fa', background: '#0d1425' }}>
                📍 Hedef Tarama Merkezi
              </div>
            </Popup>
          </Marker>
        )}

        <DisasterLayer zones={disasterZones} />

        <ClusterLayer
          signals={activeSignals}
          getIcon={getIcon}
          currentUser={currentUser}
          onStartChat={onStartChat}
          onRequestTask={onRequestTask}
          onCompleteTask={onCompleteTask}
          onIhbar={onIhbar}
          onDeleteSignal={onDeleteSignal}
        />
      </MapContainer>

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] bg-[#0a0f1d]/90 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">
            {activeSignals.length} Sinyal
          </span>
          {disasterZones.length > 0 && (
            <>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[9px] font-black uppercase text-red-400">🚨 {disasterZones.length} Afet</span>
            </>
          )}
        </div>
      </div>

      {isOpMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            📍 Sinyal konumunu seçmek için haritaya tıkla
          </span>
        </div>
      )}
    </div>
  );
}