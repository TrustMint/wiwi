import React, { useState, useRef, useCallback, useEffect } from 'react';

// === ПРОФЕССИОНАЛЬНЫЕ ПАРАМЕТРЫ СВАЙПА ===
const SWIPE_CONFIG = {
  // Пороги жестов
  MOVEMENT_THRESHOLD: 5,
  HORIZONTAL_BIAS: 1.8,
  COMPLETION_THRESHOLD: 0.35,
  VELOCITY_THRESHOLD: 0.6,
  MIN_FLING_DISTANCE: 60,
  
  // Визуальные эффекты
  PREVIOUS_SCREEN_BRIGHTNESS_START: 0.85,
  PREVIOUS_SCREEN_BRIGHTNESS_END: 1.0,
  PARALLAX_EFFECT: 0.3, // Эффект параллакса для предыдущего экрана
  
  // Физика анимации
  RUBBER_BAND_COEFF: 0.25,
  RETURN_ANIMATION_DURATION: 250,
  
  // Максимальное расстояние свайпа
  MAX_SWIPE_DISTANCE: 0.85 // 85% ширины экрана
} as const;

interface UseSwipeBackProps {
  onSwipeBack: () => void;
  enabled: boolean;
  swipeThreshold?: number; // Кастомизируемый порог
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
}

export const useSwipeBack = ({ 
  onSwipeBack, 
  enabled,
  swipeThreshold = SWIPE_CONFIG.COMPLETION_THRESHOLD 
}: UseSwipeBackProps) => {
  const [touchStart, setTouchStart] = useState<TouchInfo | null>(null);
  const [gestureType, setGestureType] = useState<'undecided' | 'swipe' | 'scroll' | 'tap'>('undecided');
  const [dragDistance, setDragDistance] = useState(0);
  const [lastTouch, setLastTouch] = useState<TouchInfo | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const screenRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(0);
  // FIX: Corrected the useRef initialization for animationFrameRef. The original code `useRef<number>()` is ambiguous and can cause errors in some TypeScript environments as it does not create a mutable ref. It is now explicitly initialized with `null` (`useRef<number | null>(null)`) to create a proper mutable ref object, resolving the "Expected 1 arguments, but got 0" error.
  const animationFrameRef = useRef<number | null>(null);
  const touchHistoryRef = useRef<TouchInfo[]>([]);
  const startScrollTopRef = useRef(0);

  // Очистка анимации при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getScreenWidth = useCallback(() => {
    return screenRef.current?.offsetWidth || window.innerWidth;
  }, []);

  const calculateSwipeMetrics = useCallback((distance: number): SwipeMetrics => {
    const screenWidth = getScreenWidth();
    const progress = Math.min(SWIPE_CONFIG.MAX_SWIPE_DISTANCE, distance / screenWidth);
    const isComplete = progress >= swipeThreshold;
    
    return {
      distance,
      progress,
      velocity: velocityRef.current,
      isComplete
    };
  }, [getScreenWidth, swipeThreshold]);

  const shouldIgnoreTouch = useCallback((target: HTMLElement): boolean => {
    // Игнорируем элементы с предотвращением свайпа
    if (target.closest('[data-no-swipe]')) return true;
    
    // Игнорируем интерактивные элементы
    const interactiveSelectors = [
      'button', 'a', 'input', 'select', 'textarea', 
      '[role="button"]', '[contenteditable="true"]',
      '.scrollable', '[data-scrollable]'
    ];
    
    return interactiveSelectors.some(selector => target.closest(selector));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || isAnimating) return;

    const target = e.target as HTMLElement;
    if (shouldIgnoreTouch(target)) {
      return;
    }

    const touch = e.touches[0];
    const time = Date.now();
    const info = { x: touch.clientX, y: touch.clientY, time };

    setTouchStart(info);
    setLastTouch(info);
    setGestureType('undecided');
    setDragDistance(0);
    velocityRef.current = 0;
    touchHistoryRef.current = [info];
    
    // Сохраняем текущую позицию скролла
    startScrollTopRef.current = document.documentElement.scrollTop || document.body.scrollTop;
  }, [enabled, isAnimating, shouldIgnoreTouch]);

  const calculateVelocity = useCallback((currentTouch: TouchInfo): number => {
    const history = touchHistoryRef.current;
    if (history.length < 2) return 0;

    const recentTouches = history.slice(-3); // Берем последние 3 точки
    const totalDelta = recentTouches.reduce((acc, touch, index) => {
      if (index === 0) return acc;
      const prevTouch = recentTouches[index - 1];
      const timeDelta = touch.time - prevTouch.time;
      const moveDelta = touch.x - prevTouch.x;
      return acc + (moveDelta / Math.max(timeDelta, 1));
    }, 0);

    return totalDelta / (recentTouches.length - 1);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart || isAnimating) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const currentTime = Date.now();
    
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Обновляем историю касаний
    const currentTouch = { x: currentX, y: currentY, time: currentTime };
    touchHistoryRef.current.push(currentTouch);
    
    // Ограничиваем размер истории
    if (touchHistoryRef.current.length > 10) {
      touchHistoryRef.current.shift();
    }

    // Рассчитываем velocity
    velocityRef.current = calculateVelocity(currentTouch);
    setLastTouch(currentTouch);

    if (gestureType === 'swipe') {
      const screenWidth = getScreenWidth();
      const maxDistance = screenWidth * SWIPE_CONFIG.MAX_SWIPE_DISTANCE;
      
      let newDistance = deltaX;
      
      // Резиновый эффект при превышении максимального расстояния
      if (deltaX > maxDistance) {
        const exceeded = deltaX - maxDistance;
        newDistance = maxDistance + (exceeded * SWIPE_CONFIG.RUBBER_BAND_COEFF);
      }
      
      // Резиновый эффект при движении в противоположную сторону
      if (deltaX < 0) {
        const resistance = SWIPE_CONFIG.RUBBER_BAND_COEFF * (1 - Math.exp(-Math.abs(deltaX) / 80));
        newDistance = deltaX * resistance;
      }
      
      setDragDistance(newDistance);
      
      // Предотвращаем скролл только при значительном горизонтальном движении
      if (absDeltaX > SWIPE_CONFIG.MOVEMENT_THRESHOLD * 2) {
        e.preventDefault();
      }
      return;
    }

    if (gestureType === 'scroll' || gestureType === 'tap') {
      return;
    }

    // Определение типа жеста
    if (gestureType === 'undecided') {
      if (absDeltaX < SWIPE_CONFIG.MOVEMENT_THRESHOLD && absDeltaY < SWIPE_CONFIG.MOVEMENT_THRESHOLD) {
        return;
      }

      // Проверяем, не скроллим ли мы
      const isScrolling = absDeltaY > absDeltaX && 
                         Math.abs(startScrollTopRef.current - (document.documentElement.scrollTop || document.body.scrollTop)) > 5;

      if (isScrolling) {
        setGestureType('scroll');
        return;
      }

      if (absDeltaX > absDeltaY * SWIPE_CONFIG.HORIZONTAL_BIAS && deltaX > 0) {
        setGestureType('swipe');
        setDragDistance(deltaX);
        
        // Предотвращаем стандартное поведение только для свайпа
        if (absDeltaX > SWIPE_CONFIG.MOVEMENT_THRESHOLD) {
          e.preventDefault();
        }
      } else {
        setGestureType('scroll');
      }
    }
  }, [touchStart, gestureType, isAnimating, getScreenWidth, calculateVelocity]);

  const animateReturn = useCallback((startDistance: number, duration: number = SWIPE_CONFIG.RETURN_ANIMATION_DURATION) => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      
      // easing function
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOut(progress);
      
      const currentDistance = startDistance * (1 - easedProgress);
      setDragDistance(currentDistance);

      if (now < endTime && currentDistance > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDragDistance(0);
        setIsAnimating(false);
      }
    };

    setIsAnimating(true);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || gestureType !== 'swipe') {
      setTouchStart(null);
      setGestureType('undecided');
      setDragDistance(0);
      velocityRef.current = 0;
      return;
    }

    const metrics = calculateSwipeMetrics(dragDistance);
    const velocity = Math.abs(velocityRef.current);

    const shouldComplete = 
      metrics.progress >= swipeThreshold ||
      (velocity >= SWIPE_CONFIG.VELOCITY_THRESHOLD && 
       dragDistance >= SWIPE_CONFIG.MIN_FLING_DISTANCE);

    if (shouldComplete) {
      onSwipeBack();
    } else {
      // Анимируем возврат к начальной позиции
      animateReturn(dragDistance);
    }

    setTouchStart(null);
    setGestureType('undecided');
    velocityRef.current = 0;
    touchHistoryRef.current = [];
  }, [gestureType, dragDistance, touchStart, onSwipeBack, calculateSwipeMetrics, swipeThreshold, animateReturn]);

  const handleTouchCancel = useCallback(() => {
    if (gestureType === 'swipe' && dragDistance > 0) {
      animateReturn(dragDistance);
    } else {
      setDragDistance(0);
    }
    
    setTouchStart(null);
    setGestureType('undecided');
    velocityRef.current = 0;
    touchHistoryRef.current = [];
  }, [gestureType, dragDistance, animateReturn]);

  const dragHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    ref: screenRef,
  };

  const isDragging = gestureType === 'swipe' && dragDistance > 0;
  const metrics = calculateSwipeMetrics(dragDistance);
  
  const pushedStyle: React.CSSProperties = {
    transform: `translateX(${dragDistance}px)`,
    transition: isAnimating ? `transform ${SWIPE_CONFIG.RETURN_ANIMATION_DURATION}ms cubic-bezier(0.2, 0.9, 0.1, 1)` : 'none',
    touchAction: 'pan-y', // Разрешаем вертикальный скролл
  };
  
  const underlyingStyle: React.CSSProperties = {
    transform: `translateX(${(metrics.progress - 1) * SWIPE_CONFIG.PARALLAX_EFFECT * 100}px)`,
    opacity: 0.9 + metrics.progress * 0.1,
    filter: `brightness(${
      SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_START + 
      metrics.progress * (SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_END - SWIPE_CONFIG.PREVIOUS_SCREEN_BRIGHTNESS_START)
    })`,
    transition: isAnimating ? `all ${SWIPE_CONFIG.RETURN_ANIMATION_DURATION}ms cubic-bezier(0.2, 0.9, 0.1, 1)` : 'none',
  };

  return {
    dragHandlers,
    pushedStyle,
    underlyingStyle,
    isDragging,
    isAnimating,
    dragProgress: metrics.progress,
    swipeMetrics: metrics,
  };
};

interface SwipeBackShadowProps {
  progress: number;
  maxOpacity?: number;
}

export const SwipeBackShadow: React.FC<SwipeBackShadowProps> = ({ 
  progress, 
  maxOpacity = 0.3 
}) => {
  const opacity = Math.min(maxOpacity, progress * maxOpacity * 2);
  
  return (
    <div
      className="swipe-back-shadow"
      style={{
        position: 'absolute',
        top: 0,
        left: -8, // Расширяем тень за пределы экрана
        bottom: 0,
        width: '8px',
        background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%)',
        opacity,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
      }}
    />
  );
};

// Дополнительный компонент для индикатора свайпа
interface SwipeProgressIndicatorProps {
  progress: number;
  threshold?: number;
}

export const SwipeProgressIndicator: React.FC<SwipeProgressIndicatorProps> = ({
  progress,
  threshold = SWIPE_CONFIG.COMPLETION_THRESHOLD
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60px',
        height: '4px',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: '2px',
        overflow: 'hidden',
        opacity: progress > 0 ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, (progress / threshold) * 100)}%`,
          height: '100%',
          backgroundColor: '#007AFF',
          transition: 'width 0.1s ease',
        }}
      />
    </div>
  );
};
