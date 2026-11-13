// js/components/calculator.js

export const ScientificCalculator = {
    state: {
        expression: '', // المعادلة الحالية
        memory: 0,
        isResultDisplayed: false, // هل المعروض هو ناتج عملية سابقة؟
        lastResultExact: '',
        lastResultNumeric: null
    },
    dom: {},

    init() {
        this.dom.modal = document.getElementById('calculatorModal');
        this.dom.screen = document.getElementById('calcScreen');
        this.dom.history = document.getElementById('calcHistory');
        this.dom.buttonsArea = document.querySelector('.calculator-grid');

        // استخدام الـ Event Delegation للأداء الأفضل
        this.dom.buttonsArea.addEventListener('click', (e) => {
            const btn = e.target.closest('.calc-btn');
            if (!btn) return;
            const key = btn.dataset.key;
            this.handleInput(key);
        });

        document.getElementById('closeCalculatorBtn').addEventListener('click', () => this.close());
    },

    normalizeExpression(expr) {
        let out = String(expr || '');
        out = out.replace(/×/g, '*').replace(/÷/g, '/');
        out = out.replace(/π/g, 'pi');
        out = out.replace(/root\(/g, 'nthRoot(');
        out = out.replace(/ln\(/g, 'log(');
        out = out.replace(/log\(/g, 'log10(');
        out = out.replace(/%/g, '/100');
        const ansValue = this.state.lastResultExact || '0';
        out = out.replace(/Ans/g, `(${ansValue})`);
        return out;
    },

    formatApprox(value) {
        try {
            return window.math.format(value, { precision: 12, notation: 'auto' });
        } catch (e) {
            return String(value);
        }
    },

    getNumericValue(expr) {
        const normalized = this.normalizeExpression(expr ?? this.state.expression);
        return window.math.evaluate(normalized);
    },
    
    open() { this.dom.modal.style.display = 'block'; },
    close() { this.dom.modal.style.display = 'none'; },

    handleInput(key) {
        // إذا كان هناك ناتج معروض وضغط المستخدم رقماً، نبدأ معادلة جديدة
        if (this.state.isResultDisplayed) {
            // إذا ضغط عملية حسابية، نكمل على الناتج
            if (['+', '-', '*', '/', '^', '%'].includes(key)) {
                this.state.isResultDisplayed = false;
            } 
            // إذا ضغط رقماً أو دالة، نبدأ من جديد
            else if (!['=', 'approx', 'clear', 'backspace'].includes(key)) {
                this.state.expression = '';
                this.state.isResultDisplayed = false;
            }
        }

        switch (key) {
            case '=': this.calculate('exact'); break;
            case 'approx': this.calculate('approx'); break;
            case 'clear': this.clear(); break;
            case 'backspace': 
                this.state.expression = this.state.expression.toString().slice(0, -1); 
                break;
            
            // الذاكرة
            case 'm+': this.memoryOp('add'); break;
            case 'm-': this.memoryOp('sub'); break;
            case 'mr': this.state.expression += this.state.memory; break;
            case 'mc': this.state.memory = 0; window.MathApp.ui.showToast('تم مسح الذاكرة'); break;
            
            // الرسم
            case 'plot': this.plotToChat(); break;
            
            // الإشارة
            case 'toggle-sign': 
                if (this.state.expression.startsWith('-')) 
                    this.state.expression = this.state.expression.substring(1);
                else 
                    this.state.expression = '-' + this.state.expression;
                break;

            // الدوال التي تحتاج أقواس
            case 'sin': case 'cos': case 'tan':
            case 'asin': case 'acos': case 'atan':
            case 'sinh': case 'cosh': case 'tanh':
            case 'log': case 'ln': case 'exp':
            case 'sqrt':
                this.state.expression += key + '(';
                break;
            case 'root':
                this.state.expression += 'root(';
                break;
            case 'pi':
                this.state.expression += 'π';
                break;
            case 'e':
                this.state.expression += 'e';
                break;
            case 'ans':
                if (this.state.lastResultExact) {
                    this.state.expression += 'Ans';
                }
                break;
            case 'inv':
                this.state.expression += '1/(';
                break;
            
            default:
                this.state.expression += key;
        }
        this.updateScreen();
    },

    calculate(mode = 'exact') {
        if (!this.state.expression) return;
        try {
            const expr = this.normalizeExpression(this.state.expression);
            if (mode === 'approx') {
                const value = window.math.evaluate(expr);
                const formatted = this.formatApprox(value);
                this.dom.history.innerText = this.state.expression + ' ≈';
                this.state.expression = formatted;
                this.state.lastResultExact = formatted;
                this.state.lastResultNumeric = value;
            } else {
                const node = window.math.simplify(expr);
                const exact = window.math.format(node, { fraction: 'ratio' });
                this.dom.history.innerText = this.state.expression + ' =';
                this.state.expression = exact.toString();
                this.state.lastResultExact = exact.toString();
                this.state.lastResultNumeric = null;
            }
            this.state.isResultDisplayed = true;
        } catch (error) {
            this.dom.screen.innerText = 'Error';
            setTimeout(() => this.updateScreen(), 1500);
        }
    },

    memoryOp(op) {
        try {
            const val = this.getNumericValue(this.state.expression || '0');
            if (op === 'add') this.state.memory += val;
            else this.state.memory -= val;
            window.MathApp.ui.showToast(`Memory: ${this.state.memory}`);
            this.state.isResultDisplayed = true; // نعتبر العملية انتهت
        } catch(e) {}
    },

    plotToChat() {
        const rawExpr = this.state.expression;
        if (!rawExpr || !/\bx\b/i.test(rawExpr)) {
            window.MathApp.ui.showToast('للرسم، يجب أن تحتوي المعادلة على المتغير "x" (مثال: sin(x))', 'error');
            return;
        }
        
        // إغلاق الآلة وإرسال رسالة للشات
        this.close();
        const plotMsg = `ارسم الدالة: $${rawExpr}$`;
        
        // محاكاة إرسال المستخدم (ليتم معالجته بواسطة النظام ورسمه)
        // ملاحظة: هنا نستخدم ChatBot ليرسمها، أو نستدعي دالة الرسم مباشرة
        // سنستخدم Chart.js مباشرة لنتيجة أسرع
        
        const chartId = 'chart-' + Date.now();
        const html = `
            <h3>📈 رسم الدالة</h3>
            <p>الدالة: $f(x) = ${rawExpr}$</p>
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>
        `;
        
        window.MathApp.chat.displayMessage(html, 'outgoing');
        window.MathApp.state.chatHistory.push({ role: 'model', parts: [{ text: html }] });

        // توليد البيانات والرسم
        setTimeout(() => {
            try {
                const expr = this.normalizeExpression(rawExpr);
                const xValues = [];
                const yValues = [];
                const step = 0.2;
                let prevY = null;
                for (let x = -10; x <= 10; x += step) {
                    xValues.push(Number(x.toFixed(2)));
                    let y = null;
                    try {
                        y = window.math.evaluate(expr, { x });
                    } catch (e) {
                        y = null;
                    }
                    if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
                        yValues.push(null);
                        prevY = null;
                        continue;
                    }
                    if (prevY !== null && Math.abs(y - prevY) > 100) {
                        yValues.push(null);
                        prevY = null;
                        continue;
                    }
                    yValues.push(y);
                    prevY = y;
                }

                new Chart(document.getElementById(chartId), {
                    type: 'line',
                    data: {
                        labels: xValues,
                        datasets: [{
                            label: `f(x) = ${rawExpr}`,
                            data: yValues,
                            borderColor: '#667eea',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            tension: 0.4,
                            spanGaps: false
                        }]
                    },
                    options: { responsive: true, scales: { x: { display: true }, y: { display: true } } }
                });
            } catch (e) {
                window.MathApp.ui.showToast('خطأ في رسم الدالة', 'error');
            }
        }, 300);
    },

    clear() {
        this.state.expression = '';
        this.dom.history.innerText = '';
        this.updateScreen();
    },

    updateScreen() {
        this.dom.screen.innerText = this.state.expression || '0';
    }
};
