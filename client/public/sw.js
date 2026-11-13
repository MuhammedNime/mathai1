// ==================== SERVICE WORKER - sw.js ====================

const CACHE_NAME = 'math-static-v1.3.1';
const RUNTIME_CACHE = 'math-runtime-v1.3.1';
const API_CACHE = 'math-api-v1.3.1';

// الملفات التي يجب تخزينها للعمل Offline
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/privacy.html',
    '/css/main.css',
    '/css/components/dark-mode-transitions.css',
    '/css/components/library.css',
    '/libs/katex.min.css',
    '/libs/css2.css',
    '/libs/katex-swap.min.css',
    '/images/app-bg.png',
    '/images/app-bg.webp',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/new-chat-96.png',
    '/icons/library-96.png',
    '/icons/saved-96.png',

    // --- مكتبات JavaScript المحلية ---
    '/libs/katex.min.js',
    '/libs/mathlive.min.js',
    '/libs/math.min.js',
    '/libs/chart.umd.min.js',
    '/libs/FileSaver.min.js',
    '/libs/html2canvas.min.js',
    '/libs/jspdf.umd.min.js',
    '/libs/pdf.min.js',
    '/libs/tesseract/tesseract.min.js',
    '/libs/tesseract/worker.min.js',
    '/libs/tesseract/tesseract-core.wasm.js',
    '/libs/tesseract/tesseract-core.wasm',
    '/libs/tesseract/lang/eng.traineddata',
    '/libs/tesseract/lang/ara.traineddata',
    '/libs/tesseract/lang/equ.traineddata',
    //'/libs/pdf.worker.min.js',
    '/libs/firebase-app-compat.js',
    '/libs/firebase-auth-compat.js',
    '/libs/firebase-firestore-compat.js',

    // --- ملفات الخطوط المحلية ---
    // أهم ملفات خطوط KaTeX لضمان العرض الصحيح
    '/libs/fonts/KaTeX_Main-Regular.woff2',
    '/libs/fonts/KaTeX_Math-Italic.woff2',
    '/libs/fonts/KaTeX_Size1-Regular.woff2',
    '/libs/fonts/KaTeX_Size2-Regular.woff2',
    '/libs/fonts/KaTeX_Size3-Regular.woff2',
    '/libs/fonts/KaTeX_Size4-Regular.woff2',
];

// ==================== INSTALL EVENT (DEBUG MODE) ====================
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('📦 Service Worker: Caching static assets');
            
            // بدلاً من addAll، سنحاول تحميلهم واحداً تلو الآخر لكشف الخطأ
            for (const asset of STATIC_ASSETS) {
                try {
                    await cache.add(asset);
                    // console.log('✅ Cached:', asset); // فعل هذا السطر إذا أردت رؤية الناجحين
                } catch (error) {
                    console.error('❌ FAILED to cache:', asset, error);
                }
            }
        })
    );
    
    self.skipWaiting();
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activated');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // حذف الكاش القديم
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== RUNTIME_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // السيطرة على كل الصفحات مباشرة
    return self.clients.claim();
});

// ==================== FETCH EVENT (أهم جزء!) ====================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // ==================== استراتيجيات مختلفة حسب نوع الطلب ====================
    
    // 1. طلبات API (Gemini/Firebase) - Network First مع Offline Fallback
    if (url.hostname.includes('generativelanguage.googleapis.com') ||
        url.hostname.includes('firestore.googleapis.com')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }
    
    // 2. الصور - Cache First (توفير استهلاك الإنترنت)
    if (request.destination === 'image') {
        event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
        return;
    }
    
    // 3. الملفات الثابتة (HTML/CSS/JS) - Cache First مع Network Fallback
    if (request.destination === 'script' || 
        request.destination === 'style' ||
        request.destination === 'document') {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
        return;
    }
    
    // 4. المكتبات الخارجية (CDN) - Stale While Revalidate
    if (url.hostname.includes('cdn') || 
        url.hostname.includes('unpkg') ||
        url.hostname.includes('gstatic')) {
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
        return;
    }
    
    // 5. باقي الطلبات - Network First
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// ==================== STRATEGIES (استراتيجيات الكاش) ====================

// 1. Cache First: جرب الكاش أولاً، ثم الشبكة
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('✅ From Cache:', request.url);
            return cachedResponse;
        }
        
        // إذا لم يوجد في الكاش، جلبه من الشبكة
        const networkResponse = await fetch(request);
        
        // حفظ نسخة في الكاش للمرة القادمة
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Cache First failed:', error);
        return offlineFallback(request);
    }
}

// 2. Network First: جرب الشبكة أولاً، ثم الكاش
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        // --- 🟢 FIX START: Check if the request method is GET before caching ---
        // حفظ في الكاش للاستخدام Offline فقط إذا كان الطلب GET
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        // --- 🟢 FIX END ---
        
        return networkResponse;
        
    } catch (error) {
        console.warn('⚠️ Network failed, trying cache:', request.url);
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return offlineFallback(request);
    }
}

// 3. Stale While Revalidate: أرجع الكاش فوراً، وحدّثه في الخلفية
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // محاولة التحديث في الخلفية (دون انتظار)
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => null);
    
    // إرجاع الكاش فوراً إن وُجد
    return cachedResponse || fetchPromise || offlineFallback(request);
}

// ==================== OFFLINE FALLBACK ====================
function offlineFallback(request) {
    // صفحة Offline مخصصة
    if (request.destination === 'document') {
        return new Response(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>غير متصل - مساعد الرياضيات</title>
                <style>
                    body {
                        font-family: 'Inter', Tahoma, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                        padding: 20px;
                    }
                    .offline-icon {
                        font-size: 100px;
                        margin-bottom: 20px;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    h1 { font-size: 32px; margin-bottom: 15px; }
                    p { font-size: 18px; opacity: 0.9; max-width: 400px; }
                    .btn {
                        background: white;
                        color: #667eea;
                        padding: 12px 30px;
                        border-radius: 25px;
                        text-decoration: none;
                        font-weight: 600;
                        margin-top: 20px;
                        display: inline-block;
                        transition: transform 0.2s;
                    }
                    .btn:hover {
                        transform: scale(1.05);
                    }
                </style>
            </head>
            <body>
                <div class="offline-icon">📡</div>
                <h1>أنت غير متصل بالإنترنت</h1>
                <p>لا تقلق! يمكنك الاستمرار في تصفح الدروس المحفوظة والمحادثات السابقة.</p>
                <a href="/" class="btn">العودة للرئيسية</a>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // صورة بديلة
    if (request.destination === 'image') {
        return new Response(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                <rect width="200" height="200" fill="#667eea"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="white" font-size="40">📷</text>
                <text x="100" y="140" text-anchor="middle" fill="white" font-size="14">غير متوفر</text>
            </svg>
        `, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    return new Response('غير متصل بالإنترنت', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// ==================== SYNC EVENT (للمزامنة الخلفية) ====================
self.addEventListener('sync', (event) => {
    console.log('🔄 Background Sync:', event.tag);
    
    if (event.tag === 'sync-chats') {
        event.waitUntil(syncPendingChats());
    }
});

async function syncPendingChats() {
    // مزامنة المحادثات المعلقة عند العودة للإنترنت
    const cache = await caches.open('pending-chats');
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            await fetch(request);
            await cache.delete(request);
            console.log('✅ Synced:', request.url);
        } catch (error) {
            console.error('❌ Sync failed:', error);
        }
    }
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url },
        actions: [
            { action: 'open', title: 'فتح', icon: '/icons/icon-72.png' },
            { action: 'close', title: 'إغلاق', icon: '/icons/icon-72.png' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// ==================== MESSAGE EVENT (التواصل مع الصفحة) ====================
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_NEW_ROUTE') {
        caches.open(RUNTIME_CACHE).then((cache) => {
            cache.add(event.data.payload.url);
        });
    }
});

console.log('🚀 Service Worker loaded successfully!');
