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
        icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    },
    error: {
        icon: <XCircleIcon className="w-5 h-5 text-red-400" />,
    },
    warning: {
        icon: <InformationCircleIcon className="w-5 h-5 text-yellow-400" />,
    },
    info: {
        icon: <SparklesIcon className="w-5 h-5 text-cyan-400" />,
    }
};

export const Toast: React.FC<ToastProps> = ({ message, type, show }) => {
  const config = toastConfig[type] || toastConfig.info;

  return (
    <div
      aria-live="assertive"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-in-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div
        className="inline-flex items-center gap-3 max-w-[calc(100vw-2rem)] py-2 px-4 bg-gray-900/70 backdrop-blur-xl rounded-full border border-white/15 shadow-lg"
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <p className="font-semibold text-sm text-white truncate">{message}</p>
      </div>
    </div>
  );
};