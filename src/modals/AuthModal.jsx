import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, FileText, Upload } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, type, setUser }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiEndpoint = type === 'login' 
      ? 'http://localhost:5000/api/login' 
      : 'http://localhost:5000/api/register';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password_hash: formData.password 
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (type === 'login') {
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
      
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-[#0d1425] border border-blue-500/20 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
        <button type="button" onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white transition"><X size={20} /></button>

        <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-100 mb-6 text-center">
          {type === 'login' ? 'KARARGAHA GİRİŞ' : 'YENİ KAYIT'}
        </h2>

        <div className="space-y-4">
          {type === 'register' && (
            <>
              {/* 1. AD SOYAD */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ad Soyad</label>
                <div className="relative">
                  <input 
                    name="full_name" 
                    required 
                    onChange={handleChange} 
                    type="text" 
                    placeholder="Ad Soyad" 
                    className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" 
                  />
                  <UserIcon className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>

              {/* 2. TELEFON */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Telefon</label>
                <div className="relative">
                  <input 
                    name="phone" 
                    required 
                    onChange={handleChange} 
                    onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} 
                    type="tel" 
                    maxLength={11} 
                    placeholder="0555 --- -- --" 
                    className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" 
                  />
                  <Phone className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>
            </>
          )}

          {/* 3. GMAIL / E-POSTA */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">E-Posta (Google Hesabı)</label>
            <div className="relative">
              <input 
                name="email" 
                required 
                onChange={handleChange} 
                type="email" 
                placeholder="ornek@gmail.com" 
                className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" 
              />
              <Mail className="absolute left-4 top-3 text-slate-600" size={18} />
            </div>
          </div>

          {type === 'register' && (
            /* 4. SICIL KAYDI */
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Adli Sicil Belgesi (PDF/JPG)</label>
              <div className="relative group text-blue-100">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  accept=".pdf,.jpg,.jpeg,.png" 
                />
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

          {/* 5. SIFRE */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Şifre Güvenliği</label>
            <div className="relative">
              <input 
                name="password" 
                required 
                onChange={handleChange} 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11 text-white" 
              />
              <Lock className="absolute left-4 top-3 text-slate-600" size={18} />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg mt-4 active:scale-95 text-white">
            {type === 'login' ? 'SİSTEME BAĞLAN' : 'GÜVENLİ KAYIT OL'}
          </button>
        </div>
      </form>
    </div>
  );
}