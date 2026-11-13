// ==================== MATH MODULE ====================
export const math = {
    openModal() {
        MathApp.state.editingElement = null;
        MathApp.dom.mathField.value = '';
        MathApp.dom.insertUpdateBtn.textContent = 'إدراج المعادلة';
        MathApp.dom.mathModal.style.display = 'block';
        MathApp.dom.mathField.focus();
    },

    closeModal() {
        MathApp.dom.mathModal.style.display = 'none';
        MathApp.state.editingElement = null;
        MathApp.editor.restoreCursor();
                },
                
                // داخل كائن math في app.js
editExisting(element) {
    // التحقق: هل العنصر داخل حقل الكتابة (Editor)؟
    const isInEditor = document.getElementById('editor').contains(element);

    if (isInEditor) {
        // === الحالة 1: داخل المحرر (مسموح التعديل) ===
        MathApp.state.editingElement = element;
        const latex = element.getAttribute('data-latex');
        MathApp.dom.mathField.value = latex;
        MathApp.dom.insertUpdateBtn.textContent = 'تعديل المعادلة';
        MathApp.dom.mathModal.style.display = 'block';
        
        // التركيز على حقل الإدخال داخل المودال
        setTimeout(() => MathApp.dom.mathField.focus(), 100);
        
   // في ملف ui.js داخل editor.editExisting -> الحالة 2
} else {
    // === الحالة 2: داخل الشات (نسخ إلى المحرر) ===
    const latex = element.getAttribute('data-latex');
    
    // إنشاء العنصر الجديد
    const newSpan = document.createElement('span');
    newSpan.className = 'math-expression';
    newSpan.contentEditable = "false"; // مهم جداً
    newSpan.setAttribute('data-latex', latex);
    // إضافة خاصية تمنع فقدان التركيز عند الحذف
    newSpan.setAttribute('tabindex', '-1'); 
    
    newSpan.onclick = function(e) { 
        e.stopPropagation();
        MathApp.math.editExisting(this); 
    };
    
    try {
        katex.render(latex, newSpan, { throwOnError: false });
    } catch (e) {
        newSpan.textContent = latex;
    }

    // --- الحل السحري: استخدام مسافات وهمية وحاوية نصية ---
    const editor = document.getElementById('editor');
    
    // إنشاء فراغ "حقيقي" قبل وبعد لضمان حركة المؤشر
    const spaceBefore = document.createTextNode('\u200B'); // مسافة عرضها صفر
    const spaceAfter = document.createTextNode('\u200B');  // مسافة عرضها صفر
    const spaceVisible = document.createTextNode(' ');    // مسافة عادية

    // إدراج في نهاية المحرر
    editor.appendChild(spaceBefore);
    editor.appendChild(newSpan);
    editor.appendChild(spaceAfter);
    editor.appendChild(spaceVisible); // مسافة عادية ليسهل الكتابة بعدها
    
    // تحريك المؤشر للنهاية وتحديث التمرير
    MathApp.editor.setCursorToEnd();
    
    // إطلاق حدث التغيير لتحديث الأزرار (زر الإرسال)
    editor.dispatchEvent(new Event('input'));
    
    MathApp.ui.showToast('تمت إضافة المعادلة للمحرر 📥');
}
},

                insert() {
    const latex = MathApp.dom.mathField.value.trim();
    if (!latex) return;

    const mathSpan = document.createElement('span');
    mathSpan.className = 'math-expression';
    mathSpan.setAttribute('contenteditable', 'false'); // المعادلة نفسها غير قابلة للتعديل نصياً
    mathSpan.setAttribute('data-latex', latex);
    mathSpan.setAttribute('onclick', 'MathApp.math.editExisting(this)');
    
    try {
        katex.render(latex, mathSpan, { throwOnError: false });
    } catch (e) {
        mathSpan.textContent = latex;
    }

    // --- التعديل هنا: إضافة مسافات صفرية لإصابة المؤشر ---
    const zwsBefore = document.createTextNode('\u200B');
    const zwsAfter = document.createTextNode('\u200B');
    
    const range = MathApp.state.currentCursorPosition;
    
    if (range && MathApp.dom.editor.contains(range.startContainer)) {
        range.deleteContents();
        // ندرج: مسافة وهمية -> المعادلة -> مسافة وهمية
        range.insertNode(zwsAfter);
        range.insertNode(mathSpan);
        range.insertNode(zwsBefore);
        
        // وضع المؤشر بعد المسافة الوهمية الأخيرة
        MathApp.editor.setCursorAfter(zwsAfter);
    } else {
        MathApp.dom.editor.appendChild(zwsBefore);
        MathApp.dom.editor.appendChild(mathSpan);
        MathApp.dom.editor.appendChild(zwsAfter);
        MathApp.editor.setCursorToEnd();
    }

    MathApp.math.closeModal();
},
                update() {
                    if (!MathApp.state.editingElement) return;
                    
                    const element = MathApp.state.editingElement;
                    const latex = MathApp.dom.mathField.value.trim();
                    
                    if (!latex) {
                        element.remove();
                    } else {
                        element.setAttribute('data-latex', latex);
                        try {
                            katex.render(latex, element, {
                                throwOnError: false,
                                displayMode: false
                            });
                        } catch (e) {
                            element.textContent = `[خطأ KaTeX] ${latex}`;
                        }
                    }
                    
                    MathApp.math.closeModal();
                }
            };