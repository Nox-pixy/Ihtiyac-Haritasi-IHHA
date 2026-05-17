import React, { useEffect, useRef, useState, useMemo } from 'react';
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

const CATEGORY_ICONS = {
  'Gıda': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  'İlaç & Tıbbi Malzeme': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 0 1-2 2zm14-4V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 13h4"/><path d="M4 11v4"/></svg>`,
  'Kıyafet & Tekstil': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  'Eşya': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  'Elektronik': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  'Gönüllü': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'default': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

const CATEGORY_COLORS = {
  'Gıda': { bg: '#f97316', light: '#fff7ed', border: '#fed7aa' },
  'İlaç & Tıbbi Malzeme': { bg: '#ef4444', light: '#fef2f2', border: '#fecaca' },
  'Kıyafet & Tekstil': { bg: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe' },
  'Eşya': { bg: '#f59e0b', light: '#fffbeb', border: '#fde68a' },
  'Elektronik': { bg: '#3b82f6', light: '#eff6ff', border: '#bfdbfe' },
  'Gönüllü': { bg: '#22c55e', light: '#f0fdf4', border: '#bbf7d0' },
  'default': { bg: '#64748b', light: '#f8fafc', border: '#e2e8f0' }
};

const createCategoryPin = (categoryName, isOwn = false, isCompleted = false) => {
  const colors = isOwn
    ? { bg: '#7c3aed', light: '#f5f3ff', border: '#c4b5fd' }
    : isCompleted
      ? { bg: '#16a34a', light: '#f0fdf4', border: '#bbf7d0' }
      : (CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['default']);
  const icon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS['default'];
  const html = `
    <div style="position:relative;width:42px;height:50px;cursor:pointer;filter:drop-shadow(0 4px 8px ${colors.bg}44);" class="ihha-pin">
      <div style="width:42px;height:42px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:${colors.bg};border:3px solid white;box-shadow:0 2px 12px ${colors.bg}55;position:absolute;top:0;left:0;"></div>
      <div style="position:absolute;top:6px;left:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:white;">
        ${icon.replace('currentColor', 'white').replace('stroke-width="2"', 'stroke-width="2.5" width="18" height="18"')}
      </div>
      ${isOwn ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#7c3aed;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:900;">S</div>` : ''}
    </div>
  `;
  return L.divIcon({ html, iconSize: [42, 50], iconAnchor: [21, 48], popupAnchor: [0, -50], className: 'ihha-marker' });
};

const hedefIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30], shadowSize: [36, 36]
});

const createDisasterIcon = () => L.divIcon({
  html: `<div style="width:38px;height:38px;border-radius:50%;background:rgba(239,68,68,0.12);border:2.5px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 12px rgba(239,68,68,0.25)">⚠️</div>`,
  iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22], className: ''
});

const isSameId = (a, b) => a != null && b != null && (parseInt(a) === parseInt(b) || String(a) === String(b));
const getIcon = (signal, isOwn) => createCategoryPin(signal.category_name, isOwn, signal.status === 'Tamamlandı');

function FlyToLocation({ target, zoom = 13 }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!target?.lat || !target?.lng) return;
    if (prevRef.current?.lat === target.lat && prevRef.current?.lng === target.lng) return;
    prevRef.current = { lat: target.lat, lng: target.lng };
    map.flyTo([target.lat, target.lng], zoom, { animate: true, duration: 1.2 });
  }, [target?.lat, target?.lng, zoom, map]);
  return null;
}

function MapClickHandler({ onLocationSelect, isOpMode }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!isOpMode) return;
      if (!isInTurkey(lat, lng)) { toast.error('Yalnızca Türkiye sınırları içine sinyal eklenebilir!'); return; }
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

function DisasterLayer({ zones }) {
  const map = useMap();
  const layerRef = useRef(null);
  const zonesKey = useMemo(() => zones.map(z => z.id).join(','), [zones]);
  useEffect(() => {
    if (!map) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    if (!zones.length) return;
    const group = L.layerGroup();
    zones.forEach(zone => {
      const circle = L.circle([parseFloat(zone.latitude), parseFloat(zone.longitude)], {
        radius: zone.radius * 1000, color: '#ef4444', fillColor: '#fca5a5', fillOpacity: 0.1, weight: 2, dashArray: '8, 6'
      });
      const marker = L.marker([parseFloat(zone.latitude), parseFloat(zone.longitude)], { icon: createDisasterIcon() });
      const severityLabel = zone.severity === 'Kritik' ? '🔴 Kritik' : zone.severity === 'Yüksek' ? '🟠 Yüksek' : zone.severity === 'Orta' ? '🟡 Orta' : '🔵 Düşük';
      marker.bindPopup(L.popup({ minWidth: 220 }).setContent(`
        <div style="padding:14px;background:#fff;color:#1a1a2e;font-family:sans-serif;min-width:220px;border-radius:16px">
          <p style="font-size:10px;font-weight:900;text-transform:uppercase;color:#ef4444;margin:0 0 6px">⚠️ Afet Bölgesi</p>
          <p style="font-size:15px;font-weight:800;color:#1e293b;margin:0 0 4px">${zone.title}</p>
          ${zone.description ? `<p style="font-size:11px;color:#64748b;margin:0 0 10px;font-style:italic">${zone.description}</p>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:9px;font-weight:700;color:#dc2626;background:#fee2e2;padding:3px 10px;border-radius:999px;border:1px solid #fca5a5">${severityLabel}</span>
            <span style="font-size:9px;font-weight:600;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:999px">📏 ${zone.radius} km</span>
          </div>
        </div>
      `));
      group.addLayer(circle);
      group.addLayer(marker);
    });
    map.addLayer(group);
    layerRef.current = group;
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [zonesKey, map]);
  return null;
}

function ClusterLayer({ signals, currentUser, onStartChat, onRequestTask, onCompleteTask, onIhbar, onDeleteSignal }) {
  const map = useMap();
  const clusterRef = useRef(null);
  const markersRef = useRef({});
  const openPopupIdRef = useRef(null);
  // ✅ currentUserId'yi ref'te tut — her zaman güncel değeri tutar
  const currentUserIdRef = useRef(currentUser?.id);

  const signalKey = useMemo(() =>
    signals.map(s => `${s.id}:${s.status}:${s.assigned_to}:${s.citizen_id}`).join('|'),
    [signals]
  );
  const currentUserId = currentUser?.id;

  // ✅ currentUser değişince ref'i güncelle
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
    // Mevcut tüm marker'ların _currentUserId'sini güncelle
    Object.values(markersRef.current).forEach(m => {
      m._currentUserId = currentUser?.id;
    });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!map) return;
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        chunkedLoading: true, maxClusterRadius: 60,
        spiderfyOnMaxZoom: true, showCoverageOnHover: false,
        animate: true, animateAddingMarkers: false,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="width:40px;height:40px;border-radius:50%;background:white;border:3px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#1d4ed8;box-shadow:0 2px 12px rgba(59,130,246,0.25)">${count}</div>`,
            className: '', iconSize: [40, 40]
          });
        }
      });
      map.addLayer(clusterRef.current);
    }

    const cluster = clusterRef.current;
    const existingIds = new Set(Object.keys(markersRef.current).map(Number));
    const newIds = new Set(signals.map(s => s.id));

    existingIds.forEach(id => {
      if (!newIds.has(id)) { cluster.removeLayer(markersRef.current[id]); delete markersRef.current[id]; }
    });

    signals.forEach(signal => {
      const isOwn = currentUserId && isSameId(signal.citizen_id, currentUserId);
      const icon = getIcon(signal, isOwn);

      if (markersRef.current[signal.id]) {
        markersRef.current[signal.id].setIcon(icon);
        markersRef.current[signal.id]._signal = signal;
        // ✅ Mevcut marker'ı güncelle
        markersRef.current[signal.id]._currentUserId = currentUserId;
        return;
      }

      const marker = L.marker([parseFloat(signal.latitude), parseFloat(signal.longitude)], { icon });
      marker._signal = signal;
      // ✅ currentUserId'yi marker'a sakla
      marker._currentUserId = currentUserId;

      const colors = CATEGORY_COLORS[signal.category_name] || CATEGORY_COLORS['default'];
      const catIcon = CATEGORY_ICONS[signal.category_name] || CATEGORY_ICONS['default'];

      const buildPopupContent = (sig, uid) => {
        // ✅ uid parametresinden al — closure değil
        const own = uid && isSameId(sig.citizen_id, uid);
        const statusText = sig.status === 'Tamamlandı' ? 'Tamamlandı' : sig.urgency_level === 'Kritik' ? 'Akıncı' : 'Vatandaş';
        const container = document.createElement('div');
        container.style.cssText = 'padding:0;min-width:260px;background:#ffffff;color:#1e293b;font-family:sans-serif;border-radius:20px;overflow:hidden;animation:popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1)';
        container.innerHTML = `
          <style>@keyframes popupIn{from{opacity:0;transform:scale(0.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>
          <div style="background:${colors.bg};padding:14px 16px;display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${catIcon.replace('currentColor','white').replace('viewBox','width="22" height="22" viewBox')}
            </div>
            <div style="flex:1;min-width:0">
              <p style="font-size:13px;font-weight:800;color:white;margin:0">
                ${sig.category_name || 'Genel'}
                ${own ? '<span style="font-size:9px;background:rgba(255,255,255,0.25);padding:1px 6px;border-radius:999px;margin-left:6px">Sizin</span>' : ''}
              </p>
              <p style="font-size:9px;color:rgba(255,255,255,0.8);margin:2px 0 0;font-weight:600;text-transform:uppercase">${statusText}</p>
            </div>
            <span style="font-size:9px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.2);color:white;white-space:nowrap">${sig.status}</span>
          </div>
          <div style="padding:14px 16px">
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase">Gönderen:</span>
                <span style="font-size:11px;color:#1e293b;font-weight:700">${sig.full_name || 'Anonim'}</span>
              </div>
              ${sig.beneficiary_note ? `<div style="display:flex;align-items:flex-start;gap:6px"><span style="font-size:10px;color:#94a3b8">📍</span><span style="font-size:10px;color:#64748b;font-weight:600">${sig.beneficiary_note}</span></div>` : ''}
              ${sig.description ? `<div style="background:${colors.light};border:1px solid ${colors.border};padding:8px 10px;border-radius:10px"><p style="font-size:11px;color:#475569;font-style:italic;margin:0">"${sig.description}"</p></div>` : ''}
              ${sig.assigned_to && sig.status !== 'Tamamlandı' ? `<div style="background:#f0fdf4;padding:5px 8px;border-radius:8px;border:1px solid #bbf7d0"><span style="font-size:9px;color:#16a34a;font-weight:800;text-transform:uppercase">⚡ Görev Üstlenildi</span></div>` : ''}
            </div>
            <div id="pact-${sig.id}" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>
        `;
        return container;
      };

      // ✅ buildActions uid parametresi alıyor — closure'dan değil
      const buildActions = (sig, m, uid) => {
        const actionsDiv = document.getElementById(`pact-${sig.id}`);
        if (!actionsDiv) return;
        actionsDiv.innerHTML = '';

        const own = uid && isSameId(sig.citizen_id, uid);
        const assignedToMe = uid && isSameId(sig.assigned_to, uid);

        const makeBtn = (html, bg, color, hoverBg, onClick) => {
          const btn = document.createElement('button');
          btn.innerHTML = html;
          btn.style.cssText = `width:100%;background:${bg};color:${color};font-size:10px;font-weight:800;text-transform:uppercase;padding:9px 12px;border-radius:10px;border:none;cursor:pointer;transition:all 0.15s;letter-spacing:0.03em;`;
          btn.onmouseover = () => { btn.style.background = hoverBg; btn.style.color = 'white'; btn.style.transform = 'scale(1.02)'; };
          btn.onmouseout = () => { btn.style.background = bg; btn.style.color = color; btn.style.transform = 'scale(1)'; };
          btn.onclick = onClick;
          return btn;
        };

        if (own) {
          const infoDiv = document.createElement('div');
          infoDiv.style.cssText = 'padding:8px 12px;background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;text-align:center;font-size:9px;color:#7c3aed;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;';
          infoDiv.innerHTML = '📌 Bu sizin sinyaliniz';
          actionsDiv.appendChild(infoDiv);
          if (sig.status !== 'Tamamlandı') {
            actionsDiv.appendChild(makeBtn('🗑 Sinyali Sil', '#fee2e2', '#dc2626', '#ef4444',
              () => { if (window.confirm('Bu sinyali silmek istiyor musunuz?')) { onDeleteSignal && onDeleteSignal(sig.id); m.closePopup(); } }
            ));
          }
          return;
        }

        if (sig.status === 'Tamamlandı') return;

        if (assignedToMe) {
          actionsDiv.appendChild(makeBtn('💬 Mesajlaş', '#dcfce7', '#16a34a', '#22c55e',
            () => { onStartChat && onStartChat(sig); m.closePopup(); }
          ));
          actionsDiv.appendChild(makeBtn('✅ Görevi Tamamla (+50 XP)', '#dcfce7', '#15803d', '#16a34a',
            () => { onCompleteTask && onCompleteTask(sig.id); m.closePopup(); }
          ));
          return;
        }

        if (!sig.assigned_to) {
          if (uid) {
            actionsDiv.appendChild(makeBtn('⚡ Yardım Teklif Et', '#dbeafe', '#2563eb', '#3b82f6',
              () => { onRequestTask && onRequestTask(sig.id); m.closePopup(); }
            ));
          }
          // ✅ İletişime Geç — uid kullanıyor, closure değil
          actionsDiv.appendChild(makeBtn('💬 İletişime Geç', '#f0fdf4', '#16a34a', '#22c55e',
            () => {
              if (!uid) { toast.warning('İletişim için giriş yapmalısın!'); return; }
              onStartChat && onStartChat(sig); m.closePopup();
            }
          ));
        }

        if (sig.assigned_to && !assignedToMe) {
          actionsDiv.appendChild(makeBtn('💬 İletişime Geç', '#f0fdf4', '#16a34a', '#22c55e',
            () => {
              if (!uid) { toast.warning('İletişim için giriş yapmalısın!'); return; }
              onStartChat && onStartChat(sig); m.closePopup();
            }
          ));
        }

        // ✅ İhbar Et — uid kullanıyor
        actionsDiv.appendChild(makeBtn('🚨 İhbar Et', '#fee2e2', '#dc2626', '#ef4444',
          () => {
            if (!uid) { toast.warning('İhbar için giriş yapmalısın!'); return; }
            onIhbar && onIhbar(sig); m.closePopup();
          }
        ));
      };

      // ✅ buildPopupContent ilk açılışta uid ile çağrılıyor
      marker.bindPopup(
        L.popup({ minWidth: 260, maxWidth: 300, autoPan: true, className: 'ihha-popup' })
          .setContent(() => buildPopupContent(marker._signal || signal, marker._currentUserId))
      );

      // ✅ popupopen'da marker'dan güncel uid oku
      marker.on('popupopen', () => {
        openPopupIdRef.current = signal.id;
        const sig = marker._signal || signal;
        const uid = marker._currentUserId; // ← closure değil, marker'dan al
        // Content'i uid ile yeniden oluştur
        const popup = marker.getPopup();
        popup.setContent(buildPopupContent(sig, uid));
        // Actions biraz bekleyerek DOM hazır olduktan sonra çalıştır
        setTimeout(() => buildActions(sig, marker, uid), 50);
      });

      marker.on('popupclose', () => {
        if (openPopupIdRef.current === signal.id) openPopupIdRef.current = null;
      });

      cluster.addLayer(marker);
      markersRef.current[signal.id] = marker;
    });
  }, [signalKey, map, currentUserId]);

  useEffect(() => {
    return () => {
      if (clusterRef.current && map) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map]);

  return null;
}

export default function MapPanel({
  onSelectLocation, externalLocation, selectedLocation, deviceLocation,
  filters, signals, currentUser,
  onStartChat, onRequestTask, onCompleteTask, isOpMode, onIhbar, onDeleteSignal
}) {
  const TURKEY_CENTER = [39.0, 35.0];
  const TURKEY_ZOOM = 6;
  const [disasterZones, setDisasterZones] = useState([]);
  const mapRef = useRef(null);
  const gpsAppliedRef = useRef(false);

  useEffect(() => {
    if (gpsAppliedRef.current) return;
    if (!deviceLocation?.lat || !deviceLocation?.lng) return;
    if (!mapRef.current) return;
    gpsAppliedRef.current = true;
    mapRef.current.setView([deviceLocation.lat, deviceLocation.lng], 10, { animate: false });
  }, [deviceLocation]);

  const activeSignals = useMemo(() => {
    if (!Array.isArray(signals)) return [];
    return signals.filter(s =>
      s.status === 'Açık' || s.status === 'Beklemede' ||
      (s.status === 'Tamamlandı' && new Date(s.created_at) > new Date(Date.now() - 86400000))
    );
  }, [signals]);

  useEffect(() => {
    fetch('http://localhost:5003/api/disaster-zones')
      .then(r => r.json())
      .then(data => setDisasterZones(Array.isArray(data) ? data : []))
      .catch(() => {});
    let socket = null;
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:5003');
      socket.on('disaster_zone_added', (zone) => { setDisasterZones(prev => [...prev, zone]); toast.warning(`⚠️ Yeni afet bölgesi: ${zone.title}`); });
      socket.on('disaster_zone_removed', ({ id }) => { setDisasterZones(prev => prev.filter(z => z.id !== parseInt(id))); });
    });
    return () => { socket?.disconnect(); };
  }, []);

  return (
    <div className="relative h-[350px] md:h-[580px] w-full rounded-3xl border border-[#ddd8d0] overflow-hidden shadow-lg z-0 text-left bg-[#e8e4dc]">
      <style>{`
        .ihha-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important; border: 1px solid #e2e8f0 !important;
          border-radius: 20px !important; box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important;
          padding: 0 !important; overflow: hidden !important;
        }
        .leaflet-popup-content-wrapper {
          background: #ffffff !important; border: 1px solid #e2e8f0 !important;
          border-radius: 20px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.10) !important;
          color: #1e293b !important; padding: 0 !important;
        }
        .leaflet-popup-tip { background: #ffffff !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-popup-close-button {
          color: #94a3b8 !important; top: 10px !important; right: 10px !important;
          font-size: 20px !important; z-index: 10 !important;
          background: rgba(255,255,255,0.8) !important; border-radius: 50% !important;
          width: 24px !important; height: 24px !important;
        }
        .leaflet-popup-close-button:hover { color: #ef4444 !important; background: #fee2e2 !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-container { font-family: inherit; background: #e8e4dc; }
        .leaflet-control-zoom a { background: white !important; color: #475569 !important; border-color: #e2e8f0 !important; font-weight: 700 !important; }
        .leaflet-control-zoom a:hover { background: #f1f5f9 !important; }
        .ihha-marker { transition: none !important; }
        .ihha-marker:hover .ihha-pin {
          transform: scale(1.18) !important;
          transition: transform 0.15s ease !important;
          filter: brightness(1.05) !important;
        }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={TURKEY_CENTER} zoom={TURKEY_ZOOM}
        className="h-full w-full"
        style={{ filter: 'saturate(0.8) brightness(1.05) contrast(0.95)' }}
        maxBounds={[[34.0, 24.0], [43.0, 46.0]]}
        maxBoundsViscosity={0.8} minZoom={5}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' keepBuffer={4} />

        {selectedLocation && <FlyToLocation target={selectedLocation} zoom={13} />}
        {!selectedLocation && filters?.center && filters.rangeMode !== 'TümÜlke' && (
          <FlyToLocation target={filters.center} zoom={10} />
        )}

        <MapClickHandler onLocationSelect={onSelectLocation} isOpMode={isOpMode} />

        {filters?.geoJson && (
          <GeoJSON key={JSON.stringify(filters.geoJson)} data={filters.geoJson}
            style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.1 }} />
        )}
        {filters?.rangeMode === 'Çap' && externalLocation?.lat && filters.radius !== 999 && (
          <Circle center={[externalLocation.lat, externalLocation.lng]} radius={filters.radius * 1000}
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.08, color: '#3b82f6', weight: 2, dashArray: '8, 8' }} />
        )}
        {externalLocation?.lat && (
          <Marker position={[externalLocation.lat, externalLocation.lng]} icon={hedefIcon}>
            <Popup><div style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb', fontSize: 12 }}>📍 Hedef Tarama Merkezi</div></Popup>
          </Marker>
        )}

        <DisasterLayer zones={disasterZones} />
        <ClusterLayer
          signals={activeSignals} currentUser={currentUser}
          onStartChat={onStartChat} onRequestTask={onRequestTask}
          onCompleteTask={onCompleteTask} onIhbar={onIhbar} onDeleteSignal={onDeleteSignal}
        />
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-[#ddd8d0] px-3 py-2 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{activeSignals.length} Sinyal</span>
          {disasterZones.length > 0 && (<><div className="w-px h-3 bg-slate-200" /><span className="text-[10px] font-black uppercase text-red-400">🚨 {disasterZones.length}</span></>)}
        </div>
      </div>

      {isOpMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-500 px-5 py-2.5 rounded-full shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">📍 Sinyal konumunu seçmek için haritaya tıkla</span>
        </div>
      )}
    </div>
  );
}