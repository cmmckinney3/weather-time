import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 3500) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const api = {
    push,
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d ?? 5000),
    info: (m, d) => push(m, 'info', d),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const TYPE_CONFIG = {
  success: { Icon: CheckCircle2, color: 'text-ch-emerald', border: 'border-ch-emerald/40', glow: 'shadow-glow-emerald' },
  error:   { Icon: AlertCircle,  color: 'text-ch-red',     border: 'border-ch-red/40',     glow: '' },
  info:    { Icon: Info,         color: 'text-ch-cyan',    border: 'border-ch-cyan/40',    glow: 'shadow-glow-cyan' },
};

const ToastItem = ({ toast, onDismiss }) => {
  const [leaving, setLeaving] = useState(false);
  const { Icon, color, border, glow } = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;

  useEffect(() => {
    const id = setTimeout(() => setLeaving(false), 0);
    return () => clearTimeout(id);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 180);
  };

  return (
    <div
      role="status"
      className={`glass-panel pointer-events-auto border ${border} ${glow} px-4 py-3 flex items-start gap-3 min-w-[260px] sm:min-w-[300px] ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <Icon size={16} className={`${color} flex-shrink-0 mt-0.5`} />
      <p className="text-xs text-slate-200 font-mono flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};
