import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, FileText, Upload, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, type, setUser }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    contract_accepted: false,
    rememberMe: false // Beni Hatırla durumu
  });

  const [showContract, setShowContract] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Şifre eşleşme kontrolü
    if (type === 'register' && formData.password !== formData.password_confirm) {
      alert("Hata: Şifreler birbiriyle eşleşmiyor!");
      return;
    }

    // Sözleşme kontrolü
    if (type === 'register' && !formData.contract_accepted) {
      alert("Lütfen İHHA Sözleşmesini onaylayın.");
      return;
    }

    const apiEndpoint = type === 'login' 
      ? 'http://localhost:5000/api/login' 
      : 'http://localhost:5000/api/register';

    try {
      let response;

      if (type === 'register') {
        // 🛡️ GÖRSEL API PROTOKOLÜ: FormData kullanarak dosya ve metinleri paketliyoruz
        const dataToSend = new FormData();
        dataToSend.append('full_name', formData.full_name);
        dataToSend.append('email', formData.email);
        dataToSend.append('phone', formData.phone);
        dataToSend.append('password_hash', formData.password);
        
        // Dosya girişini (input type="file") yakala
        const fileInput = e.target.querySelector('input[type="file"]');
        if (fileInput && fileInput.files[0]) {
          dataToSend.append('document', fileInput.files[0]);
        }

        response = await fetch(apiEndpoint, {
          method: 'POST',
          // Headers kısmında Content-Type BELİRTMİYORUZ, tarayıcı FormData için otomatik ayarlar
          body: dataToSend,
        });
      } else {
        // LOGIN PROTOKOLÜ: Standart JSON gönderimi
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password_hash: formData.password 
          })
        });
      }

      const result = await response.json();

      if (response.ok) {
        if (type === 'login') {
          // GÜVENLİK PROTOKOLÜ: Beni Hatırla kontrolü
          const storage = formData.rememberMe ? localStorage : sessionStorage;
          storage.setItem('ihha_user', JSON.stringify(result.user));
          
          setUser(result.user);
          alert(`Karargaha hoş geldin, ${result.user.full_name}`);
        } else {
          alert(`Kayıt Başarılı! Adli sicil belgeniz incelenmek üzere alındı.`);
        }
        onClose();
      } else {
        alert(`Hata: ${result.error || 'İşlem başarısız.'}`);
      }
    } catch (error) {
      console.error("Bağlantı Hatası:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sözleşme Modalı */}
      {showContract && (
        <div className="absolute inset-0 z-[3001] flex items-center justify-center p-6 bg-[#0a0f1d]/95">
          <div className="bg-[#0d1425] border border-blue-500/30 p-8 rounded-3xl max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 text-left">
            <h3 className="text-xl font-black text-blue-400 mb-4 tracking-tighter">İHHA KARARGAH SÖZLEŞMESİ</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              İHHA (İhtiyaç Yardım Haritası), Akıncılar (gönüllüler) ve Vatandaşlar arasında sadece bir köprü vazifesi görür. 
              Platform üzerinden kurulan iletişim ve yardımlaşma faaliyetlerinde tüm sorumluluk kullanıcıların kendilerine aittir. 
              Karargah, saha operasyonlarındaki bireysel kararlardan sorumlu tutulamaz.
            </p>
            <button type="button" onClick={() => setShowContract(false)} className="w-full bg-blue-600 py-3 rounded-xl font-bold uppercase text-xs text-white">Anladım</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-[#0d1425] border border-blue-500/20 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200 text-left">
        <button type="button" onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white transition"><X size={20} /></button>

        <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-100 mb-6 text-center">
          {type === 'login' ? 'KARARGAHA GİRİŞ' : 'YENİ KAYIT'}
        </h2>

        <div className="space-y-4">
          {type === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ad Soyad</label>
                <div className="relative">
                  <input name="full_name" required onChange={handleChange} type="text" placeholder="Ad Soyad" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" />
                  <UserIcon className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Telefon</label>
                <div className="relative">
                  <input name="phone" required onChange={handleChange} type="tel" maxLength={11} placeholder="0555 --- -- --" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" />
                  <Phone className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">E-Posta</label>
            <div className="relative">
              <input name="email" required onChange={handleChange} type="email" placeholder="ornek@gmail.com" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" />
              <Mail className="absolute left-4 top-3 text-slate-600" size={18} />
            </div>
          </div>

          {type === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Adli Sicil Belgesi (PDF/JPG)</label>
              <p className="text-[9px] text-amber-500 font-bold mb-1 uppercase tracking-tighter">⚠️ Onaylanmayan hesaplar devre dışı kalacaktır.</p>
              <div className="relative group text-blue-100">
                <input type="file" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.jpg,.jpeg,.png" />
                <div className="w-full bg-[#0a0f1d] border border-dashed border-white/10 p-3 rounded-xl flex items-center justify-between group-hover:border-blue-500/50 transition">
                  <div className="flex items-center gap-3">
                    <FileText className="text-slate-600" size={18} />
                    <span className="text-xs font-bold text-slate-500 italic">Belge Seçin...</span>
                  </div>
                  <Upload size={16} className="text-blue-500" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Şifre</label>
              <div className="relative">
                <input name="password" required onChange={handleChange} type="password" placeholder="••••••••" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" />
                <Lock className="absolute left-4 top-3 text-slate-600" size={18} />
              </div>
            </div>

            {type === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Şifre Tekrar</label>
                <div className="relative">
                  <input name="password_confirm" required onChange={handleChange} type="password" placeholder="••••••••" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" />
                  <ShieldCheck className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>
            )}
          </div>

          {/* Beni Hatırla (Login için) */}
          {type === 'login' && (
            <div className="flex items-center gap-2 mb-2 ml-1">
              <input type="checkbox" id="rememberMe" name="rememberMe" onChange={handleChange} className="w-4 h-4 rounded border-white/10 bg-[#0a0f1d] text-blue-600" />
              <label htmlFor="rememberMe" className="text-[10px] font-black uppercase text-slate-500 tracking-widest cursor-pointer select-none">
                Beni Hatırla (Güvenli Oturum)
              </label>
            </div>
          )}

          {/* Sözleşme Onay (Register için) */}
          {type === 'register' && (
            <div className="flex items-center gap-2 mt-4 ml-1">
              <input type="checkbox" name="contract_accepted" onChange={handleChange} className="w-4 h-4 rounded border-white/10 bg-[#0a0f1d]" />
              <span className="text-[11px] text-slate-400 font-bold">
                <button type="button" onClick={() => setShowContract(true)} className="text-blue-500 underline mr-1">İHHA Sözleşmesini</button> 
                onaylıyorum.
              </span>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg mt-4 active:scale-95 text-white">
            {type === 'login' ? 'SİSTEME BAĞLAN' : 'GÜVENLİ KAYIT OL'}
          </button>
        </div>
      </form>
    </div>
  );
}