
// ==================== THEME MODULE ====================
export const theme = {
        apply() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                window.MathApp.dom.darkModeToggle.textContent = '🌙';
            } else {
                document.body.classList.remove('dark-mode');
                window.MathApp.dom.darkModeToggle.textContent = '☀️';
            }
        },
        toggle() {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                window.MathApp.dom.darkModeToggle.textContent = '🌙';
            } else {
                localStorage.setItem('theme', 'light');
                window.MathApp.dom.darkModeToggle.textContent = '☀️';
            }
            window.MathApp.drawing.initCanvas();
        }
    }
    
    // ==================== STAGE MODULE ====================
export const stage = {
        select(stageKey, stageText) {
            window.MathApp.state.currentStage = stageKey;
            const stageEl = document.getElementById('current-stage-text');
            if (stageEl) stageEl.textContent = stageText;
            localStorage.setItem('ai_stage', stageKey);
            localStorage.setItem('ai_stage_text', stageText);
            // notify other components (library) that stage changed
            try { window.dispatchEvent(new CustomEvent('stageChanged', { detail: { key: stageKey, text: stageText } })); } catch(e) {}
        },
        load() {
            const savedStage = localStorage.getItem('ai_stage') || 'secondary';
            const savedText = localStorage.getItem('ai_stage_text') || 'ثانوي';
            this.select(savedStage, savedText);
        },
        getContext() {
            const lang = (() => {
                try { return localStorage.getItem('app_language') || 'ar'; } catch (e) { return 'ar'; }
            })();
            const contextsByLang = {
                ar: {
                    elementary: "أجب بأسلوب بسيط ومناسب لطفل.",
                    preparatory: "أجب بأسلوب مناسب للمرحلة الإعدادية.",
                    secondary: "أجب بأسلوب مناسب للمرحلة الثانوية.",
                    higher_ed: "أجب بأسلوب أكاديمي وعميق مناسب للجامعة.",
                    general: "أجب بطريقة مفهومة لجميع المراحل (ابتدائي-جامعي) وقابلة للتبسيط أو التعميق حسب الطلب."
                },
                en: {
                    elementary: "Answer in a simple, child-friendly way.",
                    preparatory: "Answer in a way suitable for middle school level.",
                    secondary: "Answer in a way suitable for high school level.",
                    higher_ed: "Answer in an academic, in-depth university level style.",
                    general: "Answer in a way understandable for all levels (elementary to university), adaptable to simplify or deepen as requested."
                },
                tr: {
                    elementary: "Basit ve çocuk seviyesine uygun şekilde yanıt ver.",
                    preparatory: "Ortaokul seviyesine uygun şekilde yanıt ver.",
                    secondary: "Lise seviyesine uygun şekilde yanıt ver.",
                    higher_ed: "Üniversite seviyesinde akademik ve derinlikli yanıt ver.",
                    general: "Tüm seviyeler (ilkokuldan üniversiteye) için anlaşılır şekilde yanıt ver, istenirse sadeleştir veya derinleştir."
                }
            };
            const contexts = contextsByLang[lang] || contextsByLang.ar;
            return contexts[window.MathApp.state.currentStage] || contexts.secondary;
        }
    }

    // ==================== FILE MODULE ====================
export const file = { 
         async handleFileUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;

                    const mimeType = file.type;
                    const reader = new FileReader();

                    // معالجة الصور
                    if (mimeType.startsWith('image/')) {
                        reader.onload = (e) => {
                            window.MathApp.state.selectedImageBase64 = e.target.result.split(',')[1];
                            window.MathApp.state.selectedImageMimeType = mimeType;
                            window.MathApp.state.attachedFileContent = null;
                            window.MathApp.state.attachedFileName = null;
                            
                            window.MathApp.dom.imageAttachedIndicator.style.display = 'flex';
                            window.MathApp.dom.imageAttachedIndicator.innerHTML = '<span>صورة مرفقة (AI)</span><span style="margin-right: 5px;">🖼️</span>';
                            event.target.value = '';
                            window.MathApp.ui.showToast('تم إرفاق الصورة بنجاح. يمكنك الآن إرسال سؤالك.');
                            window.MathApp.ui.closeBottomNav();
                            if (window.MathApp.updateInputButtons) window.MathApp.updateInputButtons();
                        };
                        reader.readAsDataURL(file);
                    
                    // معالجة ملفات TXT
                    } else if (mimeType === 'text/plain' || file.name.endsWith('.txt')) {
                        reader.onload = (e) => {
                            window.MathApp.state.attachedFileContent = e.target.result;
                            window.MathApp.state.attachedFileName = file.name;
                            window.MathApp.state.selectedImageBase64 = null;
                            window.MathApp.state.selectedImageMimeType = null;

                            window.MathApp.dom.imageAttachedIndicator.style.display = 'flex';
                            window.MathApp.dom.imageAttachedIndicator.innerHTML = `<span>ملف نصي: ${file.name}</span><span style="margin-right: 5px;">📄</span>`;
                            event.target.value = '';
                            window.MathApp.ui.showToast('تم إرفاق الملف النصي بنجاح. سيتم تحليل محتواه مع سؤالك.');
                            window.MathApp.ui.closeBottomNav();
                            if (window.MathApp.updateInputButtons) window.MathApp.updateInputButtons();
                        };
                        reader.readAsText(file);
                    
                    // معالجة ملفات PDF
                    } else if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
                        try {
                            window.MathApp.ui.showToast('جاري استخراج النص من PDF...', false);
                            
                            const arrayBuffer = await file.arrayBuffer();
                            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                            const totalPages = pdf.numPages;
                            
                            let extractedText = '';
                            let processedPages = 0;
                            
                            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                                try {
                                    const page = await pdf.getPage(pageNum);
                                    const textContent = await page.getTextContent();
                                    
                                    const pageText = textContent.items
                                        .map(item => item.str)
                                        .join(' ')
                                        .trim();
                                    
                                    if (pageText) {
                                        extractedText += `\n\n=== صفحة ${pageNum} من ${totalPages} ===\n${pageText}`;
                                        processedPages++;
                                    }
                                    
                                    if (pageNum % 5 === 0 || pageNum === totalPages) {
                                        window.MathApp.ui.showToast(`معالجة الصفحة ${pageNum}/${totalPages}...`, false);
                                    }
                                    
                                } catch (pageError) {
                                    console.warn(`فشل في قراءة الصفحة ${pageNum}:`, pageError);
                                    extractedText += `\n\n=== صفحة ${pageNum}: خطأ في القراءة ===\n`;
                                }
                            }
                            
                            if (!extractedText.trim()) {
                                throw new Error('لم يتم العثور على نص قابل للقراءة في ملف PDF. قد يكون الملف عبارة عن صور ممسوحة ضوئياً.');
                            }
                            
                            window.MathApp.state.attachedFileContent = extractedText.trim();
                            window.MathApp.state.attachedFileName = file.name;
                            window.MathApp.state.selectedImageBase64 = null;
                            window.MathApp.state.selectedImageMimeType = null;
                            
                            window.MathApp.dom.imageAttachedIndicator.style.display = 'flex';
                            window.MathApp.dom.imageAttachedIndicator.innerHTML = `
                                <span>PDF: ${file.name} (${processedPages} صفحة)</span>
                                <span style="margin-right: 5px;">📑</span>
                            `;
                            event.target.value = '';
                            
                            const charCount = extractedText.length;
                            const wordCount = extractedText.split(/\s+/).length;
                            window.MathApp.ui.showToast(`✅ تم استخراج النص بنجاح!\n\n📄 الصفحات: ${processedPages}/${totalPages}\n🔤 الأحرف: ${charCount.toLocaleString()}\n📤 الكلمات: ${wordCount.toLocaleString()}\n\nيمكنك الآن طرح سؤالك عن محتوى الملف.`);
                            window.MathApp.ui.closeBottomNav();
                            if (window.MathApp.updateInputButtons) window.MathApp.updateInputButtons();
                            
                        } catch (error) {
                            console.error('PDF Processing Error:', error);
                            
                            let errorMsg = 'فشل في معالجة ملف PDF.';
                            
                            if (error.message.includes('Password')) {
                                errorMsg = '❌ هذا الملف محمي بكلمة مرور. الرجاء إلغاء الحماية وإعادة المحاولة.';
                            } else if (error.message.includes('صور ممسوحة')) {
                                errorMsg = '⚠️ هذا الملف يحتوي على صور ممسوحة ضوئياً ولا يحتوي على نص قابل للقراءة.\n\nالحل: التقط صورة للصفحة وأرفقها كصورة بدلاً من PDF.';
                            } else if (error.message.includes('Invalid PDF')) {
                                errorMsg = '❌ الملف تالف أو ليس ملف PDF صالح.';
                            } else {
                                errorMsg += '\n\nالتفاصيل: ' + error.message;
                            }
                            
                            window.MathApp.ui.showToast(errorMsg);
                            event.target.value = '';
                            window.MathApp.ui.closeBottomNav();
                        }
                    
                    // رفض الملفات غير المدعومة
                    } else {
                        window.MathApp.ui.showToast(`عذراً، نوع الملف "${file.name}" (${mimeType}) غير مدعوم حالياً.\n\n✅ الملفات المدعومة:\n• صور: JPG, PNG, WEBP\n• نصوص: TXT, PDF\n\n💡 نصيحة: يمكنك تحويل ملفات Word/Excel إلى PDF أولاً.`);
                        event.target.value = '';
                        window.MathApp.ui.closeBottomNav();
                    }
                },
                
                clearAttachment() {
                    window.MathApp.state.selectedImageBase64 = null;
                    window.MathApp.state.selectedImageMimeType = null;
                    window.MathApp.state.attachedFileContent = null;
                    window.MathApp.state.attachedFileName = null;
                    window.MathApp.dom.imageAttachedIndicator.style.display = 'none';
                    
                    if(window.MathApp.dom.imageFileInput) window.MathApp.dom.imageFileInput.value = ''; 
                    if(window.MathApp.dom.fileInputForEquation) window.MathApp.dom.fileInputForEquation.value = '';
                    if (window.MathApp.updateInputButtons) window.MathApp.updateInputButtons();
                }
     }

    // ==================== EDITOR MODULE ====================
export const editor = {
        saveCursor() {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0 && window.MathApp.dom.editor.contains(selection.anchorNode)) {
                        window.MathApp.state.currentCursorPosition = selection.getRangeAt(0).cloneRange();
                    }
                },

                restoreCursor(position) {
                    const range = position || window.MathApp.state.currentCursorPosition;
                    if (range) {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    window.MathApp.dom.editor.focus();
                },

                setCursorAfter(node) {
                    const range = document.createRange();
                    range.setStartAfter(node);
                    range.collapse(true);
                    window.MathApp.state.currentCursorPosition = range.cloneRange();
                    this.restoreCursor();
                },

                setCursorToEnd() {
                    const range = document.createRange();
                    range.selectNodeContents(window.MathApp.dom.editor);
                    range.collapse(false);
                    window.MathApp.state.currentCursorPosition = range;
                    this.restoreCursor();
                },

                clear(showConfirm = true) {
                    const doClear = () => {
                        window.MathApp.dom.editor.innerHTML = '';
                        window.MathApp.photo.clearAttachment(false);
                        this.setCursorToEnd();
                    };
                    doClear();
                },

                getContent() {
                    return window.MathApp.dom.editor.innerHTML.trim();
                },

                convertToText(htmlContent) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    const mathElements = tempDiv.querySelectorAll('.math-expression');
                    mathElements.forEach(span => {
                        const latex = (span.getAttribute('data-latex') || '').trim();
                        const textNode = document.createTextNode(` $${latex}$ `);
                        span.parentNode.replaceChild(textNode, span);
                    });
                    return tempDiv.textContent.replace(/\s+/g, ' ').trim();
                },

               // في ملف ui.js داخل الكائن editor = { ... }

// دالة النسخ الذكي (تم تحسينها لتعمل مع التحديد الجزئي)
handleCopy(e) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    // استنساخ المحتوى المحدد فقط
    const container = document.createElement('div');
    const range = selection.getRangeAt(0);
    container.appendChild(range.cloneContents());

    // البحث عن المعادلات داخل النص المنسوخ وتحويلها إلى كود
    // نبحث عن العناصر التي لها كلاس math-expression
    const mathElements = container.querySelectorAll('.math-expression');
    
    // إذا لم تكن هناك معادلات، اترك النسخ الطبيعي يعمل
    if (mathElements.length === 0 && !range.startContainer.parentElement.closest('.math-expression')) {
        return; 
    }

    e.preventDefault(); // إيقاف النسخ العادي

    // تحويل كل معادلة إلى صيغة $latex$
    mathElements.forEach(span => {
        const latex = span.getAttribute('data-latex');
        if (latex) {
            span.replaceWith(`$${latex}$`); // استبدال الشكل البصري بالكود
        }
    });

    // وضع النص المعالج في الحافظة
    const finalBuffer = container.textContent;
    e.clipboardData.setData('text/plain', finalBuffer);
},

// دالة اللصق الذكي (تأكد أنها بهذا الشكل)
handlePaste(e) {
    e.preventDefault();
    
    // جلب النص من الحافظة
    let text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!text) return;

    // تنظيف النص وتحويل صيغ $...$ إلى عناصر HTML قابلة للتعديل
    // يدعم $$...$$ و \(...\) و $...$
    const toMathSpan = (latex) => {
        try {
            // نستخدم katex لرسم المعادلة
            const renderedMath = katex.renderToString(latex, { throwOnError: false });
            // نعيد العنصر مع البيانات اللازمة ليعمل في نظامك
            return `<span class="math-expression" contenteditable="false" data-latex="${latex}" onclick="MathApp.math.editExisting(this)">${renderedMath}</span>`;
        } catch (err) {
            return `$${latex}$`;
        }
    };

    const processedHtml = text
        .replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => toMathSpan(latex))
        .replace(/\\\(([\s\S]+?)\\\)/g, (match, latex) => toMathSpan(latex))
        .replace(/\$([^$]+)\$/g, (match, latex) => toMathSpan(latex));

    // إدراج النتيجة في مكان المؤشر
    document.execCommand('insertHTML', false, processedHtml);
    
    // تحديث المؤشر وحالة المحرر
    this.saveCursor();
    window.MathApp.dom.editor.dispatchEvent(new Event('input'));
},
               
// داخل كائن math
editExisting(element) {
    const editor = document.getElementById('editor');
    const isInEditor = editor.contains(element);

    if (isInEditor) {
        // === الحالة 1: داخل المحرر (تعديل) ===
        MathApp.state.editingElement = element;
        const latex = element.getAttribute('data-latex');
        MathApp.dom.mathField.value = latex;
        MathApp.dom.insertUpdateBtn.textContent = 'تعديل المعادلة';
        MathApp.dom.mathModal.style.display = 'block';
        setTimeout(() => MathApp.dom.mathField.focus(), 100);
        
    } else {
        // === الحالة 2: داخل الشات (نسخ إلى المحرر) ===
        const latex = element.getAttribute('data-latex');
        
        // إنشاء العنصر الجديد
        const newSpan = document.createElement('span');
        newSpan.className = 'math-expression';
        newSpan.contentEditable = false;
        newSpan.setAttribute('data-latex', latex);
        newSpan.onclick = function() { MathApp.math.editExisting(this); }; // ربط الحدث
        
        try {
            katex.render(latex, newSpan, { throwOnError: false });
        } catch (e) {
            newSpan.textContent = latex;
        }

        // إدراج في نهاية المحرر (مع التأكد من عدم التكرار)
        editor.appendChild(document.createTextNode(' ')); // مسافة قبلها
        editor.appendChild(newSpan);
        editor.appendChild(document.createTextNode(' ')); // مسافة بعدها
        
        // تحريك المؤشر للنهاية وتحديث التمرير
        MathApp.editor.setCursorToEnd();
        editor.scrollTop = editor.scrollHeight;
        
        // تحديث زر الإرسال
        editor.dispatchEvent(new Event('input'));
        
        MathApp.ui.showToast('تم نسخ المعادلة 👇');
    }
},
    }
     // ==================== EXPORT MODULE (FIXED & IMPLEMENTED) ====================
export const exportModule = {
                applyExportContrastStyles(container) {
                    if (!container) return;
                    container.classList.add('export-contrast');
                    const style = document.createElement('style');
                    style.textContent = `
                        .export-contrast {
                            background: #ffffff !important;
                            color: #111827 !important;
                        }
                        .export-contrast .message-bubble {
                            backdrop-filter: none !important;
                            box-shadow: none !important;
                        }
                        .export-contrast .incoming {
                            background: #667eea !important;
                            color: #ffffff !important;
                            border: 1px solid #5a67d8 !important;
                        }
                        .export-contrast .outgoing {
                            background: #ffffff !important;
                            color: #111827 !important;
                            border: 1px solid #e5e7eb !important;
                        }
                        .export-contrast .message-bubble h3 {
                            color: #111827 !important;
                            border-bottom-color: #cbd5e1 !important;
                        }
                        .export-contrast .message-bubble pre {
                            background: #f3f4f6 !important;
                            color: #111827 !important;
                        }
                        .export-contrast .message-bubble table {
                            background: #ffffff !important;
                        }
                        .export-contrast .message-actions {
                            display: none !important;
                        }
                    `;
                    container.appendChild(style);
                },
                async getChatElementClone() {
                    const original = window.MathApp.dom.chatMessages;
                    const clone = original.cloneNode(true);
                    
                    clone.querySelectorAll('.typing-indicator').forEach(el => el.remove());
                    
                    clone.querySelectorAll('.math-expression').forEach(span => {
                        const latex = span.getAttribute('data-latex');
                        try {
                            katex.render(latex, span, { throwOnError: false, displayMode: false });
                        } catch (e) {
                            span.textContent = `[خطأ في المعادلة: ${latex}]`;
                        }
                    });
                    
                    return clone;
                },
                
                        
    // ==========================================================
    async toPdf() {
        window.MathApp.ui.showToast('جاري إنشاء ملف PDF...');
        try {
            // -- الخطوات المشتركة: توليد الـ PDF في الذاكرة --
            const { jsPDF } = window.jspdf;
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `position: fixed; left: -9999px; top: 0; width: 800px; padding: 20px; background: #ffffff; direction: rtl;`;
            document.body.appendChild(tempContainer);
            const clone = await this.getChatElementClone();
            this.applyExportContrastStyles(tempContainer);
            tempContainer.appendChild(clone);
            const canvas = await html2canvas(tempContainer, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
            document.body.removeChild(tempContainer);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(canvas);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = pdfHeight;
            let position = 0;
            pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
            while (heightLeft > 0) {
                position -= pdf.internal.pageSize.getHeight();
                pdf.addPage();
                pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `محادثة_الرياضيات_${timestamp}.pdf`;

            // --- اكتشاف البيئة واختيار طريقة الحفظ ---
            if (window.MathApp.isCapacitor()) {
                // --- منطق Capacitor (تطبيق الموبايل) ---
                const pdfData = btoa(pdf.output('arraybuffer'));
                const { Filesystem, Directory } = Capacitor.Plugins;
                await Filesystem.writeFile({
                    path: fileName,
                    data: pdfData,
                    directory: Directory.Documents,
                });
                window.MathApp.ui.showToast(`✅ تم حفظ الملف في مجلد المستندات.`);
            } else {
                // --- منطق الويب (المتصفح العادي) ---
                pdf.save(fileName);
                window.MathApp.ui.showToast('✅ تم بدء تنزيل ملف PDF!');
            }

        } catch (error) {
            console.error('Export PDF Error (Universal):', error);
            window.MathApp.ui.showToast(`❌ فشل تصدير PDF: ${error.message}`, 'error');
        }
    },

    // ==========================================================
    // ===== دالة تصدير Word (نسخة عالمية للويب و Capacitor) =====
    // ==========================================================

async toWord() {
    window.MathApp.ui.showToast('جاري إنشاء ملف Word...');
    try {
        // --- الخطوات المشتركة: توليد محتوى HTML ---
        
        // 1. نحصل على نسخة نظيفة من المحادثة
        const clone = await this.getChatElementClone();
        
        // 2. نزيل أي عناصر لا نريدها في الملف المصدر (مثل أزرار التحكم)
        clone.querySelectorAll('.message-actions').forEach(el => el.remove());

        // 3. نجهز رأس وتذييل ملف HTML الذي سيفهمه Word
        // هذا هو الجزء الذي كان ناقصاً في الكود السابق
        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>تصدير محادثة</title>
                <style>
                    /* تنسيقات أساسية لبرنامج وورد لجعل المحادثة مقروءة */
                    body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
                    .message-bubble { 
                        border: 1px solid #dddddd; 
                        padding: 10px; 
                        margin-bottom: 10px; 
                        border-radius: 5px; 
                        max-width: 80%; 
                        word-wrap: break-word; /* لضمان عدم خروج النص الطويل عن الفقاعة */
                    }
                    .incoming { 
                        background-color: #e1f5fe; /* لون أزرق فاتح لرسائل المستخدم */
                        margin-right: auto; 
                        clear: both;
                        float: left;
                    }
                    .outgoing { 
                        background-color: #f1f8e9; /* لون أخضر فاتح لرسائل المساعد */
                        margin-left: auto;
                        clear: both;
                        float: right;
                    }
                    h1, p { text-align: right; } /* محاذاة العناوين لليمين */
                </style>
            </head>
            <body>
                <h1>محادثة مع المستشار الرياضي</h1>
                <p>تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}</p>
                <hr>
        `;

        const footer = '</body></html>';

        // 4. ندمج كل الأجزاء للحصول على المحتوى النهائي
        const sourceHTML = header + clone.innerHTML + footer;
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `محادثة_الرياضيات_${timestamp}.doc`;

        // --- اكتشاف البيئة واختيار طريقة الحفظ ---
        if (window.MathApp.isCapacitor()) {
            // --- منطق Capacitor (تطبيق الموبايل) ---
            const base64Data = btoa(unescape(encodeURIComponent(sourceHTML)));
            const { Filesystem, Directory } = Capacitor.Plugins;
            await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
            });
            window.MathApp.ui.showToast(`✅ تم حفظ الملف في مجلد المستندات.`);
        } else {
            // --- منطق الويب (المتصفح العادي) ---
            if (typeof saveAs === 'undefined') {
                window.MathApp.ui.showToast('مكتبة الحفظ (FileSaver) غير متوفرة.', 'error');
                return;
            }
            const blob = new Blob([sourceHTML], { type: 'application/msword;charset=utf-8' });
            saveAs(blob, fileName);
            window.MathApp.ui.showToast('✅ تم بدء تنزيل ملف Word!');
        }
    } catch (error) {
        console.error('Export Word Error (Universal):', error);
        window.MathApp.ui.showToast(`❌ فشل تصدير Word: ${error.message}`, 'error');
    }
},
        async toPowerPoint() {
    if (!window.MathApp.state.chatHistory || window.MathApp.state.chatHistory.length === 0) {
        window.MathApp.ui.showToast('لا توجد محادثة لتصديرها.', 'error');
        return;
    }

    window.MathApp.ui.showToast('جاري إنشاء ملف PowerPoint احترافي...', false);

    const chatData = window.MathApp.state.chatHistory;
    const EXPORT_API_URL = 'YOUR_SERVERLESS_PPTX_GENERATOR_ENDPOINT'; 
    
    try {
        const response = await fetch(EXPORT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                history: chatData,
                title: 'المستشار الرياضي - ' + new Date().toISOString().slice(0, 10)
                // يمكن إضافة إعدادات مثل theme: 'dark-mode'
            })
        });

        if (!response.ok) {
            throw new Error('فشل الخادم في توليد الملف.');
        }

        const blob = await response.blob();
        
        // استخدام مكتبة FileSaver.js لتنزيل الملف
        saveAs(blob, `عرض_رياضي_احترافي_${new Date().toISOString().slice(0, 10)}.pptx`);
        
        window.MathApp.ui.showToast('✅ تم بدء تنزيل ملف PowerPoint!', false);

    } catch (error) {
        console.error('Export PPTX Error:', error);
        window.MathApp.ui.showToast(`❌ فشل التصدير: ${error.message}`, 'error');
    }
},
    
    // ===== دالة المشاركة كصورة (نسخة عالمية للويب و Capacitor) =====
    
    // داخل exportModule في ui.js

    async shareMessageAsImage(buttonElement) {
        window.MathApp.ui.showToast('جاري تصميم بطاقة الحل... 🎨');
    
    const messageBubble = buttonElement.closest('.message-bubble');
    if (!messageBubble) return;

    // 1. إنشاء حاوية مؤقتة للتصوير
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: fixed; left: -9999px; top: 0; width: 600px;
        background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
        padding: 30px; font-family: 'Cairo', sans-serif; direction: rtl;
        border-radius: 20px;
    `;

    // 2. إضافة ترويسة (اسم التطبيق)
    const header = document.createElement('div');
    header.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:2px solid var(--primary-color); padding-bottom:10px;">
            <h2 style="margin:0; color:var(--primary-color);">المستشار الرياضي 🎓</h2>
            <span style="font-size:12px; color:#666;">Math Assistant AI</span>
        </div>
    `;
    tempContainer.appendChild(header);

    // 3. استنساخ المحتوى (بدون الأزرار)
    const contentClone = messageBubble.cloneNode(true);
    contentClone.style.boxShadow = 'none';
    contentClone.style.background = 'transparent';
    contentClone.style.border = 'none';
    contentClone.style.padding = '0';
    contentClone.querySelectorAll('.message-actions').forEach(el => el.remove()); // إزالة الأزرار
    tempContainer.appendChild(contentClone);

    // 4. إضافة تذييل (الرابط والدعوة)
    const footer = document.createElement('div');
    footer.innerHTML = `
        <div style="margin-top:20px; padding-top:10px; border-top:1px dashed #ccc; text-align:center; color:#555; font-size:13px;">
            <p style="margin:5px 0;">🚀 تم الحل باستخدام الذكاء الاصطناعي</p>
            <p style="margin:0; font-weight:bold; color:var(--primary-color);">www.mathassistant.com</p>
        </div>
    `;
        tempContainer.appendChild(footer);

        document.body.appendChild(tempContainer);
        this.applyExportContrastStyles(tempContainer);

        try {
            // تحويل الحاوية المصممة إلى صورة
            const canvas = await html2canvas(tempContainer, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        
        // ... (باقي كود المشاركة كما هو: Capacitor أو Web Share API) ...
        // (انسخ باقي المنطق من الكود القديم هنا)
        
        if (window.MathApp.isCapacitor()) {
             const base64Data = canvas.toDataURL('image/png');
             const { Share } = Capacitor.Plugins;
             await Share.share({ url: base64Data });
        } else {
             canvas.toBlob(async (blob) => {
                const file = new File([blob], "math-solution.png", { type: "image/png" });
                if (navigator.share) {
                    await navigator.share({ files: [file], title: 'حل المسألة' });
                } else {
                    saveAs(blob, 'math-solution.png');
                }
             });
        }

    } catch (error) {
        console.error(error);
        window.MathApp.ui.showToast('فشل إنشاء الصورة', 'error');
    } finally {
        document.body.removeChild(tempContainer);
    }
}
    }
    // ==========================================================

  // ==================== ui ====================
// ==================== UI MODULE (UPDATED) ====================
export const ui = {
    // --- دالة مركزية لإغلاق كل القوائم والنوافذ المنبثقة ---
    closeAllOverlays() {
        // 1. إغلاق القائمة الجانبية (Sidebar)
        if (window.MathApp.dom.sidebarNav) {
            window.MathApp.dom.sidebarNav.classList.remove('open');
        }

        // 2. إغلاق القائمة السفلية (Bottom Nav)
        if (window.MathApp.dom.bottomNavMenu) {
            window.MathApp.dom.bottomNavMenu.classList.remove('open');
            if (window.MathApp.dom.plusBtn) {
                window.MathApp.dom.plusBtn.textContent = '+';
            }
        }

        // 3. إغلاق جميع القوائم المنسدلة (Dropdowns)
        document.querySelectorAll('.dropdown-content').forEach(el => {
            el.classList.remove('show');
            this.resetDropdownPosition(el);
        });

        // 4. إغلاق قائمة التواصل (Contact Menu) داخل السايدبار
        this.hideContactMenu();
    },

    // --- الوظائف الأساسية ---

    rateMessage(buttonElement, rating) {
        const actionsContainer = buttonElement.parentElement;
        actionsContainer.querySelectorAll('.action-icon-btn').forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        });
        buttonElement.style.background = 'var(--primary-color)';
        buttonElement.style.color = 'white';
        window.MathApp.ui.showToast('شكراً لتقييمك!', false);
    },

    showToast(message, type = '') {
        const toast = document.getElementById('toast-message');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast-message ${type === 'error' ? 'error' : ''}`;
        toast.classList.add('show');
        clearTimeout(window.MathApp.toastTimeout);
        window.MathApp.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
    },

    createMessage(content, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-bubble');
        messageElement.classList.add(type === 'ai' ? 'outgoing' : 'incoming');
        const formattedContent = content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        messageElement.innerHTML = `<p>${formattedContent}</p>`;
        window.MathApp.dom.chatMessages.appendChild(messageElement);
        window.MathApp.ui.renderMathInElement(messageElement);
        window.MathApp.dom.chatMessages.scrollTop = window.MathApp.dom.chatMessages.scrollHeight;
    },

    showConfirm(message, callback) {
        const confirmDiv = document.createElement('div');
        confirmDiv.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 99999; display: flex;
            justify-content: center; align-items: center; backdrop-filter: blur(3px);
        `;
        const dialogContent = document.createElement('div');
        dialogContent.className = 'modal-content';
        dialogContent.style.cssText = `
            max-width: 350px; padding: 20px; text-align: center;
            transform: translate(-50%, -50%); top: 50%; left: 50%;
        `;
        dialogContent.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--primary-color);">تأكيد الإجراء</h3>
            <p style="margin-bottom: 20px; color: var(--text-color); font-weight: 600;">${message}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="cancelConfirm" class="btn btn-secondary">إلغاء</button>
                <button id="okConfirm" class="btn" style="background: var(--delete-bg); color: white;">تأكيد</button>
            </div>
        `;
        confirmDiv.appendChild(dialogContent);
        document.body.appendChild(confirmDiv);
        document.getElementById('cancelConfirm').onclick = () => confirmDiv.remove();
        document.getElementById('okConfirm').onclick = () => { callback(); confirmDiv.remove(); };
    },

    openSettings() {
        this.closeAllOverlays();
        const modal = document.getElementById('settingsModal');
        if (!modal) return;
        this.populateSettingsForm();
        if (window.MathApp && window.MathApp.auth && typeof window.MathApp.auth.renderStatus === 'function') {
            window.MathApp.auth.renderStatus();
        }
        modal.style.display = 'block';
    },

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';
    },

    populateSettingsForm() {
        const nameInput = document.getElementById('settingsDisplayName');
        const stageSelect = document.getElementById('settingsStage');
        const explanationSelect = document.getElementById('settingsExplanationMode');
        const languageSelect = document.getElementById('settingsLanguage');
        const countryInput = document.getElementById('settingsCountry');
        const bioInput = document.getElementById('settingsBio');

        const user = window.MathApp && window.MathApp.auth ? window.MathApp.auth.currentUser : null;
        const storedName = (() => {
            try { return localStorage.getItem('user_display_name'); } catch (e) { return null; }
        })();
        if (nameInput) {
            nameInput.value = user?.displayName || storedName || '';
        }

        const savedStage = (() => {
            try { return localStorage.getItem('ai_stage'); } catch (e) { return null; }
        })() || (window.MathApp && window.MathApp.state && window.MathApp.state.currentStage) || 'secondary';
        if (stageSelect) stageSelect.value = savedStage;

        const mode = (() => {
            try { return localStorage.getItem('ai_explain_mode'); } catch (e) { return null; }
        })() || (window.MathApp && window.MathApp.config && window.MathApp.config.explanationMode) || 'detailed';
        if (explanationSelect) explanationSelect.value = mode;

        const lang = (() => {
            try { return localStorage.getItem('app_language'); } catch (e) { return null; }
        })() || 'ar';
        if (languageSelect) languageSelect.value = lang;

        const country = (() => {
            try { return localStorage.getItem('user_country'); } catch (e) { return null; }
        })() || '';
        if (countryInput) countryInput.value = country;

        const bio = (() => {
            try { return localStorage.getItem('user_bio'); } catch (e) { return null; }
        })() || '';
        if (bioInput) bioInput.value = bio;
    },

    saveSettings() {
        const nameInput = document.getElementById('settingsDisplayName');
        const stageSelect = document.getElementById('settingsStage');
        const explanationSelect = document.getElementById('settingsExplanationMode');
        const languageSelect = document.getElementById('settingsLanguage');
        const countryInput = document.getElementById('settingsCountry');
        const bioInput = document.getElementById('settingsBio');

        const displayName = nameInput ? nameInput.value.trim() : '';
        try {
            if (displayName) localStorage.setItem('user_display_name', displayName);
            else localStorage.removeItem('user_display_name');
        } catch (e) { /* ignore */ }

        if (displayName && window.MathApp && window.MathApp.auth && window.MathApp.auth.currentUser) {
            const user = window.MathApp.auth.currentUser;
            if (typeof user.updateProfile === 'function') {
                user.updateProfile({ displayName }).catch(() => {});
            }
        }

        if (stageSelect && window.MathApp && window.MathApp.stage && typeof window.MathApp.stage.select === 'function') {
            const stageValue = stageSelect.value || 'secondary';
            const stageLabels = {
                elementary: 'ابتدائي',
                preparatory: 'إعدادي',
                secondary: 'ثانوي',
                higher_ed: 'جامعي/عالي',
                general: 'عام'
            };
            const label = stageLabels[stageValue] || stageValue;
            window.MathApp.stage.select(stageValue, label);
        }

        if (explanationSelect && window.MathApp && typeof window.MathApp.setExplanationMode === 'function') {
            const mode = explanationSelect.value === 'quick' ? 'quick' : 'detailed';
            const label = mode === 'quick' ? 'سريع' : 'تفصيلي';
            window.MathApp.setExplanationMode(mode, label);
        }

        if (languageSelect) {
            const lang = languageSelect.value || 'ar';
            try { localStorage.setItem('app_language', lang); } catch (e) { /* ignore */ }
            try { document.documentElement.lang = lang; } catch (e) { /* ignore */ }
        }

        const country = countryInput ? countryInput.value.trim() : '';
        try {
            if (country) localStorage.setItem('user_country', country);
            else localStorage.removeItem('user_country');
        } catch (e) { /* ignore */ }

        const bio = bioInput ? bioInput.value.trim() : '';
        try {
            if (bio) localStorage.setItem('user_bio', bio);
            else localStorage.removeItem('user_bio');
        } catch (e) { /* ignore */ }

        if (window.MathApp && window.MathApp.auth && typeof window.MathApp.auth.renderStatus === 'function') {
            window.MathApp.auth.renderStatus();
        }
        this.showToast('✅ تم حفظ الإعدادات');
        this.closeSettings();
    },

    resetDropdownPosition(dropdown) {
        if (!dropdown) return;
        if (dropdown.dataset.portalized === 'true' && dropdown._portalParent) {
            const parent = dropdown._portalParent;
            const next = dropdown._portalNextSibling;
            if (next && next.parentNode === parent) {
                parent.insertBefore(dropdown, next);
            } else {
                parent.appendChild(dropdown);
            }
            dropdown.dataset.portalized = '';
            dropdown._portalParent = null;
            dropdown._portalNextSibling = null;
            dropdown._portalTrigger = null;
        }
        dropdown.style.position = '';
        dropdown.style.left = '';
        dropdown.style.right = '';
        dropdown.style.top = '';
        dropdown.style.bottom = '';
        dropdown.style.marginTop = '';
        dropdown.style.marginBottom = '';
        dropdown.style.zIndex = '';
        dropdown.style.transform = '';
        dropdown.style.maxWidth = '';
    },

    positionDropdownInViewport(dropdown, trigger) {
        if (!dropdown || !trigger) return;
        if (dropdown.dataset.portalized !== 'true') {
            dropdown._portalParent = dropdown.parentElement;
            dropdown._portalNextSibling = dropdown.nextSibling;
            dropdown._portalTrigger = trigger;
            dropdown.dataset.portalized = 'true';
            document.body.appendChild(dropdown);
        }

        dropdown.style.position = 'absolute';
        dropdown.style.right = 'auto';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '0';
        dropdown.style.marginBottom = '0';
        dropdown.style.zIndex = '900';
        dropdown.style.maxWidth = `min(260px, calc(100vw - 16px))`;

        const triggerRect = trigger.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        const spacing = 8;

        let top = triggerRect.top - dropdownRect.height - spacing;
        if (top < spacing) {
            top = triggerRect.bottom + spacing;
        }

        let left = triggerRect.right - dropdownRect.width;
        const minLeft = spacing;
        const maxLeft = window.innerWidth - dropdownRect.width - spacing;
        left = Math.min(Math.max(left, minLeft), maxLeft);

        dropdown.style.top = `${Math.round(top + window.scrollY)}px`;
        dropdown.style.left = `${Math.round(left + window.scrollX)}px`;
    },

    // --- تم التعديل: التعامل مع القوائم المنسدلة ---
    toggleDropdown(id) {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const isCurrentlyOpen = dropdown.classList.contains('show');
        const isInSidebar = !!dropdown.closest('.sidebar-nav');

        if (isInSidebar) {
            // أغلق القوائم الأخرى بدون إغلاق السايدبار
            document.querySelectorAll('.dropdown-content').forEach(el => {
                if (el !== dropdown) {
                    el.classList.remove('show');
                    this.resetDropdownPosition(el);
                }
            });
            // أغلق القائمة السفلية وقائمة التواصل إن وُجدت
            if (window.MathApp.dom.bottomNavMenu) {
                window.MathApp.dom.bottomNavMenu.classList.remove('open');
                if (window.MathApp.dom.plusBtn) {
                    window.MathApp.dom.plusBtn.textContent = '+';
                }
            }
            this.hideContactMenu();
        } else {
            // أغلق كل شيء أولاً
            this.closeAllOverlays();
        }

        // إذا كانت مفتوحة، أغلقها
        if (isCurrentlyOpen) {
            dropdown.classList.remove('show');
            this.resetDropdownPosition(dropdown);
            return;
        }

        // إذا لم تكن مفتوحة سابقاً، افتحها الآن
        dropdown.classList.add('show');
        const isChatToolbar = dropdown.closest('.chat-options-bar');
        if (isChatToolbar) {
            const trigger = dropdown.previousElementSibling || dropdown.parentElement?.querySelector('button');
            this.positionDropdownInViewport(dropdown, trigger);
        } else {
            this.resetDropdownPosition(dropdown);
        }
    },

    // --- تم التعديل: التعامل مع القائمة السفلية ---
    toggleBottomNav() {
        const nav = window.MathApp.dom.bottomNavMenu;
        const isCurrentlyOpen = nav.classList.contains('open');

        // أغلق كل شيء أولاً
        this.closeAllOverlays();

        // إذا لم تكن مفتوحة سابقاً، افتحها الآن
        if (!isCurrentlyOpen) {
            nav.classList.add('open');
            window.MathApp.dom.plusBtn.textContent = '✖️';
        }
    },

    closeBottomNav() {
        window.MathApp.dom.bottomNavMenu.classList.remove('open');
        window.MathApp.dom.plusBtn.textContent = '+';
    },

    // --- تم التعديل: التعامل مع القائمة الجانبية (Sidebar) ---
    openSidebar() {
        // أغلق كل شيء أولاً
        this.closeAllOverlays();
        
        // ثم افتح السايدبار
        window.MathApp.dom.sidebarNav.classList.add('open');
        
        // إعادة تعيين حالة زر التواصل داخل السايدبار
        this.hideContactMenu();
    },

    closeSidebar() {
        window.MathApp.dom.sidebarNav.classList.remove('open');
    },

    showContactMenu() {
        if (window.MathApp.dom.showContactBtn) window.MathApp.dom.showContactBtn.style.display = 'none';
        if (window.MathApp.dom.contactMenu) window.MathApp.dom.contactMenu.style.display = 'block';
    },

    hideContactMenu() {
        if (window.MathApp.dom.contactMenu) window.MathApp.dom.contactMenu.style.display = 'none';
        if (window.MathApp.dom.showContactBtn) window.MathApp.dom.showContactBtn.style.display = 'block';
    }
};
