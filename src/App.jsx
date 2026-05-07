import React, { useState } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import FilterBar from './components/FilterBar';
import SignalList from './components/SignalList';
// Modalları çağırıyoruz
import AuthModal from './modals/AuthModal';
import IhbarModal from './modals/IhbarModal';

const App = () => {
  // Modal Yönetim State'leri
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [isIhbarOpen, setIsIhbarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-blue-100 font-sans selection:bg-blue-500/30">
      {/* Header'a fonksiyonları paslıyoruz */}
      <Header 
        onLogin={() => setAuthModal({ isOpen: true, type: 'login' })} 
        onRegister={() => setAuthModal({ isOpen: true, type: 'register' })} 
        onIhbar={() => setIsIhbarOpen(true)}
      />

      <main className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        <MapPanel />
        <FilterBar />
        <SignalList />
      </main>

      {/* --- MODAL KATMANLARI --- */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        type={authModal.type} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
      />

      <IhbarModal 
        isOpen={isIhbarOpen} 
        onClose={() => setIsIhbarOpen(false)} 
      />

      <footer className="py-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.5em]">
        İHHA Karargah Operasyon Merkezi © 2026
      </footer>
    </div>
  );
};

export default App;