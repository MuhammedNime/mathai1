export const CalculusWorkspace = {
    dom: {},
    
    init() {
        this.dom.modal = document.getElementById('calculus-workspace-modal');
        this.dom.functionInput = document.getElementById('calc-function-input');
        this.dom.operationSelect = document.getElementById('calculus-operation-select');
        this.dom.paramsFieldset = document.getElementById('calculus-params-fieldset');
        this.dom.singleParamDiv = document.getElementById('calc-single-param');
        this.dom.definiteDiv = document.getElementById('calc-definite-integration');
        this.dom.paramLabel = document.getElementById('calc-param-label'); 
        this.dom.paramInput = document.getElementById('calc-param-input');
        this.dom.limitA = document.getElementById('calc-limit-a');
        this.dom.limitB = document.getElementById('calc-limit-b');
        this.dom.rangeLabelMain = document.getElementById('range-label-main'); 
        this.dom.solveBtn = document.getElementById('solve-calculus-btn');

        this.dom.operationSelect.addEventListener('change', () => this.handleOperationChange());
        this.dom.solveBtn.addEventListener('click', () => this.solve());
        
        this.handleOperationChange(); // استدعاء أولي لضبط الواجهة
    },

    open() {
        this.dom.modal.style.display = 'flex';
        this.dom.functionInput.focus();
    },

    close() {
        this.dom.modal.style.display = 'none';
    },
    
    handleOperationChange() {
        const operation = this.dom.operationSelect.value;
        const singleParamOps = ['evaluate_at_point', 'limit', 'taylor', 'nth_derivative'];
        const definiteOps = ['integrate_definite', 'arc_length', 'volume_revolution'];

        // إخفاء كل شيء أولاً
        this.dom.paramsFieldset.style.display = 'none';
        this.dom.singleParamDiv.style.display = 'none';
        this.dom.definiteDiv.style.display = 'none';

        if (singleParamOps.includes(operation)) {
            this.dom.paramsFieldset.style.display = 'block';
            this.dom.singleParamDiv.style.display = 'flex';
            if (operation === 'evaluate_at_point') {
                this.dom.paramLabel.textContent = 'النقطة (x):';
                this.dom.paramInput.value = '2';
            } else if (operation === 'limit') {
                this.dom.paramLabel.textContent = 'النهاية عند (x→):';
                this.dom.paramInput.value = '0';
            } else if (operation === 'taylor') {
                this.dom.paramLabel.textContent = 'حول النقطة (a):';
                this.dom.paramInput.value = '0';
            } else if (operation === 'nth_derivative') {
                this.dom.paramLabel.textContent = 'رتبة المشتقة (n):';
                this.dom.paramInput.value = '2';
            }
        } 
        
        if (definiteOps.includes(operation)) {
            this.dom.paramsFieldset.style.display = 'block';
            this.dom.definiteDiv.style.display = 'flex';
            this.dom.rangeLabelMain.textContent = operation === 'arc_length' || operation === 'volume_revolution' ? 'في الفترة:' : 'حدود التكامل:';
        }
    },
    
    solve() {
        const functionLatex = this.dom.functionInput.value.trim();
        const operation = this.dom.operationSelect.value;
        
        if (!functionLatex) {
            window.MathApp.ui.showToast('❌ يجب إدخال الدالة f(x) أولاً.', 'error');
            return;
        }
        
        let params = {};

        // تعبئة المعاملات بناءً على العملية
        if (this.dom.singleParamDiv.style.display !== 'none') {
            params.paramValue = this.dom.paramInput.value.trim();
        }
        if (this.dom.definiteDiv.style.display !== 'none') {
            params.a = this.dom.limitA.value.trim();
            params.b = this.dom.limitB.value.trim();
        }

        const problemData = {
            type: 'structured_problem',
            tool: 'calculus_solver',
            function_latex: functionLatex,
            operation: operation,
            params: params
        };
        
        window.MathApp.chat.send(problemData);
        this.close(); 
    },

    formatProblemToHTML(data) {
        const { function_latex, operation, params } = data;
        let title = document.querySelector(`#calculus-operation-select option[value="${operation}"]`).textContent;
        let required = `$$ f(x) = ${function_latex} $$`;

        // إضافة تفاصيل المعاملات
        if (params.paramValue) {
            required += `<p>عندما ${params.paramValue}</p>`;
        }
        if (params.a && params.b) {
            required += `<p>في الفترة [${params.a}, ${params.b}]</p>`;
        }
        
        return `<h3>${title}</h3><p>المطلوب هو حل المسألة التالية:</p>${required}`;
    }
};