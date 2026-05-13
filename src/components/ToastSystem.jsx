import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastFn = null;

export const toast = {
  success: (msg) => toastFn?.('success', msg),
  error:   (msg) => toastFn?.('error', msg),
  warning: (msg) => toastFn?.('warning', msg),
  info:    (msg) => toastFn?.('info', msg),
};

const ICONS = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
};

const STYLES = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    toastFn = addToast;
    return () => { toastFn = null; };
  }, [addToast]);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md pointer-events-auto animate-in slide-in-from-right duration-300 min-w-[280px] max-w-[380px] bg-[#0d1425] ${STYLES[t.type]}`}
        >
          <span className="shrink-0">{ICONS[t.type]}</span>
          <p className="text-xs font-bold flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}