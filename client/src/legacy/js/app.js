
const ERROR_REPORT_MAX = 3;
const errorReportFingerprints = new Set();

const shouldReportErrors = () => {
    const cfg = window.MathApp && window.MathApp.config ? window.MathApp.config : null;
    if (cfg && cfg.enableErrorReporting === false) return false;
    return true;
};

const reportClientError = (payload) => {
    try {
        if (!shouldReportErrors()) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        window.__errorReportCount = window.__errorReportCount || 0;
        if (window.__errorReportCount >= ERROR_REPORT_MAX) return;

        const fingerprint = JSON.stringify({
            message: payload.message,
            source: payload.source,
            lineno: payload.lineno,
            colno: payload.colno,
            type: payload.type
        });
        if (errorReportFingerprints.has(fingerprint)) return;
        errorReportFingerprints.add(fingerprint);
        window.__errorReportCount += 1;

        const endpoint = (window.MathApp && window.MathApp.config && window.MathApp.config.errorReportEndpoint) || '/api/log';
        const body = {
            ...payload,
            href: (typeof location !== 'undefined' ? location.href : ''),
            userAgent: (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
            ts: new Date().toISOString()
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).catch(() => { /* ignore */ });
    } catch (e) { /* ignore */ }
};

// شبكة الأمان: تمنع التطبيق من التوقف المفاجئ
window.onerror = function (message, source, lineno, colno, error) {
    console.error("🚨 Global Error Caught:", { message, source, lineno, error });

    reportClientError({
        type: 'window.onerror',
        message: String(message || ''),
        source: source || '',
        lineno: lineno || 0,
        colno: colno || 0,
        stack: error && error.stack ? String(error.stack) : ''
    });
    
    // إذا كانت واجهة المستخدم جاهزة، اعرض رسالة لطيفة
    if (window.MathApp && window.MathApp.ui) {
        window.MathApp.ui.showToast("حدث خطأ بسيط، حاول مرة أخرى.", "error");
    }
    // true تعني: "لقد تعاملت مع الخطأ، لا توقف التطبيق"
    return true; 
};

// التعامل مع أخطاء الـ Promises (مثل فشل الاتصال بالإنترنت)
window.addEventListener('unhandledrejection', function (event) {
    console.warn("🚨 Unhandled Promise:", event.reason);

    const reason = event.reason;
    reportClientError({
        type: 'unhandledrejection',
        message: reason && reason.message ? String(reason.message) : String(reason || ''),
        stack: reason && reason.stack ? String(reason.stack) : ''
    });
    
    // تجاهل أخطاء الشبكة المعتادة
    if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch')) {
         if (window.MathApp && window.MathApp.ui) {
            window.MathApp.ui.showToast("تأكد من اتصال الإنترنت 📡", "error");
         }
    }
});

import { enhancedDarkMode } from './components/darkModeEnhanced.js';
import { PWAManager } from './tools/PWAManager.js';
import { Library } from './components/library.js';
import { math } from './components/math.js';
import { chart } from './components/chart.js';
import { photo } from './components/photo.js';
import { auth } from './services/auth.js';
import { data } from './services/data.js';
import { libraryData } from './data/libraryData.js';
import { ScientificCalculator } from './features/calculator.js';
import { chat } from './components/chat.js';
import { drawing } from './components/drawing.js';
import { localSolver } from './features/localSolver.js';
import { ExamBuilder } from './features/examBuilder.js';
import { UnitConverter } from './features/unitConverter.js';
import { theme, stage, file, editor, exportModule, ui } from './components/ui.js';
import { workSpaceModule } from './features/workSpace.js';
import { OCRManager } from './tools/ocrManager.js';

const normalizeModelName = (value) => {
    const name = String(value || '').trim();
    const aliases = {
        'gemini-2.5-flash-preview-09-2025': 'gemini-2.5-flash'
    };
    return aliases[name] || name;
};

const DEFAULT_FALLBACK_MODEL = 'gemini-2.5-flash';
const MODEL_CACHE_KEY = 'ai_models_cache_v1';
const MODEL_OVERRIDE_KEY = 'ai_model_override';
const VISION_MODEL_OVERRIDE_KEY = 'ai_vision_model_override';
const MODEL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const EXPLAIN_MODE_KEY = 'ai_explain_mode';
const EXPLAIN_TEXT_KEY = 'ai_explain_text';

const safeStorageGet = (key) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
};

const safeStorageSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
};

const safeStorageGetJson = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
};

const safeStorageSetJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
};

// ==================== PDF.js CONFIGURATION ====================
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
    console.warn('PDF.js library not loaded. PDF support will be disabled.');
}

// ==================== MAIN APPLICATION OBJECT ====================
export const MathApp = {
    // ==================== CONFIGURATION & STATE ====================
    toastTimeout: null,
    config: {
        apiRootUrl: '',
        apiBaseUrl: '/api/gemini',
        apiVisionUrl: '/api/gemini/vision',
        apiModelsUrl: '/api/models',
        model: '',
        visionModel: 'gemini-2.5-flash',
        systemPrompt: '',
        explanationMode: 'detailed',
        enableServiceWorker: true,
        enableErrorReporting: true,
        errorReportEndpoint: '/api/log'
    },

    isCapacitor() {
        return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    },

    
            state: {
        currentStage: 'secondary',
        selectedImageBase64: null,
        selectedImageMimeType: null,
        attachedFileContent: null, 
        attachedFileName: null,
        currentCursorPosition: null,
        editingElement: null,
        cameraStream: null,
        chatHistory: [],
        isDrawing: false,
        ctx: null,
        lastX: 0,
        lastY: 0,
        currentChatId: null,
        chartInstances: {},
        speechPartialListener: null
    },

    dom: {},

    // === الوحدات المستوردة ===
    auth: auth,
    data: data,
    chat: chat,
    drawing: drawing,
    libraryData: libraryData,
    theme: theme,
    stage: stage,
    file: file,
    editor: editor,
    export: exportModule,
    ui: ui,
    ScientificCalculator: ScientificCalculator,
    localSolver: localSolver,
    ExamBuilder: ExamBuilder,
    UnitConverter: UnitConverter,
    workSpaceModule: workSpaceModule,
    photo: photo,
    chart: chart,
    math: math,
    Library: Library,
    PWAManager: PWAManager,

    get AlgebraWorkspace() { return this.workSpaceModule.AlgebraWorkspace; },
    get CalculusWorkspace() { return this.workSpaceModule.CalculusWorkspace; },
    get GeometryWorkspace() { return this.workSpaceModule.GeometryWorkspace; },
    get MatrixWorkspace() { return this.workSpaceModule.MatrixWorkspace; },
    get StatisticsWorkspace() { return this.workSpaceModule.StatisticsWorkspace; },

    applyModelOverrides() {
        const modelOverride = safeStorageGet(MODEL_OVERRIDE_KEY);
        const visionOverride = safeStorageGet(VISION_MODEL_OVERRIDE_KEY);
        if (modelOverride) {
            this.config.model = normalizeModelName(modelOverride);
        }
        if (visionOverride) {
            this.config.visionModel = normalizeModelName(visionOverride);
        }
    },

    setExplanationMode(modeKey, label, persist = true) {
        this.config.explanationMode = modeKey;
        if (this.dom.explanationText) {
            this.dom.explanationText.textContent = label;
        }
        if (persist) {
            safeStorageSet(EXPLAIN_MODE_KEY, modeKey);
            safeStorageSet(EXPLAIN_TEXT_KEY, label);
        }
    },

    loadExplanationMode() {
        const savedMode = safeStorageGet(EXPLAIN_MODE_KEY);
        const savedLabel = safeStorageGet(EXPLAIN_TEXT_KEY);
        const mode = savedMode || this.config.explanationMode || 'detailed';
        const label = savedLabel || (mode === 'quick' ? 'سريع' : 'تفصيلي');
        this.setExplanationMode(mode, label, false);
    },

    normalizeModelList(data) {
        if (!data || !Array.isArray(data.models)) return [];
        return data.models
            .map((model) => ({
                name: (model.name || '').replace(/^models\//, ''),
                methods: Array.isArray(model.supportedGenerationMethods) ? model.supportedGenerationMethods : []
            }))
            .filter((model) => model.name);
    },

    loadCachedModels() {
        const cached = safeStorageGetJson(MODEL_CACHE_KEY);
        if (!cached || !cached.expiresAt || !cached.models) return null;
        if (Date.now() > cached.expiresAt) return null;
        return cached.models;
    },

    cacheModels(models) {
        safeStorageSetJson(MODEL_CACHE_KEY, {
            models,
            expiresAt: Date.now() + MODEL_CACHE_TTL_MS
        });
    },

    isModelSupported(modelName, models) {
        if (!modelName) return false;
        const entry = models.find((m) => m.name === modelName);
        return !!(entry && entry.methods.includes('generateContent'));
    },

    pickFallbackModel(models) {
        if (this.isModelSupported(DEFAULT_FALLBACK_MODEL, models)) {
            return DEFAULT_FALLBACK_MODEL;
        }
        const firstSupported = models.find((m) => m.methods.includes('generateContent'));
        return firstSupported ? firstSupported.name : '';
    },

    async fetchAvailableModels() {
        const cached = this.loadCachedModels();
        if (cached) return cached;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const modelsUrl = this.config.apiModelsUrl || '/api/models';
            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) return null;
            const data = await response.json();
            const models = this.normalizeModelList(data);
            if (models.length > 0) this.cacheModels(models);
            return models;
        } catch (e) {
            clearTimeout(timeout);
            return null;
        }
    },

    async validateModels() {
        const models = await this.fetchAvailableModels();
        if (!models || models.length === 0) return;

        const currentModel = normalizeModelName(this.config.model);
        const currentVision = normalizeModelName(this.config.visionModel);

        let updated = false;
        if (!this.isModelSupported(currentModel, models)) {
            const fallback = this.pickFallbackModel(models);
            if (fallback) {
                this.config.model = fallback;
                safeStorageSet(MODEL_OVERRIDE_KEY, fallback);
                updated = true;
            }
        }

        if (!this.isModelSupported(currentVision, models)) {
            const fallback = this.pickFallbackModel(models);
            if (fallback) {
                this.config.visionModel = fallback;
                safeStorageSet(VISION_MODEL_OVERRIDE_KEY, fallback);
                updated = true;
            }
        }

        if (updated && this.ui && typeof this.ui.showToast === 'function') {
            this.ui.showToast('تم تحديث نموذج الذكاء الاصطناعي تلقائيًا إلى نموذج مدعوم.');
        }
    },

    // === دالة التهيئة ===
    async init() {
        console.log("MathApp Initialized!");
        
        try {
            // محاولة استيراد ملف الإعدادات
            const cfg = await import('./config.js');
            
            if (cfg && cfg.CONFIG) {
                // 1. تحميل مسار خادم الوسيط (Proxy)
                const apiRootRaw = cfg.CONFIG.API_ROOT_URL || cfg.CONFIG.apiRootUrl;
                if (apiRootRaw) {
                    this.config.apiRootUrl = String(apiRootRaw).replace(/\/+$/, '');
                }

                const apiBase = cfg.CONFIG.API_BASE_URL || cfg.CONFIG.apiBaseUrl ||
                    (this.config.apiRootUrl ? `${this.config.apiRootUrl}/api/gemini` : '');
                if (apiBase) {
                    this.config.apiBaseUrl = apiBase;
                    console.info('🌐 Loaded API base URL from config.js');
                }

                const apiVision = cfg.CONFIG.API_VISION_URL || cfg.CONFIG.apiVisionUrl ||
                    (this.config.apiRootUrl ? `${this.config.apiRootUrl}/api/gemini/vision` : '');
                if (apiVision) {
                    this.config.apiVisionUrl = apiVision;
                    console.info('👁️ Loaded Vision API URL from config.js');
                }

                const apiModels = cfg.CONFIG.API_MODELS_URL || cfg.CONFIG.apiModelsUrl ||
                    (this.config.apiRootUrl ? `${this.config.apiRootUrl}/api/models` : '');
                if (apiModels) {
                    this.config.apiModelsUrl = apiModels;
                }

                if (cfg.CONFIG.visionModel || cfg.CONFIG.VISION_MODEL) {
                    const rawVision = cfg.CONFIG.visionModel || cfg.CONFIG.VISION_MODEL;
                    const normalizedVision = normalizeModelName(rawVision);
                    this.config.visionModel = normalizedVision;
                    if (normalizedVision !== rawVision) {
                        console.warn(`🧿 Normalized Vision Model: ${rawVision} → ${normalizedVision}`);
                    }
                    console.info(`🧿 Loaded Vision Model: ${this.config.visionModel}`);
                }

                // 2. تحميل اسم الموديل (مثلاً gemini-1.5-flash)
                if (cfg.CONFIG.model) {
                    const rawModel = cfg.CONFIG.model;
                    const normalizedModel = normalizeModelName(rawModel);
                    this.config.model = normalizedModel;
                    if (normalizedModel !== rawModel) {
                        console.warn(`🤖 Normalized Model: ${rawModel} → ${normalizedModel}`);
                    }
                    console.info(`🤖 Loaded Model: ${this.config.model}`);
                }

                // 3. تحميل تعليمات النظام (System Prompt)
                if (cfg.CONFIG.systemPrompt) {
                    this.config.systemPrompt = cfg.CONFIG.systemPrompt;
                    console.info('📝 Loaded System Prompt from config.js');
                }

                if (cfg.CONFIG.explanationMode) {
                    this.config.explanationMode = cfg.CONFIG.explanationMode;
                }

                const enableSW = typeof cfg.CONFIG.enableServiceWorker !== 'undefined'
                    ? cfg.CONFIG.enableServiceWorker
                    : cfg.CONFIG.ENABLE_SERVICE_WORKER;
                if (typeof enableSW !== 'undefined') {
                    this.config.enableServiceWorker = !!enableSW;
                }

                if (typeof cfg.CONFIG.enableErrorReporting !== 'undefined') {
                    this.config.enableErrorReporting = !!cfg.CONFIG.enableErrorReporting;
                }

                const errorEndpoint = cfg.CONFIG.errorReportEndpoint ||
                    (this.config.apiRootUrl ? `${this.config.apiRootUrl}/api/log` : '');
                if (errorEndpoint) {
                    this.config.errorReportEndpoint = errorEndpoint;
                }
            }
        } catch (err) {
            console.warn("⚠️ Local config.js not found or invalid. Using default hardcoded settings.");
            // لا توقف التطبيق، سيكمل الإعدادات الافتراضية الموجودة في app.js
        }


        this.cacheDOMElements();
        this.applyModelOverrides();
        this.loadExplanationMode();
        this.validateModels();
        await this.Library.init();
        this.workSpaceModule.init();
        this.setupEventListeners();
        this.initializeChatHistory();
        this.theme.apply();
        this.drawing.initCanvas();
        this.stage.load();
        this.displayWelcomeMessage();
        this.auth.initFirebase();
        ScientificCalculator.init();
        this.ExamBuilder.init();
        this.UnitConverter.init();
        this.setupMobileBackButton();
        enhancedDarkMode.init();
         enhancedDarkMode.addGlowEffect();
    },


            
            

            cacheDOMElements() {
            this.dom = {
            // القوائم الرئيسية
            editor: document.getElementById('editor'),
            chatMessages: document.getElementById('chatMessages'),
            sidebarNav: document.getElementById('sidebarNav'),
            bottomNavMenu: document.getElementById('bottomNavMenu'),
            loginStatusArea: document.getElementById('loginStatusArea'),
            accountButton: document.getElementById('accountButton'),
            settingsModal: document.getElementById('settingsModal'),
            settingsDisplayName: document.getElementById('settingsDisplayName'),
            settingsStage: document.getElementById('settingsStage'),
            settingsExplanationMode: document.getElementById('settingsExplanationMode'),
            settingsLanguage: document.getElementById('settingsLanguage'),
            settingsCountry: document.getElementById('settingsCountry'),
            settingsBio: document.getElementById('settingsBio'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
            imageAttachedIndicator: document.getElementById('imageAttachedIndicator'),
            
            // النوافذ (Modals)
            mathModal: document.getElementById('mathModal'),
            photoModal: document.getElementById('photoModal'),
            drawingModal: document.getElementById('drawingModal'),
            authModal: document.getElementById('authModal'),
            savedChatsModal: document.getElementById('savedChatsModal'),

            // عناصر متنوعة
            darkModeToggle: document.getElementById('darkModeToggle'),
            plusBtn: document.getElementById('plusBtn'),
            fileInputForEquation: document.getElementById('fileInputForEquation'),
            mathField: document.getElementById('mathInput'),
            canvas: document.getElementById('drawingCanvas'),
            cameraStream: document.getElementById('cameraStream'),
            confirmImageBtn: document.getElementById('confirmImageBtn'),
            reviewImagePreview: document.getElementById('reviewImagePreview'),
            imageReviewArea: document.getElementById('imageReviewArea'),
            insertUpdateBtn: document.getElementById('insertUpdateBtn'),
            emailInput: document.getElementById('emailInput'), 
            passwordInput: document.getElementById('passwordInput'),
            authSubmitBtn: document.getElementById('authSubmitBtn'),
            contactMenu: document.getElementById('contactMenu'),
            showContactBtn: document.getElementById('showContactBtn'),
            openSidebarBtn: document.getElementById('openSidebarBtn'),
            toggleStageDropdownBtn: document.getElementById('toggleStageDropdownBtn'),
            toggleExportDropdownBtn: document.getElementById('toggleExportDropdownBtn'),
            toggleExplainDropdownBtn: document.getElementById('toggleExplainDropdownBtn'),
            closeSidebarBtn: document.getElementById('closeSidebarBtn'),
            sendMessageBtn: document.getElementById('sendMessageBtn'),
            explanationText: document.getElementById('current-explanation-text')
                       };
            },

            initializeChatHistory() {
                this.state.chatHistory = [
                { role: "user", parts: [{ text: "مرحباً! عرّف عن نفسك." }] },
                { role: "model", parts: [{ text: "أنا 🤖 المساعد الذكي لطلاب الرياضيات من كل الفئات العمرية 👧🧒‍🎓 أشرح، أوضّح، وأساعدك خطوة بخطوة حتى تفهم الرياضيات وتحبّها ❤️🚀 تم تطويري بعناية من قبل الأستاذ محمد جمال نعمه 👨‍💻 الحاصل على 🎓 Master of Mathematics من جامعة Gaziantep" }] }
                ];
            },

            setupEventListeners() {
                // --- Header ---
            this.dom.openSidebarBtn.addEventListener('click', () => this.ui.openSidebar());
            if (this.dom.toggleStageDropdownBtn) {
                this.dom.toggleStageDropdownBtn.addEventListener('click', () => this.ui.toggleDropdown('stageDropdown'));
            }
            if (this.dom.toggleExplainDropdownBtn) {
                this.dom.toggleExplainDropdownBtn.addEventListener('click', () => this.ui.toggleDropdown('explanationDropdown'));
            }
            if (this.dom.toggleExportDropdownBtn) {
                this.dom.toggleExportDropdownBtn.addEventListener('click', () => this.ui.toggleDropdown('exportDropdown'));
            }
            this.dom.darkModeToggle.addEventListener('click', () => {
            this.theme.toggle();
            this.ui.closeAllOverlays(); // <-- هذا السطر الجديد للإغلاق
            });
            if (this.dom.accountButton) {
                this.dom.accountButton.addEventListener('click', () => this.ui.openSettings());
            }
            const stageElementary = document.getElementById('selectStageElementary');
            if (stageElementary) stageElementary.addEventListener('click', () => { this.stage.select('elementary', 'ابتدائي'); this.ui.toggleDropdown('stageDropdown'); });
            const stagePreparatory = document.getElementById('selectStagePreparatory');
            if (stagePreparatory) stagePreparatory.addEventListener('click', () => { this.stage.select('preparatory', 'إعدادي'); this.ui.toggleDropdown('stageDropdown'); });
            const stageSecondary = document.getElementById('selectStageSecondary');
            if (stageSecondary) stageSecondary.addEventListener('click', () => { this.stage.select('secondary', 'ثانوي'); this.ui.toggleDropdown('stageDropdown'); });
            const stageHigher = document.getElementById('selectStageHigherEd');
            if (stageHigher) stageHigher.addEventListener('click', () => { this.stage.select('higher_ed', 'جامعي'); this.ui.toggleDropdown('stageDropdown'); });
            const stageGeneral = document.getElementById('selectStageGeneral');
            if (stageGeneral) stageGeneral.addEventListener('click', () => { this.stage.select('general', 'عام'); this.ui.toggleDropdown('stageDropdown'); });
            const explainQuick = document.getElementById('selectExplainQuick');
            if (explainQuick) explainQuick.addEventListener('click', () => { this.setExplanationMode('quick', 'سريع'); this.ui.toggleDropdown('explanationDropdown'); });
            const explainDetailed = document.getElementById('selectExplainDetailed');
            if (explainDetailed) explainDetailed.addEventListener('click', () => { this.setExplanationMode('detailed', 'تفصيلي'); this.ui.toggleDropdown('explanationDropdown'); });
            const exportPdfBtn = document.getElementById('exportPdfBtn');
            if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => { this.export.toPdf(); this.ui.toggleDropdown('exportDropdown'); });
            const exportWordBtn = document.getElementById('exportWordBtn');
            if (exportWordBtn) exportWordBtn.addEventListener('click', () => { this.export.toWord(); this.ui.toggleDropdown('exportDropdown'); });

            // --- Sidebar ---
            this.dom.closeSidebarBtn.addEventListener('click', () => this.ui.closeSidebar());
            document.getElementById('startNewChatBtn').addEventListener('click', () => { this.chat.startNew(); this.ui.closeSidebar(); });
            document.getElementById('toggleSavedChatsBtn').addEventListener('click', (e) => { e.preventDefault(); this.data.toggleSavedChatsAccordion(); });
            document.getElementById('toggleLibraryBtn').addEventListener('click', () => this.Library.toggleLibrary());
            this.dom.showContactBtn.addEventListener('click', () => this.ui.showContactMenu());
            if (this.dom.saveSettingsBtn) {
                this.dom.saveSettingsBtn.addEventListener('click', () => this.ui.saveSettings());
            }
            if (this.dom.closeSettingsModalBtn) {
                this.dom.closeSettingsModalBtn.addEventListener('click', () => this.ui.closeSettings());
            }

            // Handle clicks coming from the index/search UI (custom event)
            window.addEventListener('openLesson', (ev) => {
                try {
                    const item = ev.detail;
                    if (item) this.Library.sendLessonFromIndex(item);
                } catch (e) { console.warn(e); }
            });
            document.getElementById('hideContactMenuBtn').addEventListener('click', () => this.ui.hideContactMenu());

            // --- Input Area ---
            this.dom.sendMessageBtn.addEventListener('click', () => {
            this.chat.send();
            this.ui.closeAllOverlays(); // <-- هذا السطر الجديد للإغلاق
            });
            this.dom.plusBtn.addEventListener('click', () => {
            this.ui.toggleBottomNav();
            });
            document.getElementById('openMathModalBtn').addEventListener('click', () =>{
            this.math.openModal();
            this.ui.closeAllOverlays();
            });
            this.dom.imageAttachedIndicator.addEventListener('click', () => this.photo.open());

        
            // --- BOTTOM NAVIGATION ---
            document.getElementById('closeBottomNavBtn').addEventListener('click', () => this.ui.closeBottomNav());
            document.getElementById('bottomNavMenu').addEventListener('click', (e) => {
            const toolBtn = e.target.closest('.bottom-nav-btn');
            if (!toolBtn) return;
            const tool = toolBtn.dataset.tool;
            this.ui.closeBottomNav(); 
            switch(tool) {
                case 'open-camera': this.photo.open(); break;
                case 'open-file': this.dom.fileInputForEquation.click(); break;
                case 'open-drawing': this.drawing.open(); break;
                case 'geometry-workspace': this.GeometryWorkspace.open(); break;
                case 'matrix-workspace': this.MatrixWorkspace.open(); break; 
                case 'equation-builder': alert("باني المعادلات قيد التطوير!"); break;
                case 'calculus-workspace': this.CalculusWorkspace.open(); break;
                case 'algebra-workspace': this.AlgebraWorkspace.open(); break;
                case 'statistics-workspace': this.StatisticsWorkspace.open(); break;
                case 'open-calculator': ScientificCalculator.open(); break;
                case 'exam-builder': this.ExamBuilder.open(); break;
                case 'unit-converter': this.UnitConverter.open(); break;
            }
            });
        
            // --- General Modal Close Button ---
            document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modalId || btn.closest('.app-modal').id;
                if (document.getElementById(modalId)) {
                   document.getElementById(modalId).style.display = 'none';
                }
            });
            });

            // --- Specific Modals ---
            // Math Modal
            document.getElementById('cancelMathModalBtn').addEventListener('click', () => this.math.closeModal());
            this.dom.insertUpdateBtn.addEventListener('click', () => {
            if (this.state.editingElement) this.math.update();
            else this.math.insert();
            });

            // Photo Modal
            document.getElementById('cancelPhotoModalBtn').addEventListener('click', () => this.photo.close());
            document.getElementById('selectImageFileBtn').addEventListener('click', () => document.getElementById('imageFileInput').click());
            document.getElementById('openCameraBtn').addEventListener('click', () => this.photo.openCamera());
            document.getElementById('captureImageBtn').addEventListener('click', () => this.photo.capture());
            document.getElementById('imageFileInput').addEventListener('change', (event) => this.photo.previewFile(event));
            document.getElementById('clearAttachmentBtn').addEventListener('click', () => this.photo.clearAttachment(true));
            this.dom.confirmImageBtn.addEventListener('click', () => this.photo.confirm());

            // Drawing Modal
            document.getElementById('cancelDrawingBtn').addEventListener('click', () => this.drawing.close());
            document.getElementById('clearCanvasBtn').addEventListener('click', () => this.drawing.clear());
            document.getElementById('processDrawingBtn').addEventListener('click', () => {
                if (this.drawing.processWithOCR) return this.drawing.processWithOCR();
                return this.drawing.process();
            });
            document.getElementById('penWidth').addEventListener('change', (e) => this.drawing.setPenWidth(e.target.value));
            document.getElementById('penColor').addEventListener('change', (e) => this.drawing.setPenColor(e.target.value));

            // Auth Modal
            document.getElementById('cancelAuthModalBtn').addEventListener('click', () => this.auth.closeModal());
            document.getElementById('toggleAuthModeLink').addEventListener('click', (e) => { e.preventDefault(); this.auth.toggleMode(); });
            document.getElementById('forgotPasswordLink').addEventListener('click', () => this.auth.resetPassword());
            this.dom.authSubmitBtn.addEventListener('click', () => this.auth.handleAuthSubmit());

            // Saved Chats Modal
            document.getElementById('closeSavedChatsModalBtn').addEventListener('click', () => this.data.closeLoadModal());
        
            

            // --- Drawing Canvas Events (for drawing modal) ---
            this.dom.canvas.addEventListener('mousedown', (e) => this.drawing.startDrawing(e));
            this.dom.canvas.addEventListener('mousemove', (e) => this.drawing.draw(e));
            this.dom.canvas.addEventListener('mouseup', () => this.drawing.stopDrawing());
            this.dom.canvas.addEventListener('mouseout', () => this.drawing.stopDrawing());
            this.dom.canvas.addEventListener('touchstart', (e) => this.drawing.startDrawing(e));
            this.dom.canvas.addEventListener('touchmove', (e) => this.drawing.draw(e));
            this.dom.canvas.addEventListener('touchend', () => this.drawing.stopDrawing());
            this.dom.canvas.addEventListener('touchcancel', () => this.drawing.stopDrawing());

            // --- Dynamic Content & Global Events ---

            this.dom.chatMessages.addEventListener('click', (event) => {
            const shareBtn = event.target.closest('.share-btn');
            const rateGoodBtn = event.target.closest('.rate-good-btn');
            const rateBadBtn = event.target.closest('.rate-bad-btn');
            const mathExpression = event.target.closest('.math-expression');

            if (shareBtn) this.export.shareMessageAsImage(shareBtn);
            if (rateGoodBtn) this.ui.rateMessage(rateGoodBtn, 'good');
            if (rateBadBtn) this.ui.rateMessage(rateBadBtn, 'bad');
            
            
            if (mathExpression) {
            // التحقق: هل العنصر يمتلك onclick مدمج؟ (يحدث هذا في رسائل المستخدم)
            // إذا كان يمتلكه، نتجاهل هذا المستمع لكي لا تعمل الدالة مرتين
            if (mathExpression.hasAttribute('onclick')) {
                return; 
            }
            // إذا لم يكن لديه onclick (مثل رسائل الـ AI)، نقوم باستدعاء الدالة يدوياً
            this.math.editExisting(mathExpression);
        }
            });
            // 2. إضافة مستمع النسخ العام (Copy Listener) - ضروري جداً للمشكلة الثانية
    // هذا الكود يضمن أنه عند نسخ أي شيء من الصفحة، يتم تحويل المعادلات إلى صيغة $...$
    document.addEventListener('copy', (e) => {
        // نتحقق أولاً مما إذا كان التحديد يحتوي على معادلات
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const container = selection.getRangeAt(0).commonAncestorContainer;
            // إذا كان النسخ من داخل المحرر أو الشات، نستخدم النسخ الذكي
            if (
                this.dom.editor.contains(container) || 
                this.dom.chatMessages.contains(container) ||
                (container.nodeType === 1 && container.querySelector('.math-expression')) // حالة عامة
            ) {
                this.editor.handleCopy(e);
            }
        }
    });

            // --- Editor specific events ---
            this.dom.editor.addEventListener('paste', (e) => this.editor.handlePaste(e));
            this.dom.editor.addEventListener('click', () => this.editor.saveCursor());
            this.dom.editor.addEventListener('keyup', () => this.editor.saveCursor());
            this.dom.editor.addEventListener('focus', () => this.editor.saveCursor());

            // --- Window events ---
            document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.math.closeModal(); this.photo.close(); this.drawing.close();
                this.auth.closeModal(); this.data.closeLoadModal();
                this.ui.closeSidebar(); this.ui.closeBottomNav();
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal) settingsModal.style.display = 'none';
                if(this.GeometryWorkspace.dom.modal) this.GeometryWorkspace.dom.modal.style.display = 'none';
            }
            });
            // عند النقر على منطقة المحادثة، أغلق جميع القوائم المفتوحة
                this.dom.chatMessages.addEventListener('click', () => {
    this.ui.closeAllOverlays();
            });

            // عند النقر على حقل الكتابة (المحرر)، أغلق القوائم أيضاً
            this.dom.editor.addEventListener('click', () => {
              this.ui.closeAllOverlays();
            });
            // ==================== الإدخال الصوتي الذكي (WhatsApp Style) ====================

const editor = this.dom.editor;
const recordBtn = document.getElementById('recordBtn');
const sendBtn = this.dom.sendMessageBtn;

// دالة للتبديل بين زر الإرسال وزر التسجيل
const toggleInputButtons = () => {
    if (!recordBtn || !sendBtn) return;
    const text = editor.innerText.trim();
    const hasImage = MathApp.state.selectedImageBase64 !== null;
    const hasFile = MathApp.state.attachedFileContent !== null;

    // إذا كان هناك نص أو صورة أو ملف -> اظهر زر الإرسال
    if (text.length > 0 || hasImage || hasFile) {
        recordBtn.style.display = 'none';
        sendBtn.style.display = 'flex';
    } else {
        // الحقل فارغ -> اظهر زر المايك
        sendBtn.style.display = 'none';
        recordBtn.style.display = 'flex';
    }
};

// مراقبة الكتابة في الحقل للتبديل الفوري
editor.addEventListener('input', toggleInputButtons);
toggleInputButtons();
this.updateInputButtons = toggleInputButtons;

if (recordBtn) {
recordBtn.addEventListener('click', async () => {
    const editor = this.dom.editor; // جلب المحرر من الكاش الموجود مسبقاً

    // التحقق هل نحن على أندرويد (Capacitor)؟
    if (this.isCapacitor()) {
        
        // --- حالة الموبايل (نستخدم كائن Capacitor العالمي لتجنب مشاكل الـ import) ---
        try {
            const SpeechRec = window.Capacitor?.Plugins?.SpeechRecognition;
            
            if (!SpeechRec) {
                MathApp.ui.showToast("إضافة المايك غير مثبتة في الأندرويد", "error");
                return;
            }

            const isRecording = recordBtn.innerHTML.includes('⬛');

            if (isRecording) {
                await SpeechRec.stop();
                if (this.state.speechPartialListener && this.state.speechPartialListener.remove) {
                    await this.state.speechPartialListener.remove();
                    this.state.speechPartialListener = null;
                }
                recordBtn.innerHTML = '🎙️';
            } else {
                const permission = SpeechRec.requestPermissions
                    ? await SpeechRec.requestPermissions()
                    : (SpeechRec.requestPermission ? await SpeechRec.requestPermission() : null);

                const granted = !!(permission && (permission.speechRecognition === 'granted' || permission.permission === true));
                if (!granted) {
                    MathApp.ui.showToast("يرجى السماح بالمايكروفون", "error");
                    return;
                }
                const available = await SpeechRec.available();
                if (available.available) {
                    recordBtn.innerHTML = '<span class="recording-pulse">⬛</span>';

                    if (this.state.speechPartialListener && this.state.speechPartialListener.remove) {
                        await this.state.speechPartialListener.remove();
                        this.state.speechPartialListener = null;
                    }

                    // إضافة مستمع للنتائج (Native)
                    this.state.speechPartialListener = await SpeechRec.addListener('partialResults', (data) => {
                        if (data.matches && data.matches.length > 0) {
                            editor.innerText = data.matches[0];
                            this.editor.setCursorToEnd();
                            editor.dispatchEvent(new Event('input'));
                        }
                    });

                    await SpeechRec.start({
                        language: "ar-SA",
                        partialResults: true,
                        popup: false,
                    });
                }
            }
        } catch (err) {
            console.error("Native Speech Error:", err);
            MathApp.ui.showToast("خطأ في صلاحيات المايك");
        }

    } else {
        // --- حالة الويب العادي ---
        const SpeechRecognitionWeb = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognitionWeb) {
            if (!window.mathAppRecognition) {
                window.mathAppRecognition = new SpeechRecognitionWeb();
                window.mathAppRecognition.lang = 'ar-SA';
                window.mathAppRecognition.continuous = false;

                window.mathAppRecognition.onstart = () => recordBtn.innerHTML = '<span class="recording-pulse">⬛</span>';
                window.mathAppRecognition.onend = () => recordBtn.innerHTML = '🎙️';
                window.mathAppRecognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    editor.innerText += (editor.innerText ? ' ' : '') + transcript;
                    this.editor.setCursorToEnd();
                    editor.dispatchEvent(new Event('input'));
                };
            }

            if (recordBtn.innerHTML.includes('⬛')) {
                window.mathAppRecognition.stop();
            } else {
                window.mathAppRecognition.start();
            }
        } else {
            MathApp.ui.showToast("المتصفح لا يدعم الصوت");
        }
    }
});
}
        // داخل MathApp.setupEventListeners() في app.js
this.dom.editor.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const container = range.startContainer;
            const offset = range.startOffset;

            // إذا كان المؤشر في بداية نود نصي بعد المعادلة مباشرة
            if (container.nodeType === Node.TEXT_NODE && offset === 0) {
                const prevNode = container.previousSibling;
                if (prevNode && prevNode.classList && prevNode.classList.contains('math-expression')) {
                    prevNode.remove(); // احذف المعادلة برمجياً
                    e.preventDefault(); // منع سلوك المتصفح الافتراضي
                }
            } 
            // إذا كان المؤشر بعد المعادلة داخل الحاوية الأب
            else if (container === this.dom.editor && offset > 0) {
                const nodeBefore = container.childNodes[offset - 1];
                if (nodeBefore && nodeBefore.classList && nodeBefore.classList.contains('math-expression')) {
                    nodeBefore.remove();
                    e.preventDefault();
                }
            }
        }
    }
});
            },

            displayWelcomeMessage() {
        const welcomeMsgParts = this.state.chatHistory[1].parts; 
        if (welcomeMsgParts && welcomeMsgParts.length > 0) {
            this.chat.displayMessage(welcomeMsgParts[0].text, 'outgoing'); 
        }
        this.chat.scrollToBottom(); 
            },
         setupMobileBackButton() {
    // === دالة مساعدة لإغلاق القوائم المفتوحة (تعيد true إذا أغلقت شيئاً) ===
    const closeOpenUI = () => {
        // 1. فحص النوافذ المنبثقة (Modals)
        const openModals = Array.from(document.querySelectorAll('.app-modal')).filter(modal => {
            return getComputedStyle(modal).display !== 'none';
        });

        if (openModals.length > 0) {
            openModals.forEach(m => m.style.display = 'none');
            return true; // تم إغلاق نافذة
        }

        // 2. فحص القائمة الجانبية
        const sidebar = document.getElementById('sidebarNav');
        if (sidebar && sidebar.classList.contains('open')) {
            this.ui.closeSidebar();
            return true; // تم إغلاق السايدبار
        }

        // 3. فحص القائمة السفلية
        const bottomNav = document.getElementById('bottomNavMenu');
        if (bottomNav && bottomNav.classList.contains('open')) {
            this.ui.closeBottomNav();
            return true; // تم إغلاق القائمة السفلية
        }

        return false; // لا يوجد شيء مفتوح
    };

    // ============================================================
    // الحالة 1: تطبيق موبايل حقيقي (Capacitor / Android)
    // ============================================================
    if (this.isCapacitor()) {
        App.addListener('backButton', ({ canGoBack }) => {
            const handled = closeOpenUI();

            if (!handled) {
                // إذا لم يكن هناك قوائم مفتوحة، اسأل عن الخروج
                App.exitApp();
            }
        });
    } 
    // ============================================================
    // الحالة 2: متصفح ويب / PWA (Web History API)
    // ============================================================
    else {
        // إضافة حالة وهمية عند البدء لمنع الخروج الفوري
        window.history.pushState({ page: 'home' }, '', window.location.href);

        window.addEventListener('popstate', (event) => {
            const handled = closeOpenUI();

            if (handled) {
                // إذا أغلقنا قائمة، نعيد الحالة الوهمية لنمنع الخروج في الضغطة القادمة
                window.history.pushState({ page: 'home' }, '', window.location.href);
            } else {
                // لا يوجد قوائم، المستخدم يريد الرجوع/الخروج
                // تأكيد الخروج مُلغى — نسمح بالرجوع/الخروج مباشرة
            }
        });
    }
},           
};

            window.MathApp = MathApp;  
            OCRManager.init();
           
            

            // ==================== FINAL INITIALIZATION ====================
            const bootMathApp = () => {
            MathApp.init();
            PWAManager.init();
            };
            if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootMathApp);
            } else {
            bootMathApp();
            }
