import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassPanel } from './GlassPanel';
import { XCircleIcon } from '../icons/Icons';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare props to satisfy TypeScript in strict environments
  declare props: Readonly<ErrorBoundaryProps>;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // Очистка всех хранилищ для сброса состояния "бой" (corrupted state)
    localStorage.clear();
    sessionStorage.clear();
    // Жесткая перезагрузка страницы
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-6">
          <GlassPanel className="max-w-sm w-full p-6 text-center border-red-500/30">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <XCircleIcon className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Возникла проблема</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Произошла критическая ошибка в работе приложения. Мы уже знаем об этом.
              Пожалуйста, попробуйте сбросить приложение.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-transform active:scale-95"
            >
              Сбросить и перезапустить
            </button>
            {this.state.error && (
                <div className="mt-4 p-2 bg-black/40 rounded text-xs text-gray-600 font-mono overflow-hidden text-left">
                    {this.state.error.toString()}
                </div>
            )}
          </GlassPanel>
        </div>
      );
    }

    return this.props.children;
  }
}
