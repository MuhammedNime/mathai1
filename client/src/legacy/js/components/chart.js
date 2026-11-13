// ==================== CHART MODULE ====================
// الكائن المسؤول عن إدارة ورسم المخططات البيانية باستخدام Chart.js
export const chart = {
    // دالة إنشاء وعرض الرسم البياني
    render(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with id ${canvasId} not found`);
            return;
        }

        const ctx = canvas.getContext('2d');

        // تدمير الرسم البياني القديم إذا كان موجوداً
        if (MathApp.state.chartInstances[canvasId]) {
            MathApp.state.chartInstances[canvasId].destroy();
                }

                try {
                    // إنشاء رسم بياني جديد
                    // يتم تخزين مثيل الرسم البياني في MathApp.state.chartInstances
                    MathApp.state.chartInstances[canvasId] = new Chart(ctx, config);
                    console.log(`Chart.js: الرسم البياني ${canvasId} تم إنشاؤه بنجاح.`);
                } catch (error) {
                    console.error('Error creating chart:', error);
                    // عرض رسالة خطأ واضحة للمستخدم مكان الرسم
                    canvas.parentElement.innerHTML = `<div style="color: var(--delete-bg); padding: 20px; text-align: center; border: 1px dashed var(--delete-bg); border-radius: 8px; margin: 10px 0;">فشل في إنشاء الرسم البياني. يرجى مراجعة الإدخال.</div>`;
                }
            },

            // دالة تدمير رسم بياني محدد
            destroy(canvasId) {
                if (MathApp.state.chartInstances[canvasId]) {
                    MathApp.state.chartInstances[canvasId].destroy();
                    delete MathApp.state.chartInstances[canvasId];
                    console.log(`Chart.js: الرسم البياني ${canvasId} تم تدميره.`);
                }
            },

            // دالة تدمير جميع الرسوم البيانية
            destroyAll() {
                Object.keys(MathApp.state.chartInstances).forEach(canvasId => {
                    this.destroy(canvasId);
                });
                console.log('Chart.js: تم تدمير جميع الرسوم البيانية النشطة.');
            }
            };