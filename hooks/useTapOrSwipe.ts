// FIX: Imported the main React object to resolve the "Cannot find namespace 'React'" error for types like React.CSSProperties and React.Touch.
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import type { TouchEvent } from 'react';

// iOS 17 Pro параметры - обновленные значения
const SWIPE_THRESHOLD = 8; // Более точный порог для iOS
const TAP_DURATION = 160; // Оптимизировано под iOS
const MULTITOUCH_DELAY = 30;
const LONG_PRESS_DURATION = 400; // Для long press
const VELOCITY_THRESHOLD = 0.3; // Порог скорости для различения жестов

interface TouchPoint {
  x: number;
  y: number;
  time: number;
  target: EventTarget | null;
  identifier: number;
}

interface GestureState {
  type: 'tap' | 'swipe' | 'scroll' | 'longpress' | 'multitouch' | 'none';
  velocity: number;
  distance: number;
  direction: 'left' | 'right' | 'up' | 'down' | 'none';
}

interface UseTapOrSwipeResult {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  getTouchEndHandler: (actionCallback: () => void) => (e: TouchEvent) => void;
  isTouchActive: boolean;
  currentGesture: GestureState;
  isPotentialTap: boolean;
}

/**
 * Усовершенствованный хук для точного различения всех типов жестов в стиле iOS
 */
export const useTapOrSwipe = (): UseTapOrSwipeResult => {
    const touchStartRef = useRef<TouchPoint | null>(null);
    const lastTouchRef = useRef<TouchPoint | null>(null);
    const touchTimeoutRef = useRef<number | null>(null);
    const longPressTimeoutRef = useRef<number | null>(null);
    const isTouchActiveRef = useRef(false);
    const gestureStateRef = useRef<GestureState>({
        type: 'none',
        velocity: 0,
        distance: 0,
        direction: 'none'
    });
    
    const [currentGesture, setCurrentGesture] = useState<GestureState>(gestureStateRef.current);
    const [isPotentialTap, setIsPotentialTap] = useState(false);

    // Расширенная проверка интерактивных элементов (как в iOS)
    const isInteractiveElement = useCallback((target: EventTarget): boolean => {
        const element = target as HTMLElement;
        
        // Базовые интерактивные элементы
        if (element.closest('button, a, input, select, textarea, [role="button"], [role="link"]')) {
            return true;
        }
        
        // Элементы с обработчиками событий
        if (element.hasAttribute('onclick') || 
            element.hasAttribute('onTap') || 
            element.closest('[onclick], [onTap]')) {
            return true;
        }
        
        // Прокручиваемые контейнеры
        if (element.closest('[data-scroll-container], .scroll-container, [scrollable]')) {
            const style = window.getComputedStyle(element);
            if (style.overflow === 'auto' || style.overflow === 'scroll') {
                return true;
            }
        }
        
        // Элементы с отключенным свайпом
        if (element.closest('[data-no-swipe], [data-swipe-disabled]')) {
            return true;
        }
        
        // Проверяем, является ли элемент частью нативной навигации iOS
        if (element.closest('[data-native-ios-nav]')) {
            return true;
        }
        
        return false;
    }, []);

    // Проверка элементов, которые должны блокировать все жесты
    const isGestureBlockingElement = useCallback((target: EventTarget): boolean => {
        const element = target as HTMLElement;
        return !!element.closest('[data-gesture-block], .gesture-block, video, audio, iframe, object, embed');
    }, []);

    // Проверка элементов с собственным скроллом
    const hasInternalScroll = useCallback((element: HTMLElement): boolean => {
        const scrollable = element.closest('[data-internal-scroll], .internal-scroll, [scroll-region]');
        if (!scrollable) return false;
        
        const style = window.getComputedStyle(scrollable);
        return style.overflow === 'auto' || style.overflow === 'scroll';
    }, []);

    // Очистка всех таймаутов
    const clearTimeouts = useCallback(() => {
        if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
            touchTimeoutRef.current = null;
        }
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    // Обновление состояния жеста
    const updateGestureState = useCallback((newState: Partial<GestureState>) => {
        gestureStateRef.current = { ...gestureStateRef.current, ...newState };
        setCurrentGesture(gestureStateRef.current);
    }, []);

    const calculateGesture = useCallback((start: TouchPoint, current: TouchPoint): Partial<GestureState> => {
        const dx = current.x - start.x;
        const dy = current.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDelta = current.time - start.time;
        const velocity = distance / Math.max(timeDelta, 1);
        
        // Определение направления
        let direction: GestureState['direction'] = 'none';
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
        } else {
            direction = dy > 0 ? 'down' : 'up';
        }
        
        // Определение типа жеста
        let type: GestureState['type'] = 'none';
        if (distance < SWIPE_THRESHOLD) {
            type = timeDelta > LONG_PRESS_DURATION ? 'longpress' : 'tap';
        } else {
            const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
            type = isHorizontal ? 'swipe' : 'scroll';
        }
        
        return { type, velocity, distance, direction };
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Игнорируем блокирующие элементы
        if (isGestureBlockingElement(e.target)) {
            touchStartRef.current = null;
            return;
        }

        // Обрабатываем только одиночные касания для жестов
        if (e.touches.length !== 1) {
            updateGestureState({ type: 'multitouch' });
            touchStartRef.current = null;
            return;
        }

        const touch = e.touches[0];
        const time = Date.now();
        
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time,
            target: e.target,
            identifier: touch.identifier
        };

        lastTouchRef.current = touchStartRef.current;
        isTouchActiveRef.current = true;
        setIsPotentialTap(true);

        // Сбрасываем состояние жеста
        updateGestureState({
            type: 'none',
            velocity: 0,
            distance: 0,
            direction: 'none'
        });

        // Таймаут для long press
        longPressTimeoutRef.current = window.setTimeout(() => {
            if (touchStartRef.current && isTouchActiveRef.current) {
                updateGestureState({ type: 'longpress' });
                setIsPotentialTap(false);
            }
        }, LONG_PRESS_DURATION);

        // Автоматический сброс через максимальное время тапа
        touchTimeoutRef.current = window.setTimeout(() => {
            if (touchStartRef.current && gestureStateRef.current.type === 'none') {
                touchStartRef.current = null;
                isTouchActiveRef.current = false;
                setIsPotentialTap(false);
            }
        }, TAP_DURATION + MULTITOUCH_DELAY);
    }, [isGestureBlockingElement, updateGestureState]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!touchStartRef.current) return;

        // Ищем соответствующий touch point
        // FIX: Corrected type inference by explicitly finding touch with matching identifier
        // React.TouchList is array-like, not an array, so we convert it.
        // We also need to handle the case where touches[i] might not match.
        const touches = Array.from(e.touches) as React.Touch[];
        const touch = touches.find(t => t.identifier === touchStartRef.current?.identifier);
        
        if (!touch) return;

        const currentPoint = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            target: touchStartRef.current.target,
            identifier: touch.identifier
        };

        // Обновляем velocity на основе последнего движения
        if (lastTouchRef.current) {
            const timeDelta = currentPoint.time - lastTouchRef.current.time;
            const distance = Math.sqrt(
                Math.pow(currentPoint.x - lastTouchRef.current.x, 2) +
                Math.pow(currentPoint.y - lastTouchRef.current.y, 2)
            );
            const velocity = distance / Math.max(timeDelta, 1);
            
            if (velocity > VELOCITY_THRESHOLD) {
                setIsPotentialTap(false);
                if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
            }
        }

        lastTouchRef.current = currentPoint;

        // Рассчитываем жест
        const gestureUpdate = calculateGesture(touchStartRef.current, currentPoint);
        updateGestureState(gestureUpdate);

        // Если жест определен как не-tap, сбрасываем potential tap
        if (gestureUpdate.type && gestureUpdate.type !== 'tap' && gestureUpdate.type !== 'none') {
            setIsPotentialTap(false);
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        }

        // Для интерактивных элементов с внутренним скроллом - особое поведение
        const targetElement = touchStartRef.current.target as HTMLElement;
        if (hasInternalScroll(targetElement) && gestureUpdate.type === 'scroll') {
            // Разрешаем нативный скролл
            return;
        }

        // Предотвращаем действие по умолчанию для свайпов
        if (gestureUpdate.type === 'swipe' && gestureUpdate.distance && gestureUpdate.distance > SWIPE_THRESHOLD) {
            e.preventDefault();
        }
    }, [calculateGesture, updateGestureState, hasInternalScroll]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        clearTimeouts();
        
        if (!touchStartRef.current) {
            isTouchActiveRef.current = false;
            setIsPotentialTap(false);
            return;
        }

        // Ищем соответствующий touch point
        const changedTouches = Array.from(e.changedTouches) as React.Touch[];
        const touch = changedTouches.find(t => t.identifier === touchStartRef.current?.identifier);
        
        if (!touch) {
            touchStartRef.current = null;
            isTouchActiveRef.current = false;
            setIsPotentialTap(false);
            return;
        }

        const endPoint = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            target: touchStartRef.current.target,
            identifier: touch.identifier
        };

        // Финальный расчет жеста
        const finalGesture = calculateGesture(touchStartRef.current, endPoint);
        updateGestureState(finalGesture);

        // iOS-like поведение: сбрасываем состояние через короткую задержку
        touchTimeoutRef.current = window.setTimeout(() => {
            updateGestureState({ type: 'none', velocity: 0, distance: 0, direction: 'none' });
        }, 150);

        // Сброс состояния
        touchStartRef.current = null;
        lastTouchRef.current = null;
        isTouchActiveRef.current = false;
        setIsPotentialTap(false);
    }, [clearTimeouts, calculateGesture, updateGestureState]);

    const getTouchEndHandler = useCallback((actionCallback: () => void) => {
        return (e: TouchEvent) => {
            // Для интерактивных элементов - используем нативное поведение
            if (isInteractiveElement(e.target)) {
                return;
            }

            if (!touchStartRef.current) {
                handleTouchEnd(e);
                return;
            }

            const startPoint = touchStartRef.current;
            const touch = e.changedTouches[0];
            const currentTime = Date.now();
            const timeDelta = currentTime - startPoint.time;

            // Проверяем движение
            const dx = Math.abs(touch.clientX - startPoint.x);
            const dy = Math.abs(touch.clientY - startPoint.y);
            const totalMovement = Math.sqrt(dx * dx + dy * dy);

            // Условия для тапа (iOS-like):
            // - Минимальное движение
            // - Короткая продолжительность
            // - Не было long press
            // - Не было быстрого движения (velocity)
            const isTap = totalMovement <= SWIPE_THRESHOLD && 
                         timeDelta <= TAP_DURATION && 
                         gestureStateRef.current.type !== 'longpress' &&
                         gestureStateRef.current.velocity < VELOCITY_THRESHOLD;

            // Проверяем, не изменился ли target (например, из-за скролла под элементом)
            const isSameTarget = e.target === startPoint.target;

            if (isTap && isSameTarget && !isInteractiveElement(e.target)) {
                // iOS-like: небольшая задержка для нативного feel
                touchTimeoutRef.current = window.setTimeout(() => {
                    actionCallback();
                }, 16); // Один кадр при 60fps
            }

            handleTouchEnd(e);
        };
    }, [handleTouchEnd, isInteractiveElement]);

    // Мемоизируем результат чтобы избежать лишних ререндеров
    const result = useMemo((): UseTapOrSwipeResult => ({
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        getTouchEndHandler,
        isTouchActive: isTouchActiveRef.current,
        currentGesture,
        isPotentialTap
    }), [handleTouchStart, handleTouchMove, handleTouchEnd, getTouchEndHandler, currentGesture, isPotentialTap]);

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            clearTimeouts();
        };
    }, [clearTimeouts]);

    return result;
};

// Специализированные хуки для разных типов взаимодействий

export const useTapOnly = (actionCallback: () => void, options?: { disabled?: boolean }) => {
    const { onTouchStart, onTouchMove, getTouchEndHandler, isTouchActive } = useTapOrSwipe();
    
    const handlers = useMemo(() => {
        if (options?.disabled) return {};
        
        return {
            onTouchStart,
            onTouchMove,
            onTouchEnd: getTouchEndHandler(actionCallback),
            'data-tap-enabled': true,
            style: { cursor: 'pointer' } as React.CSSProperties
        };
    }, [onTouchStart, onTouchMove, getTouchEndHandler, actionCallback, options?.disabled]);

    return { handlers, isTouchActive };
};

export const useLongPress = (actionCallback: () => void, duration: number = LONG_PRESS_DURATION) => {
    const { onTouchStart, onTouchEnd, currentGesture } = useTapOrSwipe();
    
    useEffect(() => {
        if (currentGesture.type === 'longpress') {
            actionCallback();
        }
    }, [currentGesture.type, actionCallback]);

    return {
        onTouchStart,
        onTouchEnd,
        'data-long-press-enabled': true
    };
};

export const useSwipeGesture = (options: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}) => {
    const { onTouchStart, onTouchMove, onTouchEnd, currentGesture } = useTapOrSwipe();
    
    useEffect(() => {
        if (currentGesture.type === 'swipe' && currentGesture.distance > (options.threshold || 50)) {
            switch (currentGesture.direction) {
                case 'left':
                    options.onSwipeLeft?.();
                    break;
                case 'right':
                    options.onSwipeRight?.();
                    break;
                case 'up':
                    options.onSwipeUp?.();
                    break;
                case 'down':
                    options.onSwipeDown?.();
                    break;
            }
        }
    }, [currentGesture, options]);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        'data-swipe-enabled': true
    };
};
