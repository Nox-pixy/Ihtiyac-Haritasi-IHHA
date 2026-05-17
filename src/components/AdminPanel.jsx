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

  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');

  const [disasterForm, setDisasterForm] = useState({
    title: '', description: '', address: '', latitude: '', longitude: '', radius: 10, severity: 'Yüksek'
  });
  const [disasterSearching, setDisasterSearching] = useState(false);

  const [adminForm, setAdminForm] = useState({ email: '', password: '', currentPassword: '' });
  const [adminSaving, setAdminSaving] = useState(false);

  const stats = [
    { label: "Bekleyen Sinyaller", value: allSignals.filter(s => s.status === 'Beklemede').length, icon: Radio, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { label: "Sistemdeki Birimler", value: allUsers.length, icon: Shield, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Onay Bekleyen Kayıt", value: allUsers.filter(u => u.identity_doc_status === 'Beklemede').length, icon: Users, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Aktif Afet Bölgesi", value: disasterZones.length, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, userRes, catRes, dzRes, ihbarRes] = await Promise.all([
        fetch('http://localhost:5003/api/signals?all=true'),
        fetch('http://localhost:5003/api/admin/users'),
        fetch('http://localhost:5003/api/categories'),
        fetch('http://localhost:5003/api/disaster-zones'),
        fetch('http://localhost:5003/api/admin/ihbarlar'),
      ]);
      const [sigData, userData, catData, dzData, ihbarData] = await Promise.all([
        sigRes.json(), userRes.json(), catRes.json(), dzRes.json(), ihbarRes.json()
      ]);
      setAllSignals(Array.isArray(sigData) ? sigData : []);
      setAllUsers(Array.isArray(userData) ? userData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setDisasterZones(Array.isArray(dzData) ? dzData : []);
      setIhbarlar(Array.isArray(ihbarData) ? ihbarData : []);
    } catch (err) { console.error("Veri çekme hatası:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const fetchSubcategories = async (catId) => {
    if (subcategories[catId]) return;
    try {
      const res = await fetch(`http://localhost:5003/api/categories/${catId}/subcategories`);
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
      const res = await fetch(`http://localhost:5003/api/admin/verify-signal/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch { alert("Sinyal güncellenemedi."); }
  };

  const handleUserVerify = async (userId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5003/api/admin/verify-user/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch { alert("Kullanıcı güncellenemedi."); }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch('http://localhost:5003/api/admin/categories', {
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
      await fetch(`http://localhost:5003/api/admin/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch { alert("Silinemedi."); }
  };

  const handleAddSubcategory = async (catId) => {
    if (!newSubcategory.trim()) return;
    try {
      const res = await fetch('http://localhost:5003/api/admin/subcategories', {
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
      await fetch(`http://localhost:5003/api/admin/subcategories/${subId}`, { method: 'DELETE' });
      setSubcategories(prev => ({ ...prev, [catId]: prev[catId].filter(s => s.id !== subId) }));
    } catch { alert("Silinemedi."); }
  };

  const searchDisasterAddress = async () => {
    if (!disasterForm.address.trim()) return;
    setDisasterSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(disasterForm.address + ', Türkiye')}&countrycodes=tr&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setDisasterForm(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
        alert(`Konum bulundu: ${data[0].display_name.substring(0, 80)}`);
      } else { alert('Adres bulunamadı.'); }
    } catch { alert('Arama başarısız.'); }
    finally { setDisasterSearching(false); }
  };

  const handleAddDisasterZone = async () => {
    const { title, latitude, longitude, radius, severity, description } = disasterForm;
    if (!title) { alert('Bölge adı zorunludur.'); return; }
    if (!latitude || !longitude) { alert('Önce konum araması yapın.'); return; }
    try {
      const res = await fetch('http://localhost:5003/api/admin/disaster-zones', {
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
      await fetch(`http://localhost:5003/api/admin/disaster-zones/${id}`, { method: 'DELETE' });
      fetchData();
    } catch { alert("Silinemedi."); }
  };

  const handleChangeCredentials = async () => {
    if (!adminForm.currentPassword) { alert('Mevcut şifrenizi girin.'); return; }
    if (!adminForm.email && !adminForm.password) { alert('Yeni e-posta veya şifre girin.'); return; }
    setAdminSaving(true);
    try {
      const res = await fetch('http://localhost:5003/api/admin/change-credentials', {
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
    { key: 'signals',    label: 'Sinyaller',   icon: Radio,         badge: allSignals.filter(s => s.status === 'Beklemede').length },
    { key: 'users',      label: 'Kullanıcılar', icon: Users,         badge: 0 },
    { key: 'ihbar',      label: 'İhbarlar',     icon: Bell,          badge: ihbarlar.length },
    { key: 'categories', label: 'Kategoriler',  icon: Tag,           badge: 0 },
    { key: 'disaster',   label: 'Afet Bölgesi', icon: AlertTriangle, badge: disasterZones.length },
    { key: 'settings',   label: 'Ayarlar',      icon: Settings,      badge: 0 },
  ];

  // ✅ Açık tema input sınıfı
  const inputCls = "w-full bg-white border border-[#ddd8d0] px-4 py-3 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400";

  return (
    <div className="space-y-6 text-left">

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white border ${stat.border} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Sekme Paneli */}
      <div className="bg-white border border-[#ddd8d0] rounded-3xl overflow-hidden shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-[#ece8e2] bg-[#f7f5f0] overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                tab === t.key
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/60'
              }`}>
              <t.icon size={13} />
              {t.label}
              {t.badge > 0 && (
                <span className="bg-red-400 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>
              )}
            </button>
          ))}
          <button onClick={fetchData} className="ml-auto px-6 text-slate-400 hover:text-slate-700 transition-all border-l border-[#ece8e2] flex-shrink-0">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-6">

          {/* ── SİNYAL DENETİMİ ── */}
          {tab === 'signals' && (
            <div className="space-y-3">
              {allSignals.length > 0 ? allSignals.map(signal => (
                <div key={signal.id} className={`bg-white border p-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
                  signal.status === 'Açık' ? 'border-green-200 bg-green-50/30' :
                  signal.status === 'İptal' ? 'border-red-200 opacity-60' :
                  signal.status === 'Tamamlandı' ? 'border-teal-200 opacity-70' :
                  'border-[#ece8e2] hover:border-blue-200'
                }`}>
                  <div className="text-left space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                        signal.status === 'Açık' ? 'bg-green-100 text-green-600' :
                        signal.status === 'İptal' ? 'bg-red-100 text-red-500' :
                        signal.status === 'Tamamlandı' ? 'bg-teal-100 text-teal-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>{signal.status === 'Beklemede' ? '⏳ Beklemede' : signal.status}</span>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                        signal.urgency_level === 'Kritik' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>{signal.urgency_level === 'Kritik' ? '🛡️ Akıncı' : '👤 Vatandaş'}</span>
                      <span className="text-[9px] font-mono text-slate-400">#{signal.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{signal.category_name || 'Genel'} Talebi</h4>
                    {signal.description && <p className="text-xs text-slate-500 italic truncate max-w-lg">"{signal.description}"</p>}
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={9} className="text-red-400" /> {Number(signal.latitude).toFixed(4)}, {Number(signal.longitude).toFixed(4)}</span>
                      <span className="flex items-center gap-1"><User size={9} className="text-blue-400" /> {signal.full_name || 'Anonim'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    {signal.status === 'Beklemede' ? (
                      <>
                        <button onClick={() => handleSignalAction(signal.id, 'İptal')}
                          className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 active:scale-90">
                          <XCircle size={18} />
                        </button>
                        <button onClick={() => handleSignalAction(signal.id, 'Açık')}
                          className="p-3 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-100 active:scale-90">
                          <CheckCircle size={18} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 pr-2 italic">
                        <CheckCircle2 size={16} className={signal.status === 'Açık' || signal.status === 'Tamamlandı' ? 'text-green-500' : 'text-red-400'} />
                        {signal.status}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-[#ece8e2] rounded-2xl">
                  <AlertCircle className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sinyal Yok</p>
                </div>
              )}
            </div>
          )}

          {/* ── KULLANICI YÖNETİMİ — SİCİL KOLONU KALDIRILDI ── */}
          {tab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-4 pb-3 text-left">Kullanıcı</th>
                    <th className="px-4 pb-3 text-left">E-Posta</th>
                    <th className="px-4 pb-3 text-left">Durum</th>
                    <th className="px-4 pb-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user.id} className="bg-white border border-[#ece8e2] rounded-2xl hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                      <td className="px-4 py-3 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-black text-[11px] uppercase shrink-0">
                            {user.full_name?.charAt(0)}
                          </div>
                          <span className="font-bold text-sm text-slate-800">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                          user.identity_doc_status === 'Onaylı' ? 'bg-green-100 text-green-600' :
                          user.identity_doc_status === 'Reddedildi' ? 'bg-red-100 text-red-500' :
                          'bg-amber-100 text-amber-600'
                        }`}>{user.identity_doc_status?.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 rounded-r-2xl text-right">
                        {/* ✅ Sicil butonu KALDIRILDI */}
                        <button
                          onClick={() => handleUserVerify(user.id, user.identity_doc_status === 'Onaylı' ? 'Reddedildi' : 'Onaylı')}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 border rounded-lg transition-all ${
                            user.identity_doc_status === 'Onaylı'
                              ? 'text-red-500 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500'
                              : 'text-green-600 border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500'
                          }`}>
                          {user.identity_doc_status === 'Onaylı' ? 'Askıya Al' : 'Onayla'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── İHBAR BİLDİRİMLERİ ── */}
          {tab === 'ihbar' && (
            <div className="space-y-3">
              {ihbarlar.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#ece8e2] rounded-2xl">
                  <Bell className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Bekleyen ihbar yok</p>
                </div>
              ) : ihbarlar.map(ihbar => (
                <div key={ihbar.id} className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-500 uppercase">🚨 Acil İhbar</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{ihbar.category_name}</span>
                      <span className="text-[9px] font-mono text-slate-400">#{ihbar.id}</span>
                    </div>
                    {ihbar.description && <p className="text-xs text-slate-600 italic truncate max-w-lg">"{ihbar.description}"</p>}
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase flex-wrap">
                      <span className="flex items-center gap-1"><User size={9} className="text-blue-400" /> {ihbar.full_name || 'Anonim'}</span>
                      <span className="flex items-center gap-1"><MapPin size={9} className="text-red-400" /> {Number(ihbar.latitude).toFixed(4)}, {Number(ihbar.longitude).toFixed(4)}</span>
                      {ihbar.beneficiary_note && <span>📍 {ihbar.beneficiary_note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleSignalAction(ihbar.id, 'İptal')}
                      className="p-2.5 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-200">
                      <XCircle size={16} />
                    </button>
                    <button onClick={() => handleSignalAction(ihbar.id, 'Açık')}
                      className="p-2.5 bg-white text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-200">
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── KATEGORİ YÖNETİMİ ── */}
          {tab === 'categories' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-[#ddd8d0] p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                  <Tag size={14} className="text-blue-500" /> Yeni Ana Kategori
                </h3>
                <div className="flex gap-2">
                  <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Kategori adı..."
                    className={inputCls} />
                  <button onClick={handleAddCategory}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1.5">
                    <Plus size={14} /> Ekle
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white border border-[#ddd8d0] rounded-2xl overflow-hidden hover:border-blue-200 transition-all">
                    <div className="p-4 flex items-center justify-between">
                      <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                          <Tag size={13} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {subcategories[cat.id] ? `${subcategories[cat.id].length} alt` : ''}
                        </span>
                        {expandedCat === cat.id
                          ? <ChevronDown size={13} className="text-slate-400 ml-auto" />
                          : <ChevronRight size={13} className="text-slate-400 ml-auto" />}
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all ml-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {expandedCat === cat.id && (
                      <div className="border-t border-[#ece8e2] p-4 space-y-3 bg-slate-50/50">
                        <div className="flex gap-2">
                          <input type="text" value={newSubcategory} onChange={e => setNewSubcategory(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                            placeholder={`${cat.name} için alt kategori...`}
                            className="flex-1 bg-white border border-[#ddd8d0] px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 transition" />
                          <button onClick={() => handleAddSubcategory(cat.id)}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg text-[10px] font-black transition border border-blue-200">
                            <Plus size={13} />
                          </button>
                        </div>
                        {(subcategories[cat.id] || []).length === 0 ? (
                          <p className="text-[10px] text-slate-400 font-semibold text-center py-1">Alt kategori yok</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {(subcategories[cat.id] || []).map(sub => (
                              <div key={sub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#ece8e2] group">
                                <span className="text-xs font-semibold text-slate-600">↳ {sub.name}</span>
                                <button onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                  className="text-slate-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                                  <Trash2 size={11} />
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
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} /> Afet Bölgesi İşaretle
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Bölge adı (örn: Hatay Depremi 2025)" value={disasterForm.title}
                    onChange={e => setDisasterForm({...disasterForm, title: e.target.value})}
                    className={`${inputCls} col-span-full`} />
                  <input type="text" placeholder="Açıklama (opsiyonel)" value={disasterForm.description}
                    onChange={e => setDisasterForm({...disasterForm, description: e.target.value})}
                    className={`${inputCls} col-span-full`} />
                  <div className="col-span-full space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Şehir veya İlçe</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="örn: Hatay, Antakya..." value={disasterForm.address}
                        onChange={e => setDisasterForm({...disasterForm, address: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && searchDisasterAddress()}
                        className={inputCls.replace('w-full', 'flex-1')} />
                      <button onClick={searchDisasterAddress}
                        className="px-4 py-2.5 bg-white hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition flex items-center gap-1.5 border border-red-200">
                        <Search size={13} />
                        {disasterSearching ? 'Aranıyor...' : 'Bul'}
                      </button>
                    </div>
                    {disasterForm.latitude ? (
                      <p className="text-[10px] text-green-600 font-bold ml-1">
                        ✅ {parseFloat(disasterForm.latitude).toFixed(4)}, {parseFloat(disasterForm.longitude).toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-semibold ml-1">Şehir veya ilçe yazıp "Bul" butonuna tıklayın</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Yarıçap: {disasterForm.radius} km</label>
                    <input type="range" min="1" max="300" value={disasterForm.radius}
                      onChange={e => setDisasterForm({...disasterForm, radius: parseInt(e.target.value)})}
                      className="w-full accent-red-400" />
                  </div>
                  <select value={disasterForm.severity} onChange={e => setDisasterForm({...disasterForm, severity: e.target.value})}
                    className={inputCls}>
                    <option value="Düşük">Düşük Tehlike</option>
                    <option value="Orta">Orta Tehlike</option>
                    <option value="Yüksek">Yüksek Tehlike</option>
                    <option value="Kritik">Kritik Tehlike</option>
                  </select>
                </div>
                <button onClick={handleAddDisasterZone} disabled={!disasterForm.latitude}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center gap-2">
                  <AlertTriangle size={14} /> Haritaya İşaretle
                </button>
              </div>

              <div className="space-y-2">
                {disasterZones.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-[#ece8e2] rounded-2xl">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aktif afet bölgesi yok</p>
                  </div>
                ) : disasterZones.map(zone => (
                  <div key={zone.id} className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-500 uppercase">🚨 {zone.severity}</span>
                        <span className="text-sm font-bold text-slate-800">{zone.title}</span>
                      </div>
                      {zone.description && <p className="text-xs text-slate-500 italic">{zone.description}</p>}
                      <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <MapPin size={9} className="text-red-400" />
                        {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)} · {zone.radius} km
                      </p>
                    </div>
                    <button onClick={() => handleDeleteDisasterZone(zone.id)}
                      className="p-2.5 text-slate-300 hover:text-red-400 hover:bg-red-100 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AYARLAR ── */}
          {tab === 'settings' && (
            <div className="max-w-md space-y-5">
              <div className="bg-slate-50 border border-[#ddd8d0] p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                  <Settings size={14} className="text-blue-500" /> Admin Kimlik Bilgileri
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Yalnızca değiştirmek istediğiniz alanı doldurun.</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Yeni E-Posta (opsiyonel)</label>
                    <input type="email" placeholder="yeni@email.com" value={adminForm.email}
                      onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                      className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Yeni Şifre (opsiyonel)</label>
                    <input type="password" placeholder="••••••••" value={adminForm.password}
                      onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                      className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-red-400 ml-1">Mevcut Şifre (zorunlu)</label>
                    <input type="password" placeholder="Doğrulama için mevcut şifreniz" value={adminForm.currentPassword}
                      onChange={e => setAdminForm({...adminForm, currentPassword: e.target.value})}
                      className="w-full bg-white border border-red-200 px-4 py-3 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition placeholder:text-slate-400" />
                  </div>
                  <button onClick={handleChangeCredentials} disabled={adminSaving}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition">
                    {adminSaving ? 'Güncelleniyor...' : '🔐 Kimlik Bilgilerini Güncelle'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-[#ddd8d0] p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Sistem Bilgisi</h3>
                <div className="space-y-2 text-[11px] font-bold text-slate-500">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#ece8e2]">
                    <span className="text-slate-400 uppercase text-[9px]">Versiyon</span>
                    <span className="text-slate-700">İHHA v1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#ece8e2]">
                    <span className="text-slate-400 uppercase text-[9px]">Backend</span>
                    <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Aktif</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400 uppercase text-[9px]">WebSocket</span>
                    <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Bağlı</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}