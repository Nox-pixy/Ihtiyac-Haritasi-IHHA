import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  MapPin, User, FileText, Radio, Users, Activity, CheckCircle2,
  Plus, Trash2, AlertTriangle, Tag, Bell, Settings, ChevronDown, ChevronRight, Search
} from 'lucide-react';

export default function AdminPanel() {
  const [tab, setTab] = useState('signals'); 
  const [allSignals, setAllSignals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [expandedCat, setExpandedCat] = useState(null);
  const [disasterZones, setDisasterZones] = useState([]);
  const [ihbarlar, setIhbarlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocUserId, setSelectedDocUserId] = useState(null);

  // Kategori formları
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');

  // Afet bölgesi form — adres aramalı
  const [disasterForm, setDisasterForm] = useState({
    title: '', description: '', address: '', latitude: '', longitude: '', radius: 10, severity: 'Yüksek'
  });
  const [disasterSearching, setDisasterSearching] = useState(false);

  // Admin ayarları
  const [adminForm, setAdminForm] = useState({ email: '', password: '', currentPassword: '' });
  const [adminSaving, setAdminSaving] = useState(false);

  const stats = [
    { label: "Bekleyen Sinyaller", value: allSignals.filter(s => s.status === 'Beklemede').length, icon: Radio, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Sistemdeki Birimler", value: allUsers.length, icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Onay Bekleyen Kayıt", value: allUsers.filter(u => u.identity_doc_status === 'Beklemede').length, icon: Users, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Aktif Afet Bölgesi", value: disasterZones.length, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, userRes, catRes, dzRes, ihbarRes] = await Promise.all([
        fetch('http://localhost:5000/api/signals?all=true'),
        fetch('http://localhost:5000/api/admin/users'),
        fetch('http://localhost:5000/api/categories'),
        fetch('http://localhost:5000/api/disaster-zones'),
        fetch('http://localhost:5000/api/admin/ihbarlar'),
      ]);
      const [sigData, userData, catData, dzData, ihbarData] = await Promise.all([
        sigRes.json(), userRes.json(), catRes.json(), dzRes.json(), ihbarRes.json()
      ]);
      setAllSignals(Array.isArray(sigData) ? sigData : []);
      setAllUsers(Array.isArray(userData) ? userData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setDisasterZones(Array.isArray(dzData) ? dzData : []);
      setIhbarlar(Array.isArray(ihbarData) ? ihbarData : []);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // Alt kategorileri çek
  const fetchSubcategories = async (catId) => {
    if (subcategories[catId]) return;
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${catId}/subcategories`);
      const data = await res.json();
      setSubcategories(prev => ({ ...prev, [catId]: Array.isArray(data) ? data : [] }));
    } catch { setSubcategories(prev => ({ ...prev, [catId]: [] })); }
  };

  const toggleCat = (catId) => {
    if (expandedCat === catId) { setExpandedCat(null); return; }
    setExpandedCat(catId);
    fetchSubcategories(catId);
  };

  const handleSignalAction = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/verify-signal/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) { fetchData(); }
    } catch { alert("Sinyal güncellenemedi."); }
  };

  const handleUserVerify = async (userId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/verify-user/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) { fetchData(); }
    } catch { alert("Kullanıcı güncellenemedi."); }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });
      const data = await res.json();
      if (res.ok) { setNewCategory(''); fetchData(); }
      else alert(data.error);
    } catch { alert("Kategori eklenemedi."); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istiyor musunuz?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch { alert("Silinemedi."); }
  };

  const handleAddSubcategory = async (catId) => {
    if (!newSubcategory.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/subcategories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: catId, name: newSubcategory.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNewSubcategory('');
        setSubcategories(prev => ({ ...prev, [catId]: [...(prev[catId] || []), data] }));
      } else alert(data.error);
    } catch { alert("Alt kategori eklenemedi."); }
  };

  const handleDeleteSubcategory = async (catId, subId) => {
    try {
      await fetch(`http://localhost:5000/api/admin/subcategories/${subId}`, { method: 'DELETE' });
      setSubcategories(prev => ({ ...prev, [catId]: prev[catId].filter(s => s.id !== subId) }));
    } catch { alert("Silinemedi."); }
  };

  // ✅ Afet bölgesi adres araması
  const searchDisasterAddress = async () => {
    if (!disasterForm.address.trim()) return;
    setDisasterSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(disasterForm.address + ', Türkiye')}&countrycodes=tr&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setDisasterForm(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
        alert(`Konum bulundu: ${data[0].display_name.substring(0, 80)}`);
      } else { alert('Adres bulunamadı. Farklı bir ifade deneyin.'); }
    } catch { alert('Arama başarısız.'); }
    finally { setDisasterSearching(false); }
  };

  const handleAddDisasterZone = async () => {
    const { title, latitude, longitude, radius, severity, description } = disasterForm;
    if (!title) { alert('Bölge adı zorunludur.'); return; }
    if (!latitude || !longitude) { alert('Önce konum araması yapın.'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/admin/disaster-zones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, latitude: parseFloat(latitude), longitude: parseFloat(longitude), radius: parseInt(radius), severity })
      });
      if (res.ok) {
        setDisasterForm({ title: '', description: '', address: '', latitude: '', longitude: '', radius: 10, severity: 'Yüksek' });
        fetchData();
      }
    } catch { alert("Afet bölgesi eklenemedi."); }
  };

  const handleDeleteDisasterZone = async (id) => {
    if (!window.confirm('Bu afet bölgesini kaldırmak istiyor musunuz?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/disaster-zones/${id}`, { method: 'DELETE' });
      fetchData();
    } catch { alert("Silinemedi."); }
  };

  // ✅ Admin kimlik güncelleme
  const handleChangeCredentials = async () => {
    if (!adminForm.currentPassword) { alert('Mevcut şifrenizi girin.'); return; }
    if (!adminForm.email && !adminForm.password) { alert('Yeni e-posta veya şifre girin.'); return; }
    setAdminSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/change-credentials', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: adminForm.email || undefined,
          new_password: adminForm.password || undefined,
          current_password: adminForm.currentPassword
        })
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); setAdminForm({ email: '', password: '', currentPassword: '' }); }
      else alert(data.error);
    } catch { alert('Güncelleme başarısız.'); }
    finally { setAdminSaving(false); }
  };

  const tabs = [
    { key: 'signals',    label: 'Sinyaller',   icon: Radio,          badge: allSignals.filter(s => s.status === 'Beklemede').length },
    { key: 'users',      label: 'Kullanıcılar', icon: Users,          badge: 0 },
    { key: 'ihbar',      label: 'İhbarlar',     icon: Bell,           badge: ihbarlar.length },
    { key: 'categories', label: 'Kategoriler',  icon: Tag,            badge: 0 },
    { key: 'disaster',   label: 'Afet Bölgesi', icon: AlertTriangle,  badge: disasterZones.length },
    { key: 'settings',   label: 'Ayarlar',      icon: Settings,       badge: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* İstatistik Kartları */}
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

      {/* Sekme Paneli */}
      <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/5 bg-[#0d1425] overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-5 py-5 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 border-b-2 ${
                tab === t.key ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              <t.icon size={13} />
              {t.label}
              {t.badge > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>
              )}
            </button>
          ))}
          <button onClick={fetchData} className="ml-auto px-6 text-slate-500 hover:text-white transition-all border-l border-white/5 flex-shrink-0">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-8">

          {/* ── SİNYAL DENETİMİ ── */}
          {tab === 'signals' && (
            <div className="space-y-4">
              {allSignals.length > 0 ? allSignals.map(signal => (
                <div key={signal.id} className={`bg-white/5 border p-6 rounded-[2rem] flex items-center justify-between transition-all ${
                  signal.status === 'Açık' ? 'border-green-500/30' :
                  signal.status === 'İptal' ? 'border-red-500/30 opacity-50' :
                  signal.status === 'Tamamlandı' ? 'border-teal-500/30 opacity-70' :
                  'border-white/5 hover:border-blue-500/30'
                }`}>
                  <div className="text-left space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                        signal.status === 'Açık' ? 'bg-green-500/10 text-green-500' :
                        signal.status === 'İptal' ? 'bg-red-500/10 text-red-500' :
                        signal.status === 'Tamamlandı' ? 'bg-teal-500/10 text-teal-400' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>{signal.status === 'Beklemede' ? '⏳ Beklemede' : signal.status}</span>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${
                        signal.urgency_level === 'Kritik' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>{signal.urgency_level === 'Kritik' ? '🛡️ Akıncı' : '👤 Vatandaş'}</span>
                      <span className="text-[9px] font-mono text-slate-600">#{signal.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase">{signal.category_name || 'Genel'} Talebi</h4>
                    <p className="text-xs text-slate-400 italic truncate max-w-lg">"{signal.description}"</p>
                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-red-500" /> {Number(signal.latitude).toFixed(4)}, {Number(signal.longitude).toFixed(4)}</span>
                      <span className="flex items-center gap-1"><User size={10} className="text-blue-500" /> {signal.full_name || 'Anonim'}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0 ml-4">
                    {signal.status === 'Beklemede' ? (
                      <>
                        <button onClick={() => handleSignalAction(signal.id, 'İptal')} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"><XCircle size={22} /></button>
                        <button onClick={() => handleSignalAction(signal.id, 'Açık')} className="p-4 bg-green-600/10 text-green-500 rounded-2xl hover:bg-green-600 hover:text-white transition-all active:scale-90"><CheckCircle size={22} /></button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 pr-4 italic">
                        <CheckCircle2 size={20} className={signal.status === 'Açık' || signal.status === 'Tamamlandı' ? 'text-green-500' : 'text-red-500'} />
                        {signal.status}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/5">
                  <AlertCircle className="mx-auto text-slate-800 mb-4 opacity-20" size={40} />
                  <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">Sinyal Yok</p>
                </div>
              )}
            </div>
          )}

          {/* ── KULLANICI YÖNETİMİ ── */}
          {tab === 'users' && (
            <div className="overflow-x-auto text-left">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                    <th className="px-6 pb-4">Kullanıcı</th>
                    <th className="px-6 pb-4">E-Posta</th>
                    <th className="px-6 pb-4">Sicil Durumu</th>
                    <th className="px-6 pb-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user.id} className="bg-white/5 hover:bg-white/10 transition-all">
                      <td className="px-6 py-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-black text-[10px] uppercase">{user.full_name?.charAt(0)}</div>
                          <span className="font-bold text-sm text-white uppercase">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono italic">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${
                          user.identity_doc_status === 'Onaylı' ? 'bg-green-500/10 text-green-500' :
                          user.identity_doc_status === 'Reddedildi' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>{user.identity_doc_status?.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl text-right space-x-2">
                        <button onClick={() => {
                          if (user.identity_doc_path) { setSelectedDoc(`http://localhost:5000/uploads/${user.identity_doc_path}`); setSelectedDocUserId(user.id); }
                          else alert('Belge yüklememiş.');
                        }} className="text-[10px] font-black uppercase text-blue-500 hover:text-white px-3 py-1 border border-blue-500/20 rounded-lg transition-all">Sicil</button>
                        <button onClick={() => handleUserVerify(user.id, user.identity_doc_status === 'Onaylı' ? 'Reddedildi' : 'Onaylı')}
                          className={`text-[10px] font-black uppercase px-3 py-1 border rounded-lg transition-all ${
                            user.identity_doc_status === 'Onaylı' ? 'text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                          }`}>{user.identity_doc_status === 'Onaylı' ? 'Askıya Al' : 'Onayla'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── İHBAR BİLDİRİMLERİ ── */}
          {tab === 'ihbar' && (
            <div className="space-y-4">
              {ihbarlar.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <Bell className="mx-auto text-slate-800 mb-4 opacity-20" size={40} />
                  <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Bekleyen ihbar yok</p>
                </div>
              ) : ihbarlar.map(ihbar => (
                <div key={ihbar.id} className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2rem] flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black px-3 py-1 rounded-full bg-red-500/20 text-red-400 uppercase">🚨 ACİL İHBAR</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{ihbar.category_name}</span>
                      <span className="text-[9px] font-mono text-slate-600">#{ihbar.id}</span>
                    </div>
                    <p className="text-xs text-slate-300 italic truncate max-w-lg">"{ihbar.description}"</p>
                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase flex-wrap">
                      <span className="flex items-center gap-1"><User size={10} className="text-blue-500" /> {ihbar.full_name || 'Anonim'}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-red-500" /> {Number(ihbar.latitude).toFixed(4)}, {Number(ihbar.longitude).toFixed(4)}</span>
                      {ihbar.beneficiary_note && <span>📍 {ihbar.beneficiary_note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleSignalAction(ihbar.id, 'İptal')} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={18} /></button>
                    <button onClick={() => handleSignalAction(ihbar.id, 'Açık')} className="p-3 bg-green-600/10 text-green-500 rounded-2xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── KATEGORİ YÖNETİMİ ── */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <Tag size={16} className="text-blue-400" /> Yeni Ana Kategori Ekle
                </h3>
                <div className="flex gap-3">
                  <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Kategori adı..."
                    className="flex-1 bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition" />
                  <button onClick={handleAddCategory}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase transition flex items-center gap-2">
                    <Plus size={16} /> Ekle
                  </button>
                </div>
              </div>

              {/* Kategoriler + Alt kategoriler */}
              <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all">
                    <div className="p-4 flex items-center justify-between">
                      <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                          <Tag size={14} />
                        </div>
                        <span className="text-sm font-bold text-white">{cat.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold">
                          {subcategories[cat.id] ? `${subcategories[cat.id].length} alt kategori` : ''}
                        </span>
                        {expandedCat === cat.id ? <ChevronDown size={14} className="text-slate-500 ml-auto" /> : <ChevronRight size={14} className="text-slate-500 ml-auto" />}
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Alt kategoriler */}
                    {expandedCat === cat.id && (
                      <div className="border-t border-white/5 p-4 space-y-3 bg-[#0a0f1d]/50">
                        <div className="flex gap-2">
                          <input type="text" value={newSubcategory} onChange={e => setNewSubcategory(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                            placeholder={`${cat.name} için alt kategori...`}
                            className="flex-1 bg-[#0a0f1d] border border-white/10 px-3 py-2 rounded-lg text-xs font-bold text-white outline-none focus:border-blue-500 transition" />
                          <button onClick={() => handleAddSubcategory(cat.id)}
                            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition flex items-center gap-1">
                            <Plus size={14} />
                          </button>
                        </div>
                        {(subcategories[cat.id] || []).length === 0 ? (
                          <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-2">Alt kategori yok</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {(subcategories[cat.id] || []).map(sub => (
                              <div key={sub.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg group">
                                <span className="text-xs font-bold text-slate-300">↳ {sub.name}</span>
                                <button onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                  className="text-slate-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AFET BÖLGESİ ── */}
          {tab === 'disaster' && (
            <div className="space-y-6">
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2rem] space-y-4">
                <h3 className="text-sm font-black uppercase text-red-400 tracking-widest flex items-center gap-2">
                  <AlertTriangle size={16} /> Afet Bölgesi İşaretle
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Bölge adı (örn: Hatay Depremi 2025)" value={disasterForm.title}
                    onChange={e => setDisasterForm({...disasterForm, title: e.target.value})}
                    className="bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-red-500 transition col-span-full" />
                  <input type="text" placeholder="Açıklama (opsiyonel)" value={disasterForm.description}
                    onChange={e => setDisasterForm({...disasterForm, description: e.target.value})}
                    className="bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-red-500 transition col-span-full" />

                  {/* ✅ Adres araması */}
                  <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Şehir veya İlçe</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="örn: Hatay, Antakya, Kahramanmaraş..." value={disasterForm.address}
                        onChange={e => setDisasterForm({...disasterForm, address: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && searchDisasterAddress()}
                        className="flex-1 bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-red-500 transition" />
                      <button onClick={searchDisasterAddress}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition flex items-center gap-2 border border-red-500/20">
                        <Search size={14} />
                        {disasterSearching ? 'Aranıyor...' : 'Bul'}
                      </button>
                    </div>
                    {disasterForm.latitude && (
                      <p className="text-[10px] text-green-400 font-bold ml-1">
                        ✅ Konum: {parseFloat(disasterForm.latitude).toFixed(4)}, {parseFloat(disasterForm.longitude).toFixed(4)}
                      </p>
                    )}
                    {!disasterForm.latitude && (
                      <p className="text-[9px] text-slate-600 font-bold ml-1">Şehir veya ilçe adı yazıp "Bul" butonuna tıklayın</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Yarıçap: {disasterForm.radius} km</label>
                    <input type="range" min="1" max="300" value={disasterForm.radius}
                      onChange={e => setDisasterForm({...disasterForm, radius: parseInt(e.target.value)})}
                      className="w-full accent-red-500" />
                  </div>
                  <select value={disasterForm.severity} onChange={e => setDisasterForm({...disasterForm, severity: e.target.value})}
                    className="bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-red-500 transition">
                    <option value="Düşük">Düşük Tehlike</option>
                    <option value="Orta">Orta Tehlike</option>
                    <option value="Yüksek">Yüksek Tehlike</option>
                    <option value="Kritik">Kritik Tehlike</option>
                  </select>
                </div>
                <button onClick={handleAddDisasterZone}
                  disabled={!disasterForm.latitude}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> Afet Bölgesini Haritaya İşaretle
                </button>
              </div>

              <div className="space-y-3">
                {disasterZones.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-[2rem]">
                    <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Aktif afet bölgesi yok</p>
                  </div>
                ) : disasterZones.map(zone => (
                  <div key={zone.id} className="bg-red-500/5 border border-red-500/20 p-5 rounded-[2rem] flex items-center justify-between group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black px-3 py-1 rounded-full bg-red-500/20 text-red-400 uppercase">🚨 {zone.severity}</span>
                        <span className="text-sm font-bold text-white">{zone.title}</span>
                      </div>
                      {zone.description && <p className="text-xs text-slate-400 italic">{zone.description}</p>}
                      <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                        <MapPin size={10} className="text-red-400" />
                        {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)}
                        · {zone.radius} km yarıçap
                      </p>
                    </div>
                    <button onClick={() => handleDeleteDisasterZone(zone.id)}
                      className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AYARLAR ── */}
          {tab === 'settings' && (
            <div className="max-w-md space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-blue-400" /> Admin Kimlik Bilgileri
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">Yalnızca değiştirmek istediğiniz alanı doldurun.</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Yeni E-Posta (opsiyonel)</label>
                    <input type="email" placeholder="yeni@email.com" value={adminForm.email}
                      onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Yeni Şifre (opsiyonel)</label>
                    <input type="password" placeholder="••••••••" value={adminForm.password}
                      onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-red-500 ml-1">Mevcut Şifre (zorunlu)</label>
                    <input type="password" placeholder="Doğrulama için mevcut şifreniz" value={adminForm.currentPassword}
                      onChange={e => setAdminForm({...adminForm, currentPassword: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-red-500/20 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-red-500 transition" />
                  </div>
                  <button onClick={handleChangeCredentials} disabled={adminSaving}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black uppercase transition">
                    {adminSaving ? 'Güncelleniyor...' : '🔐 Kimlik Bilgilerini Güncelle'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Sistem Bilgisi</h3>
                <div className="space-y-2 text-[11px] font-bold text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase text-[9px]">Versiyon</span>
                    <span className="text-white">İHHA v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase text-[9px]">Backend</span>
                    <span className="text-green-400">● Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase text-[9px]">WebSocket</span>
                    <span className="text-green-400">● Bağlı</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Belge Önizleme */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-[#050810]/95 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-full bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 text-left">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0d1425]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><FileText size={20} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Güvenlik Taraması</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Adli Sicil Kaydı</p>
                </div>
              </div>
              <button onClick={() => { setSelectedDoc(null); setSelectedDocUserId(null); }}
                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-full transition-all">
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 bg-black/20 p-4">
              <iframe src={selectedDoc} className="w-full h-full rounded-2xl border border-white/5 bg-white" title="Sicil Kaydı" />
            </div>
            <div className="p-6 border-t border-white/5 bg-[#0d1425] flex justify-end gap-4">
              <button onClick={() => { setSelectedDoc(null); setSelectedDocUserId(null); }}
                className="px-8 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">Kapat</button>
              <button onClick={() => { if (selectedDocUserId) { handleUserVerify(selectedDocUserId, 'Onaylı'); setSelectedDoc(null); setSelectedDocUserId(null); } }}
                className="px-8 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-500 transition-all">
                Doğrula ve Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}