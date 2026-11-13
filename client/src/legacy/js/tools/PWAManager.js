// ==================== PWA MANAGER ====================
export const PWAManager = {
    deferredPrompt: null,
    swRegistration: null,
    
    async init() {
        if (this.isServiceWorkerDisabled()) {
            await this.unregisterServiceWorkers();
            this.monitorConnection();
            this.handleShortcuts();
            console.log('ℹ️ Service Worker disabled by config');
            return;
        }

        await this.registerServiceWorker();
        this.monitorConnection();
        this.setupInstallPrompt();
        this.checkForUpdates();
        this.handleShortcuts();
        console.log('✅ PWA Manager initialized');
    },
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker not supported');
            return;
        }
        
        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered:', this.swRegistration.scope);
            
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    },

    isServiceWorkerDisabled() {
        return !!(window.MathApp && window.MathApp.config && window.MathApp.config.enableServiceWorker === false);
    },

    async unregisterServiceWorkers() {
        if (!('serviceWorker' in navigator)) {
            return;
        }
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        } catch (error) {
            console.warn('⚠️ Failed to unregister Service Workers:', error);
        }
    },
    
    monitorConnection() {
        const offlineIndicator = document.getElementById('offlineIndicator');
        if (!offlineIndicator) {
            console.warn('Offline indicator not found');
            return;
        }
        
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineIndicator.style.display = 'none';
                MathApp.ui.showToast('✅ عدت متصلاً بالإنترنت', false);
            } else {
                offlineIndicator.style.display = 'block';
                MathApp.ui.showToast('⚠️ أنت الآن في وضع Offline', false);
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        if (!navigator.onLine) {
            offlineIndicator.style.display = 'block';
        }
    },
    
    setupInstallPrompt() {
        const installBanner = document.getElementById('pwaInstallBanner');
        const installBtn = document.getElementById('pwaInstallBtn');
        const closeBanner = document.getElementById('pwaCloseBanner');
        
        if (!installBanner || !installBtn || !closeBanner) {
            console.warn('Install banner elements not found');
            return;
        }
        
        const showBanner = () => {
            if (this.isStandalone()) return;
            installBanner.style.display = 'block';
        };

        const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            setTimeout(() => {
                showBanner();
            }, 4000);
        });

        // iOS fallback (no beforeinstallprompt)
        if (isIOS && !this.isStandalone()) {
            setTimeout(() => {
                showBanner();
            }, 5000);
        }
        
        installBtn.addEventListener('click', async () => {
            if (!this.deferredPrompt) {
                if (isIOS) {
                    MathApp.ui.showToast('على iOS: اضغط مشاركة ثم "إضافة إلى الشاشة الرئيسية"', false);
                } else {
                    MathApp.ui.showToast('افتح قائمة المتصفح ثم اختر "تثبيت التطبيق"', false);
                }
                return;
            }

            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`User choice: ${outcome}`);
            
            if (outcome === 'accepted') {
                MathApp.ui.showToast('🎉 شكراً لتثبيت التطبيق!', false);
            }
            
            this.deferredPrompt = null;
            installBanner.style.display = 'none';
        });
        
        closeBanner.addEventListener('click', () => {
            installBanner.style.display = 'none';
        });
        
        window.addEventListener('appinstalled', () => {
            MathApp.ui.showToast('✅ تم تثبيت التطبيق بنجاح!', false);
            installBanner.style.display = 'none';
        });
    },
    
    showUpdateNotification() {
        const updateNotif = document.getElementById('updateNotification');
        const updateBtn = document.getElementById('updateBtn');
        
        if (!updateNotif || !updateBtn) return;
        
        updateNotif.style.display = 'block';
        
        updateBtn.addEventListener('click', () => {
            if (this.swRegistration && this.swRegistration.waiting) {
                this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
                
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
            }
        });
        
        setTimeout(() => {
            updateNotif.style.display = 'none';
        }, 10000);
    },
    
    checkForUpdates() {
        if (!this.swRegistration) return;
        
        setInterval(() => {
            this.swRegistration.update();
        }, 60 * 60 * 1000);
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.swRegistration.update();
            }
        });
    },
    
    handleShortcuts() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        switch (action) {
            case 'new-chat':
                MathApp.chat.startNew();
                break;
            case 'library':
                MathApp.Library.toggleLibrary();
                break;
            case 'saved-chats':
                MathApp.data.loadSavedChats();
                break;
        }
    },

    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }
};
