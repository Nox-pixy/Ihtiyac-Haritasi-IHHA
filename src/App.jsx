import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import FilterBar from './components/FilterBar';
import SignalList from './components/SignalList';
import AuthModal from './modals/AuthModal';
import ProfileModal from './modals/ProfileModal';
import IhbarModal from './modals/IhbarModal';
import OperationPanel from './components/OperationPanel';
import AdminPanel from './components/AdminPanel';
import ToastContainer, { toast } from './components/ToastSystem';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [globalSignals, setGlobalSignals] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [isOpPanelOpen, setIsOpPanelOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [activeChats, setActiveChats] = useState([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [ihbarModalOpen, setIhbarModalOpen] = useState(false);
  const [ihbarSignal, setIhbarSignal] = useState(null);
  const [filters, setFilters] = useState({
    category: 'Hepsi', userType: 'Hepsi', radius: 5, rangeMode: 'Çap', center: null
  });

  const filtersRef = useRef(filters);
  const deviceLocationRef = useRef(deviceLocation);
  const selectedLocationRef = useRef(selectedLocation);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { deviceLocationRef.current = deviceLocation; }, [deviceLocation]);
  useEffect(() => { selectedLocationRef.current = selectedLocation; }, [selectedLocation]);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('ihha_user') || localStorage.getItem('ihha_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const fetchGlobalSignals = useCallback(async () => {
    try {
      const f = filtersRef.current;
      const categoryMap = {
        'Gıda': 1, 'İlaç & Tıbbi Malzeme': 2, 'Kıyafet & Tekstil': 3,
        'Eşya': 4, 'Elektronik': 5, 'Gönüllü': 6
      };
      const url = new URL('http://localhost:5000/api/signals');
      if (f.category !== 'Hepsi') url.searchParams.append('category_id', categoryMap[f.category]);
      if (f.userType !== 'Hepsi') url.searchParams.append('userType', f.userType);
      const centerPoint = f.center || deviceLocationRef.current || selectedLocationRef.current;
      if (centerPoint && f.rangeMode !== 'TümÜlke') {
        url.searchParams.append('lat', centerPoint.lat);
        url.searchParams.append('lng', centerPoint.lng);
        url.searchParams.append('radius', f.rangeMode === 'Çap' ? f.radius : 10);
      }
      const res = await fetch(url);
      const data = await res.json();
      setGlobalSignals(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Radar Hatası"); }
  }, []);

  useEffect(() => {
    let socket = null;
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:5000');
      socket.on('signal_updated', () => {
        fetchGlobalSignals();
        toast.info('Harita güncellendi!');
      });
    });
    return () => { socket?.disconnect(); };
  }, [fetchGlobalSignals]);

  useEffect(() => { fetchGlobalSignals(); }, [filters, fetchGlobalSignals]);

  useEffect(() => {
    const interval = setInterval(fetchGlobalSignals, 20000);
    return () => clearInterval(interval);
  }, [fetchGlobalSignals]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleIhbarSubmit = async (payload) => {
    if (!currentUser) { toast.warning("Önce sisteme giriş yapmalısın!"); return false; }
    try {
      const res = await fetch('http://localhost:5000/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, citizen_id: currentUser.id })
      });
      if (res.ok) {
        toast.success("Sinyal gönderildi! Admin onayı bekleniyor.");
        setIsOpPanelOpen(false);
        setSelectedLocation(null);
        fetchGlobalSignals();
        return true;
      } else {
        const err = await res.json();
        toast.error(err.error || 'Sinyal gönderilemedi.');
        return false;
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
      return false;
    }
  };

  const handleAssignTask = async (signalId) => {
    if (!currentUser) { toast.warning("Önce karargaha giriş yapmalısın!"); return; }
    try {
      const res = await fetch('http://localhost:5000/api/signals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, user_id: currentUser.id })
      });
      if (res.ok) { toast.success("Operasyon üstlenildi! +10 XP kazandın!"); fetchGlobalSignals(); }
      else { const err = await res.json(); toast.error(err.error || 'Görev atanamadı.'); }
    } catch { toast.error("Sunucuya bağlanılamadı."); }
  };

  const handleCompleteTask = async (signalId) => {
    if (!currentUser) return;
    try {
      const res = await fetch('http://localhost:5000/api/signals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, user_id: currentUser.id })
      });
      if (res.ok) { toast.success('Görev tamamlandı! +50 XP kazandın! 🎉'); fetchGlobalSignals(); }
      else { const err = await res.json(); toast.error(err.error || 'Görev tamamlanamadı.'); }
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
  };

  const handleStartChat = (signal) => {
    if (!currentUser) {
      toast.warning('Sohbet için giriş yapmalısın!');
      setAuthModal({ isOpen: true, type: 'login' });
      return;
    }
    setActiveChats(prev => {
      const exists = prev.find(c => c.id === signal.id);
      if (exists) return prev;
      return [...prev, signal];
    });
  };

  const handleCloseChat = (signalId) => {
    setActiveChats(prev => prev.filter(c => c.id !== signalId));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ihha_user');
    localStorage.removeItem('ihha_token');
    sessionStorage.removeItem('ihha_user');
    sessionStorage.removeItem('ihha_token');
    setProfileModalOpen(false);
    setActiveChats([]);
    toast.info("Bağlantı güvenli şekilde kesildi.");
  };

  if (currentUser?.email === 'admin@ihha.com') return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-blue-100 font-sans text-left relative">

      {/* ✅ HEADER — önceki kodda yoktu, eklendi */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogin={() => setAuthModal({ isOpen: true, type: 'login' })}
        onRegister={() => setAuthModal({ isOpen: true, type: 'register' })}
        onProfileOpen={() => setProfileModalOpen(true)}
      />

      <main className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {currentUser && (
          <button
            onClick={() => { setIsOpPanelOpen(!isOpPanelOpen); if (isOpPanelOpen) setSelectedLocation(null); }}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border transition-all ${
              isOpPanelOpen ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-blue-600 border-blue-400 text-white shadow-2xl'
            }`}
          >
            {isOpPanelOpen ? '✕ İşlemi İptal Et' : '📡 Sinyal Talebi Gönder'}
          </button>
        )}

        {isOpPanelOpen && (
          <OperationPanel
            currentUser={currentUser}
            selectedLocation={selectedLocation}
            onIhbarSubmit={handleIhbarSubmit}
            onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
          />
        )}

        <MapPanel
          onSelectLocation={(lat, lng) => isOpPanelOpen && setSelectedLocation({ lat, lng })}
          externalLocation={selectedLocation || deviceLocation}
          signals={globalSignals}
          filters={filters}
          currentUser={currentUser}
          onStartChat={handleStartChat}
          onAssignTask={handleAssignTask}
          onCompleteTask={handleCompleteTask}
          isOpMode={isOpPanelOpen}
          onIhbar={(signal) => {
            setIhbarSignal(signal);
            setIhbarModalOpen(true);
          }}
        />

        <FilterBar
          onFilterChange={handleFilterChange}
          userLocation={deviceLocation}
        />

        <SignalList
          signals={globalSignals}
          currentUser={currentUser}
          onSignalClick={(lat, lng) => setSelectedLocation({ lat, lng })}
          onStartChat={handleStartChat}
        />
      </main>

      <AuthModal
        isOpen={authModal.isOpen}
        type={authModal.type}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        setUser={(u) => setCurrentUser(u)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />

      <IhbarModal
        isOpen={ihbarModalOpen}
        onClose={() => { setIhbarModalOpen(false); setIhbarSignal(null); }}
        currentUser={currentUser}
        deviceLocation={deviceLocation}
        onSubmitSuccess={fetchGlobalSignals}
        signal={ihbarSignal}
      />

      <div className="fixed bottom-6 right-6 z-[4000] flex flex-row-reverse items-end gap-3">
        {activeChats.map((signal, i) => (
          <ChatPanel
            key={signal.id}
            signal={signal}
            currentUser={currentUser}
            onClose={() => handleCloseChat(signal.id)}
            isMinimized={i > 1}
          />
        ))}
      </div>

      <ToastContainer />

      <footer className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.5em]">
        İHHA Karargah Operasyon Merkezi © 2026
      </footer>
    </div>
  );
};

const ChatPanel = ({ signal, currentUser, onClose, isMinimized: initMin }) => {
  const [messages, setMessages] = useState([
    { id: 1, from: 'system', text: '-- Bağlantı kuruluyor... --' }
  ]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [minimized, setMinimized] = useState(initMin || false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, minimized]);

  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      const s = io('http://localhost:5000');
      socketRef.current = s;

      s.on('connect', () => {
        setConnected(true);
        s.emit('join_room', { signal_id: signal.id, user: currentUser });
        setMessages(prev => [...prev, { id: Date.now(), from: 'system', text: '-- Hat Bağlantısı Kuruldu --' }]);
      });

      s.on('message_history', (history) => {
        setMessages(prev => [...prev, ...history]);
      });

      s.on('receive_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        if (minimized && msg.name !== currentUser?.full_name) {
          setUnread(n => n + 1);
        }
      });

      s.on('user_joined', (msg) => {
        setMessages(prev => [...prev, { id: Date.now(), ...msg }]);
      });

      s.on('user_left', (msg) => {
        setMessages(prev => [...prev, { id: Date.now(), ...msg }]);
      });

      s.on('disconnect', () => {
        setConnected(false);
        setMessages(prev => [...prev, { id: Date.now(), from: 'system', text: '-- Bağlantı kesildi --' }]);
      });

      setSocket(s);
    });

    return () => { socketRef.current?.disconnect(); };
  }, [signal.id]);

  const send = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { signal_id: signal.id, message: input.trim() });
    setInput('');
  };

  const handleMaximize = () => {
    setMinimized(false);
    setUnread(0);
  };

  if (minimized) {
    return (
      <div className="bg-[#0d1425] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden cursor-pointer w-52" onClick={handleMaximize}>
        <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[10px] font-black uppercase text-white truncate">#{signal.id} {signal.category_name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-blue-200 hover:text-white font-bold text-xs">✕</button>
          </div>
        </div>
        <div className="px-4 py-2 text-[9px] text-slate-500 font-bold truncate">
          {signal.full_name} · {signal.beneficiary_note || 'Sinyal'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1425] border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden w-80">
      <div className="bg-blue-600 p-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">
              📟 #{signal.id} · {signal.category_name}
            </span>
          </div>
          <p className="text-[9px] text-blue-200 mt-0.5 truncate">
            👤 {signal.full_name || 'Anonim'}
            {signal.beneficiary_note && <span> · 📍 {signal.beneficiary_note}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button onClick={() => setMinimized(true)} className="text-blue-200 hover:text-white text-xs font-bold">─</button>
          <button onClick={onClose} className="text-blue-200 hover:text-white font-bold">✕</button>
        </div>
      </div>

      <div className="h-52 overflow-y-auto p-4 space-y-2 bg-[#0a0f1d]/50" style={{scrollbarWidth:'thin',scrollbarColor:'#1e3a5f transparent'}}>
        {messages.map(msg => (
          <div key={msg.id} className={`text-[10px] ${
            msg.from === 'system' ? 'text-center text-slate-600 italic font-bold uppercase' :
            msg.name === currentUser?.full_name ? 'text-right' : 'text-left'
          }`}>
            {msg.from === 'system' ? (
              <span>{msg.text}</span>
            ) : (
              <div className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl ${
                msg.name === currentUser?.full_name ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200'
              }`}>
                <p className="font-bold text-[9px] opacity-70 mb-0.5">{msg.name}</p>
                <p>{msg.text}</p>
                <p className="text-[8px] opacity-50 mt-0.5">{msg.time}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={connected ? "Mesaj yaz..." : "Bağlanıyor..."}
          disabled={!connected}
          className="flex-1 bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition disabled:opacity-50"
        />
        <button onClick={send} disabled={!connected}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition">▶</button>
      </div>
    </div>
  );
};

export default App;