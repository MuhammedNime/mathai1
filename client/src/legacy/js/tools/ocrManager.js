import { normalizeOCRText } from './mathNormalize.js';

// ==================== OCR MANAGER (Online + Offline) ====================
export const OCRManager = {
    _initialized: false,
    _workerPromise: null,
    _workerLang: null,
    localConfig: {
        lang: 'ara+eng+equ',
        fallbackLang: 'ara+eng',
        workerPath: '/libs/tesseract/worker.min.js',
        corePath: '/libs/tesseract/tesseract-core.wasm.js',
        langPath: '/libs/tesseract/lang'
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        if (!window.MathApp || !window.MathApp.drawing) return;
        window.MathApp.drawing.processWithOCR = async () => this.processDrawing();
    },

    isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : false;
    },

    async getWorker() {
        if (this._workerPromise) return this._workerPromise;

        const create = async (lang) => {
            if (!window.Tesseract || !window.Tesseract.createWorker) {
                throw new Error('OCR library not loaded.');
            }
            const worker = await window.Tesseract.createWorker({
                workerPath: this.localConfig.workerPath,
                corePath: this.localConfig.corePath,
                langPath: this.localConfig.langPath
            });
            await worker.loadLanguage(lang);
            await worker.initialize(lang);
            await worker.setParameters({
                preserve_interword_spaces: '1'
            });
            this._workerLang = lang;
            return worker;
        };

        this._workerPromise = (async () => {
            try {
                return await create(this.localConfig.lang);
            } catch (err) {
                console.warn('OCR: fallback language set due to init error', err);
                return await create(this.localConfig.fallbackLang);
            }
        })();

        return this._workerPromise;
    },

    getApiUrl() {
        const base = (window.MathApp && window.MathApp.config && (window.MathApp.config.apiVisionUrl || window.MathApp.config.apiBaseUrl)) || '/api/gemini/vision';
        const model = (window.MathApp && window.MathApp.config && (window.MathApp.config.visionModel || window.MathApp.config.model)) || 'gemini-2.5-flash';
        try {
            const url = new URL(base, window.location.origin);
            url.searchParams.set('model', model);
            return url.toString();
        } catch (e) {
            const sep = base.includes('?') ? '&' : '?';
            return `${base}${sep}model=${encodeURIComponent(model)}`;
        }
    },

    async preprocessImage(base64Image, options = {}) {
        const settings = {
            maxSize: 1400,
            crop: false,
            cropPadding: 12,
            binarize: false,
            threshold: 180,
            contrast: 1.25,
            whiteThreshold: 245,
            ...options
        };

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, settings.maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                let workCanvas = canvas;
                let workCtx = ctx;

                if (settings.crop) {
                    const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                    const { data, width, height } = imageData;
                    let minX = width, minY = height, maxX = 0, maxY = 0;
                    let found = false;
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const idx = (y * width + x) * 4;
                            const r = data[idx];
                            const g = data[idx + 1];
                            const b = data[idx + 2];
                            const brightness = (r + g + b) / 3;
                            if (brightness < settings.whiteThreshold) {
                                found = true;
                                if (x < minX) minX = x;
                                if (y < minY) minY = y;
                                if (x > maxX) maxX = x;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                    if (found) {
                        minX = Math.max(0, minX - settings.cropPadding);
                        minY = Math.max(0, minY - settings.cropPadding);
                        maxX = Math.min(width - 1, maxX + settings.cropPadding);
                        maxY = Math.min(height - 1, maxY + settings.cropPadding);
                        const cropWidth = Math.max(1, maxX - minX + 1);
                        const cropHeight = Math.max(1, maxY - minY + 1);
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = cropWidth;
                        cropCanvas.height = cropHeight;
                        const cropCtx = cropCanvas.getContext('2d');
                        cropCtx.drawImage(workCanvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                        workCanvas = cropCanvas;
                        workCtx = cropCtx;
                    }
                }

                const processed = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                const { data } = processed;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    let v = 0.299 * r + 0.587 * g + 0.114 * b;
                    v = (v - 128) * settings.contrast + 128;
                    if (settings.binarize) {
                        v = v > settings.threshold ? 255 : 0;
                    }
                    v = Math.max(0, Math.min(255, v));
                    data[i] = v;
                    data[i + 1] = v;
                    data[i + 2] = v;
                    data[i + 3] = 255;
                }
                workCtx.putImageData(processed, 0, 0);

                const output = workCanvas.toDataURL('image/png').split(',')[1];
                resolve(output || base64Image);
            };
            img.onerror = () => resolve(base64Image);
            img.src = `data:image/png;base64,${base64Image}`;
        });
    },

    async recognizeWithGemini(base64Image) {
        const apiUrl = this.getApiUrl();
        if (!apiUrl) {
            throw new Error('Missing Vision API URL.');
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: "استخرج النص أو المعادلات الرياضية من هذه الصورة. اكتب المعادلات بصيغة LaTeX بين علامات $. أعطني النص فقط بدون أي تفسيرات أو مقدمات."
                        },
                        {
                            inlineData: {
                                mimeType: "image/png",
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;
        return text ? text.trim() : null;
    },

    async recognizeWithLocalOCR(base64Image) {
        const worker = await this.getWorker();
        const dataUrl = `data:image/png;base64,${base64Image}`;
        const { data } = await worker.recognize(dataUrl);
        return data && data.text ? data.text.trim() : null;
    },

    async recognizeAuto(base64Image, options = {}) {
        const preprocessed = options.preprocessed || base64Image;
        if (this.isOnline()) {
            try {
                return await this.recognizeWithGemini(base64Image);
            } catch (error) {
                console.warn('Gemini OCR failed, falling back to local OCR:', error);
                return await this.recognizeWithLocalOCR(preprocessed);
            }
        }
        return await this.recognizeWithLocalOCR(preprocessed);
    },

    async recognizeFromCanvas(canvasElement) {
        try {
            if (!window.MathApp) throw new Error('MathApp not initialized.');
            window.MathApp.ui.showToast(this.isOnline() ? '🔍 جاري التعرف على الكتابة...' : '📴 OCR محلي: جاري التعرف...');

            const dataURL = canvasElement.toDataURL('image/png');
            const base64Data = dataURL.split(',')[1];
            const preprocessed = await this.preprocessImage(base64Data, {
                crop: true,
                binarize: true,
                contrast: 1.35,
                threshold: 170
            });

            const result = await this.recognizeAuto(base64Data, { preprocessed });
            if (result) {
                const cleaned = normalizeOCRText(result);
                window.MathApp.dom.editor.textContent = cleaned;
                window.MathApp.editor.setCursorToEnd();
                window.MathApp.ui.showToast('✅ تم التعرف على النص بنجاح!');
                return cleaned;
            }
            throw new Error('لم يتم العثور على نص');
        } catch (error) {
            console.error('OCR Error:', error);
            if (window.MathApp && window.MathApp.ui) {
                window.MathApp.ui.showToast('❌ فشل التعرف على الكتابة: ' + error.message, 'error');
            }
            return null;
        }
    },

    async recognizeFromImage(imageFile) {
        try {
            if (!window.MathApp) throw new Error('MathApp not initialized.');
            window.MathApp.ui.showToast(this.isOnline() ? '🔍 جاري تحليل الصورة...' : '📴 OCR محلي: تحليل الصورة...');

            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const base64Data = e.target.result.split(',')[1];
                        const preprocessed = await this.preprocessImage(base64Data, {
                            crop: false,
                            binarize: false,
                            contrast: 1.15
                        });
                        const result = await this.recognizeAuto(base64Data, { preprocessed });
                        if (result) {
                            const cleaned = normalizeOCRText(result);
                            window.MathApp.dom.editor.textContent = cleaned;
                            window.MathApp.editor.setCursorToEnd();
                            window.MathApp.ui.showToast('✅ تم استخراج النص من الصورة!');
                            resolve(cleaned);
                        } else {
                            throw new Error('لم يتم العثور على نص في الصورة');
                        }
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('فشل قراءة الصورة'));
                reader.readAsDataURL(imageFile);
            });
        } catch (error) {
            console.error('Image OCR Error:', error);
            if (window.MathApp && window.MathApp.ui) {
                window.MathApp.ui.showToast('❌ فشل استخراج النص: ' + error.message, 'error');
            }
            return null;
        }
    },

    async processDrawing() {
        if (!window.MathApp) throw new Error('MathApp not initialized.');
        const canvas = window.MathApp.dom.canvas;
        const choice = await this.showProcessChoice();

        if (choice === 'ocr') {
            const text = await this.recognizeFromCanvas(canvas);
            if (text) {
                window.MathApp.drawing.close();
                window.MathApp.ui.showToast('✅ تم إدراج النص المستخرج');
            }
        } else if (choice === 'image') {
            const dataURL = canvas.toDataURL('image/png');
            window.MathApp.state.selectedImageMimeType = 'image/png';
            window.MathApp.state.selectedImageBase64 = dataURL.split(',')[1];
            window.MathApp.drawing.close();
            window.MathApp.photo.open();
            window.MathApp.photo.confirm();
            window.MathApp.ui.showToast('تم إرفاق الرسم بنجاح.');
        }
    },

    showProcessChoice() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex;
            justify-content: center; align-items: center; z-index: 999999;
        `;
            modal.innerHTML = `
            <div style="background: var(--bg-container); padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3 style="margin-bottom: 20px; color: var(--primary-color);">كيف تريد معالجة الرسم؟</h3>
                <button id="ocrChoice" class="btn btn-primary" style="width: 100%; margin-bottom: 10px; padding: 15px;">✍️ التعرف على الخط (OCR)</button>
                <button id="imageChoice" class="btn btn-secondary" style="width: 100%; margin-bottom: 10px; padding: 15px;">🖼️ إرسال كصورة</button>
                <button id="cancelChoice" class="btn" style="width: 100%; background: var(--secondary-bg); color: white; padding: 10px;">إلغاء</button>
            </div>
        `;
            document.body.appendChild(modal);

            document.getElementById('ocrChoice').onclick = () => { modal.remove(); resolve('ocr'); };
            document.getElementById('imageChoice').onclick = () => { modal.remove(); resolve('image'); };
            document.getElementById('cancelChoice').onclick = () => { modal.remove(); resolve(null); };
        });
    }
};
