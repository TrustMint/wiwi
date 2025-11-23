
import React, { useMemo } from 'react';

interface AvatarProps {
  seed: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ seed, className = "w-10 h-10" }) => {
  const { config, uniqueId } = useMemo(() => {
    // 1. Генерируем числовой хеш из строки seed (адреса кошелька)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);

    // 2. Расширенная палитра градиентов (iOS / Crypto style)
    const gradients = [
        ['#4F46E5', '#EC4899'], // Indigo -> Pink
        ['#2563EB', '#22D3EE'], // Blue -> Cyan
        ['#7C3AED', '#DB2777'], // Violet -> Magenta
        ['#059669', '#34D399'], // Emerald -> Teal
        ['#DC2626', '#F59E0B'], // Red -> Amber
        ['#9333EA', '#6366F1'], // Purple -> Indigo
        ['#EA580C', '#FCD34D'], // Orange -> Yellow
        ['#0891B2', '#0EA5E9'], // Cyan -> Sky
        ['#1E293B', '#94A3B8'], // Slate -> Gray (Stealth)
        ['#BE123C', '#FB7185'], // Rose
        ['#15803D', '#86EFAC'], // Green
        ['#B45309', '#FCD34D'], // Amber Gold
    ];
    
    // 3. Типы паттернов фона
    const patterns = ['none', 'grid', 'dots', 'waves', 'hex'];

    // 4. Вычисляем параметры на основе хеша (детерминировано)
    const gradIndex = absHash % gradients.length;
    const patternIndex = (absHash >> 2) % patterns.length; // Сдвиг битов, чтобы не зависеть от того же множителя
    const rotate = (absHash % 360); // Уникальный угол градиента
    
    const gradient = gradients[gradIndex];
    const pattern = patterns[patternIndex];

    // Уникальный ID для SVG определений, чтобы они не пересекались между разными аватарами на странице
    const uniqueId = `avatar-${absHash}-${Math.random().toString(36).substr(2, 5)}`;

    return { 
        config: { gradient, pattern, rotate }, 
        uniqueId 
    };
  }, [seed]);

  // Контур щита
  const shieldPath = "M 50 2 L 95 15 V 50 C 95 80 50 98 50 98 C 50 98 5 80 5 50 V 15 L 50 2 Z";

  return (
    <div 
      className={`relative ${className} flex-shrink-0 drop-shadow-md`} 
      role="img" 
      aria-label={`Avatar for ${seed}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
            {/* Основной уникальный градиент */}
            <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${config.rotate} .5 .5)`}>
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
            </linearGradient>

            {/* Эффект свечения для Зубра */}
            <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="2" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
             
            {/* Стеклянный блик */}
             <linearGradient id={`gloss-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="40%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </linearGradient>

            {/* Паттерны */}
            <pattern id={`pat-grid-${uniqueId}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
            <pattern id={`pat-dots-${uniqueId}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1" fill="rgba(255,255,255,0.15)" />
            </pattern>
            <pattern id={`pat-waves-${uniqueId}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 5 20 10 10 T 20 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </pattern>
             <pattern id={`pat-hex-${uniqueId}`} x="0" y="0" width="10" height="17.32" patternUnits="userSpaceOnUse">
                 <path d="M5 0L10 2.89V8.66L5 11.55L0 8.66V2.89L5 0Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
        </defs>

        {/* 1. Задний фон щита (Темный) */}
        <path 
            d={shieldPath}
            fill="#0a0a0a"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1" 
        />

        {/* 2. Заливка паттерном (если есть) */}
        {config.pattern !== 'none' && (
            <path 
                d={shieldPath} 
                fill={`url(#pat-${config.pattern}-${uniqueId})`} 
                style={{ mixBlendMode: 'overlay' }}
            />
        )}

        {/* 3. Силуэт Зубра с уникальным градиентом */}
        <g filter={`url(#glow-${uniqueId})`} transform="scale(0.9) translate(5.5, 5)">
            
            {/* Горб */}
            <path 
                d="M 20 60 L 50 15 L 80 60 Z" 
                fill={`url(#grad-${uniqueId})`} 
                opacity="0.6"
            />

            {/* Голова и Рога */}
            <path 
                d="M 50 92 L 35 75 L 28 55 L 15 35 L 32 42 L 40 35 L 60 35 L 68 42 L 85 35 L 72 55 L 65 75 Z"
                fill={`url(#grad-${uniqueId})`}
                stroke="#000"
                strokeWidth="1"
                strokeOpacity="0.5"
            />
            
            {/* Глаза (всегда темные для контраста) */}
            <path d="M 38 55 L 45 58 L 38 61 Z" fill="#000" fillOpacity="0.8" />
            <path d="M 62 55 L 55 58 L 62 61 Z" fill="#000" fillOpacity="0.8" />

            {/* Деталь лба */}
            <path d="M 50 40 L 45 50 L 55 50 Z" fill="#000" fillOpacity="0.4" />

        </g>
        
        {/* 4. Блик (Стекло) поверх всего */}
        <path 
            d={shieldPath} 
            fill={`url(#gloss-${uniqueId})`} 
            style={{ mixBlendMode: 'screen' }} 
            pointerEvents="none"
        />
      </svg>
    </div>
  );
};
