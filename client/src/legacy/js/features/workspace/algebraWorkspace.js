// ==================== ALGEBRA WORKSPACE - COMPREHENSIVE EDITION ====================
export const AlgebraWorkspace = {
    dom: {},
    state: {
        categories: {}
    },

    init() {
        this.dom.modal = document.getElementById('algebra-workspace-modal');
        this.dom.categorySelect = document.getElementById('algebra-category-select');
        this.dom.methodSelect = document.getElementById('algebra-method-select');
        this.dom.expressionInput = document.getElementById('algebra-expression-input');
        this.dom.paramsFieldset = document.getElementById('algebra-params-fieldset');
        this.dom.paramLabel = document.getElementById('algebra-param-label');
        this.dom.paramInput = document.getElementById('algebra-param-input');
        this.dom.solveBtn = document.getElementById('solve-algebra-btn');

        // حدد فئات وطرق الجبر
        this.categories = {
            polynomials: {
                name: 'كثيرات الحدود',
                methods: {
                    evaluate: 'تقييم كثيرة الحدود',
                    roots: 'إيجاد الجذور',
                    factor: 'تحليل إلى عوامل',
                    expand: 'فك الأقواس',
                    gcd: 'القاسم المشترك الأكبر',
                    lcm: 'المضاعف المشترك الأصغر',
                    divide: 'قسمة كثيرات الحدود',
                    derivative: 'مشتقة كثيرة الحدود',
                    integral: 'تكامل كثيرة الحدود',
                    descartesRuleOfSigns: 'قاعدة ديكارت للإشارات',
                    rationalRootTheorem: 'مبرهنة الجذر النسبي',
                    syntheticDivision: 'القسمة التركيبية'
                }
            },
            equations: {
                name: 'المعادلات',
                methods: {
                    linear: 'معادلات خطية',
                    quadratic: 'معادلات تربيعية',
                    cubic: 'معادلات من الدرجة الثالثة',
                    quartic: 'معادلات من الدرجة الرابعة',
                    exponential: 'معادلات أسية',
                    logarithmic: 'معادلات لوغاريتمية',
                    radical: 'معادلات جذرية',
                    rational: 'معادلات نسبية',
                    absolute: 'معادلات القيمة المطلقة',
                    systems: 'أنظمة المعادلات',
                    diophantine: 'معادلات ديوفانتين',
                    parametric: 'معادلات بارامترية',
                    inequality: 'حل المتباينات (Inequalities)'
                }
            },
            expressions: {
                name: 'التعابير (Expressions)',
                methods: {
                    simplifyRational: 'تبسيط التعابير الجبرية / تبسيط الكسور'
                }
            },
            inequalities: {
                name: 'المتباينات',
                methods: {
                    linear: 'متباينات خطية',
                    quadratic: 'متباينات تربيعية',
                    rational: 'متباينات نسبية',
                    absolute: 'متباينات القيمة المطلقة',
                    systems: 'أنظمة المتباينات',
                    exponential: 'متباينات أسية',
                    logarithmic: 'متباينات لوغاريتمية'
                }
            },
            functions: {
                name: 'الدوال',
                methods: {
                    domain: 'مجال الدالة',
                    range: 'مدى الدالة',
                    inverse: 'الدالة العكسية',
                    composition: 'تركيب الدوال',
                    evenOdd: 'تصنيف زوجية/فردية',
                    periodic: 'فترة الدالة',
                    asymptotes: 'الخطوط التقريبية',
                    intercepts: 'نقاط التقاطع',
                    extrema: 'القيم القصوى',
                    inflection: 'نقاط الانعطاف',
                    monotonicity: 'فترات التزايد والتناقص',
                    continuity: 'الاستمرارية'
                }
            },
            complex: {
                name: 'الأعداد المركبة',
                methods: {
                    operations: 'العمليات الأساسية',
                    modulus: 'المعامل والزاوية',
                    conjugate: 'المرافق',
                    polar: 'الصورة القطبية',
                    exponential: 'الصورة الأسية',
                    roots: 'جذور العدد المركب',
                    deMoivre: 'مبرهنة دي موافر',
                    argandDiagram: 'مخطط أرغاند'
                }
            },
            abstract: {
                name: 'الجبر المجرد',
                methods: {
                    groups: 'نظرية الزمر',
                    rings: 'الحلقات',
                    fields: 'الحقول',
                    vectorSpaces: 'الفضاءات الخطية',
                    homomorphism: 'التشاكل',
                    isomorphism: 'التماثل',
                    cosets: 'المجموعات الجزئية',
                    cyclicGroups: 'الزمر الدورية',
                    quotientGroups: 'زمر القسمة',
                    galoisTheory: 'نظرية جالوا'
                }
            },
            linear: {
                name: 'الجبر الخطي',
                methods: {
                    vectorOperations: 'عمليات المتجهات',
                    dotProduct: 'الضرب القياسي',
                    crossProduct: 'الضرب الاتجاهي',
                    projection: 'الإسقاط',
                    basis: 'الأساس',
                    dimension: 'البعد',
                    linearTransformation: 'التحويلات الخطية',
                    kernel: 'النواة',
                    image: 'الصورة',
                    orthogonality: 'التعامد',
                    gramSchmidt: 'عملية جرام-شميت',
                    innerProduct: 'الضرب الداخلي'
                }
            },
            numberTheory: {
                name: 'نظرية الأعداد',
                methods: {
                    primeFactorization: 'التحليل إلى عوامل أولية',
                    divisibility: 'القسمة',
                    euclideanAlgorithm: 'خوارزمية إقليدس',
                    modularArithmetic: 'الحساب النمطي',
                    chineseRemainder: 'مبرهنة الباقي الصيني',
                    fermatLittle: 'مبرهنة فيرما الصغرى',
                    eulerPhi: 'دالة أويلر φ',
                    primalityTest: 'اختبار الأولية',
                    perfectNumbers: 'الأعداد الكاملة',
                    fibonacciSequence: 'متتالية فيبوناتشي'
                }
            }
        };

        // ربط الأحداث
        this.dom.categorySelect.addEventListener('change', () => this.handleCategoryChange());
        this.dom.methodSelect.addEventListener('change', () => this.handleMethodChange());
        this.dom.solveBtn.addEventListener('click', () => this.solve());

        // تهيئة الواجهة
        this.populateCategories();
        this.handleCategoryChange();
    },

    open() {
        this.dom.modal.style.display = 'flex';
        setTimeout(() => {
            this.dom.expressionInput.focus();
        }, 100);
    },

    close() {
        this.dom.modal.style.display = 'none';
    },

    populateCategories() {
        this.dom.categorySelect.innerHTML = '<option value="">-- اختر الفئة --</option>';
        Object.entries(this.categories).forEach(([key, cat]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = cat.name;
            this.dom.categorySelect.appendChild(option);
        });
    },

    handleCategoryChange() {
        const category = this.dom.categorySelect.value;
        if (!category) {
            this.dom.methodSelect.innerHTML = '<option value="">-- اختر الطريقة --</option>';
            return;
        }

        const methods = this.categories[category].methods;
        this.dom.methodSelect.innerHTML = '<option value="">-- اختر الطريقة --</option>';
        Object.entries(methods).forEach(([key, name]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            this.dom.methodSelect.appendChild(option);
        });

        this.handleMethodChange();
    },

    handleMethodChange() {
        const method = this.dom.methodSelect.value;
        
        // إخفاء حقل المعاملات أولاً
        this.dom.paramsFieldset.style.display = 'none';

        if (!method) return;

        // الطرق التي تحتاج معامل إضافي
        const paramMethods = {
            'evaluate': 'قيمة x:',
            'taylor': 'حول النقطة a:',
            'nth_derivative': 'رتبة المشتقة n:',
            'syntheticDivision': 'القاسم (c في (x-c)):',
            'roots': 'رتبة الجذر (اختياري):',
            'composition': 'الدالة الثانية g(x):',
            'parametric': 'قيمة المعامل t:'
        };

        if (paramMethods[method]) {
            this.dom.paramsFieldset.style.display = 'block';
            this.dom.paramLabel.textContent = paramMethods[method];
        }
    },

    solve() {
        const category = this.dom.categorySelect.value;
        const method = this.dom.methodSelect.value;
        const expression = this.dom.expressionInput.value.trim();

        if (!category || !method) {
            window.MathApp.ui.showToast('❌ يرجى اختيار الفئة والطريقة.', 'error');
            return;
        }

        if (!expression) {
            window.MathApp.ui.showToast('❌ يرجى إدخال التعبير الرياضي.', 'error');
            return;
        }

        let param = null;
        if (this.dom.paramsFieldset.style.display !== 'none') {
            param = this.dom.paramInput.value.trim();
        }

        const problemData = {
            type: 'structured_problem',
            tool: 'algebra_solver',
            category: category,
            method: method,
            expression: expression,
            param: param
        };

        // Special handling for inequalities (we expect expression like '2x+3 > 7')
        if (category === 'equations' && method === 'inequality') {
            const m = expression.match(/([\s\S]*?)(<=|>=|≤|≥|<|>)([\s\S]*)/);
            if (m) {
                problemData.inequality = expression;
                problemData.operator = m[2];
                problemData.left = m[1].trim();
                problemData.right = m[3].trim();
            }
        }

        window.MathApp.chat.send(problemData);
        this.close();
        window.MathApp.ui.showToast('✅ تم إرسال المسألة للحل!', 'success');
    },

    formatProblemToHTML(data) {
        const { category, method, expression, param, inequality, left, right, operator } = data;
        
        const categoryName = this.categories[category]?.name || category;
        const methodName = this.categories[category]?.methods[method] || method;

        let html = `<h3>🔢 ${categoryName} - ${methodName}</h3>`;

        if (method === 'inequality' && inequality) {
            html += `<p><strong>المتباينة:</strong></p>`;
            html += `<p>$$${inequality}$$</p>`;
            html += '<p><strong>المطلوب:</strong> إيجاد مجموعة القيم (الفترة أو الفترات) التي تحقق المتباينة وشرح الخطوات.</p>';
            return html;
        }

        if (category === 'expressions' && method === 'simplifyRational') {
            html += `<p><strong>التعبير المراد تبسيطه:</strong></p>`;
            html += `<p><code>${expression}</code></p>`;
            html += '<p><strong>المطلوب:</strong> تبسيط التعبير وذكر شروط الصحة (مثل قِيَم المقام).</p>';
            return html;
        }

        html += `<p><strong>التعبير:</strong></p>`;
        html += `<p>$$${expression}$$</p>`;

        if (param) {
            html += `<p><strong>المعامل:</strong> <code>${param}</code></p>`;
        }

        html += '<p><strong>المطلوب:</strong> يرجى حل وشرح الخطوات بالتفصيل.</p>';
        
        return html;
    }
};
