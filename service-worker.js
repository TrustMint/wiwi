// Импортируем библиотеку Workbox от Google. Это стандарт для продакшен-воркеров.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  // Workbox автоматически управляет версиями и очисткой кэша.
  // Нам больше не нужен ручной CACHE_NAME.

  // 1. Предварительное кэширование "оболочки" приложения (App Shell).
  // Эти файлы будут загружены при установке Service Worker и всегда доступны офлайн.
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: null },
    { url: '/manifest.json', revision: null },
    { url: '/assets/icon-192.png', revision: null },
    { url: '/assets/icon-512.png', revision: null },
    { url: '/assets/apple-touch-icon.png', revision: null },
    { url: '/assets/favicon.svg', revision: null },
    { url: '/assets/preloader-icon.svg', revision: null }
  ]);
  
  // 2. Стратегия кэширования для страниц (навигационных запросов).
  // NetworkFirst: Сначала пытаемся загрузить из сети. Если сети нет, отдаем из кэша.
  // Это гарантирует, что пользователь видит свежий контент, но приложение работает и офлайн.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
    })
  );

  // 3. Стратегия для CSS и JavaScript - Stale-While-Revalidate.
  // Это лучшая стратегия для производительности:
  // - Запрос мгновенно отдается из кэша.
  // - Одновременно в фоне идет запрос в сеть за обновлением.
  // - Если пришло обновление, кэш тихо обновляется для следующего визита.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources-cache',
    })
  );

  // 4. Стратегия для изображений - Cache First.
  // Изображения меняются редко, поэтому сначала ищем в кэше.
  // Если нет - загружаем из сети и сохраняем в кэш для будущих запросов.
  // Добавляем ограничение на 60 изображений и срок хранения 30 дней, чтобы кэш не разрастался.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        }),
      ],
    })
  );

  // --- ПОДГОТОВКА К PRO-ФУНКЦИЯМ ---

  // 5. Обработка фоновой синхронизации (Background Sync).
  // Это позволит отправлять данные (например, создание объявления), когда появится интернет.
  // Для активации, фронтенд должен будет зарегистрировать 'sync' событие.
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-new-listings') {
      console.log('[Service Worker] Sync event for "sync-new-listings" received.');
      event.waitUntil(
        // Здесь будет логика:
        // 1. Взять сохраненные данные из IndexedDB.
        // 2. Отправить их на сервер через fetch().
        // 3. В случае успеха - очистить данные из IndexedDB.
        // 4. Показать уведомление об успехе.
        // syncNewListings() 
      );
    }
  });

  // 6. Обработка Push-уведомлений.
  // Слушает push-события от сервера.
  self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    const data = event.data.json();
    const title = data.title || 'DeMarket';
    const options = {
      body: data.body,
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      data: {
        url: data.url // URL для перехода по клику
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

  // 7. Обработка клика по уведомлению.
  // Открывает нужную страницу или просто приложение.
  self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({
        type: 'window',
      }).then((clientsArr) => {
        // Если уже есть открытая вкладка, фокусируемся на ней и переходим по URL.
        const hadWindowToFocus = clientsArr.some((windowClient) =>
          windowClient.url === urlToOpen ? (windowClient.focus(), true) : false
        );
        // В противном случае, открываем новую вкладку.
        if (!hadWindowToFocus)
          clients.openWindow(urlToOpen).then((windowClient) => (windowClient ? windowClient.focus() : null));
      })
    );
  });

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}