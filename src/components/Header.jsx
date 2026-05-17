import React, { useState, useEffect, useRef } from 'react';
import { Radar, User as UserIcon, LogOut, ShieldCheck, Menu, X, Bell, Radio } from 'lucide-react';
import { toast } from './ToastSystem';

const NOTIF_STORAGE_KEY = 'ihha_notifications';

export default function Header({ onLogin, onRegister, currentUser, onLogout, onProfileOpen, onAcceptRequest, onSignalsRefresh, onOpenChats, onSinyal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const socketRef = useRef(null);
  const notifIdRef = useRef(0);
  const nextId = () => `notif_${++notifIdRef.current}_${Date.now()}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications)); }
    catch {}
  }, [notifications]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      localStorage.removeItem(NOTIF_STORAGE_KEY);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    import('socket.io-client').then(({ io }) => {
      if (socketRef.current) socketRef.current.disconnect();
      const socket = io('http://localhost:5003');
      socketRef.current = socket;
      socket.on('connect', () => { socket.emit('register_user', { user_id: currentUser.id }); });
      socket.on(`task_request_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'task_request', read: false, ...data }]);
        toast.info(`⚡ ${data.requester_name} yardım teklif etti!`);
      });
      socket.on(`task_accepted_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'task_accepted', read: false, ...data }]);
        toast.success('✅ Teklifiniz kabul edildi!');
        onSignalsRefresh && onSignalsRefresh();
      });
      socket.on(`task_rejected_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'task_rejected', read: false, ...data }]);
        toast.warning('❌ Teklifiniz reddedildi.');
      });
      socket.on(`completion_request_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'completion_request', read: false, ...data }]);
        toast.info(`🏁 ${data.akinci_name} görevi tamamladı!`);
      });
      socket.on(`completion_approved_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'completion_approved', read: false, ...data }]);
        toast.success(data.message || '+50 XP kazandın! 🎉');
        onSignalsRefresh && onSignalsRefresh();
      });
      socket.on(`completion_rejected_${currentUser.id}`, (data) => {
        setNotifications(prev => [...prev, { id: nextId(), type: 'completion_rejected', read: false, ...data }]);
        toast.warning(data.message || 'Vatandaş memnun kalmadı.');
        onSignalsRefresh && onSignalsRefresh();
      });
    });
    return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleAccept = async (notif) => {
    try {
      const res = await fetch('http://localhost:5003/api/signals/accept-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: notif.request_id, owner_id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); clearNotif(notif.id); onAcceptRequest && onAcceptRequest(); }
      else toast.error(data.error);
    } catch { toast.error('Bağlantı hatası.'); }
  };

  const handleReject = async (notif) => {
    try {
      const res = await fetch('http://localhost:5003/api/signals/reject-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: notif.request_id, owner_id: currentUser.id })
      });
      if (res.ok) { toast.info('İstek reddedildi.'); clearNotif(notif.id); }
    } catch { toast.error('Bağlantı hatası.'); }
  };

  const handleApproveCompletion = async (notif, approved) => {
    try {
      const res = await fetch('http://localhost:5003/api/signals/approve-completion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: notif.signal_id, owner_id: currentUser.id, approved })
      });
      const data = await res.json();
      if (res.ok) { toast.success(approved ? '👍 Akıncı puanlandı!' : '👎 Kaydedildi.'); clearNotif(notif.id); onSignalsRefresh && onSignalsRefresh(); }
      else toast.error(data.error);
    } catch { toast.error('Bağlantı hatası.'); }
  };

  const renderNotif = (notif) => {
    switch (notif.type) {
      case 'task_request': return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            ⚡ <span className="text-blue-600 font-bold">{notif.requester_name}</span> sinyal #{notif.signal_id} için yardım teklif etti
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleAccept(notif)} className="flex-1 py-1.5 bg-green-100 hover:bg-green-500 text-green-700 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-green-200">✅ Kabul</button>
            <button onClick={() => handleReject(notif)} className="flex-1 py-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-red-200">❌ Reddet</button>
          </div>
        </div>
      );
      case 'task_accepted': return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-green-600">✅ Sinyal #{notif.signal_id} teklifiniz kabul edildi!</p>
          <p className="text-[10px] text-slate-400">Artık mesajlaşabilirsiniz.</p>
          <button onClick={() => clearNotif(notif.id)} className="text-[10px] text-slate-400 hover:text-red-400">Kapat</button>
        </div>
      );
      case 'task_rejected': return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-red-500">❌ Sinyal #{notif.signal_id} teklifiniz reddedildi.</p>
          <button onClick={() => clearNotif(notif.id)} className="text-[10px] text-slate-400 hover:text-red-400">Kapat</button>
        </div>
      );
      case 'completion_request': return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            🏁 <span className="text-amber-600 font-bold">{notif.akinci_name}</span> sinyal #{notif.signal_id} görevini tamamladı.
          </p>
          <p className="text-[10px] text-slate-500">Memnun kaldınız mı?</p>
          <div className="flex gap-2">
            <button onClick={() => handleApproveCompletion(notif, true)} className="flex-1 py-1.5 bg-green-100 hover:bg-green-500 text-green-700 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-green-200">👍 Evet</button>
            <button onClick={() => handleApproveCompletion(notif, false)} className="flex-1 py-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition border border-red-200">👎 Hayır</button>
          </div>
        </div>
      );
      case 'completion_approved': return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-green-600">🎉 Vatandaş memnun kaldı! +50 XP!</p>
          <button onClick={() => clearNotif(notif.id)} className="text-[10px] text-slate-400 hover:text-red-400">Kapat</button>
        </div>
      );
      case 'completion_rejected': return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-red-500">😔 Vatandaş memnun kalmadı.</p>
          <button onClick={() => clearNotif(notif.id)} className="text-[10px] text-slate-400 hover:text-red-400">Kapat</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <header className="px-6 py-4 flex justify-between items-center border-b border-[#ddd8d0] sticky top-0 z-[2000] bg-white/90 backdrop-blur-xl shadow-sm">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
          <Radar className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight uppercase leading-none text-slate-800">İHHA</h1>
          <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase hidden md:block">Operasyon Merkezi</p>
        </div>
      </div>

      {/* Desktop Sağ */}
      <div className="hidden md:flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-3">
            {/* Kullanıcı bilgisi */}
            <div className="flex flex-col items-end mr-1">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${currentUser.status === 'Onaylı' ? 'text-blue-500' : 'text-amber-500'}`}>
                  {currentUser.status === 'Onaylı' ? 'Akıncı' : 'Vatandaş'}
                </span>
                {currentUser.status === 'Onaylı' && <ShieldCheck size={10} className="text-blue-500" />}
              </div>
              <span className="text-xs font-bold text-slate-700">{currentUser.full_name}</span>
            </div>

            {/* ✅ Sinyal Gönder butonu — MessageSquare yerine */}
            <button
              onClick={() => onSinyal && onSinyal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
              title="Sinyal Talebi Gönder"
            >
              <Radio size={14} />
              <span className="hidden lg:block">Sinyal Gönder</span>
            </button>

            {/* Bildirim zili */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(p => !p); if (!notifOpen) markAllRead(); }}
                className="relative p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-all"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#ddd8d0] rounded-2xl overflow-hidden shadow-xl z-[3000]">
                  <div className="px-4 py-3 border-b border-[#ece8e2] flex items-center justify-between bg-slate-50">
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Bildirimler</span>
                    <button
                      onClick={() => { setNotifications([]); localStorage.removeItem(NOTIF_STORAGE_KEY); }}
                      className="text-[9px] text-slate-400 hover:text-red-400 font-bold uppercase"
                    >Temizle</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="mx-auto text-slate-300 mb-2" size={24} />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Bildirim yok</p>
                      </div>
                    ) : [...notifications].reverse().map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-[#ece8e2] ${!notif.read ? 'bg-blue-50/50' : 'bg-white'}`}>
                        {renderNotif(notif)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profil dropdown */}
            <div className="group relative">
              <button className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-500 transition-all">
                <UserIcon size={18} />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#ddd8d0] rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-[3000] translate-y-1 group-hover:translate-y-0">
                <div className="p-3 border-b border-[#ece8e2] mb-1">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Güven Skoru</p>
                    <span className="text-[9px] font-bold text-blue-500">{currentUser.trust_score || 100}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all" style={{ width: `${currentUser.trust_score || 100}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold">🏅 {currentUser.akinci_xp || 0} XP</p>
                </div>
                <button onClick={onProfileOpen} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition text-slate-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Profil Detayları
                </button>
                <div className="h-px bg-[#ece8e2] my-1" />
                <button onClick={onLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 transition flex items-center justify-between">
                  <span>Güvenli Çıkış</span><LogOut size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-blue-500 transition uppercase tracking-widest">Giriş Yap</button>
            <button onClick={onRegister} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition shadow-md uppercase">Kayıt Ol</button>
          </div>
        )}
      </div>

      {/* Mobil */}
      <div className="flex md:hidden items-center gap-2">
        {currentUser && (
          <button onClick={() => { setNotifOpen(p => !p); if (!notifOpen) markAllRead(); }} className="relative p-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
        )}
        <button onClick={() => setMobileMenuOpen(p => !p)} className="p-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* Mobil bildirim */}
      {notifOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#ddd8d0] p-4 md:hidden z-[2001] shadow-xl max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase text-slate-600">Bildirimler</span>
            <button onClick={() => { setNotifications([]); localStorage.removeItem(NOTIF_STORAGE_KEY); }} className="text-[9px] text-red-400 font-bold uppercase">Temizle</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase py-4">Bildirim yok</p>
          ) : [...notifications].reverse().map(notif => (
            <div key={notif.id} className="mb-3 p-3 bg-slate-50 rounded-xl border border-[#ece8e2]">{renderNotif(notif)}</div>
          ))}
        </div>
      )}

      {/* Mobil menü */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#ddd8d0] p-4 space-y-3 md:hidden z-[2001] shadow-xl">
          {currentUser ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-white text-sm">
                  {currentUser.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{currentUser.full_name}</p>
                  <p className={`text-[9px] font-black uppercase ${currentUser.status === 'Onaylı' ? 'text-blue-500' : 'text-amber-500'}`}>
                    {currentUser.status === 'Onaylı' ? '🛡️ Akıncı' : '👤 Vatandaş'} · {currentUser.akinci_xp || 0} XP
                  </p>
                </div>
              </div>
              <button onClick={() => { onSinyal && onSinyal(); setMobileMenuOpen(false); }} className="w-full p-3 bg-blue-50 rounded-xl text-xs font-bold text-blue-600 text-left border border-blue-100 flex items-center gap-2">
                <Radio size={14} /> 📡 Sinyal Talebi Gönder
              </button>
              <button onClick={() => { onProfileOpen(); setMobileMenuOpen(false); }} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 text-left border border-[#ece8e2]">👤 Profil Detayları</button>
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full p-3 bg-red-50 rounded-xl text-xs font-bold text-red-400 text-left border border-red-100">🔒 Güvenli Çıkış</button>
            </>
          ) : (
            <>
              <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-[#ece8e2]">Giriş Yap</button>
              <button onClick={() => { onRegister(); setMobileMenuOpen(false); }} className="w-full p-3 bg-blue-500 rounded-xl text-xs font-black text-white">Kayıt Ol</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}