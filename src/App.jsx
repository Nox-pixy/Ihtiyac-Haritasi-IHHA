import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import FilterBar from './components/FilterBar';
import SignalList from './components/SignalList';
import AuthModal from './modals/AuthModal';
import IhbarModal from './modals/IhbarModal';
import ProfileModal from './modals/ProfileModal';
import OperationPanel from './components/OperationPanel'; // Yeni eklenen panel

const App = () => {
  // --- STATE YÖNETİMİ ---
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [isIhbarOpen, setIsIhbarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Seçilen koordinat state'i (Haritadan gelecek)
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Giriş yapan kullanıcı bilgisi
  const [currentUser, setCurrentUser] = useState(null);

  // Sayfa yüklendiğinde oturumu kontrol et
  useEffect(() => {
    const savedUser = localStorage.getItem('ihha_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('ihha_user');
      }
    }
  }, []);

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileOpen(false); // Profil açıksa kapat
    localStorage.removeItem('ihha_user');
    alert("Karargah bağlantısı kesildi. Güvenli çıkış yapıldı.");
  };

  // Haritadan koordinat seçildiğinde çalışacak fonksiyon
  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    // Artık modal otomatik açılmıyor, koordinat OperationPanel'e gidiyor
  };

  // İhbar Gönderimi (OperationPanel'den tetiklenecek)
  const handleIhbarSubmit = async (data) => {
    const payload = { ...data, citizen_id: currentUser.id };
    try {
      const res = await fetch('http://localhost:5000/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Sinyal merkeze ulaştı! Karargah ekipleri bilgilendiriliyor.");
        setSelectedLocation(null); // Başarılı gönderimden sonra pini temizle
      }
    } catch (error) {
      console.error("Sinyal Hatası:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-blue-100 font-sans selection:bg-blue-500/30">
      
      {/* Header: Kullanıcı durumuna göre butonları yönetir */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onProfileOpen={() => setIsProfileOpen(true)}
        onLogin={() => setAuthModal({ isOpen: true, type: 'login' })} 
        onRegister={() => setAuthModal({ isOpen: true, type: 'register' })} 
        onIhbar={() => setIsIhbarOpen(true)}
      />

      <main className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {/* Karşılama Paneli ve Operasyon Paneli */}
        {currentUser && (
          <>
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic">Sistem Aktif</p>
                <h2 className="text-sm font-bold">Operatör: {currentUser.full_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-500">Adli Sicil Onayı</p>
                <span className={`text-xs font-bold ${currentUser.status === 'Onaylı' ? 'text-green-400' : 'text-yellow-500'}`}>
                  ● {currentUser.status || 'İnceleniyor'}
                </span>
              </div>
            </div>

            {/* Yeni eklenen Sinyal Operasyon Paneli */}
            <OperationPanel 
              currentUser={currentUser} 
              selectedLocation={selectedLocation} 
              onIhbarSubmit={handleIhbarSubmit} 
            />
          </>
        )}

        {/* Harita Paneli: Koordinat seçme fonksiyonunu gönderiyoruz */}
        <MapPanel onSelectLocation={handleLocationSelect} />
        
        <FilterBar />
        <SignalList />
      </main>

      {/* --- MODAL KATMANLARI --- */}
      
      {/* Giriş/Kayıt Modalı */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        type={authModal.type} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
        setUser={(user) => {
          setCurrentUser(user);
          localStorage.setItem('ihha_user', JSON.stringify(user));
        }}
      />

      {/* Profil Detayları Modalı */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={currentUser} 
        onLogout={handleLogout}
      />

      {/* İhbar Bırakma Modalı (Opsiyonel manuel ihbar butonu için tutuldu) */}
      <IhbarModal 
        isOpen={isIhbarOpen} 
        onClose={() => {
          setIsIhbarOpen(false);
          setSelectedLocation(null); 
        }} 
        currentUser={currentUser}
        initialLocation={selectedLocation}
      />

      <footer className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.5em]">
        İHHA Karargah Operasyon Merkezi © 2026
      </footer>
    </div>
  );
};

export default App;