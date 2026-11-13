import { normalizeMathExpression } from '../../tools/mathNormalize.js';

// ==================== STATISTICS WORKSPACE - COMPREHENSIVE EDITION ====================
export const StatisticsWorkspace = {
    dom: {},
    state: {
        dataset: [],
        x_dataset: [],
        y_dataset: [],
        categories: {}
    },

    init() {
        this.dom.modal = document.getElementById('statistics-workspace-modal');
        this.dom.categorySelect = document.getElementById('stats-category-select');
        this.dom.methodSelect = document.getElementById('stats-method-select');
        this.dom.dataInput = document.getElementById('stats-data-input');
        this.dom.xDataInput = document.getElementById('stats-x-data-input');
        this.dom.yDataInput = document.getElementById('stats-y-data-input');
        this.dom.paramsFieldset = document.getElementById('stats-params-fieldset');
        this.dom.paramLabel = document.getElementById('stats-param-label');
        this.dom.paramInput = document.getElementById('stats-param-input');
        this.dom.datasetFieldset = document.getElementById('stats-dataset-fieldset');
        this.dom.xyDatasetFieldset = document.getElementById('stats-xy-dataset-fieldset');
        this.dom.solveBtn = document.getElementById('solve-stats-btn');

        // حدد فئات وطرق الإحصاء
        this.categories = {
            descriptive: {
                name: 'الإحصاء الوصفي',
                methods: {
                    mean: 'المتوسط الحسابي',
                    geometricMean: 'المتوسط الهندسي',
                    harmonicMean: 'المتوسط التوافقي',
                    median: 'الوسيط',
                    mode: 'المنوال',
                    range: 'المدى',
                    variance: 'التباين',
                    standardDeviation: 'الانحراف المعياري',
                    coefficientOfVariation: 'معامل الاختلاف',
                    meanAbsoluteDeviation: 'متوسط الانحراف المطلق',
                    quartiles: 'الربيعات',
                    skewness: 'الالتواء',
                    kurtosis: 'التفرطح',
                    percentile: 'النسبة المئوية',
                    zScore: 'درجة Z',
                    frequencyDistribution: 'التوزيع التكراري'
                }
            },
            probability: {
                name: 'الاحتمالات',
                methods: {
                    basic: 'احتمال أساسي',
                    conditional: 'احتمال شرطي',
                    bayes: 'قانون بايز',
                    multiplication: 'قاعدة الضرب',
                    addition: 'قاعدة الجمع',
                    permutations: 'التباديل',
                    combinations: 'التوافيق',
                    expectedValue: 'القيمة المتوقعة',
                    varianceRV: 'تباين المتغير العشوائي'
                }
            },
            distributions: {
                name: 'التوزيعات الاحتمالية',
                methods: {
                    binomial: 'التوزيع الثنائي',
                    normal: 'التوزيع الطبيعي',
                    poisson: 'توزيع بواسون',
                    exponential: 'التوزيع الأسي',
                    uniform: 'التوزيع المنتظم',
                    gamma: 'توزيع جاما',
                    chiSquare: 'توزيع كاي تربيع',
                    tDistribution: 'توزيع t',
                    fDistribution: 'توزيع F'
                }
            },
            regression: {
                name: 'الانحدار والارتباط',
                methods: {
                    linear: 'الانحدار الخطي البسيط',
                    correlation: 'معامل ارتباط بيرسون',
                    multiple: 'الانحدار المتعدد',
                    polynomial: 'الانحدار متعدد الحدود',
                    logistic: 'الانحدار اللوجستي',
                    spearman: 'ارتباط سبيرمان'
                }
            },
            hypothesis: {
                name: 'اختبار الفرضيات',
                methods: {
                    zTest: 'اختبار Z',
                    tTest: 'اختبار t',
                    chiSquareTest: 'اختبار كاي تربيع',
                    anova: 'تحليل التباين ANOVA',
                    mannWhitney: 'اختبار مان ويتني',
                    wilcoxon: 'اختبار ويلكوكسون',
                    kolmogorovSmirnov: 'اختبار كولموجروف-سميرنوف'
                }
            },
            timeseries: {
                name: 'السلاسل الزمنية',
                methods: {
                    movingAverage: 'المتوسط المتحرك',
                    exponentialMovingAverage: 'المتوسط المتحرك الأسي',
                    trend: 'الاتجاه العام',
                    seasonality: 'الموسمية',
                    forecast: 'التنبؤ',
                    autocorrelation: 'الارتباط الذاتي',
                    stationarityTest: 'اختبار السكون'
                }
            },
            bayesian: {
                name: 'الإحصاء البايزي',
                methods: {
                    posterior: 'التوزيع اللاحق',
                    conjugatePrior: 'التوزيع السابق المترافق',
                    credibleInterval: 'الفترة القابلة للتصديق',
                    bayesFactor: 'عامل بايز',
                    mcmc: 'سلاسل ماركوف مونت كارلو'
                }
            },
            multivariate: {
                name: 'الإحصاء متعدد المتغيرات',
                methods: {
                    correlationMatrix: 'مصفوفة الارتباط',
                    covarianceMatrix: 'مصفوفة التباين المشترك',
                    factorAnalysis: 'تحليل العوامل',
                    pca: 'تحليل المكونات الرئيسية',
                    discriminantAnalysis: 'التحليل التمييزي',
                    manova: 'تحليل التباين المتعدد',
                    clusterAnalysis: 'تحليل العناقيد',
                    mahalanobisDistance: 'مسافة ماهالانوبيس'
                }
            },
            nonparametric: {
                name: 'الإحصاء اللامعلمي',
                methods: {
                    signTest: 'اختبار الإشارة',
                    kruskalWallis: 'اختبار كروسكال-واليس',
                    friedmanTest: 'اختبار فريدمان',
                    runsTest: 'اختبار التسلسلات',
                    leveneTest: 'اختبار ليفين'
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
            this.dom.dataInput.focus();
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
        
        // إخفاء كل شيء أولاً
        this.dom.datasetFieldset.style.display = 'none';
        this.dom.xyDatasetFieldset.style.display = 'none';
        this.dom.paramsFieldset.style.display = 'none';

        if (!method) return;

        // الطرق التي تحتاج إلى مجموعة بيانات واحدة
        const singleDatasetMethods = [
            'mean', 'geometricMean', 'harmonicMean', 'median', 'mode', 'range',
            'variance', 'standardDeviation', 'coefficientOfVariation', 'meanAbsoluteDeviation',
            'quartiles', 'skewness', 'kurtosis', 'zScore', 'frequencyDistribution',
            'movingAverage', 'exponentialMovingAverage', 'trend', 'seasonality',
            'forecast', 'autocorrelation', 'stationarityTest', 'signTest',
            'runsTest', 'leveneTest'
        ];

        // الطرق التي تحتاج إلى مجموعتي بيانات (X و Y)
        const xyDatasetMethods = [
            'linear', 'correlation', 'multiple', 'polynomial', 'logistic', 'spearman'
        ];

        // الطرق التي تحتاج معامل إضافي
        const paramMethods = {
            'percentile': 'النسبة المئوية (0-100):',
            'binomial': 'عدد المحاولات n وا��احتمال p (مثال: 10, 0.5):',
            'normal': 'المتوسط μ والانحراف المعياري σ (مثال: 0, 1):',
            'poisson': 'معامل λ:',
            'exponential': 'معامل λ:',
            'uniform': 'الحدود a و b (مثال: 0, 1):',
            'gamma': 'معاملات k و θ (مثال: 2, 2):',
            'chiSquare': 'درجات الحرية df:',
            'tDistribution': 'درجات الحرية df:',
            'fDistribution': 'درجات الحرية df1 و df2 (مثال: 5, 10):'
        };

        if (singleDatasetMethods.includes(method)) {
            this.dom.datasetFieldset.style.display = 'block';
        }

        if (xyDatasetMethods.includes(method)) {
            this.dom.xyDatasetFieldset.style.display = 'block';
        }

        if (paramMethods[method]) {
            this.dom.paramsFieldset.style.display = 'block';
            this.dom.paramLabel.textContent = paramMethods[method];
        }
    },

    parseData(text) {
        // تحليل البيانات من نص (قيم مفصولة بفواصل أو مسافات أو أسطر جديدة)
        return text
            .split(/[\s,;\n]+/)
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => {
                try {
                    const normalized = normalizeMathExpression(s, { removeSpaces: true, preferExponent: true });
                    return window.math.evaluate(normalized);
                } catch {
                    return NaN;
                }
            })
            .filter(n => !isNaN(n));
    },

    solve() {
        const category = this.dom.categorySelect.value;
        const method = this.dom.methodSelect.value;

        if (!category || !method) {
            window.MathApp.ui.showToast('❌ يرجى اختيار الفئة والطريقة.', 'error');
            return;
        }

        let dataset = null;
        let x_dataset = null;
        let y_dataset = null;
        let param = null;

        // جمع البيانات بناءً على المدخلات المطلوبة
        if (this.dom.datasetFieldset.style.display !== 'none') {
            const text = this.dom.dataInput.value.trim();
            if (!text) {
                window.MathApp.ui.showToast('❌ يرجى إدخال مجموعة البيانات.', 'error');
                return;
            }
            dataset = this.parseData(text);
            if (dataset.length === 0) {
                window.MathApp.ui.showToast('❌ البيانات المدخلة غير صالحة.', 'error');
                return;
            }
        }

        if (this.dom.xyDatasetFieldset.style.display !== 'none') {
            const xText = this.dom.xDataInput.value.trim();
            const yText = this.dom.yDataInput.value.trim();
            if (!xText || !yText) {
                window.MathApp.ui.showToast('❌ يرجى إدخال كلا المجموعتين X و Y.', 'error');
                return;
            }
            x_dataset = this.parseData(xText);
            y_dataset = this.parseData(yText);
            if (x_dataset.length === 0 || y_dataset.length === 0) {
                window.MathApp.ui.showToast('❌ البيانات المدخلة غير صالحة.', 'error');
                return;
            }
            if (x_dataset.length !== y_dataset.length) {
                window.MathApp.ui.showToast('❌ يجب أن تحتوي X و Y على نفس عدد العناصر.', 'error');
                return;
            }
        }

        if (this.dom.paramsFieldset.style.display !== 'none') {
            const paramText = this.dom.paramInput.value.trim();
            if (!paramText) {
                window.MathApp.ui.showToast('❌ يرجى إدخال قيمة المعامل.', 'error');
                return;
            }
            param = paramText;
        }

        const problemData = {
            type: 'structured_problem',
            tool: 'statistics_solver',
            category: category,
            method: method,
            dataset: dataset,
            x_dataset: x_dataset,
            y_dataset: y_dataset,
            param: param
        };

        window.MathApp.chat.send(problemData);
        this.close();
        window.MathApp.ui.showToast('✅ تم إرسال المسألة للحل!', 'success');
    },

    formatProblemToHTML(data) {
        const { category, method, dataset, x_dataset, y_dataset, param } = data;
        
        const categoryName = this.categories[category]?.name || category;
        const methodName = this.categories[category]?.methods[method] || method;

        let html = `<h3>📊 ${categoryName} - ${methodName}</h3>`;

        if (dataset) {
            html += `<p><strong>مجموعة البيانات:</strong></p>`;
            html += `<p><code>[${dataset.join(', ')}]</code></p>`;
        }

        if (x_dataset && y_dataset) {
            html += `<p><strong>البيانات X:</strong></p>`;
            html += `<p><code>[${x_dataset.join(', ')}]</code></p>`;
            html += `<p><strong>البيانات Y:</strong></p>`;
            html += `<p><code>[${y_dataset.join(', ')}]</code></p>`;
        }

        if (param) {
            html += `<p><strong>المعامل:</strong> <code>${param}</code></p>`;
        }

        html += '<p><strong>المطلوب:</strong> يرجى حساب وشرح الخطوات بالتفصيل.</p>';
        
        return html;
    }
};
