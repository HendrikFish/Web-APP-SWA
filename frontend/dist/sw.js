/**
 * Service Worker für SmartWorkArt PWA
 * Ermöglicht Offline-Funktionalität und bessere Performance
 */

const CACHE_NAME = 'smartworkart-v1.0.0';
const STATIC_CACHE = 'smartworkart-static-v1';
const DYNAMIC_CACHE = 'smartworkart-dynamic-v1';

// Dateien die immer gecacht werden sollen
const STATIC_FILES = [
    '/',
    '/core/dashboard/index.html',
    '/core/login/index.html',
    '/modules/menueplan/index.html',
    '/modules/rezept/index.html',
    '/modules/zutaten/index.html',
    '/modules/einrichtung/index.html',
    
    // Shared CSS/JS
    '/shared/styles/layout.css',
    '/shared/components/toast-notification/toast-notification.css',
    '/shared/components/confirmation-modal/confirmation-modal.css',
    
    // Icons
    '/public/assets/icons/manifest-icon-192.png',
    '/public/assets/icons/manifest-icon-512.png',
    
    // Offline-Fallback
    '/offline.html'
];

// API-Endpunkte die gecacht werden sollen
const CACHEABLE_APIS = [
    '/api/rezepte',
    '/api/zutaten',
    '/api/einrichtungen',
    '/api/portal/stammdaten'
];

// Install Event - Cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch Event - Network-first for API, Cache-first for static
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle API requests (Network-first strategy)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static files (Cache-first strategy)
    event.respondWith(handleStaticRequest(request));
});

/**
 * Network-first strategy for API requests
 * Versucht erst das Netzwerk, fällt auf Cache zurück
 */
async function handleApiRequest(request) {
    try {
        // Versuche Netzwerk-Request
        const networkResponse = await fetch(request);
        
        // Nur erfolgreiche Responses cachen
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            
            // Cache only specific API endpoints
            const url = new URL(request.url);
            const shouldCache = CACHEABLE_APIs.some(api => url.pathname.includes(api));
            
            if (shouldCache) {
                caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(request, responseClone))
                    .catch(error => console.log('Cache put error:', error));
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Network request failed, trying cache:', error);
        
        // Netzwerk fehlgeschlagen, versuche Cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Wenn auch Cache fehlschlägt, gib Offline-Response zurück
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Offline - Daten nicht verfügbar',
                offline: true
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Cache-first strategy for static files
 * Schaut erst im Cache, dann im Netzwerk
 */
async function handleStaticRequest(request) {
    try {
        // Versuche Cache zuerst
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Cache-Miss, versuche Netzwerk
        console.log('Cache miss, fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        // Erfolgreiche Response cachen
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseClone))
                .catch(error => console.log('Cache put error:', error));
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Both cache and network failed:', error);
        
        // Für HTML-Requests, zeige Offline-Seite
        if (request.headers.get('accept').includes('text/html')) {
            const offlineResponse = await caches.match('/offline.html');
            return offlineResponse || new Response('Offline', { status: 503 });
        }
        
        // Für andere Requests, gib Fehler-Response zurück
        return new Response('Offline', { status: 503 });
    }
}

// Background Sync (für spätere Implementierung)
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Hier könnten offline gespeicherte Daten synchronisiert werden
        console.log('Service Worker: Performing background sync...');
        
        // Implementierung für spätere Offline-Funktionalität
        // z.B. offline erstellte Rezepte hochladen
        
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push Notifications (für spätere Implementierung)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');
    
    const options = {
        body: event.data ? event.data.text() : 'Neue Benachrichtigung',
        icon: '/public/assets/icons/manifest-icon-192.png',
        badge: '/public/assets/icons/manifest-icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Öffnen',
                icon: '/public/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Schließen',
                icon: '/public/assets/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('SmartWorkArt', options)
    );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
}); 