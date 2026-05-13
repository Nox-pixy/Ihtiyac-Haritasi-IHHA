import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import FilterBar from './components/FilterBar';
import SignalList from './components/SignalList';
import AuthModal from './modals/AuthModal';
import ProfileModal from './modals/ProfileModal';
import OperationPanel from './components/OperationPanel';
import AdminPanel from './components/AdminPanel';

// 🛡️ ADMIN DASHBOARD LAYOUT
const AdminDashboard = ({ currentUser, onLogout }) => (
  <div className="flex min-h-screen bg-[#050810] text-slate-200 text-left">
    <aside className="w-64 bg-[#0a0f1d] border-r border-white/5 flex flex-col fixed h-full">
      <div className="p-8 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white">İ</div>
        <h1 className="font-black uppercase tracking-tighter text-red-50 text-xl">İHHA</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 mt-4">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-widest text-left">Dashboard</button>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={onLogout} className="w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-all text-left text-white">Güvenli Çıkış</button>
      </div>
    </aside>
    <main className="flex-1 ml-64 p-10 bg-[#050810]"><AdminPanel /></main>
  </div>
);

const App = () => {
  // --- STATE YÖNETİMİ ---
  const [currentUser, setCurrentUser] = useState(null);
  const [globalSignals, setGlobalSignals] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [isOpPanelOpen, setIsOpPanelOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [activeChat, setActiveChat] = useState(null);
  
  const [filters, setFilters] = useState({ 
    category: 'Hepsi', 
    userType: 'Hepsi', 
    radius: 5, 
    rangeMode: 'Çap', 
    center: null 
  });

  // 🛡️ OTURUM KONTROLÜ
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ihha_user') || localStorage.getItem('ihha_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Oturum okuma hatası");
      }
    }
  }, []);

  // 🌍 CİHAZ KONUMU
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Konum izni yok.")
      );
    }
  }, []);

  // 📡 RADAR SENKRONİZASYONU
  const fetchGlobalSignals = useCallback(async () => {
    try {
      const categoryMap = {
        'Gıda': 1, 'İlaç & Tıbbi Malzeme': 2, 'Kıyafet & Tekstil': 3,
        'Eşya': 4, 'Elektronik': 5, 'Gönüllü': 6
      };

      const url = new URL('http://localhost:5000/api/signals');
      if (filters.category !== 'Hepsi') url.searchParams.append('category_id', categoryMap[filters.category]);
      if (filters.userType !== 'Hepsi') url.searchParams.append('userType', filters.userType);

      const centerPoint = filters.center || deviceLocation || selectedLocation;
      if (centerPoint) {
        url.searchParams.append('lat', centerPoint.lat);
        url.searchParams.append('lng', centerPoint.lng);
        url.searchParams.append('radius', filters.rangeMode === 'Çap' ? filters.radius : 10);
      }

      const res = await fetch(url);
      const data = await res.json();
      setGlobalSignals(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Radar Hatası"); }
  }, [filters, selectedLocation, deviceLocation]);

  useEffect(() => {
    fetchGlobalSignals();
    const interval = setInterval(fetchGlobalSignals, 20000);
    return () => clearInterval(interval);
  }, [fetchGlobalSignals]);

  // ⚡ GÖREV ÜSTLENME PROTOKOLÜ (C AŞAMASI)
  const handleAssignTask = async (signalId) => {
    if (!currentUser) return alert("Önce karargaha giriş yapmalısın!");
    try {
      const res = await fetch(`http://localhost:5000/api/signals/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, user_id: currentUser.id })
      });
      if (res.ok) {
        alert("Operasyon başarıyla üstlenildi!");
        fetchGlobalSignals();
      }
    } catch (err) { console.error("Görev atama hatası"); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ihha_user');
    sessionStorage.removeItem('ihha_user');
    alert("Bağlantı kesildi.");
  };

  if (currentUser?.email === 'admin@ihha.com') return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-blue-100 font-sans text-left relative">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onLogin={() => setAuthModal({ isOpen: true, type: 'login' })}
        onRegister={() => setAuthModal({ isOpen: true, type: 'register' })}
      />
      
      <main className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {currentUser && (
          <button 
            onClick={() => { setIsOpPanelOpen(!isOpPanelOpen); if (isOpPanelOpen) setSelectedLocation(null); }}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border transition-all ${isOpPanelOpen ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-blue-600 border-blue-400 text-white shadow-2xl'}`}
          >
            {isOpPanelOpen ? '✕ İşlemi İptal Et' : '📡 Sinyal Talebi Gönder'}
          </button>
        )}
        
        {isOpPanelOpen && (
          <OperationPanel 
            currentUser={currentUser} 
            selectedLocation={selectedLocation} 
            onIhbarSubmit={() => { setIsOpPanelOpen(false); setSelectedLocation(null); fetchGlobalSignals(); }} 
            onLocationSelect={(lat, lng) => setSelectedLocation({lat, lng})} 
          />
        )}

        <MapPanel 
          onSelectLocation={(lat, lng) => isOpPanelOpen && setSelectedLocation({lat, lng})} 
          externalLocation={selectedLocation || deviceLocation}
          signals={globalSignals} 
          filters={filters} 
          currentUser={currentUser}
          onStartChat={(signal) => setActiveChat(signal)}
          onAssignTask={handleAssignTask}
        />
        
        <FilterBar 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          userLocation={deviceLocation} 
        />

        <SignalList signals={globalSignals} currentUser={currentUser} onSignalClick={(lat, lng) => setSelectedLocation({lat, lng})} />
      </main>

      <AuthModal 
        isOpen={authModal.isOpen} 
        type={authModal.type} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        setUser={(u) => setCurrentUser(u)}
      />

      {activeChat && (
        <div className="fixed bottom-6 right-6 z-[4000] w-80 animate-in slide-in-from-right">
          <div className="bg-[#0d1425] border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">📟 Telsiz: #{activeChat.id}</span>
              <button onClick={() => setActiveChat(null)}>✕</button>
            </div>
            <div className="h-64 p-4 bg-[#0a0f1d]/50">
               <p className="text-[9px] text-center text-slate-600 font-bold uppercase italic">-- Hat Bağlantısı Kuruldu --</p>
            </div>
          </div>
        </div>
      )}
      
      <footer className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.5em]">
        İHHA Karargah Operasyon Merkezi © 2026
      </footer>
    </div>
  );
};

export default App;