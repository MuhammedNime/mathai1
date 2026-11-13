export const ExamBuilder = {
    state: {
        attachedFile: null, // { content, type, name }
        currentExam: null,  // تخزين بيانات الامتحان المولد
        userAnswers: {}
    },
    dom: {},

    init() {
        this.dom.modal = document.getElementById('exam-builder-modal');
        this.dom.uploadZone = document.getElementById('exam-upload-zone');
        this.dom.fileInput = document.getElementById('exam-file-input');
        this.dom.setupPanel = document.getElementById('exam-setup-panel');
        this.dom.displayPanel = document.getElementById('exam-display-panel');
        this.dom.questionsContainer = document.getElementById('exam-questions-container');
        
        // Event Listeners
        this.dom.uploadZone.addEventListener('click', () => this.dom.fileInput.click());
        this.dom.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('generate-exam-btn').addEventListener('click', () => this.generateExam());
        document.getElementById('submit-exam-btn').addEventListener('click', () => this.gradeExam());
        document.getElementById('new-exam-btn').addEventListener('click', () => this.reset());
    },

    open() {
        this.reset();
        this.dom.modal.style.display = 'flex';
    },

    reset() {
        this.state.attachedFile = null;
        this.state.currentExam = null;
        this.state.userAnswers = {};
        this.dom.fileInput.value = '';
        this.clearFile();
        this.dom.setupPanel.style.display = 'block';
        this.dom.displayPanel.style.display = 'none';
        this.dom.questionsContainer.innerHTML = '';
    },

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        window.MathApp.ui.showToast('جاري معالجة الملف...', false);

        const reader = new FileReader();
        
        if (file.type.startsWith('image/')) {
            reader.onload = (e) => {
                this.state.attachedFile = {
                    content: e.target.result.split(',')[1],
                    type: file.type,
                    name: file.name,
                    isImage: true
                };
                this.updateFilePreview();
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            // استخدام معالج PDF الموجود في التطبيق (بسيط حالياً)
            // في النسخة المطورة، سنحوله إلى صور ليفهمها Gemini Vision بشكل أفضل
            // هنا سنرسله كنص إذا استطعنا استخراجه، أو نحذر المستخدم
            window.MathApp.ui.showToast('⚠️ يفضل تحويل الـ PDF إلى صور لأفضل دقة في استنساخ النماذج.', 'warning');
            
            // ... (منطق PDF البسيط) ...
            this.state.attachedFile = {
                content: "PDF_CONTENT_PLACEHOLDER", // سنعتمد على المستخدم لرفع صور الآن
                name: file.name,
                isImage: false
            };
            this.updateFilePreview();
        }
    },

    updateFilePreview() {
        document.getElementById('exam-file-preview').style.display = 'flex';
        document.getElementById('exam-file-name').textContent = this.state.attachedFile.name;
        this.dom.uploadZone.style.display = 'none';
    },

    clearFile() {
        this.state.attachedFile = null;
        document.getElementById('exam-file-preview').style.display = 'none';
        this.dom.uploadZone.style.display = 'block';
    },

    async generateExam() {
        // 1. التحقق من وجود الملف
        if (!this.state.attachedFile) {
            window.MathApp.ui.showToast('الرجاء رفع نموذج أو صورة أولاً.', 'error');
            return;
        }

        const qCount = document.getElementById('exam-question-count').value;
        const difficulty = document.getElementById('exam-difficulty').value;

        // إظهار رسالة التحميل
        const loadingToast = document.getElementById('toast-message');
        window.MathApp.ui.showToast('⏳ جاري تحليل النموذج وتوليد الامتحان... (انتظر قليلاً)');

        // 2. تحضير النص (Prompt)
        const promptText = `
            You are a professional educational exam creator.
            Task: Analyze the attached image (which is an exam paper or textbook page).
            Action: Create a BRAND NEW exam that mimics the exact style, structure, and topic of the uploaded image.
            
            Settings:
            - Number of Questions: ${qCount === 'same' ? 'Same quantity as the original image' : qCount}
            - Difficulty: ${difficulty === 'match' ? 'Same difficulty' : (difficulty === 'harder' ? 'Slightly harder' : 'Slightly easier')}
            - Language: Arabic (Use LaTeX for Math).

            **IMPORTANT RESPONSE FORMAT**:
            You must return ONLY valid JSON code. No markdown formatting, no backticks.
            Structure:
            {
                "title": "Exam Title Here",
                "questions": [
                    {
                        "id": 1,
                        "type": "mcq", 
                        "text": "Question text here (Arabic)",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "The correct option text",
                        "explanation": "Brief explanation in Arabic"
                    },
                    {
                        "id": 2,
                        "type": "open",
                        "text": "Open question text",
                        "correctAnswer": "The expected answer",
                        "explanation": "Solution steps"
                    }
                ]
            }
        `;

        // 3. تحضير البيانات للإرسال
        // ملاحظة: نستخدم window.MathApp للوصول إلى الإعدادات العامة
        const parts = [
            { text: promptText },
            { 
                inlineData: { 
                    mimeType: this.state.attachedFile.type, 
                    data: this.state.attachedFile.content 
                } 
            }
        ];

        try {
            // استخدام مفتاح API من الإعدادات العامة
            const API_BASE = window.MathApp.config.apiBaseUrl || '/api/gemini';
            const MODEL = window.MathApp.config.model; // تأكد أن الموديل يدعم الصور (مثل gemini-2.5-flash)
            if (!API_BASE) {
                window.MathApp.ui.showToast('لم يتم إعداد خادم الوسيط (API_BASE_URL).', 'error');
                return;
            }
            if (!MODEL) {
                window.MathApp.ui.showToast('لم يتم تحديد النموذج (model).', 'error');
                return;
            }

            const API_URL = (() => {
                try {
                    const url = new URL(API_BASE, window.location.origin);
                    url.searchParams.set('model', MODEL);
                    return url.toString();
                } catch (e) {
                    const sep = API_BASE.includes('?') ? '&' : '?';
                    return `${API_BASE}${sep}model=${encodeURIComponent(MODEL)}`;
                }
            })();
            
            console.log("🚀 Sending Exam Request...");

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: parts }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4000
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("API Error Details:", errData);
                throw new Error(errData.error?.message || `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("📥 API Response Received:", data);

            let textResponse = data.candidates[0].content.parts[0].text;
            
            // 4. تنظيف الرد لاستخراج JSON فقط
            // إزالة أي علامات markdown قد يضيفها الذكاء الاصطناعي
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // محاولة العثور على بداية ونهاية الـ JSON الحقيقي
            const firstBrace = textResponse.indexOf('{');
            const lastBrace = textResponse.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                textResponse = textResponse.substring(firstBrace, lastBrace + 1);
            }

            const examData = JSON.parse(textResponse);
            
            window.MathApp.ui.showToast('✅ تم توليد الامتحان بنجاح!', false);
            this.renderExam(examData);

        } catch (error) {
            console.error('Exam Generation Error:', error);
            window.MathApp.ui.showToast(`❌ حدث خطأ: ${error.message}`, 'error');
            
            // طباعة الخطأ في الكونسول للمطور
            console.log("Raw Response causing error might be logged above.");
        }
    },
      
    renderExam(examData) {
        this.state.currentExam = examData;
        this.dom.setupPanel.style.display = 'none';
        this.dom.displayPanel.style.display = 'flex';
        const container = this.dom.questionsContainer;
        
        container.innerHTML = `<h2 style="text-align:center; color:var(--primary-color); margin-bottom:20px;">${examData.title}</h2>`;

        examData.questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'exam-question-card';
            qDiv.style.cssText = `
                background: var(--bg-container); border: 1px solid var(--modal-border);
                border-radius: 12px; padding: 15px; margin-bottom: 15px;
            `;

            // نص السؤال مع دعم KaTeX
            let qText = `<div style="font-weight:bold; margin-bottom:10px;">س${index+1}: ${q.text}</div>`;
            
            // خيارات الإجابة
            if (q.type === 'mcq' && q.options) {
                qText += `<div class="options-grid" style="display:grid; gap:10px;">`;
                q.options.forEach((opt, optIdx) => {
                    qText += `
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:8px; border:1px solid var(--modal-border); border-radius:8px;">
                            <input type="radio" name="q_${index}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `;
                });
                qText += `</div>`;
            } else {
                qText += `<textarea class="math-input" placeholder="اكتب إجابتك هنا..." style="height:80px; min-height:80px;"></textarea>`;
            }

            // منطقة التصحيح (مخفية)
            qText += `<div class="correction-area" id="correction_${index}" style="display:none; margin-top:15px; background:var(--bg-info); padding:10px; border-radius:8px;">
                <strong>✅ الإجابة الصحيحة:</strong> <span class="correct-ans">${q.correctAnswer}</span><br>
                <strong>💡 الشرح:</strong> ${q.explanation}
            </div>`;

            qDiv.innerHTML = qText;
            container.appendChild(qDiv);
        });

        // تفعيل KaTeX على الأسئلة الجديدة
        window.MathApp.ui.renderMathInElement(container);
    },

    gradeExam() {
        // إظهار الإجابات الصحيحة
        this.state.currentExam.questions.forEach((q, index) => {
            const correctionDiv = document.getElementById(`correction_${index}`);
            correctionDiv.style.display = 'block';
            
            // تحريك الشاشة بسلاسة
            correctionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        
        document.getElementById('submit-exam-btn').style.display = 'none';
        window.MathApp.ui.showToast('تم تصحيح الامتحان. راجع إجاباتك! 🎉');
    }
};
