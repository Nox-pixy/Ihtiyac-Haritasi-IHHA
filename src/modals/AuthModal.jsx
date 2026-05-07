import React from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, FileText, Upload } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, type }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0d1425] border border-blue-500/20 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white transition">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-100 mb-6">
          {type === 'login' ? 'Karargaha Giriş' : 'Yeni Kayıt'}
        </h2>

        <div className="space-y-4">
          {/* Kayıt Olurken İstenen Ek Bilgiler */}
          {type === 'register' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ad Soyad</label>
                <div className="relative">
                  <input type="text" placeholder="Ad Soyad" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11" />
                  <UserIcon className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Telefon Numarası</label>
                <div className="relative">
                  <input type="tel" placeholder="0555 --- -- --" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11" />
                  <Phone className="absolute left-4 top-3 text-slate-600" size={18} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">E-Posta</label>
            <div className="relative">
              <input type="email" placeholder="ornek@ihha.com" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11" />
              <Mail className="absolute left-4 top-3 text-slate-600" size={18} />
            </div>
          </div>

          {/* Adli Sicil Belgesi Yükleme (Sadece Kayıtta) */}
          {type === 'register' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Adli Sicil Belgesi (PDF/JPG)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="w-full bg-[#0a0f1d] border border-dashed border-white/10 p-3 rounded-xl flex items-center justify-between group-hover:border-blue-500/50 transition">
                  <div className="flex items-center gap-3">
                    <FileText className="text-slate-600" size={18} />
                    <span className="text-xs font-bold text-slate-500">Dosya Seçilmedi</span>
                  </div>
                  <Upload size={16} className="text-blue-500" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Şifre</label>
            <div className="relative">
              <input type="password" placeholder="••••••••" className="w-full bg-[#0a0f1d] border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-sm pl-11" />
              <Lock className="absolute left-4 top-3 text-slate-600" size={18} />
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/20 mt-4">
            {type === 'login' ? 'Sisteme Bağlan' : 'Güvenli Kayıt Ol'}
          </button>
        </div>
      </div>
    </div>
  );
}