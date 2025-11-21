import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// === ПРОФЕССИОНАЛЬНЫЕ ПАРАМЕТРЫ СВАЙПА ===
const SWIPE_CONFIG = {
  // УВЕЛИЧЕННЫЕ пороги для надежного различения жестов
  MOVEMENT_THRESHOLD: 25, // Еще больше увеличено для надежности
  HORIZONTAL_BIAS: 4.0,   // Сильно увеличено для четкого горизонтального определения
  COMPLETION_THRESHOLD: 0.35,
  VELOCITY_THRESHOLD: 0.6,
  MIN_FLING_DISTANCE: 60,
  
  // Визуальные эффекты
  PREVIOUS_SCREEN_BRIGHTNESS_START: 0.85,
  PREVIOUS_SCREEN_BRIGHTNESS_END: 1.0,
  PARALLAX_EFFECT: 0.3,
  CURRENT_SCREEN_SHADOW: 0.15,
  SHADOW_OPACITY: 0.3,
  
  // Физика анимации
  RUBBER_BAND_COEFF: 0.25,
  RETURN_ANIMATION_DURATION: 250,
  VELOCITY_SMOOTHING: 0.6,
  
  // Максимальное расстояние свайпа
  MAX_SWIPE_DISTANCE: 0.85,
  
  // Настройки блокировки скролла
  SCROLL_LOCK_ENABLED: true,
  
  // Настройки определения жестов
  TOUCH_HISTORY_SIZE: 10,
  VELOCITY_SAMPLES: 3,
  
  // Параметры для предотвращения конфликтов
  CONFLICT_PREVENTION_DELAY: 80, // Увеличена задержка
  TAP_MAX_DURATION: 200, // Максимальное время для тапа
} as const;

interface UseSwipeBackProps {
  onSwipeBack: () => void;
  enabled: boolean;
  swipeThreshold?: number;
  scrollLock?: boolean;
}

interface TouchInfo {
  x: number;
  y: number;
  time: number;
}

interface SwipeMetrics {
  distance: number;
  progress: number;
  velocity: number;
  isComplete: boolean;
  shouldComplete: boolean;
}

interface BodyStyleState {
  overflow: string;
  position: string;
  top: string;
  width: string;
  height: string;
  scrollY: number;
}

export const useSwipeBack = ({ 
  onSwipeBack, 
  enabled,
  swipeThreshold = SWIPE_CONFIG.COMPLETION_THRESHOLD,
  scrollLock = SWIPE_CONFIG.SCROLL_LOCK_ENABLED
}: UseSwipeBackProps) => {
  // VISUAL STATE
  const [dragDistance, setDragDistance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // LOGIC STATE (Refs for performance)
  const touchStartRef = useRef<TouchInfo | null>(null);
  const gestureTypeRef = useRef<'undecided' | 'swipe' | 'scroll' | 'tap'>('undecided');
  const lastTouchRef = useRef<TouchInfo | null>(null);
  const velocityRef = useRef(0);
  const touchHistoryRef = useRef<TouchInfo[]>([]);
  const startScrollTopRef = useRef(0);
  const isScrollPreventedRef = useRef(false);
  const scrollLockTimeoutRef = useRef<number | null>(null);
  const tapTimeoutRef = useRef<number | null>(null);
  
  // DOM Refs
  const screenRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Scroll Lock Refs
  const scrollLockStyleRef = useRef<HTMLStyleElement | null>(null);
  const originalBodyStyleRef = useRef<BodyStyleState>({
    overflow: '',
    position: '',
    top: '',
    width: '',
    height: '',
    scrollY: 0
  });
  const isScrollLockedRef = useRef(false);

  // === СИСТЕМА БЛОКИРОВКИ СКРОЛЛА ===
  
  const lockScroll = useCallback(() => {
    if (!scrollLock || isScrollLockedRef.current) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    
    originalBodyStyleRef.current = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      height: body.style.height,
      scrollY
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.height = '100%';

    const style = document.createElement('style');
    style.id = 'swipe-back-scroll-lock';
    style.innerHTML = `
      html.swipe-scroll-lock {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
      body.swipe-scroll-lock * {
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: none !important;
      }
    `;
    document.head.appendChild(style);
    scrollLockStyleRef.current = style;
    
    html.classList.add('swipe-scroll-lock');
    body.classList.add('swipe-scroll-lock');

    isScrollLockedRef.current = true;
  }, [scrollLock]);

  const unlockScroll = useCallback(() => {
    if (!isScrollLockedRef.current) return;

    const body = document.body;
    const html = document.documentElement;
    const originalStyles = originalBodyStyleRef.current;

    if (scrollLockStyleRef.current) {
      if (document.head.contains(scrollLockStyleRef.current)) {
        document.head.removeChild(scrollLockStyleRef.current);
      }
      scrollLockStyleRef.current = null;
    }

    html.classList.remove('swipe-scroll-lock');
    body.classList.remove('swipe-scroll-lock');

    body.style.overflow = originalStyles.overflow;
    body.style.position = originalStyles.position;
    body.style.top = originalStyles.top;
    body.style.width = originalStyles.width;
    body.style.height = originalStyles.height;

    if (originalStyles.position !== 'fixed') {
      window.scrollTo(0, originalStyles.scrollY);
    }

    isScrollLockedRef.current = false;
    isScrollPreventedRef.current = false;
  }, []);

  // Очистка всех таймаутов и анимаций
  const clearAllTimeouts = useCallback(() => {
    if (scrollLockTimeoutRef.current) {
      clearTimeout(scrollLockTimeoutRef.current);
      scrollLockTimeoutRef.current = null;
    }
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      unlockScroll();
    };
  }, [clearAllTimeouts, unlockScroll]);

  // === УТИЛИТЫ ===

  const getScreenWidth = useCallback(() => {
    return screenRef.current?.offsetWidth || window.innerWidth;
  }, []);

  const calculateSwipeMetrics = useCallback((distance: number): SwipeMetrics => {
    const screenWidth = getScreenWidth();
    const progress = Math.min(SWIPE_CONFIG.MAX_SWIPE_DISTANCE, distance / screenWidth);
    const isComplete = progress >= swipeThreshold;
    const velocity = Math.abs(velocityRef.current);
    
    const shouldComplete = 
      isComplete ||
      (velocity >= SWIPE_CONFIG.VELOCITY_THRESHOLD && 
       distance >= SWIPE_CONFIG.MIN_FLING_DISTANCE);

    return {
      distance,
      progress,
      velocity,
      isComplete,
      shouldComplete
    };
  }, [getScreenWidth, swipeThreshold]);

  // УЛУЧШЕННАЯ проверка элементов с расширенным списком
  const shouldIgnoreTouch = useCallback((target: HTMLElement): boolean => {
    // Быстрая проверка на явные запреты
    if (target.closest('[data-no-swipe]')) return true;
    
    // Расширенный список интерактивных элементов
    const interactiveSelectors = [
      'button', 
      'a', 
      'input', 
      'select', 
      'textarea', 
      '[role="button"]', 
      '[role="link"]',
      '[role="tab"]',
      '[contenteditable="true"]',
      '[data-scrollable]',
      '.scrollable',
      '.no-swipe',
      '[data-horizontal-scroll]',
      '.horizontal-scroll',
      '[data-tap-enabled]',
      '[data-long-press-enabled]',
      '[data-swipe-enabled]',
      '[onClick]',
      '.interactive',
      '.clickable',
      // Специфичные для вашего приложения
      '[class*="button"]',
      '[class*="btn"]',
      '[class*="tab"]',
      '[class*="menu"]',
      '[class*="nav"]',
      '[class*="link"]',
      // Элементы форм
      'label',
      '[type="radio"]',
      '[type="checkbox"]',
      // Элементы с обработчиками событий
      '[onTouchStart]',
      '[onTouchEnd]',
      '[onTouchMove]',
    ];
    
    const isInteractive = interactiveSelectors.some(selector => {
      const element = target.closest(selector);
      if (element) {
        // Дополнительная проверка: если элемент отключен, не игнорируем
        if (element.hasAttribute('disabled')) return false;
        return true;
      }
      return false;
    });
    
    return isInteractive;
  }, []);

  const calculateVelocity = useCallback((currentTouch: TouchInfo): number => {
    const history = touchHistoryRef.current;
    if (history.length < 2) return 0;

    const recentTouches = history.slice(-SWIPE_CONFIG.VELOCITY_SAMPLES);
    let totalVelocity = 0;
    let sampleCount = 0;

    for (let i = 1; i < recentTouches.length; i++) {
      const current = recentTouches[i];
      const previous = recentTouches[i - 1];
      const timeDelta = current.time - previous.time;
      
      if (timeDelta > 0) {
        const moveDelta = current.x - previous.x;
        totalVelocity += moveDelta / timeDelta;
        sampleCount++;
      }
    }

    return sampleCount > 0 ? totalVelocity / sampleCount : 0;
  }, []);

  // === ОБРАБОТЧИКИ КАСАНИЙ ===

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || isAnimating) return;

    const target = e.target as HTMLElement;
    
    // ВАЖНО: проверяем интерактивные элементы ДО начала обработки
    if (shouldIgnoreTouch(target)) {
      return; // Полностью игнорируем для интерактивных элементов
    }

    const touch = e.touches[0];
    const time = Date.now();
    const info: TouchInfo = { 
      x: touch.clientX, 
      y: touch.clientY, 
      time 
    };

    // Сбрасываем состояние
    clearAllTimeouts();
    touchStartRef.current = info;
    lastTouchRef.current = info;
    gestureTypeRef.current = 'undecided';
    velocityRef.current = 0;
    touchHistoryRef.current = [info];
    startScrollTopRef.current = document.documentElement.scrollTop || document.body.scrollTop;
    
    // Таймаут для автоматического определения тапа
    tapTimeoutRef.current = window.setTimeout(() => {
      if (touchStartRef.current && gestureTypeRef.current === 'undecided') {
        gestureTypeRef.current = 'tap';
      }
    }, SWIPE_CONFIG.TAP_MAX_DURATION);
  }, [enabled, isAnimating, shouldIgnoreTouch, clearAllTimeouts]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isAnimating) return;

    // Если уже определили как тап - игнорируем движение
    if (gestureTypeRef.current === 'tap') {
      return;
    }

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const currentTime = Date.now();
    
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    const currentTouch: TouchInfo = { x: currentX, y: currentY, time: currentTime };
    touchHistoryRef.current.push(currentTouch);
    
    if (touchHistoryRef.current.length > SWIPE_CONFIG.TOUCH_HISTORY_SIZE) {
      touchHistoryRef.current.shift();
    }

    const rawVelocity = calculateVelocity(currentTouch);
    velocityRef.current = SWIPE_CONFIG.VELOCITY_SMOOTHING * velocityRef.current + 
                         (1 - SWIPE_CONFIG.VELOCITY_SMOOTHING) * rawVelocity;
    
    lastTouchRef.current = currentTouch;

    // Обработка активного свайпа
    if (gestureTypeRef.current === 'swipe') {
      const screenWidth = getScreenWidth();
      const maxDistance = screenWidth * SWIPE_CONFIG.MAX_SWIPE_DISTANCE;
      let newDistance = deltaX;
      
      if (deltaX > maxDistance) {
        const exceeded = deltaX - maxDistance;
        newDistance = maxDistance + (exceeded * SWIPE_CONFIG.RUBBER_BAND_COEFF);
      }
      
      if (deltaX < 0) {
        const resistance = SWIPE_CONFIG.RUBBER_BAND_COEFF * (1 - Math.exp(-Math.abs(deltaX) / 80));
        newDistance = deltaX * resistance;
      }
      
      setDragDistance(newDistance);
      
      // preventDefault только при значительном движении
      if (absDeltaX > SWIPE_CONFIG.MOVEMENT_THRESHOLD * 2 && !isScrollPreventedRef.current) {
        e.preventDefault();
        isScrollPreventedRef.current = true;
      }
      return;
    }

    if (gestureTypeRef.current === 'scroll') {
      return;
    }

    // Определение типа жеста с ОЧЕНЬ высокими порогами
    if (gestureTypeRef.current === 'undecided') {
      // Очищаем таймаут тапа при движении
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }

      // Игнорируем микро-движения (ВЫСОКИЙ порог)
      if (absDeltaX < SWIPE_CONFIG.MOVEMENT_THRESHOLD && absDeltaY < SWIPE_CONFIG.MOVEMENT_THRESHOLD) {
        return;
      }

      const currentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollDelta = Math.abs(startScrollTopRef.current - currentScrollTop);
      const isScrolling = absDeltaY > absDeltaX && scrollDelta > 2;

      if (isScrolling) {
        gestureTypeRef.current = 'scroll';
        return;
      }

      // ОЧЕНЬ СТРОГОЕ определение свайпа
      if (absDeltaX > absDeltaY * SWIPE_CONFIG.HORIZONTAL_BIAS && deltaX > 0) {
        gestureTypeRef.current = 'swipe';
        setDragDistance(deltaX);
        
        // Отложенная блокировка скролла
        scrollLockTimeoutRef.current = window.setTimeout(() => {
          if (gestureTypeRef.current === 'swipe' && !isScrollLockedRef.current) {
            lockScroll();
          }
        }, SWIPE_CONFIG.CONFLICT_PREVENTION_DELAY);
        
        // preventDefault только при значительном движении
        if (absDeltaX > SWIPE_CONFIG.MOVEMENT_THRESHOLD * 2) {
          e.preventDefault();
          isScrollPreventedRef.current = true;
        }
      } else {
        gestureTypeRef.current = 'scroll';
      }
    }
  }, [isAnimating, getScreenWidth, calculateVelocity, lockScroll]);

  const animateReturn = useCallback((startDistance: number, duration: number = SWIPE_CONFIG.RETURN_ANIMATION_DURATION) => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const currentDistance = startDistance * (1 - easeOut(progress));
      
      setDragDistance(currentDistance);

      if (now < endTime && currentDistance > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDragDistance(0);
        setIsAnimating(false);
        isScrollPreventedRef.current = false;
        unlockScroll();
      }
    };

    setIsAnimating(true);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [unlockScroll]);

  const handleTouchEnd = useCallback(() => {
    clearAllTimeouts();

    if (!touchStartRef.current) {
      unlockScroll();
      return;
    }

    // Если это был тап - немедленно сбрасываем
    if (gestureTypeRef.current === 'tap') {
      touchStartRef.current = null;
      gestureTypeRef.current = 'undecided';
      unlockScroll();
      return;
    }

    if (gestureTypeRef.current !== 'swipe') {
      touchStartRef.current = null;
      gestureTypeRef.current = 'undecided';
      unlockScroll();
      return;
    }

    const metrics = calculateSwipeMetrics(dragDistance);

    if (metrics.shouldComplete) {
      onSwipeBack();
    } else {
      animateReturn(dragDistance);
    }

    // Сброс состояния
    touchStartRef.current = null;
    gestureTypeRef.current = 'undecided';
    velocityRef.current = 0;
    touchHistoryRef.current = [];
    isScrollPreventedRef.current = false;
    
    if (metrics.shouldComplete) {
      unlockScroll();
    }
  }, [dragDistance, onSwipeBack, calculateSwipeMetrics, animateReturn, unlockScroll, clearAllTimeouts]);

  const handleTouchCancel = useCallback(() => {
    clearAllTimeouts();

    if (gestureTypeRef.current === 'swipe' && dragDistance > 0) {
      animateReturn(dragDistance);
    } else {
      setDragDistance(0);
      unlockScroll();
    }
    
    touchStartRef.current = null;
    gestureTypeRef.current = 'undecided';
    velocityRef.current = 0;
    touchHistoryRef.current = [];
    isScrollPreventedRef.current = false;
  }, [dragDistance, animateReturn, unlockScroll, clearAllTimeouts]);

  // Memoize drag handlers
  const dragHandlers = useMemo(() => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    ref: screenRef,
    style: {
      touchAction: 'pan-y',
      overscrollBehavior: 'none',
      // Улучшенная обработка для iOS
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      // Дополнительные гарантии
      userSelect: 'none',
    } as React.CSSProperties
  }), [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  const isDragging = gestureTypeRef.current === 'swipe' && dragDistance > 0;
  const metrics = calculateSwipeMetrics(dragDistance);
  
  const pushedStyle: React.CSSProperties = useMemo(() => ({
    transform: `translate3d(${dragDistance}px, 0, 0)`,
    transition: isAnimating ? 
      `transform ${SWIPE_CONFIG.RETURN_ANIMATION_DURATION}ms cubic-bezier(0.2, 0.9, 0.1, 1)` : 
      'none',
    touchAction: isDragging ? 'none' : 'pan-y',
    overscrollBehavior: 'none',
    zIndex: 100,
    position: 'relative',
    height: '100%',
    boxShadow: isDragging ? 
      `-4px 0 20px rgba(0, 0, 0, ${SWIPE_CONFIG.CURRENT_SCREEN_SHADOW * metrics.progress})` : 
      'none',
    userSelect: isDragging ? 'none' : 'auto',
    WebkitUserSelect: isDragging ? 'none' : 'auto',
  }), [dragDistance, isAnimating, isDragging, metrics.progress]);
  
  const underlyingStyle: React.CSSProperties = useMemo(() => ({
    transform: `translate3d(${dragDistance * SWIPE_CONFIG.PARALLAX_EFFECT}px, 0, 0)`,
    filter: `brightness(${
      SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_START + 
      metrics.progress * (SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_END - SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_START)
    })`,
    transition: isAnimating ? 
      `all ${SWIPE_CONFIG.RETURN_ANIMATION_DURATION}ms cubic-bezier(0.2, 0.9, 0.1, 1)` : 
      'none',
    opacity: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, 
    pointerEvents: 'none',
  }), [dragDistance, isAnimating, metrics.progress]);

  return {
    dragHandlers,
    pushedStyle,
    underlyingStyle,
    isDragging,
    isAnimating,
    dragProgress: metrics.progress,
    swipeMetrics: metrics,
    resetSwipe: useCallback(() => {
      setDragDistance(0);
      gestureTypeRef.current = 'undecided';
      touchStartRef.current = null;
      isScrollPreventedRef.current = false;
      clearAllTimeouts();
      unlockScroll();
    }, [unlockScroll, clearAllTimeouts])
  };
};

interface SwipeBackShadowProps {
  progress: number;
  maxOpacity?: number;
  color?: string;
  width?: number;
}

export const SwipeBackShadow: React.FC<SwipeBackShadowProps> = ({ 
  progress, 
  maxOpacity = SWIPE_CONFIG.SHADOW_OPACITY,
  color = 'rgba(0,0,0,0.1)',
  width = 8
}) => {
  const opacity = Math.min(maxOpacity, progress * maxOpacity * 2);
  
  return (
    <div
      className="swipe-back-shadow"
      style={{
        position: 'absolute',
        top: 0,
        left: -width,
        bottom: 0,
        width: `${width}px`,
        background: `linear-gradient(to right, rgba(0,0,0,0) 0%, ${color} 100%)`,
        opacity,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1001,
      }}
    />
  );
};