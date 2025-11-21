
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onLoadingComplete?: () => void;
  status?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadingComplete, status }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only trigger auto-fadeout if there is no persistent status (like deep link fetching)
    // If status is present, parent controls visibility via mounting/unmounting
    if (!status) {
        const fadeOutTimeout = setTimeout(() => {
        setIsFadingOut(true);
        if (onLoadingComplete) {
            setTimeout(onLoadingComplete, 600);
        }
        }, 3200); 

        return () => {
        clearTimeout(fadeOutTimeout);
        };
    }
  }, [onLoadingComplete, status]);

  // Shield Path (идентичен Avatar.tsx для идеального наложения)
  const shieldPath = "M 50 2 L 95 15 V 50 C 95 80 50 98 50 98 C 50 98 5 80 5 50 V 15 L 50 2 Z";

  return (
    <div className={`splash-screen ${isFadingOut ? 'splash-screen--hidden' : ''}`}>
      <div className="splash-screen__blur"></div>
      <div className="splash-screen__content relative flex flex-col items-center justify-center h-full w-full">
        
        <style>
          {`
            @keyframes breathe {
              0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(34, 211, 238, 0)); }
              50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(34, 211, 238, 0.3)); }
              100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(34, 211, 238, 0)); }
            }

            @keyframes scan-up {
              0% { height: 0%; }
              100% { height: 100%; }
            }
            
            @keyframes scan-line-move {
              0% { bottom: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { bottom: 100%; opacity: 0; }
            }

            .logo-container {
              width: 140px;
              height: 140px;
              position: relative;
              /* iOS Breathe Animation applied to the whole container */
              animation: breathe 4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
            }

            /* Слой 1: Блеклый, с голубым оттенком */
            .base-layer {
               opacity: 0.6;
            }

            /* Контейнер маски */
            .scan-mask {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 0%; /* Анимируется до 100% */
              animation: scan-up 2s cubic-bezier(0.45, 0, 0.55, 1) forwards;
              overflow: hidden;
              z-index: 2;
            }

            /* SVG внутри маски: фиксированная высота, чтобы не сплющивался */
            .scan-mask svg {
               position: absolute;
               bottom: 0;
               left: 0;
               width: 100%;
               height: 140px; /* Важно: равно высоте контейнера */
            }

            /* Линия сканера */
            .scan-line {
              position: absolute;
              left: -20%;
              width: 140%;
              height: 2px;
              background: linear-gradient(90deg, transparent, #22d3ee, #ffffff, #22d3ee, transparent);
              box-shadow: 0 0 15px 2px rgba(34, 211, 238, 0.8);
              z-index: 10;
              bottom: 0;
              opacity: 0;
              animation: scan-line-move 2s cubic-bezier(0.45, 0, 0.55, 1) forwards;
            }
          `}
        </style>

        <div className="logo-container">
          {/* 1. BASE LAYER: Блеклая, темно-голубая версия */}
          <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0 base-layer">
            {/* Темный приглушенный щит */}
            <path d={shieldPath} fill="#0f172a" stroke="#164e63" strokeWidth="1" />
            
            {/* Блеклый голубой силуэт зубра */}
            <g transform="scale(0.9) translate(5.5, 5)" fill="#0e7490" opacity="0.4">
                <path d="M 20 60 L 50 15 L 80 60 Z" />
                <path d="M 50 92 L 35 75 L 28 55 L 15 35 L 32 42 L 40 35 L 60 35 L 68 42 L 85 35 L 72 55 L 65 75 Z" />
            </g>
          </svg>

          {/* 2. REVEAL LAYER: Нормальная, яркая версия (раскрывается маской) */}
          <div className="scan-mask">
             <svg viewBox="0 0 100 100">
                <defs>
                    {/* Яркий градиент (Cyan -> Purple) как в DMTIcon */}
                    <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan 400 */}
                        <stop offset="100%" stopColor="#a855f7" /> {/* Purple 500 */}
                    </linearGradient>
                    <filter id="brand-glow" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="3" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {/* Нормальный черный щит */}
                <path d={shieldPath} fill="#050505" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1.5" />
                
                {/* Нормальный яркий зубр с глазами */}
                <g transform="scale(0.9) translate(5.5, 5)" filter="url(#brand-glow)">
                    {/* Горб */}
                    <path d="M 20 60 L 50 15 L 80 60 Z" fill="url(#brand-grad)" opacity="0.5" />
                    {/* Голова */}
                    <path d="M 50 92 L 35 75 L 28 55 L 15 35 L 32 42 L 40 35 L 60 35 L 68 42 L 85 35 L 72 55 L 65 75 Z" fill="url(#brand-grad)" />
                    {/* Глаза (важная деталь "нормального" состояния) */}
                    <path d="M 38 55 L 45 58 L 38 61 Z" fill="#000" />
                    <path d="M 62 55 L 55 58 L 62 61 Z" fill="#000" />
                </g>
                
                {/* Блик */}
                <path d={shieldPath} fill="url(#gloss)" pointerEvents="none" style={{mixBlendMode: 'overlay'}}/>
             </svg>
          </div>
          
          {/* 3. Линия сканера */}
          <div className="scan-line"></div>
        </div>

      </div>
    </div>
  );
};
