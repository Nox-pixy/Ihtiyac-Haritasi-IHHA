import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Send, Search } from 'lucide-react';
import { toast } from '../components/ToastSystem';

export default function IhbarModal({ isOpen, onClose, currentUser, deviceLocation, onSubmitSuccess, signal }) {
  const [address, setAddress] = useState('');
  const [detail, setDetail] = useState('');
  const [coords, setCoords] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [catId, setCatId] = useState(1);
  const [ihbarNedeni, setIhbarNedeni] = useState('');

  const staticCategories = [
    { id: 1, name: 'Gıda' }, { id: 2, name: 'İlaç & Tıbbi Malzeme' },
    { id: 3, name: 'Kıyafet & Tekstil' }, { id: 4, name: 'Eşya' },
    { id: 5, name: 'Elektronik' }, { id: 6, name: 'Gönüllü' }
  ];

  const ihbarNedenleri = [
    'Yanıltıcı bilgi',
    'Sahte sinyal',
    'Uygunsuz içerik',
    'Spam / Tekrarlı sinyal',
    'Yanlış konum',
    'Diğer'
  ];

  // ✅ Signal prop gelince formu önceden doldur
  useEffect(() => {
    if (signal) {
      setDetail(`Sinyal #${signal.id} için ihbar — ${signal.description || ''}`);
      if (signal.latitude && signal.longitude) {
        setCoords({ lat: parseFloat(signal.latitude), lng: parseFloat(signal.longitude) });
      }
      if (signal.category_id) setCatId(signal.category_id);
      if (signal.beneficiary_note) setAddress(signal.beneficiary_note);
    } else {
      // Modal kapanınca sıfırla
      setDetail('');
      setCoords(null);
      setAddress('');
      setCatId(1);
      setIhbarNedeni('');
    }
  }, [signal, isOpen]);

  if (!isOpen) return null;

  const searchAddress = async () => {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast.success(`Konum bulundu: ${data[0].display_name.substring(0, 50)}...`);
      } else {
        toast.warning('Adres bulunamadı. Daha ayrıntılı girin.');
      }
    } catch { toast.error('Arama başarısız.'); }
    finally { setSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.warning('İhbar bırakmak için giriş yapmalısın!'); return; }
    const finalCoords = coords || deviceLocation;
    if (!finalCoords) { toast.warning('Konum belirleyin: Adres arayın veya konum izni verin.'); return; }

    // Signal ihbarı için neden seçimi zorunlu
    if (signal && !ihbarNedeni) { toast.warning('Lütfen ihbar nedenini seçin.'); return; }

    setSending(true);
    try {
      const fullDetail = signal && ihbarNedeni
        ? `[İHBAR NEDENİ: ${ihbarNedeni}] ${detail}`
        : detail;

      const res = await fetch('http://localhost:5000/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: currentUser.id,
          category_id: parseInt(catId),
          description: fullDetail,
          latitude: finalCoords.lat,
          longitude: finalCoords.lng,
          urgency_level: 'Kritik',
          is_for_self: false,
          beneficiary_note: signal ? `Sinyal #${signal.id} ihbarı — ${address}` : address
        })
      });
      if (res.ok) {
        toast.success('İhbar merkeze iletildi! Admin inceleyecek.');
        setAddress(''); setDetail(''); setCoords(null); setIhbarNedeni('');
        onSubmitSuccess && onSubmitSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || 'İhbar gönderilemedi.');
      }
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg bg-[#0d1425] border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in zoom-in duration-200 text-left max-h-[90vh] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#7f1d1d transparent'}}>
        <button type="button" onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white transition z-10">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-red-100">
              {signal ? 'Sinyal İhbar Et' : 'Acil İhbar Formu'}
            </h2>
            {signal && (
              <p className="text-[10px] text-red-400 font-bold mt-0.5">
                #{signal.id} · {signal.category_name} · {signal.full_name || 'Anonim'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">

          {/* ✅ Signal ihbarında neden seçimi */}
          {signal && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">
                İhbar Nedeni <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ihbarNedenleri.map(neden => (
                  <button
                    key={neden}
                    type="button"
                    onClick={() => setIhbarNedeni(neden)}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase text-left transition border ${
                      ihbarNedeni === neden
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-red-500/30 hover:text-white'
                    }`}
                  >
                    {neden}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Olay Mahalli */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">
              Olay Mahalli
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Adres veya konum bilgisi..."
                  className="w-full bg-[#0a0f1d] border border-white/5 p-4 rounded-xl outline-none focus:border-red-500 transition font-bold text-sm pl-12 text-white"
                />
                <MapPin className="absolute left-4 top-4 text-slate-600" size={20} />
              </div>
              <button type="button" onClick={searchAddress}
                className="bg-[#1a2235] hover:bg-slate-700 px-4 rounded-xl text-[10px] font-black uppercase text-white transition border border-white/5 flex items-center gap-1 shrink-0">
                {searching ? '...' : <><Search size={14} /> Bul</>}
              </button>
            </div>
            {coords && (
              <p className="text-[10px] text-green-400 font-bold ml-1">
                ✅ GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                {signal && <span className="text-slate-500 ml-2">(Sinyal konumundan alındı)</span>}
              </p>
            )}
            {!coords && deviceLocation && (
              <p className="text-[10px] text-yellow-500 font-bold ml-1">⚠ Adres aranmazsa cihaz konumu kullanılır</p>
            )}
          </div>

          {/* İhtiyaç / İhbar Türü */}
          {!signal && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">İhtiyaç Türü</label>
              <select value={catId} onChange={e => setCatId(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/5 p-4 rounded-xl outline-none text-xs font-bold text-white focus:border-red-500 appearance-none">
                {staticCategories.map(c => <option key={c.id} value={c.id} className="bg-[#0d1425]">{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Detay */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">
              {signal ? 'İhbar Detayı' : 'Açıklama'}
            </label>
            <textarea rows="4" value={detail} onChange={e => setDetail(e.target.value)} required
              placeholder={signal ? 'Bu sinyali neden ihbar ediyorsunuz?' : 'Durumu kısaca açıklayın...'}
              className="w-full bg-[#0a0f1d] border border-white/5 p-4 rounded-xl outline-none focus:border-red-500 transition font-bold text-sm resize-none text-white placeholder:text-slate-700"
            />
          </div>

          <button type="submit" disabled={sending}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition shadow-lg flex items-center justify-center gap-3 text-white">
            {sending ? 'Gönderiliyor...' : <><Send size={16} /> {signal ? 'Sinyali İhbar Et' : 'İhbarı Merkeze İlet'}</>}
          </button>

          <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-tighter">
            * Yanıltıcı ihbarlar sistemden uzaklaştırılmanıza sebep olabilir.
          </p>
        </div>
      </form>
    </div>
  );
}