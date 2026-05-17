import React, { useState, useEffect } from 'react';
import { X, Award, Shield, CheckCircle2, AlertCircle, LogOut, Trophy, Radio, Clock, Edit2, Save, Eye, EyeOff, Trash2, MapPin } from 'lucide-react';
import { toast } from '../components/ToastSystem';

function UserIcon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function ProfileModal({ isOpen, onClose, user, onLogout, onUserUpdate }) {
  const [tab, setTab] = useState('profile');
  const [leaderboard, setLeaderboard] = useState([]);
  const [mySignals, setMySignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', current_password: '', new_password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setEditMode(false);
    Promise.all([
      fetch('http://localhost:5003/api/leaderboard').then(r => r.json()),
      user?.id ? fetch(`http://localhost:5003/api/my-signals/${user.id}`).then(r => r.json()) : Promise.resolve([])
    ]).then(([lb, ms]) => {
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setMySignals(Array.isArray(ms) ? ms : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (user) setEditForm(prev => ({ ...prev, full_name: user.full_name || '', phone: user.phone || '' }));
  }, [user]);

  if (!isOpen || !user) return null;

  const isAkinci = user.status === 'Onaylı';
  const rank = isAkinci ? 'Saha Operatörü · Akıncı' : 'Vatandaş · Gözlemci';
  const myRank = leaderboard.findIndex(u => u.id === user.id) + 1;

  const statusBadge = (status) => {
    if (status === 'Açık') return 'bg-green-100 text-green-600 border-green-200';
    if (status === 'Beklemede') return 'bg-amber-100 text-amber-600 border-amber-200';
    if (status === 'Tamamlandı') return 'bg-teal-100 text-teal-600 border-teal-200';
    if (status === 'İptal') return 'bg-red-100 text-red-500 border-red-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const handleSave = async () => {
    if (editForm.new_password && editForm.new_password !== editForm.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor!'); return;
    }
    if (editForm.new_password && !editForm.current_password) {
      toast.error('Mevcut şifrenizi girin.'); return;
    }
    setSaving(true);
    try {
      const body = {};
      if (editForm.full_name && editForm.full_name !== user.full_name) body.full_name = editForm.full_name;
      if (editForm.phone && editForm.phone !== user.phone) body.phone = editForm.phone.replace(/\s/g, '');
      if (editForm.new_password) { body.new_password = editForm.new_password; body.current_password = editForm.current_password; }
      if (!Object.keys(body).length) { toast.info('Değişiklik yapılmadı.'); setSaving(false); return; }

      const res = await fetch(`http://localhost:5003/api/users/${user.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bilgiler güncellendi!');
        const storage = localStorage.getItem('ihha_user') ? localStorage : sessionStorage;
        const updated = { ...user, ...data.user };
        storage.setItem('ihha_user', JSON.stringify(updated));
        onUserUpdate && onUserUpdate(updated);
        setEditMode(false);
        setEditForm(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
      } else {
        toast.error(data.error || 'Güncelleme başarısız.');
      }
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
    finally { setSaving(false); }
  };

  const handleDeleteSignal = async (signalId) => {
    if (!window.confirm('Bu sinyali silmek istiyor musunuz?')) return;
    try {
      const res = await fetch(`http://localhost:5003/api/signals/${signalId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (res.ok) { toast.success('Sinyal silindi.'); setMySignals(prev => prev.filter(s => s.id !== signalId)); }
      else { const err = await res.json(); toast.error(err.error); }
    } catch { toast.error('Bağlantı hatası.'); }
  };

  const inputClass = "w-full bg-slate-50 border border-[#ddd8d0] px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-[#ddd8d0] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">

        {/* ── Üst Banner ── */}
        <div className="h-28 relative shrink-0 overflow-hidden">
          {/* Gradient arkaplan */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-violet-100" />
          <div className="absolute inset-0 opacity-20"
            style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)'}} />
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-500 hover:text-slate-700 transition backdrop-blur-sm z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Profil Özeti ── */}
        <div className="px-8 pt-0 shrink-0 bg-white">
          <div className="relative -mt-14 mb-5 flex items-end gap-4">
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg shrink-0 ${isAkinci ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <UserIcon size={40} className={isAkinci ? 'text-white' : 'text-slate-400'} />
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-black tracking-tight text-slate-800">{user.full_name}</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isAkinci ? 'text-blue-500' : 'text-slate-400'}`}>
                {rank}
                {myRank > 0 && <span className="ml-2 text-amber-500">· #{myRank} Sıra</span>}
              </p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {user.email && <p className="text-[10px] text-slate-400 font-semibold">{user.email}</p>}
                {user.phone && <p className="text-[10px] text-slate-400 font-semibold">{user.phone}</p>}
              </div>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                <Award size={13} />
                <span className="text-[9px] font-black uppercase tracking-wide">Akıncı XP</span>
              </div>
              <p className="text-2xl font-black text-blue-600">{user.akinci_xp || 0}</p>
            </div>
            <div className="bg-green-50 border border-green-100 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-green-500 mb-1">
                <Shield size={13} />
                <span className="text-[9px] font-black uppercase tracking-wide">Güven</span>
              </div>
              <p className="text-2xl font-black text-green-600">%{user.trust_score || 100}</p>
            </div>
            <div className="bg-violet-50 border border-violet-100 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-violet-500 mb-1">
                <Radio size={13} />
                <span className="text-[9px] font-black uppercase tracking-wide">Sinyal</span>
              </div>
              <p className="text-2xl font-black text-violet-600">{mySignals.length}</p>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex border-b border-[#ece8e2]">
            {[
              { key: 'profile', label: 'Profil', icon: Shield },
              { key: 'signals', label: 'Sinyallerim', icon: Radio },
              { key: 'leaderboard', label: 'Liderboard', icon: Trophy },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                  tab === t.key
                    ? 'text-blue-500 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-200'
                }`}
              >
                <t.icon size={11} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sekme İçeriği ── */}
        <div
          className="flex-1 overflow-y-auto px-8 py-5 bg-[#f7f5f0]"
          style={{scrollbarWidth:'thin', scrollbarColor:'#ddd8d0 transparent'}}
        >

          {/* PROFİL */}
          {tab === 'profile' && (
            <div className="space-y-4">

              {/* Sicil durumu */}
              <div className={`p-4 rounded-2xl border ${isAkinci ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isAkinci ? 'bg-green-100 text-green-500' : 'bg-amber-100 text-amber-500'}`}>
                      {isAkinci ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-700">Adli Sicil Onay Durumu</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAkinci ? 'Belgeleriniz doğrulandı, saha operasyonlarına katılabilirsiniz.' : 'Belgeleriniz operatör onayında. Lütfen bekleyiniz.'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border shrink-0 ${isAkinci ? 'bg-green-100 text-green-600 border-green-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                    {user.status || 'Beklemede'}
                  </span>
                </div>
              </div>

              {/* Bilgi güncelleme */}
              {!editMode ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 bg-white hover:bg-blue-50 border border-[#ddd8d0] hover:border-blue-300 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition text-slate-500 hover:text-blue-500 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Edit2 size={13} /> Bilgileri Güncelle
                  </button>
                  <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="px-5 bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 text-red-400 hover:text-white py-3 rounded-2xl text-xs font-black uppercase transition flex items-center gap-2 shadow-sm"
                  >
                    <LogOut size={13} /> Çıkış
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#ddd8d0] p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase text-slate-700">Bilgileri Güncelle</h3>
                    <button onClick={() => setEditMode(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ad Soyad</label>
                    <input
                      type="text" value={editForm.full_name}
                      onChange={e => setEditForm(p => ({...p, full_name: e.target.value}))}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Telefon</label>
                    <input
                      type="tel" value={editForm.phone}
                      onChange={e => setEditForm(p => ({...p, phone: e.target.value}))}
                      placeholder="05XX XXX XX XX"
                      className={inputClass}
                    />
                  </div>

                  <div className="border-t border-[#ece8e2] pt-3 space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Şifre Değiştir (opsiyonel)</p>
                    <input
                      type="password" value={editForm.current_password}
                      onChange={e => setEditForm(p => ({...p, current_password: e.target.value}))}
                      placeholder="Mevcut şifre"
                      className={inputClass}
                    />
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'} value={editForm.new_password}
                        onChange={e => setEditForm(p => ({...p, new_password: e.target.value}))}
                        placeholder="Yeni şifre"
                        className={`${inputClass} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <input
                      type="password" value={editForm.confirm_password}
                      onChange={e => setEditForm(p => ({...p, confirm_password: e.target.value}))}
                      placeholder="Yeni şifre tekrar"
                      className={`${inputClass} ${
                        editForm.confirm_password && editForm.new_password !== editForm.confirm_password
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : editForm.confirm_password && editForm.new_password === editForm.confirm_password
                            ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                            : ''
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <Save size={13} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SİNYALLERİM */}
          {tab === 'signals' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-semibold uppercase">Yükleniyor...</p>
                </div>
              ) : mySignals.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-[#ece8e2]">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Radio className="text-slate-300" size={22} />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase">Henüz sinyal göndermediniz.</p>
                </div>
              ) : mySignals.map(signal => (
                <div key={signal.id} className="bg-white border border-[#ece8e2] p-4 rounded-2xl hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${statusBadge(signal.status)}`}>
                          {signal.status}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{signal.category_name}</span>
                        <span className="text-[9px] font-mono text-slate-300">#{signal.id}</span>
                      </div>
                      {signal.description && (
                        <p className="text-xs text-slate-500 italic truncate">
                          "{signal.description?.substring(0, 60)}{signal.description?.length > 60 ? '...' : ''}"
                        </p>
                      )}
                      {signal.beneficiary_note && (
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <MapPin size={9} className="text-amber-400 shrink-0" />
                          {signal.beneficiary_note}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={9} />
                        {signal.created_at ? new Date(signal.created_at).toLocaleString('tr-TR') : '--'}
                      </p>
                    </div>
                    {signal.status !== 'Tamamlandı' && (
                      <button
                        onClick={() => handleDeleteSignal(signal.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-50 rounded-xl transition shrink-0 border border-transparent hover:border-red-100"
                        title="Sinyali Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LİDERBOARD */}
          {tab === 'leaderboard' && (
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-semibold uppercase">Yükleniyor...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-[#ece8e2]">
                  <Trophy className="mx-auto text-slate-300 mb-2" size={28} />
                  <p className="text-slate-400 text-xs font-bold uppercase">Henüz kayıtlı kullanıcı yok.</p>
                </div>
              ) : leaderboard.map((u, i) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    u.id === user.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-[#ece8e2] hover:shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white shadow-md' :
                    i === 1 ? 'bg-slate-300 text-white shadow-md' :
                    i === 2 ? 'bg-amber-600 text-white shadow-md' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {u.full_name}
                      {u.id === user.id && <span className="ml-2 text-blue-500 text-[9px] font-black">(Sen)</span>}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">
                      {u.identity_doc_status === 'Onaylı' ? '🛡️ Akıncı' : '👤 Vatandaş'} · {u.completed_tasks} görev
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-500">{u.akinci_xp}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}