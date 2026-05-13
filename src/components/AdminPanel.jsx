import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  MapPin, User, FileText, Radio, Users, Activity, CheckCircle2 
} from 'lucide-react';

export default function AdminPanel() {
  const [tab, setTab] = useState('signals'); 
  const [allSignals, setAllSignals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // 📊 Karargah Genel Durum İstatistikleri
  const stats = [
    { 
      label: "Bekleyen Sinyaller", 
      value: allSignals.filter(s => s.status === 'Beklemede').length, 
      icon: Radio, 
      color: "text-red-500", 
      bg: "bg-red-500/10" 
    },
    { 
      label: "Sistemdeki Birimler", 
      value: allUsers.length, 
      icon: Shield, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      label: "Onay Bekleyen Kayıt", 
      value: allUsers.filter(u => u.identity_doc_status === 'Beklemede').length, 
      icon: Users, 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10" 
    },
    { 
      label: "Sistem Sağlığı", 
      value: "%98", 
      icon: Activity, 
      color: "text-green-500", 
      bg: "bg-green-500/10" 
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Tüm Sinyalleri Çek (all=true sayesinde onaylananlar da gelir)
      const sigRes = await fetch('http://localhost:5000/api/signals?all=true');
      const sigData = await sigRes.json();
      setAllSignals(Array.isArray(sigData) ? sigData : []);

      // 2. Tüm Kullanıcıları Çek
      const userRes = await fetch('http://localhost:5000/api/admin/users');
      const userData = await userRes.json();
      setAllUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error("Karargah veri çekme hatası:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [tab]);

  // Sinyal Onay/Ret İşlemi
  const handleSignalAction = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/verify-signal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Sinyal ${newStatus === 'Açık' ? 'Onaylandı' : 'İptal Edildi'}.`);
        fetchData();
      }
    } catch (err) {
      alert("Sinyal güncellenemedi.");
    }
  };

  // Kullanıcı Onay/Ret İşlemi
  const handleUserVerify = async (userId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/verify-user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Kullanıcı durumu ${newStatus} olarak güncellendi.`);
        fetchData();
      }
    } catch (err) {
      alert("Kullanıcı güncellenemedi.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 📊 İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#0a0f1d] border border-white/5 p-6 rounded-[2rem] shadow-xl hover:border-blue-500/20 transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* 📑 İÇERİK YÖNETİMİ (Sekmeli Yapı) */}
      <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/5 bg-[#0d1425]">
          <button 
            onClick={() => setTab('signals')}
            className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${tab === 'signals' ? 'bg-red-500/10 text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Radio size={14} /> Sinyal Denetimi ({allSignals.filter(s => s.status === 'Beklemede').length})
          </button>
          <button 
            onClick={() => setTab('users')}
            className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${tab === 'users' ? 'bg-blue-500/10 text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Users size={14} /> Kullanıcı Yönetimi
          </button>
          <button 
            onClick={fetchData}
            className="px-8 text-slate-500 hover:text-white transition-all border-l border-white/5"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-8">
          {tab === 'signals' ? (
            <div className="space-y-4">
              {allSignals.length > 0 ? allSignals.map(signal => (
                <div key={signal.id} className={`bg-white/5 border p-6 rounded-[2rem] flex items-center justify-between transition-all group ${
                  signal.status === 'Açık' ? 'border-green-500/30' : 
                  signal.status === 'İptal' ? 'border-red-500/30 opacity-50' : 'border-white/5 hover:border-blue-500/30'
                }`}>
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-3">
                      {/* Durum Etiketi */}
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        signal.status === 'Açık' ? 'bg-green-500/10 text-green-500' : 
                        signal.status === 'İptal' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {signal.status === 'Beklemede' ? 'Sinyal Beklemede' : signal.status}
                      </span>
                      
                      {/* 🛡️ VATANDAŞ / AKINCI AYRIMI */}
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                        signal.urgency_level === 'Kritik' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {signal.urgency_level === 'Kritik' ? '🛡️ Akıncı Birimi' : '👤 Vatandaş'}
                      </span>

                      <span className="text-[10px] font-mono text-slate-600 tracking-tighter">ID: {signal.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white uppercase">{signal.category_name || 'Genel'} Talebi</h4>
                    <p className="text-xs text-slate-400 italic">"{signal.description}"</p>
                    
                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MapPin size={10} className="text-red-500" /> {Number(signal.latitude).toFixed(4)}, {Number(signal.longitude).toFixed(4)}</span>
                      <span className="flex items-center gap-1.5"><User size={10} className="text-blue-500" /> {signal.full_name || 'Birim Operatörü'}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {signal.status === 'Beklemede' ? (
                      <>
                        <button 
                          onClick={() => handleSignalAction(signal.id, 'İptal')} 
                          className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                        >
                          <XCircle size={22} />
                        </button>
                        <button 
                          onClick={() => handleSignalAction(signal.id, 'Açık')} 
                          className="p-4 bg-green-600/10 text-green-500 rounded-2xl hover:bg-green-600 hover:text-white transition-all active:scale-90"
                        >
                          <CheckCircle size={22} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 pr-4 italic">
                        <CheckCircle2 size={20} className={signal.status === 'Açık' ? 'text-green-500' : 'text-red-500'} /> 
                        {signal.status === 'Açık' ? 'Onaylandı' : 'Reddedildi'}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/5">
                  <AlertCircle className="mx-auto text-slate-800 mb-4 opacity-20" size={40} />
                  <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">Hava Sahası Temiz: Sinyal Yok</p>
                </div>
              )}
            </div>
          ) : (
            /* 👥 KULLANICI YÖNETİM TABLOSU */
            <div className="overflow-x-auto text-left animate-in slide-in-from-bottom duration-500">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                    <th className="px-6 pb-4">Birim Operatörü</th>
                    <th className="px-6 pb-4">E-Posta / Karargah Kimliği</th>
                    <th className="px-6 pb-4">Sicil Durumu</th>
                    <th className="px-6 pb-4 text-right">Denetim</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user.id} className="bg-white/5 group hover:bg-white/10 transition-all">
                      <td className="px-6 py-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-black text-[10px] uppercase">
                            {user.full_name?.charAt(0)}
                          </div>
                          <span className="font-bold text-sm text-white uppercase tracking-tight">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono italic tracking-tighter">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${
                          user.identity_doc_status === 'Onaylı' ? 'bg-green-500/10 text-green-500' : 
                          user.identity_doc_status === 'Reddedildi' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {user.identity_doc_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl text-right space-x-2">
                        <button 
                          onClick={() => setSelectedDoc(`http://localhost:5000/uploads/${user.id}_sicil.pdf`)}
                          className="text-[10px] font-black uppercase text-blue-500 hover:text-white px-3 py-1 border border-blue-500/20 rounded-lg transition-all"
                        >
                          Sicil
                        </button>
                        <button 
                          onClick={() => handleUserVerify(user.id, user.identity_doc_status === 'Onaylı' ? 'Reddedildi' : 'Onaylı')}
                          className={`text-[10px] font-black uppercase px-3 py-1 border rounded-lg transition-all ${
                            user.identity_doc_status === 'Onaylı' ? 'text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          {user.identity_doc_status === 'Onaylı' ? 'Askıya Al' : 'Onayla'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 📄 BELGE ÖNİZLEME MODALI */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-[#050810]/95 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-full bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 text-left">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0d1425]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Güvenlik Taraması</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Adli Sicil Kaydı Kontrolü</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-full transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 bg-black/20 p-4">
              <iframe 
                src={selectedDoc} 
                className="w-full h-full rounded-2xl border border-white/5 bg-white" 
                title="Sicil Kaydı Önizleme" 
              />
            </div>
            <div className="p-6 border-t border-white/5 bg-[#0d1425] flex justify-end gap-4">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-8 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Kapat
              </button>
              <button 
                className="px-8 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 hover:bg-green-500 transition-all"
              >
                Doğrula ve Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
      `}</style>
    </div>
  );
}