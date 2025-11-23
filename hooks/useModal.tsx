import React, { useState, createContext, useContext, useCallback, useRef, useEffect } from 'react';

// Эта реализация полностью переработана для соответствия UX iOS-приложений.
// Она включает в себя анимацию появления снизу, свайп для закрытия,
// и эффект "жидкого стекла", соответствующий нашему дизайн-коду "iOS Crypto-Glass".

interface ModalContextType {
  showModal: (component: React.ReactNode) => void;
  hideModal: () => void;
  isModalOpen: boolean; // Экспортируем состояние для возможности очистки в родительских компонентах
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const isModalOpen = modalContent !== null;

  const showModal = useCallback((component: React.ReactNode) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    setModalContent(component);
    setIsClosing(false);
    
    setTimeout(() => {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }, 10);
  }, []);

  const hideModal = useCallback(() => {
    if (isClosing) return;
    
    setIsClosing(true);
    setIsVisible(false);
    
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    hideTimeoutRef.current = window.setTimeout(() => {
      setModalContent(null);
      setIsClosing(false);
      hideTimeoutRef.current = null;
    }, 300); // Соответствует длительности анимации
  }, [isClosing]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      hideModal();
    }
  }, [hideModal]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const content = contentRef.current;
    
    // Проверяем, начинается ли свайп в нижней части модального окна (последние 48px)
    const contentRect = content?.getBoundingClientRect();
    const isSwipeFromBottom = contentRect && (touch.clientY > contentRect.bottom - 48);
    
    // Разрешаем свайп только из нижней части или если контент не скроллится
    const scrollableContent = e.currentTarget.querySelector('.modal-scroll-content');
    const isAtTop = !scrollableContent || scrollableContent.scrollTop <= 0;
    
    if (!isSwipeFromBottom && !isAtTop) return;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0 && content) {
        moveEvent.preventDefault();
        const resistance = isSwipeFromBottom ? 1 : 0.5; // Меньше сопротивления при свайпе снизу
        content.style.transition = 'none';
        content.style.transform = `translateY(${deltaY * resistance}px)`;
        
        // Затемнение фона при свайпе вниз
        const overlay = modalRef.current;
        if (overlay) {
          const progress = Math.min(deltaY / 200, 0.6); // Максимальное затемнение 60%
          overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.6 - progress * 0.3})`;
        }
      }
    };
    
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endY = endEvent.changedTouches[0].clientY;
      const deltaY = endY - startY;
      
      // Восстанавливаем фон
      const overlay = modalRef.current;
      if (overlay) {
        overlay.style.backgroundColor = '';
      }
      
      if(content) {
        content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Уменьшаем порог закрытия при свайпе из нижней части
        const closeThreshold = isSwipeFromBottom ? 60 : 100;
        
        if (deltaY > closeThreshold) {
          hideModal();
        } else {
          content.style.transform = ''; // Возвращаем на место
        }
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd as EventListener);
  }, [hideModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalContent && !isClosing) {
        hideModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalContent, hideModal, isClosing]);

  const value = { showModal, hideModal, isModalOpen };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modalContent && (
        <div
          ref={modalRef}
          onClick={handleOverlayClick}
          className={`
            fixed inset-0 z-[100]
            flex items-end justify-center sm:items-center
            transition-all duration-300 ease-in-out
            ${isVisible ? 'opacity-100 bg-black/60' : 'opacity-0 bg-transparent pointer-events-none'}
            ${isClosing ? 'backdrop-blur-none' : 'backdrop-blur-sm'}
          `}
        >
          <div
            ref={contentRef}
            onTouchStart={handleTouchStart}
            className={`
              w-full
              bg-black/40 backdrop-blur-3xl
              border-2 border-white/10 /* Матовое стеклянное обрамление 2мм */
              rounded-[40px] /* Увеличил скругление углов */
              shadow-2xl
              transition-all duration-300 ease-in-out
              flex flex-col
              /* Мобильные: отступ снизу 16px как по бокам, сверху 80px (8см) */
              /* Десктоп: по центру, занимает 1/3 ширины */
              max-h-[calc(100vh-96px)] sm:max-h-[calc(100vh-160px)] /* 80px сверху + 16px снизу = 96px, на десктопе больше */
              max-w-full sm:max-w-md
              ${isVisible 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-full sm:translate-y-4 opacity-0 scale-95'
              }
            `}
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: '0 16px 16px 16px', /* Одинаковые отступы со всех сторон на мобильных */
              ...(window.innerWidth >= 640 && { 
                margin: 'auto',
                maxHeight: 'calc(100vh - 160px)' /* 80px сверху и снизу на десктопе */
              })
            }}
          >
            {/* Хедер с крестиком и хендлом - УБРАН ВНЕШНИЙ ОТСТУП СВЕРХУ */}
            <div className="flex-shrink-0 relative h-12"> {/* Убрал pt-4 */}
              {/* Хендл для свайпа (только на мобильных) */}
              <div className="sm:hidden flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-400/60 rounded-full transition-colors duration-200" />
              </div>
              
              {/* Крестик для закрытия - СДЕЛАН "ЛИТЫМ" БЕЗ ЧЕЛКИ */}
              <button
                onClick={hideModal}
                className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-200 active:scale-95"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 14 14" 
                  fill="none" 
                  className="text-white"
                >
                  <path 
                    d="M13 1L1 13M1 1L13 13" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            
            {/* Контент модалки */}
            <div className="overflow-y-auto flex-1 modal-scroll-content px-1 pb-6">
              {modalContent}
            </div>

            {/* Область для удобного свайпа снизу */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 h-12 bg-transparent" />
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};