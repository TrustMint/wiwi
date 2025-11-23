import React, { useCallback } from 'react';

export type Tab = 'home' | 'catalog' | 'create' | 'chats' | 'profile';

interface TabBarProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface TabBarItemProps {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  isAction?: boolean;
  badge?: number; // Добавим поддержку бейджей для уведомлений
  disabled?: boolean;
}

interface TabBarItemRendererProps extends TabBarItemProps {
  isActive: boolean;
  onClick: () => void;
}

const TabBarItemRenderer: React.FC<TabBarItemRendererProps> = ({
  label,
  icon,
  isAction = false,
  isActive,
  onClick,
  badge,
  disabled = false,
}) => {
  const activeColor = 'text-cyan-400';
  const inactiveColor = 'text-gray-400 hover:text-gray-200';
  const disabledColor = 'text-gray-600 cursor-not-allowed';

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    onClick();
  }, [disabled, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [disabled, onClick]);

  if (isAction) {
    return (
      <button 
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative flex flex-col items-center justify-center h-16 w-full transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset rounded-full"
        disabled={disabled}
        aria-label={label}
        aria-disabled={disabled}
      >
        <div className={`
          flex items-center justify-center w-12 h-10 rounded-2xl text-white shadow-lg transform transition-all duration-200 relative
          ${disabled 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-cyan-500 shadow-cyan-500/40 hover:bg-cyan-600 hover:scale-105 active:scale-95'
          }
        `}>
          {icon}
          {badge && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-black z-10">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      </button>
    );
  }
  
  return (
    <button 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex flex-col items-center justify-center h-16 w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset rounded-full
        ${disabled ? 'cursor-not-allowed' : 'active:scale-95'}
      `}
      disabled={disabled}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled}
    >
      {/* The animated pill background for active state */}
      <span 
        className={`
          absolute inset-y-1 -inset-x-1.5 backdrop-blur-xl ring-1 rounded-full transition-all duration-300 ease-in-out 
          ${isActive 
            ? 'bg-white/15 ring-white/10 opacity-100 scale-100' 
            : 'opacity-0 scale-90'
          }
          ${disabled ? 'ring-gray-600' : 'ring-white/10'}
        `}
        aria-hidden="true"
      ></span>
      
      {/* The content (icon and label) is relative to sit on top */}
      <div className="relative flex flex-col items-center justify-center space-y-1">
        <div className={`
          transition-colors duration-200 relative inline-flex items-center justify-center
          ${disabled 
            ? disabledColor 
            : isActive 
              ? activeColor 
              : inactiveColor
          }
        `}>
          {icon}
          {/* Badge positioned at top-right corner of icon */}
          {badge && badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 border-[1.5px] border-black z-10 shadow-sm">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        <span className={`
          text-xs font-medium transition-colors duration-200
          ${disabled 
            ? disabledColor 
            : isActive 
              ? activeColor 
              : inactiveColor
          }
        `}>
          {label}
        </span>
      </div>
    </button>
  );
};

const TabBarComponent: React.FC<TabBarProps> = ({ children, activeTab, onTabChange }) => {
  const items = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabBarItemProps> => 
      React.isValidElement(child) && child.type === TabBarItem
  );

  const handleTabChange = useCallback((tab: Tab) => {
    onTabChange(tab);
  }, [onTabChange]);

  return (
    <div 
      className="fixed inset-x-4 z-50 pointer-events-none transition-[bottom] duration-300"
      // Remove extra 10px buffer to place it as low as possible while respecting safe area
      style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Основная навигация"
    >
        <div 
          className="max-w-[340px] mx-auto bg-black/80 backdrop-blur-3xl rounded-full border-2 border-white/10 shadow-2xl pointer-events-auto"
          role="tablist"
          aria-orientation="horizontal"
        >
            <div className="grid grid-cols-5 items-center h-16 px-[10px]">
                 {items.map((item) => {
                   const { id, ...itemProps } = item.props;
                   return (
                    <TabBarItemRenderer
                        key={id}
                        id={id}
                        {...itemProps}
                        isActive={activeTab === id}
                        onClick={() => handleTabChange(id)}
                    />
                   );
                 })}
            </div>
        </div>
    </div>
  );
};

const TabBarItem: React.FC<TabBarItemProps> = () => null;

export const TabBar = Object.assign(TabBarComponent, {
  Item: TabBarItem,
});