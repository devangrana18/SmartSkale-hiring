import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-50 text-emerald-900 border-emerald-300',
            error: 'bg-rose-50 text-rose-900 border-rose-300',
            info: 'bg-indigo-50 text-indigo-900 border-indigo-300',
          }[toast.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            info: 'text-indigo-600',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-slide-up ${typeStyles}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-bold text-slate-900 mb-0.5">{toast.title}</p>}
                <p className="font-medium leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
