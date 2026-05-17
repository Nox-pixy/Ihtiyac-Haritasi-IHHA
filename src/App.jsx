import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  <div className="flex min-h-screen bg-[#f7f5f0] text-slate-800 text-left">
    <aside className="w-64 bg-white border-r border-[#ddd8d0] flex flex-col fixed h-full shadow-sm">
      <div className="p-6 flex items-center gap-3 border-b border-[#ece8e2]">
        <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md">İ</div>
        <div>
          <h1 className="font-black uppercase tracking-tight text-slate-800 text-base leading-none">İHHA</h1>
          <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Admin Paneli</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 mt-2">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 font-black text-xs uppercase tracking-widest text-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Dashboard
        </button>
      </nav>
      <div className="p-4 border-t border-[#ece8e2]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-black text-red-500 text-xs">
            {currentUser?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-700 truncate">{currentUser?.full_name || 'Admin'}</p>
            <p className="text-[9px] text-slate-400 font-semibold">Sistem Yöneticisi</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-all text-left border border-transparent hover:border-red-100 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Güvenli Çıkış
        </button>
      </div>
    </aside>
    <main className="flex-1 ml-64 p-8 bg-[#f7f5f0] min-h-screen"><AdminPanel /></main>
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
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const [filters, setFilters] = useState({
    category: 'Hepsi', userType: 'Hepsi', radius: 999,
    rangeMode: 'TümÜlke', center: { lat: 39.0, lng: 35.0 },
    location: { city: '', district: '', neighborhood: '', displayName: 'Tüm Türkiye' },
    geoJson: null
  });

  const filtersRef = useRef(filters);
  const deviceLocationRef = useRef(deviceLocation);
  const selectedLocationRef = useRef(selectedLocation);
  const currentUserRef = useRef(currentUser);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { deviceLocationRef.current = deviceLocation; }, [deviceLocation]);
  useEffect(() => { selectedLocationRef.current = selectedLocation; }, [selectedLocation]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          sessionStorage.setItem('ihha_user', JSON.stringify(user));
          sessionStorage.setItem('ihha_token', token);
          setCurrentUser(user);
          toast.success(`Hoş geldin, ${user.full_name}!`);
        } catch { toast.error('Giriş hatası.'); }
      }
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('ihha_user') || localStorage.getItem('ihha_user');
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {} }
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
      const categoryMap = { 'Gıda': 1, 'İlaç & Tıbbi Malzeme': 2, 'Kıyafet & Tekstil': 3, 'Eşya': 4, 'Elektronik': 5, 'Gönüllü': 6 };
      const url = new URL('http://localhost:5003/api/signals');
      url.searchParams.append('all', 'true');
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
      setGlobalSignals(prev => {
        const newData = Array.isArray(data) ? data : [];
        if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
        return newData;
      });
    } catch { console.error('Radar Hatası'); }
  }, []);

  useEffect(() => {
    let socket = null;
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:5003', { transports: ['websocket'] });
      socket.on('signal_updated', () => fetchGlobalSignals());
      socket.on('signal_deleted', () => fetchGlobalSignals());
      socket.on('new_signal', () => fetchGlobalSignals());
      if (currentUser?.id) {
        socket.on(`task_accepted_${currentUser.id}`, (data) => {
          fetchGlobalSignals();
          fetch(`http://localhost:5003/api/signals?all=true`)
            .then(r => r.json())
            .then(signals => {
              const signal = Array.isArray(signals) ? signals.find(s => s.id === parseInt(data.signal_id)) : null;
              if (signal) {
                setActiveChats(chats => {
                  const exists = chats.find(c => c.signal.id === signal.id);
                  if (exists) return chats;
                  return [...chats, { signal, unread: 0 }];
                });
                setActiveChatId(signal.id);
                setMessengerOpen(true);
                toast.success('✅ Görev kabul edildi! Mesajlaşabilirsiniz.');
              }
            }).catch(() => {});
        });
        socket.on(`completion_approved_${currentUser.id}`, (data) => {
          toast.success(data.message || 'Vatandaş memnun kaldı! +50 XP 🎉');
          fetchGlobalSignals();
        });
        socket.on(`completion_rejected_${currentUser.id}`, (data) => {
          toast.warning(data.message || 'Vatandaş memnun kalmadı.');
          fetchGlobalSignals();
        });
      }
    });
    return () => { socket?.disconnect(); };
  }, [fetchGlobalSignals, currentUser?.id]);

  useEffect(() => { fetchGlobalSignals(); }, [filters, fetchGlobalSignals]);
  useEffect(() => {
    const interval = setInterval(fetchGlobalSignals, 30000);
    return () => clearInterval(interval);
  }, [fetchGlobalSignals]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleIhbarSubmit = async (payload) => {
    if (!currentUser) { toast.warning('Önce sisteme giriş yapmalısın!'); return false; }
    try {
      const res = await fetch('http://localhost:5003/api/needs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, citizen_id: currentUser.id })
      });
      if (res.ok) {
        toast.success('Sinyal gönderildi! Admin onayı bekleniyor.');
        setIsOpPanelOpen(false); setSelectedLocation(null); fetchGlobalSignals(); return true;
      } else { const err = await res.json(); toast.error(err.error || 'Sinyal gönderilemedi.'); return false; }
    } catch { toast.error('Sunucuya bağlanılamadı.'); return false; }
  };

  const handleRequestTask = async (signalId) => {
    if (!currentUser) { toast.warning('Önce karargaha giriş yapmalısın!'); return; }
    try {
      const res = await fetch('http://localhost:5003/api/signals/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, user_id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message); else toast.error(data.error);
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
  };

  const handleCompleteTask = async (signalId) => {
    if (!currentUser) return;
    try {
      const res = await fetch('http://localhost:5003/api/signals/request-completion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, user_id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message); else toast.error(data.error);
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
  };

  const handleDeleteSignal = async (signalId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:5003/api/signals/${signalId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      if (res.ok) { toast.success('Sinyal silindi.'); fetchGlobalSignals(); }
      else { const err = await res.json(); toast.error(err.error); }
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
  };

  const handleStartChat = (signal) => {
    if (!currentUser) {
      toast.warning('Sohbet için giriş yapmalısın!');
      setAuthModal({ isOpen: true, type: 'login' }); return;
    }
    setActiveChats(prev => {
      const exists = prev.find(c => c.signal.id === signal.id);
      if (exists) return prev;
      return [...prev, { signal, unread: 0 }];
    });
    setActiveChatId(signal.id);
    setMessengerOpen(true);
  };

  const handleCloseChat = (signalId) => {
    setActiveChats(prev => prev.filter(c => c.signal.id !== signalId));
    if (activeChatId === signalId) setActiveChatId(null);
  };

  const handleUnreadUpdate = (signalId, count) => {
    setActiveChats(prev => prev.map(c =>
      c.signal.id === signalId ? { ...c, unread: count } : c
    ));
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    if (id) setActiveChats(prev => prev.map(c => c.signal.id === id ? { ...c, unread: 0 } : c));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ihha_user'); localStorage.removeItem('ihha_token');
    sessionStorage.removeItem('ihha_user'); sessionStorage.removeItem('ihha_token');
    setProfileModalOpen(false); setActiveChats([]); setMessengerOpen(false);
    toast.info('Bağlantı güvenli şekilde kesildi.');
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    const storage = localStorage.getItem('ihha_user') ? localStorage : sessionStorage;
    storage.setItem('ihha_user', JSON.stringify(updatedUser));
  };

  const handleSinyal = () => {
    setIsOpPanelOpen(p => !p);
    if (isOpPanelOpen) setSelectedLocation(null);
  };

  const externalLocation = useMemo(() =>
    selectedLocation || deviceLocation,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLocation?.lat, selectedLocation?.lng, deviceLocation?.lat, deviceLocation?.lng]
  );

  const totalUnread = activeChats.reduce((sum, c) => sum + (c.unread || 0), 0);

  if (currentUser?.email === 'admin@ihha.com') return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800 font-sans text-left relative">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogin={() => setAuthModal({ isOpen: true, type: 'login' })}
        onRegister={() => setAuthModal({ isOpen: true, type: 'register' })}
        onProfileOpen={() => setProfileModalOpen(true)}
        onAcceptRequest={fetchGlobalSignals}
        onSignalsRefresh={fetchGlobalSignals}
        onOpenChats={() => setMessengerOpen(p => !p)}
        onSinyal={handleSinyal}
      />

      <main className="max-w-6xl mx-auto px-4 pt-4 pb-8 space-y-4">

        {/* ✅ OperationPanel */}
        {isOpPanelOpen && (
          <div className="pt-4">
            <OperationPanel
              currentUser={currentUser}
              selectedLocation={selectedLocation}
              onIhbarSubmit={handleIhbarSubmit}
              onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
            />
          </div>
        )}

        {/* ✅ FilterBar — sticky, header altında yapışık */}
        <div className="sticky top-[72px] z-[1999] pt-4">
          <FilterBar onFilterChange={handleFilterChange} userLocation={deviceLocation} />
        </div>

        {/* ✅ Harita — daha kısa */}
        <MapPanel
          onSelectLocation={(lat, lng) => isOpPanelOpen && setSelectedLocation({ lat, lng })}
          externalLocation={externalLocation}
          selectedLocation={selectedLocation}
          deviceLocation={deviceLocation}
          signals={globalSignals}
          filters={filters}
          currentUser={currentUser}
          onStartChat={handleStartChat}
          onRequestTask={handleRequestTask}
          onCompleteTask={handleCompleteTask}
          isOpMode={isOpPanelOpen}
          onIhbar={(signal) => { setIhbarSignal(signal); setIhbarModalOpen(true); }}
          onDeleteSignal={handleDeleteSignal}
          mapHeight="h-[320px] md:h-[440px]"
        />

        <SignalList
          signals={globalSignals}
          currentUser={currentUser}
          onSignalClick={(lat, lng) => setSelectedLocation({ lat, lng })}
          onStartChat={handleStartChat}
          onRequestTask={handleRequestTask}
          onDeleteSignal={handleDeleteSignal}
        />
      </main>

      <AuthModal
        isOpen={authModal.isOpen} type={authModal.type}
        onClose={() => setAuthModal(p => ({ ...p, isOpen: false }))}
        setUser={(u) => setCurrentUser(u)}
      />
      <ProfileModal
        isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)}
        user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate}
      />
      <IhbarModal
        isOpen={ihbarModalOpen}
        onClose={() => { setIhbarModalOpen(false); setIhbarSignal(null); }}
        currentUser={currentUser} deviceLocation={deviceLocation}
        onSubmitSuccess={fetchGlobalSignals} signal={ihbarSignal}
      />

      {currentUser && (
        <MessengerPopup
          open={messengerOpen}
          onClose={() => setMessengerOpen(false)}
          chats={activeChats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onCloseChat={handleCloseChat}
          onUnreadUpdate={handleUnreadUpdate}
          currentUser={currentUser}
        />
      )}

      {currentUser && (
        <button
          onClick={() => setMessengerOpen(p => !p)}
          className="fixed bottom-6 right-6 z-[3997] w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      <ToastContainer />

      <footer className="py-8 text-center text-[10px] text-slate-400 font-mono uppercase tracking-[0.5em]">
        İHHA Karargah Operasyon Merkezi © 2026
      </footer>
    </div>
  );
};

// ✅ WhatsApp-style Messenger Popup
const MessengerPopup = ({ open, onClose, chats, activeChatId, onSelectChat, onCloseChat, onUnreadUpdate, currentUser }) => {
  const activeChat = chats.find(c => c.signal.id === activeChatId);

  return (
    <div
      className={`fixed bottom-24 right-6 z-[4000] transition-all duration-200 ${
        open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{ width: '360px' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ddd8d0] overflow-hidden flex flex-col" style={{ height: '520px' }}>
        <div className="bg-blue-500 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {activeChat && (
              <button onClick={() => onSelectChat(null)} className="text-blue-100 hover:text-white transition shrink-0 mr-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}
            {activeChat ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0">
                  {activeChat.signal.category_name?.charAt(0) || '#'}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white truncate">#{activeChat.signal.id} · {activeChat.signal.category_name}</p>
                  <p className="text-[9px] text-blue-100 truncate">{activeChat.signal.full_name || 'Anonim'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="text-[13px] font-black text-white">Mesajlar</span>
                {chats.length > 0 && <span className="text-[9px] text-blue-200 font-semibold">{chats.length} sohbet</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition shrink-0 ml-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {activeChat ? (
          <ChatWindow
            signal={activeChat.signal}
            currentUser={currentUser}
            onBack={() => onSelectChat(null)}
            onUnreadUpdate={(count) => onUnreadUpdate(activeChat.signal.id, count)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ddd8d0 transparent' }}>
            {chats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" width="26" height="26">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-600">Henüz sohbet yok</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">Bir sinyale tıklayıp<br/>"İletişime Geç" butonuna bas.</p>
              </div>
            ) : chats.map(({ signal, unread }) => (
              <button
                key={signal.id}
                onClick={() => onSelectChat(signal.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-all text-left border-b border-[#f5f0ec] last:border-0"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm shadow-sm">
                  {signal.category_name?.charAt(0) || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">#{signal.id} · {signal.category_name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{signal.full_name || 'Anonim'}</p>
                  {signal.beneficiary_note && <p className="text-[9px] text-slate-400 truncate">📍 {signal.beneficiary_note}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {unread > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{unread}</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onCloseChat(signal.id); if (activeChatId === signal.id) onSelectChat(null); }}
                    className="text-slate-300 hover:text-red-400 transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ ChatWindow
const ChatWindow = ({ signal, currentUser, onBack, onUnreadUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const inputRef = useRef(null);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetch(`http://localhost:5003/api/messages/${signal.id}`)
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [signal.id]);

  useEffect(() => {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    let mounted = true;
    import('socket.io-client').then(({ io }) => {
      if (!mounted) return;
      const s = io('http://localhost:5003', { transports: ['websocket'], reconnectionAttempts: 5 });
      socketRef.current = s;
      s.on('connect', () => {
        if (!mounted) return;
        setConnected(true);
        s.emit('join_room', { signal_id: signal.id, user: currentUserRef.current });
      });
      s.on('receive_message', (msg) => {
        if (!mounted) return;
        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(msg.id))) return prev;
          return [...prev, msg];
        });
        if (msg.name !== currentUserRef.current?.full_name) onUnreadUpdate && onUnreadUpdate(1);
      });
      s.on('user_joined', (msg) => {
        if (!mounted) return;
        setMessages(prev => [...prev, { id: msg.id || `join_${Date.now()}`, from: 'system', text: msg.text }]);
      });
      s.on('user_left', (msg) => {
        if (!mounted) return;
        setMessages(prev => [...prev, { id: msg.id || `left_${Date.now()}`, from: 'system', text: msg.text }]);
      });
      s.on('disconnect', () => { if (!mounted) return; setConnected(false); });
    });
    return () => { mounted = false; if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
  }, [signal.id]);

  const send = useCallback(() => {
    const msg = input.trim();
    if (!msg || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { signal_id: signal.id, message: msg });
    setInput('');
    inputRef.current?.focus();
  }, [input, signal.id]);

  return (
    <>
      {!connected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-amber-600 font-semibold">Bağlanıyor...</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#f8f6f3]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ddd8d0 transparent' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <svg className="animate-spin w-6 h-6 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-[10px] text-slate-400">Yükleniyor...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto border border-[#ece8e2] shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" width="20" height="20">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-[11px] font-bold text-slate-500">Henüz mesaj yok</p>
              <p className="text-[10px] text-slate-400">İlk mesajı sen gönder!</p>
            </div>
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${
            msg.from === 'system' ? 'justify-center' :
            msg.name === currentUser?.full_name ? 'justify-end' : 'justify-start'
          }`}>
            {msg.from === 'system' ? (
              <span className="bg-white/80 border border-[#ece8e2] px-2.5 py-0.5 rounded-full text-[9px] text-slate-400 font-medium">{msg.text}</span>
            ) : msg.name === currentUser?.full_name ? (
              <div className="max-w-[75%]">
                <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl rounded-br-sm shadow-sm">
                  <p className="text-[12px] leading-relaxed">{msg.text}</p>
                </div>
                <p className="text-[8px] text-slate-400 mt-0.5 text-right pr-1">{msg.time}</p>
              </div>
            ) : (
              <div className="max-w-[75%] flex gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-black text-slate-600 shrink-0 mt-auto mb-4">
                  {msg.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-semibold mb-0.5 ml-1">{msg.name}</p>
                  <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm border border-[#ece8e2] shadow-sm">
                    <p className="text-[12px] text-slate-700 leading-relaxed">{msg.text}</p>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-0.5 ml-1">{msg.time}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-2.5 border-t border-[#ece8e2] bg-white flex gap-2 items-center shrink-0">
        <input
          ref={inputRef}
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder={connected ? 'Mesajınızı yazın...' : 'Bağlanıyor...'}
          disabled={!connected}
          className="flex-1 bg-slate-50 border border-[#ddd8d0] rounded-2xl px-3 py-2 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50 placeholder:text-slate-400"
        />
        <button
          onClick={send}
          disabled={!connected || !input.trim()}
          className="w-9 h-9 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition active:scale-95 shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default App;