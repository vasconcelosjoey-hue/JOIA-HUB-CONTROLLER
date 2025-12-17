
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none md:top-6 md:right-6">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-float border animate-in slide-in-from-right-10 fade-in duration-300 max-w-[90vw] w-auto md:w-96 backdrop-blur-md ${
                            toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
                            toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' :
                            toast.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-800' :
                            'bg-white/95 border-gray-200 text-gray-800'
                        }`}
                    >
                        <div className="shrink-0">
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'success' && <CheckCircle2 size={20} />}
                            {toast.type === 'warning' && <AlertTriangle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <p className="text-xs md:text-sm font-bold leading-tight">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-50 hover:opacity-100 p-1">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
