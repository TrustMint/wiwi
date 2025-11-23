
import React from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, SparklesIcon } from '../icons/Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  show: boolean;
}

const toastConfig: Record<ToastType, { icon: React.ReactNode }> = {
    success: {
        icon: <CheckCircleIcon className="w-7 h-7 text-green-400" />,
    },
    error: {
        icon: <XCircleIcon className="w-7 h-7 text-red-400" />,
    },
    warning: {
        icon: <InformationCircleIcon className="w-7 h-7 text-yellow-400" />,
    },
    info: {
        icon: <SparklesIcon className="w-7 h-7 text-cyan-400" />,
    }
};

export const Toast: React.FC<ToastProps> = ({ message, type, show }) => {
  const config = toastConfig[type] || toastConfig.info;

  return (
    <div
      aria-live="assertive"
      className={`
        fixed top-3 left-1/2 -translate-x-1/2 z-[200]
        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}
        w-[calc(100vw-24px)] sm:w-auto sm:min-w-[380px] sm:max-w-md
      `}
    >
      <div
        className="
          flex items-center gap-3.5 p-3.5 pl-4
          bg-black/60 backdrop-blur-3xl
          border border-white/10
          rounded-[28px]
          shadow-2xl shadow-black/50
        "
      >
        {/* Icon wrapper */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0 py-0.5">
             <p className="text-[15px] font-medium text-white leading-snug break-words whitespace-pre-wrap tracking-tight">
                {message}
             </p>
        </div>
      </div>
    </div>
  );
};
