import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from '../components/ToastSystem';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthModal({ isOpen, onClose, type, setUser }) {
  const [mode, setMode] = useState(type);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '',
    password: '', password_confirm: '',
    contract_accepted: false, rememberMe: false
  });
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // ✅ type prop değişince (giriş yap / kayıt ol butonları) mode sıfırla
  useEffect(() => { setMode(type); }, [type]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (e.target.name === 'phone') {
      const phone = e.target.value.replace(/\s/g, '');
      setPhoneError(phone.length > 0 && !/^(05)[0-9]{0,9}$/.test(phone) ? '05XX XXX XX XX formatında giriniz' : '');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) { toast.error('E-posta adresinizi girin.'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5003/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) { setForgotSent(true); toast.success('Sıfırlama bağlantısı gönderildi!'); }
      else toast.error(data.error || 'Bir hata oluştu.');
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5003/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && formData.password !== formData.password_confirm) {
      toast.error('Şifreler birbiriyle eşleşmiyor!'); return;
    }
    if (mode === 'register' && !formData.contract_accepted) {
      toast.warning('Lütfen İHHA Sözleşmesini onaylayın.'); return;
    }
    if (mode === 'register') {
      const phone = formData.phone.replace(/\s/g, '');
      if (!/^(05)[0-9]{9}$/.test(phone)) {
        toast.error('Telefon numarası 05XX XXX XX XX formatında olmalıdır.'); return;
      }
    }
    const apiEndpoint = mode === 'login' ? 'http://localhost:5003/api/login' : 'http://localhost:5003/api/register';
    setLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register'
          ? { full_name: formData.full_name, email: formData.email, phone: formData.phone.replace(/\s/g, ''), password_hash: formData.password }
          : { email: formData.email, password_hash: formData.password }
        )
      });
      const result = await response.json();
      if (response.ok) {
        if (mode === 'login') {
          const storage = formData.rememberMe ? localStorage : sessionStorage;
          storage.setItem('ihha_user', JSON.stringify(result.user));
          if (result.token) storage.setItem('ihha_token', result.token);
          setUser(result.user);
          toast.success(`Hoş geldin, ${result.user.full_name}!`);
          onClose();
        } else {
          toast.success('Kayıt başarılı!');
          try {
            const loginRes = await fetch('http://localhost:5003/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email, password_hash: formData.password })
            });
            const loginData = await loginRes.json();
            if (loginRes.ok) {
              sessionStorage.setItem('ihha_user', JSON.stringify(loginData.user));
              if (loginData.token) sessionStorage.setItem('ihha_token', loginData.token);
              setUser(loginData.user);
            }
          } catch { /* sessiz */ }
          onClose();
        }
      } else { toast.error(result.error || 'İşlem başarısız.'); }
    } catch { toast.error('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-white border border-[#ddd8d0] p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition font-semibold text-sm pl-11 text-slate-700 placeholder:text-slate-400";
  const labelClass = "text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {showContract && (
        <div className="absolute inset-0 z-[3001] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-[#ddd8d0] p-8 rounded-3xl max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight">İHHA Karargah Sözleşmesi</h3>
            <div className="w-8 h-1 bg-blue-400 rounded-full mb-4" />
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              İHHA (İhtiyaç Yardım Haritası), Akıncılar (gönüllüler) ve Vatandaşlar arasında sadece bir köprü vazifesi görür.
              Platform üzerinden kurulan iletişim ve yardımlaşma faaliyetlerinde tüm sorumluluk kullanıcıların kendilerine aittir.
              Karargah, saha operasyonlarındaki bireysel kararlardan sorumlu tutulamaz.
            </p>
            <button type="button" onClick={() => setShowContract(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-xl font-black uppercase text-xs text-white transition shadow-md">
              Anladım, Devam Et
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md bg-white border border-[#ddd8d0] rounded-3xl shadow-2xl animate-in zoom-in duration-200 text-left max-h-[90vh] overflow-y-auto"
        style={{scrollbarWidth:'thin', scrollbarColor:'#ddd8d0 transparent'}}>

        {/* Header */}
        <div className="p-7 pb-5 border-b border-[#ece8e2]">
          <button type="button" onClick={onClose}
            className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800">
                {mode === 'login' ? 'Karargaha Giriş' : mode === 'register' ? 'Yeni Kayıt' : 'Şifremi Unuttum'}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                {mode === 'login' ? 'Hesabınla sisteme bağlan' : mode === 'register' ? 'Gönüllü ağına katıl' : 'Şifre sıfırlama bağlantısı al'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-4">

          {/* ŞİFREMİ UNUTTUM */}
          {mode === 'forgot' && (
            forgotSent ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="32" height="32">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 mb-1">E-posta gönderildi!</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-blue-500">{formData.email}</span> adresine sıfırlama bağlantısı gönderildi.
                  </p>
                </div>
                <button onClick={() => { setMode('login'); setForgotSent(false); }}
                  className="text-[11px] text-blue-500 font-bold hover:text-blue-600 uppercase">← Girişe Dön</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı göndereceğiz.
                </p>
                <div className="space-y-1">
                  <label className={labelClass}>E-Posta</label>
                  <div className="relative">
                    <input name="email" required onChange={handleChange} type="email"
                      placeholder="ornek@gmail.com" className={inputClass} />
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-md text-white active:scale-[0.98]">
                  {loading ? 'Gönderiliyor...' : '📧 Sıfırlama Bağlantısı Gönder'}
                </button>
                <button type="button" onClick={() => setMode('login')}
                  className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 font-semibold">
                  ← Girişe Dön
                </button>
              </form>
            )
          )}

          {/* GİRİŞ / KAYIT */}
          {mode !== 'forgot' && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Kayıt — Ad Soyad */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className={labelClass}>Ad Soyad</label>
                  <div className="relative">
                    <input name="full_name" required onChange={handleChange} type="text"
                      placeholder="Ad Soyad" className={inputClass} />
                    <UserIcon className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  </div>
                </div>
              )}

              {/* Kayıt — Telefon */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className={labelClass}>Telefon <span className="text-slate-400 normal-case font-normal">(Türkiye)</span></label>
                  <div className="relative">
                    <input name="phone" required onChange={handleChange} type="tel" maxLength={11}
                      placeholder="05XX XXX XX XX"
                      className={`${inputClass} ${phoneError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} />
                    <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  </div>
                  {phoneError && <p className="text-[10px] text-red-400 font-semibold ml-1">⚠ {phoneError}</p>}
                </div>
              )}

              {/* E-Posta */}
              <div className="space-y-1">
                <label className={labelClass}>E-Posta</label>
                <div className="relative">
                  <input name="email" required onChange={handleChange} type="email"
                    placeholder="ornek@gmail.com" className={inputClass} />
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                </div>
              </div>

              {/* Şifre */}
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className={labelClass}>Şifre</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')}
                      className="text-[10px] text-blue-500 hover:text-blue-600 font-bold transition">
                      Şifremi Unuttum
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input name="password" required onChange={handleChange}
                    type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    className={`${inputClass} pr-11`} />
                  <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Kayıt — Şifre Tekrar */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className={labelClass}>Şifre Tekrar</label>
                  <div className="relative">
                    <input name="password_confirm" required onChange={handleChange}
                      type={showPassConfirm ? 'text' : 'password'} placeholder="••••••••"
                      className={`${inputClass} pr-11 ${
                        formData.password_confirm && formData.password !== formData.password_confirm
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : formData.password_confirm && formData.password === formData.password_confirm
                            ? 'border-green-300 focus:border-green-400 focus:ring-green-100' : ''
                      }`} />
                    <ShieldCheck className={`absolute left-3.5 top-3.5 ${
                      formData.password_confirm && formData.password === formData.password_confirm ? 'text-green-400' : 'text-slate-400'
                    }`} size={16} />
                    <button type="button" onClick={() => setShowPassConfirm(!showPassConfirm)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition">
                      {showPassConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {formData.password_confirm && formData.password !== formData.password_confirm && (
                    <p className="text-[10px] text-red-400 font-semibold ml-1">⚠ Şifreler eşleşmiyor</p>
                  )}
                </div>
              )}

              {/* Beni Hatırla */}
              {mode === 'login' && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative">
                    <input type="checkbox" name="rememberMe" onChange={handleChange} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                      formData.rememberMe ? 'bg-blue-500 border-blue-500' : 'bg-white border-[#ddd8d0] group-hover:border-blue-300'
                    }`}>
                      {formData.rememberMe && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Beni Hatırla</span>
                </label>
              )}

              {/* Sözleşme */}
              {mode === 'register' && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none group pt-1">
                  <div className="relative mt-0.5 shrink-0">
                    <input type="checkbox" name="contract_accepted" onChange={handleChange} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                      formData.contract_accepted ? 'bg-blue-500 border-blue-500' : 'bg-white border-[#ddd8d0] group-hover:border-blue-300'
                    }`}>
                      {formData.contract_accepted && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    <button type="button" onClick={() => setShowContract(true)}
                      className="text-blue-500 hover:text-blue-600 underline font-bold transition">
                      İHHA Sözleşmesini
                    </button>{' '}okudum ve onaylıyorum.
                  </span>
                </label>
              )}

              {/* Submit */}
              <button type="submit"
                disabled={loading || (mode === 'register' && !!phoneError)}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-md active:scale-[0.98] text-white"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Bağlanıyor...
                  </span>
                ) : mode === 'login' ? '🔐 Sisteme Bağlan' : '✅ Kayıt Ol'}
              </button>

              {/* Mod geçişi */}
              <p className="text-center text-[11px] text-slate-400">
                {mode === 'login' ? (
                  <>Hesabın yok mu?{' '}
                    <button type="button" onClick={() => setMode('register')}
                      className="text-blue-500 font-bold hover:text-blue-600 transition">Kayıt ol</button>
                  </>
                ) : (
                  <>Zaten üye misin?{' '}
                    <button type="button" onClick={() => setMode('login')}
                      className="text-blue-500 font-bold hover:text-blue-600 transition">Giriş yap</button>
                  </>
                )}
              </p>

              {/* ✅ Google butonu EN ALTTA */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-[#ece8e2]" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">veya</span>
                <div className="flex-1 h-px bg-[#ece8e2]" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-[#ddd8d0] rounded-2xl text-sm font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50/30 transition shadow-sm active:scale-[0.98]"
              >
                <GoogleIcon />
                Google ile {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}