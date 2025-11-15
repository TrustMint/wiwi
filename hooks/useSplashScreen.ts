import { useState, useEffect, useCallback } from 'react';

export const useSplashScreen = (): { isLoading: boolean; handleLoadingComplete: () => void; } => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the splash screen has been seen in this session
    const hasSeenSplash = sessionStorage.getItem('deMarketIOSLoaderSeen');
    
    if (hasSeenSplash) {
      setIsLoading(false);
    } else {
      sessionStorage.setItem('deMarketIOSLoaderSeen', 'true');
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    handleLoadingComplete
  };
};