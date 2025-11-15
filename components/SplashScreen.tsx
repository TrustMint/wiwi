import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onLoadingComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadingComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade out effect
    const fadeOutTimeout = setTimeout(() => {
      setIsFadingOut(true);
      if (onLoadingComplete) {
        setTimeout(onLoadingComplete, 600); // Match CSS animation duration
      }
    }, 3000); // Total splash screen time

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [onLoadingComplete]);

  return (
    <div className={`splash-screen ${isFadingOut ? 'splash-screen--hidden' : ''}`}>
      <div className="splash-screen__blur"></div>
      <div className="splash-screen__content">
        <img src="/assets/preloader-icon.svg" alt="DeMarket Logo" className="splash-screen__icon" />
      </div>
    </div>
  );
};