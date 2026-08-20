import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, toastType, clearToast } = useUIStore();

  if (!toastMessage) return null;

  const styles = {
    success: {
      border: 'border-green-500/20 bg-green-950/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
      icon: <CheckCircle className="text-green-400 flex-shrink-0" size={16} />,
    },
    error: {
      border: 'border-red-500/20 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      icon: <AlertCircle className="text-red-400 flex-shrink-0" size={16} />,
    },
    info: {
      border: 'border-primary/20 bg-primary-container/5 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
      icon: <Info className="text-primary flex-shrink-0" size={16} />,
    },
  };

  const activeStyle = styles[toastType] || styles.info;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down pointer-events-none">
      <div className={`glass-panel ${activeStyle.border} py-3 px-5 rounded-full flex items-center gap-3 backdrop-blur-xl pointer-events-auto max-w-sm`}>
        {activeStyle.icon}
        <span className="text-[13px] font-semibold text-on-surface truncate">{toastMessage}</span>
        <button
          onClick={clearToast}
          className="text-on-surface-variant hover:text-on-surface p-0.5 rounded-full hover:bg-white/5 active:scale-95 duration-200 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
