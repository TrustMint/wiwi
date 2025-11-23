// Импортируем библиотеку Workbox от Google. Это стандарт для продакшен-воркеров.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем проверку origin
const getValidOrigin = () => {
  try {
    return self.location.origin;
  } catch (error) {
    // Если self.location недоступен, используем альтернативные методы
    return new URL(self.registration.scope).origin;
  }
};

const VALID_ORIGIN = getValidOrigin();

// 🔧 ИСПРАВЛЕНИЕ: Проверяем что Workbox загрузился
if (typeof workbox !== 'undefined') {
  console.log(`✅ Workbox is loaded for origin: ${VALID_ORIGIN}`);

  // 🔧 ИСПРАВЛЕНИЕ: Настраиваем Workbox для dev mode
  workbox.setConfig({
    debug: false, // Отключаем debug в продакшене
    modulePathPrefix: 'https://storage.googleapis.com/workbox-cdn/releases/7.0.0/'
  });

  // 1. Предварительное кэширование "оболочки" приложения (App Shell).
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: '1.0.1' },
    { url: '/index.tsx', revision: '1.0.1' },
    { url: '/manifest.json', revision: '1.0.1' },
    { url: '/assets/icon-192.png', revision: '1.0.0' },
    { url: '/assets/icon-512.png', revision: '1.0.0' },
    { url: '/assets/apple-touch-icon.png', revision: '1.0.0' },
    { url: '/assets/favicon.svg', revision: '1.0.0' },
    { url: '/assets/preloader-icon.svg', revision: '1.0.0' }
  ], {
    cleanUrls: false,
    directoryIndex: 'index.html'
  });
  
  // 2. Стратегия кэширования для страниц (навигационных запросов).
  workbox.routing.registerRoute(
    ({ request, url }) => {
      // 🔧 ИСПРАВЛЕНИЕ: Проверяем origin перед кэшированием
      return request.mode === 'navigate' && url.origin === VALID_ORIGIN;
    },
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 24 часа
        }),
      ],
    })
  );

  // 3. Стратегия для CSS и JavaScript - Stale-While-Revalidate.
  workbox.routing.registerRoute(
    ({ request, url }) => {
      // 🔧 ИСПРАВЛЕНИЕ: Проверяем origin
      return (request.destination === 'script' || request.destination === 'style') && 
             url.origin === VALID_ORIGIN;
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources-cache-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
        }),
      ],
    })
  );

  // 4. Стратегия для изображений - Cache First.
  workbox.routing.registerRoute(
    ({ request, url }) => {
      // 🔧 ИСПРАВЛЕНИЕ: Проверяем origin
      return request.destination === 'image' && url.origin === VALID_ORIGIN;
    },
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        }),
      ],
    })
  );

  // 🔧 ИСПРАВЛЕНИЕ: Добавляем обработку API запросов - НЕ кэшируем!
  workbox.routing.registerRoute(
    ({ url }) => {
      // Не кэшируем API запросы и запросы к внешним ресурсам
      return url.pathname.startsWith('/api/') || url.origin !== VALID_ORIGIN;
    },
    new workbox.strategies.NetworkOnly() // Только сеть, без кэша
  );

  // --- ПОДГОТОВКА К PRO-ФУНКЦИЯМ ---

  // 5. Обработка фоновой синхронизации (Background Sync).
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-new-listings') {
      console.log('[Service Worker] Sync event for "sync-new-listings" received.');
      event.waitUntil(
        // Здесь будет логика:
        // 1. Взять сохраненные данные из IndexedDB.
        // 2. Отправить их на сервер через fetch().
        // 3. В случае успеха - очистить данные из IndexedDB.
        // 4. Показать уведомление об успехе.
        Promise.resolve().then(() => {
          console.log('Background sync completed');
        })
      );
    }
  });

  // 6. Обработка Push-уведомлений.
  self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    
    // 🔧 ИСПРАВЛЕНИЕ: Безопасная обработка данных
    let data;
    try {
      data = event.data ? event.data.json() : { title: 'DeMarket', body: 'New notification' };
    } catch (error) {
      data = { title: 'DeMarket', body: 'New notification' };
    }
    
    const title = data.title || 'DeMarket';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      data: {
        url: data.url || '/' // URL для перехода по клику
      }
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  });

  // 7. Обработка клика по уведомлению.
  self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
      }).then((clientsArr) => {
        // Если уже есть открытая вкладка, фокусируемся на ней и переходим по URL.
        const hadWindowToFocus = clientsArr.some((windowClient) => {
          if (windowClient.url === urlToOpen || windowClient.url.startsWith(self.location.origin)) {
            windowClient.focus();
            return true;
          }
          return false;
        });
        
        // В противном случае, открываем новую вкладку.
        if (!hadWindowToFocus) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  });

  // 🔧 ИСПРАВЛЕНИЕ: Обработка ошибок
  self.addEventListener('error', (event) => {
    console.error('[Service Worker] Error:', event.error);
  });

  self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled rejection:', event.reason);
  });

} else {
  console.log('⚠️ Workbox не загрузился, Service Worker работает в базовом режиме');
  
  // 🔧 РЕЗЕРВНЫЙ РЕЖИМ: Базовый Service Worker без Workbox
  const CACHE_NAME = 'demarket-fallback-v1';
  const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/static/js/bundle.js',
    '/static/css/main.css'
  ];

  self.addEventListener('install', (event) => {
    console.log('📦 Service Worker installing...');
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', (event) => {
    // 🔧 ИСПРАВЛЕНИЕ: Проверяем origin
    if (event.request.url.startsWith(self.location.origin)) {
      event.respondWith(
        caches.match(event.request)
          .then((response) => response || fetch(event.request))
      );
    }
    // Для внешних запросов - пропускаем
  });
}

console.log('🎯 Service Worker успешно загружен и настроен');