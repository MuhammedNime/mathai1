import { unitSolver } from './solvers/unitSolver.js';
import { geometrySolver } from './solvers/geometrySolver.js';
import { matrixSolver } from './solvers/matrixSolver.js';
import { calculusSolver } from './solvers/calculusSolver.js';
import { algebraSolver } from './solvers/algebraSolver.js';
import { statisticsSolver } from './solvers/statisticsSolver.js';
import { normalizeMathExpression, toLatinDigits } from '../tools/mathNormalize.js';

const math = window.math;

const normalizeExpression = (expr) => {
    return normalizeMathExpression(expr, { removeSpaces: true, preferExponent: true });
};

const extractNumbers = (text) => {
    if (!text) return [];
    const normalized = toLatinDigits(String(text || '')).replace(/([0-9])[،,]([0-9])/g, '$1.$2');
    const matches = normalized.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi);
    if (!matches) return [];
    return matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
};

const nearlyEqual = (a, b, tol = 1e-6) => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    const diff = Math.abs(a - b);
    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    return diff <= tol * scale;
};

const matrixToArray = (matrix) => {
    if (!matrix) return null;
    if (Array.isArray(matrix)) return matrix;
    if (matrix && typeof matrix.toArray === 'function') return matrix.toArray();
    if (matrix && matrix._data) return matrix._data;
    return null;
};

const parseLatexMatrix = (latex) => {
    if (!latex) return null;
    const match = String(latex).match(/\\begin\{(?:bmatrix|pmatrix|matrix)\}([\s\S]*?)\\end\{(?:bmatrix|pmatrix|matrix)\}/);
    if (!match) return null;
    const body = match[1].trim();
    if (!body) return null;
    const rows = body.split(/\\\\/).map((row) => row.trim()).filter(Boolean);
    const result = rows.map((row) => {
        const cols = row.split('&').map((cell) => cell.trim());
        return cols.map((cell) => {
            const cleaned = normalizeMathExpression(cell, { removeSpaces: true, preferExponent: true });
            if (!cleaned) return NaN;
            const num = Number(cleaned);
            if (Number.isFinite(num)) return num;
            try {
                return math.evaluate(cleaned);
            } catch (e) {
                return NaN;
            }
        });
    });
    if (result.some((row) => row.some((val) => !Number.isFinite(val)))) return null;
    return result;
};

const matricesClose = (A, B, tol = 1e-6) => {
    if (!A || !B) return false;
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) {
        if (!Array.isArray(A[i]) || !Array.isArray(B[i]) || A[i].length !== B[i].length) return false;
        for (let j = 0; j < A[i].length; j++) {
            if (!nearlyEqual(Number(A[i][j]), Number(B[i][j]), tol)) return false;
        }
    }
    return true;
};

const LOCAL_SOLVER_MIN_CONFIDENCE = 65;

const shouldFallbackToAI = (confidence) => {
    if (!confidence || !confidence.checks || confidence.checks.length === 0) return false;
    if (confidence.score >= LOCAL_SOLVER_MIN_CONFIDENCE) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
    return true;
};

export const localSolver = {
    // الدالة الرئيسية والموجه
    solve(queryOrData) {
        let solutionData = null;

        // --- الموجه للبيانات المنظمة ---
        if (typeof queryOrData === 'object' && queryOrData !== null && queryOrData.type === 'structured_problem') {
            console.log('🔍 LocalSolver routing structured data for tool:', queryOrData.tool);
            
            try {
                switch (queryOrData.tool) {
                        case 'geometry_solver':
                        solutionData = geometrySolver.solve(queryOrData);
                        break;
                        case 'matrix_solver':
                        solutionData = matrixSolver.solve(queryOrData);
                        break;
                        case 'calculus_solver': 
                        solutionData = calculusSolver.solve(queryOrData);
                        break;
                        case 'algebra_solver': 
                        solutionData = algebraSolver.solve(queryOrData);
                        break;
                        case 'statistics_solver': 
                        solutionData = statisticsSolver.solve(queryOrData);
                        break;
                        case 'unit_converter':
                        solutionData = unitSolver.solve(queryOrData);
                        break;

                    default:
                        console.warn('Unknown tool:', queryOrData.tool);
                }
            } catch (error) {
                console.error('Error in local solver:', error);
                return null;
            }
        }

        // معالجة خاصة: تحليل المصفوفة الشامل
        if (typeof queryOrData === 'object' && queryOrData !== null && queryOrData.type === 'structured_problem' && queryOrData.tool === 'matrix_solver' && queryOrData.operation === 'comprehensive_analysis') {
            try {
                const res = matrixSolver.enhanced.solve('comprehensive_analysis', queryOrData.matrixA);
                if (res && res.success) {
                    // استخدم واجهة MatrixWorkspace لتنسيق التقرير إن وُجدت
                    try {
                        if (window.MathApp && MathApp.MatrixWorkspace && typeof MathApp.MatrixWorkspace.formatReportToHTML === 'function') {
                            return MathApp.MatrixWorkspace.formatReportToHTML(res, queryOrData.matrixA);
                        }
                    } catch (e) { console.warn('Formatting matrix report failed', e); }

                    // fallback بسيط
                    let html = `<h3>📊 تقرير التحليل الشامل للمصفوفة</h3>`;
                    const dims = res.analyses && res.analyses.dimensions;
                    if (dims) html += `<p>الأبعاد: ${dims.rows} × ${dims.cols} — مربع: ${dims.isSquare ? 'نعم' : 'لا'}</p>`;
                    if (res.analyses && res.analyses.rank) html += `<p>الرتبة: ${res.analyses.rank.rank}</p>`;
                    if (res.analyses && res.analyses.determinant) html += `<p>المحدد: ${res.analyses.determinant.value}</p>`;
                    if (res.analyses && res.analyses.conditionNumber) html += `<p>رقم الحالة: ${res.analyses.conditionNumber.value || 'غير معرّف'}</p>`;
                    return this.formatResponse('التحليل الشامل للمصفوفة', html, []);
                }
            } catch (e) {
                console.error('Error in matrix analysis formatting:', e);
            }
        }

        // إذا كان الحل من حلّال إحصائي يعيد حقل result أو latex، ندعمه هنا
        if (solutionData && (solutionData.result !== undefined || solutionData.latex)) {
            console.log('✅ Local statistics solution found:', solutionData);
            const final = solutionData.latex || (typeof solutionData.result === 'number' ? solutionData.result : (solutionData.result && JSON.stringify(solutionData.result)) );
            const confidence = this.assessConfidence(queryOrData, solutionData);
            if (shouldFallbackToAI(confidence)) {
                console.warn('LocalSolver: low confidence statistics result — fallback to AI.');
                return null;
            }
            if (confidence && confidence.score < LOCAL_SOLVER_MIN_CONFIDENCE && typeof navigator !== 'undefined' && navigator.onLine === false) {
                confidence.notes = (confidence.notes || []).concat(['⚠️ تحقق منخفض ولا يوجد اتصال للذكاء الاصطناعي.']);
            }
            return this.formatResponse(solutionData.title || 'نتيجة إحصائية', final, solutionData.steps || [], confidence);
        }

        // إذا وجدنا حلاً، نعيد تنسيقه كـ HTML (صيغ قديمة)
        if (solutionData && solutionData.finalResult) {
            console.log('✅ Local solution found:', solutionData);
            const confidence = this.assessConfidence(queryOrData, solutionData);
            if (shouldFallbackToAI(confidence)) {
                console.warn('LocalSolver: low confidence result — fallback to AI.');
                return null;
            }
            if (confidence && confidence.score < LOCAL_SOLVER_MIN_CONFIDENCE && typeof navigator !== 'undefined' && navigator.onLine === false) {
                confidence.notes = (confidence.notes || []).concat(['⚠️ تحقق منخفض ولا يوجد اتصال للذكاء الاصطناعي.']);
            }
            return this.formatResponse(solutionData.title, solutionData.finalResult, solutionData.steps, confidence);
        }
        
        console.log('⚠️ No local solution found. Passing to Gemini.');
        return null;
    },

    // دالة التنسيق النهائية المحسّنة
    formatResponse(title, finalResult, steps = [], confidenceReport = null) {
        let html = `<div class="local-solution-container" style="border-left: 4px solid var(--primary-color); padding: 15px; background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, transparent 100%); border-radius: 8px; margin: 10px 0;">`;
        
        html += `<h3 style="margin-top: 0; color: var(--primary-color);">⚡ ${title} (حل محلي سريع)</h3>`;

        if (steps && steps.length > 0) {
            html += '<div class="solution-steps">';
            html += '<details style="cursor: pointer; margin: 10px 0;">';
            html += '<summary style="font-weight: 700; padding: 10px; background: var(--bg-input-area); border-radius: 5px; user-select: none;">📝 عرض خطوات الحل</summary>';
            html += '<div style="padding: 12px; margin-top: 10px;">';

            steps.forEach((step, idx) => {
                if (step.explanation && step.explanation.includes('<')) {
                    // إذا كان الشرح يحتوي على HTML (مثل في حالة الحلول المتعددة)
                    html += step.explanation;
                } else {
                    html += `<div class="step" style="background: var(--bg-container); padding: 10px; border-radius: 5px; margin: 8px 0; border-right: 3px solid var(--primary-color);">
                        <strong>الخطوة ${idx + 1}:</strong> ${step.explanation}
                        ${step.equation ? `<div style="margin-top: 8px; padding: 8px; background: rgba(102, 126, 234, 0.05); border-radius: 5px; direction: ltr; text-align: center;">$$${step.equation}$$</div>` : ''}
                    </div>`;
                }
            });

            html += '</div>';
            html += '</details>';
            html += '</div>';
        }

        if (confidenceReport) {
            html += this.formatConfidenceReport(confidenceReport);
        }

        html += `<div class="final-result" style="background: var(--bg-input-area); padding: 15px; border-radius: 8px; margin-top: 15px; border: 2px solid var(--primary-color);">
            <h4 style="margin-top: 0; color: var(--primary-color);">✅ النتيجة النهائية:</h4>
            <div class="result-box" style="font-size: 16px; text-align: center;">
                $$${finalResult}$$
            </div>
        </div>`;

        html += `<div style="margin-top: 10px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 5px; font-size: 12px; color: var(--text-secondary); text-align: center;">
            💡 تم حساب هذا الحل محلياً بدون الاتصال بالإنترنت (على جهازك مباشرة)
        </div>`;

        html += '</div>';
        return html;
    },

    formatConfidenceReport(report) {
        if (!report) return '';
        const score = Math.max(0, Math.min(100, Math.round(report.score || 0)));
        const label = report.label || 'متوسطة';
        const color = score >= 85 ? '#2e7d32' : score >= 70 ? '#1565c0' : score >= 50 ? '#ef6c00' : '#c62828';
        let html = `<div class="confidence-report" style="margin-top: 12px; padding: 10px; border-radius: 8px; border: 1px dashed var(--modal-border); background: rgba(0,0,0,0.03);">`;
        html += `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="font-weight:700;">📊 درجة الثقة: <span style="color:${color};">${label}</span></div>
            <div style="font-size:12px; color: var(--text-secondary);">${score}%</div>
        </div>`;

        if (report.checks && report.checks.length) {
            html += `<ul style="margin: 8px 0 0; padding-right: 18px; line-height: 1.6;">`;
            report.checks.forEach((check) => {
                const icon = check.ok === true ? '✅' : check.ok === false ? '❌' : '⚪';
                const detail = check.detail ? ` <span style="color: var(--text-secondary);">(${check.detail})</span>` : '';
                html += `<li>${icon} ${check.label}${detail}</li>`;
            });
            html += `</ul>`;
        }

        if (report.notes && report.notes.length) {
            html += `<div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">${report.notes.join(' • ')}</div>`;
        }

        html += `</div>`;
        return html;
    },

    assessConfidence(queryOrData, solutionData) {
        const report = {
            score: 60,
            label: 'متوسطة',
            checks: [],
            notes: []
        };

        const addCheck = (ok, label, detail = '', weight = 15) => {
            report.checks.push({ ok, label, detail });
            if (ok === true) report.score += weight;
            if (ok === false) report.score -= weight;
        };

        try {
            if (!queryOrData || typeof queryOrData !== 'object') {
                report.notes.push('لا تتوفر بيانات كافية للتحقق الآلي.');
                report.score = 50;
                report.label = 'متوسطة';
                return report;
            }

            if (queryOrData.type !== 'structured_problem') {
                report.notes.push('التحقق الآلي متاح فقط للمسائل المنظمة.');
                report.score = 50;
                report.label = 'متوسطة';
                return report;
            }

            const tool = queryOrData.tool;

            if (tool === 'algebra_solver') {
                const category = queryOrData.category;
                const method = queryOrData.method;
                if (category === 'expressions' && method === 'evaluate') {
                    const expr = normalizeExpression(queryOrData.expression);
                    const expected = math.evaluate(expr);
                    const actual = extractNumbers(solutionData.finalResult || solutionData.result)[0];
                    addCheck(nearlyEqual(expected, actual, 1e-6), 'مقارنة حسابية مباشرة', `القيمة المحسوبة = ${expected}`);
                }

                if (category === 'expressions' && method === 'simplifyRational') {
                    const original = normalizeExpression(queryOrData.expression);
                    const lastStep = Array.isArray(solutionData.steps) && solutionData.steps.length
                        ? solutionData.steps[solutionData.steps.length - 1].equation
                        : null;
                    const simplified = normalizeExpression(lastStep || solutionData.finalResult || '');
                    const testPoints = [-3, -1, 1, 2, 3];
                    let passed = 0;
                    let total = 0;
                    testPoints.forEach((x) => {
                        try {
                            const v1 = math.evaluate(original, { x });
                            const v2 = math.evaluate(simplified, { x });
                            if (Number.isFinite(v1) && Number.isFinite(v2)) {
                                total += 1;
                                if (nearlyEqual(v1, v2, 1e-5)) passed += 1;
                            }
                        } catch (e) { /* ignore */ }
                    });
                    if (total > 0) {
                        addCheck(passed === total, 'تحقق بالتجربة العددية', `${passed}/${total} نقاط متطابقة`);
                    } else {
                        addCheck(null, 'تحقق بالتجربة العددية', 'تعذر الاختبار العددي');
                    }
                }

                if (category === 'equations') {
                    if (method === 'inequality') {
                        const inequality = queryOrData.inequality || '';
                        const operator = queryOrData.operator || '';
                        const left = normalizeExpression(queryOrData.left || '');
                        const right = normalizeExpression(queryOrData.right || '');
                        const intervalText = solutionData.finalResult || '';
                        const bounds = extractNumbers(intervalText);
                        if (bounds.length) {
                            const testValue = bounds.length === 1 ? bounds[0] + 1 : (bounds[0] + bounds[1]) / 2;
                            try {
                                const leftVal = math.evaluate(left, { x: testValue });
                                const rightVal = math.evaluate(right, { x: testValue });
                                let ok = null;
                                if (['<', '≤', '<='].includes(operator)) ok = leftVal <= rightVal;
                                if (['>', '≥', '>='].includes(operator)) ok = leftVal >= rightVal;
                                addCheck(ok, 'تحقق بنقطة اختبار للمتباينة', `x = ${testValue}`);
                            } catch (e) {
                                addCheck(null, 'تحقق بنقطة اختبار للمتباينة', 'تعذر التقييم');
                            }
                        } else {
                            addCheck(null, 'تحقق بنقطة اختبار للمتباينة', 'تعذر استخراج حدود الحل');
                        }
                    } else if (method === 'system' || queryOrData.matrixA) {
                        const A = matrixToArray(queryOrData.matrixA);
                        const b = queryOrData.vectorB || queryOrData.matrixB;
                        const numbers = extractNumbers(solutionData.finalResult || '');
                        if (A && Array.isArray(b) && numbers.length >= A[0].length) {
                            try {
                                const vector = numbers.slice(0, A[0].length);
                                const expected = math.multiply(A, vector);
                                const expectedArr = matrixToArray(expected);
                                const flatExpected = expectedArr ? expectedArr.flat() : [];
                                const flatB = b.flat ? b.flat() : b;
                                let okCount = 0;
                                const total = Math.min(flatExpected.length, flatB.length);
                                for (let i = 0; i < total; i++) {
                                    if (nearlyEqual(flatExpected[i], flatB[i], 1e-4)) okCount += 1;
                                }
                                addCheck(okCount === total, 'تحقق بنظام المعادلات', `${okCount}/${total} معادلات متطابقة`);
                            } catch (e) {
                                addCheck(null, 'تحقق بنظام المعادلات', 'تعذر إعادة الحساب');
                            }
                        } else {
                            addCheck(null, 'تحقق بنظام المعادلات', 'بيانات غير كافية');
                        }
                    } else {
                        const equation = queryOrData.equation || '';
                        let lhs = '';
                        let rhs = '';
                        if (equation.includes('=')) {
                            [lhs, rhs] = equation.split('=').map((s) => s.trim());
                        } else if (queryOrData.left || queryOrData.right) {
                            lhs = queryOrData.left || '';
                            rhs = queryOrData.right || '';
                        } else if (Number.isFinite(queryOrData.a) && Number.isFinite(queryOrData.b) && Number.isFinite(queryOrData.c)) {
                            lhs = `${queryOrData.a}*x^2 + ${queryOrData.b}*x + ${queryOrData.c}`;
                            rhs = '0';
                        } else {
                            lhs = equation;
                            rhs = '0';
                        }
                        lhs = normalizeExpression(lhs);
                        rhs = normalizeExpression(rhs);

                        const numbers = extractNumbers(solutionData.finalResult || '');
                        if (numbers.length) {
                            let okCount = 0;
                            numbers.forEach((val) => {
                                try {
                                    const leftVal = math.evaluate(lhs, { x: val });
                                    const rightVal = math.evaluate(rhs, { x: val });
                                    if (nearlyEqual(leftVal, rightVal, 1e-4)) okCount += 1;
                                } catch (e) { /* ignore */ }
                            });
                            addCheck(okCount === numbers.length, 'تحقق بالتعويض في المعادلة', `${okCount}/${numbers.length} جذور صحيحة`);
                        } else {
                            addCheck(null, 'تحقق بالتعويض في المعادلة', 'تعذر استخراج الجذور');
                        }
                    }
                }
            }

            if (tool === 'calculus_solver') {
                if (queryOrData.operation === 'differentiate') {
                    const original = normalizeExpression(queryOrData.function_latex);
                    const derivativeText = String(solutionData.finalResult || '').split('=').slice(1).join('=').trim();
                    const derived = normalizeExpression(derivativeText);
                    const testPoints = [-2, -1, 1, 2, 3];
                    let passed = 0;
                    let total = 0;
                    testPoints.forEach((x) => {
                        try {
                            const h = 1e-4;
                            const f1 = math.evaluate(original, { x: x + h });
                            const f2 = math.evaluate(original, { x: x - h });
                            const numeric = (f1 - f2) / (2 * h);
                            const symbolic = math.evaluate(derived, { x });
                            if (Number.isFinite(numeric) && Number.isFinite(symbolic)) {
                                total += 1;
                                if (nearlyEqual(numeric, symbolic, 1e-2)) passed += 1;
                            }
                        } catch (e) { /* ignore */ }
                    });
                    if (total > 0) {
                        addCheck(passed >= Math.ceil(total * 0.7), 'تحقق عددي للمشتقة', `${passed}/${total} نقاط متقاربة`);
                    } else {
                        addCheck(null, 'تحقق عددي للمشتقة', 'تعذر الاختبار العددي');
                    }
                }

                if (queryOrData.operation === 'integrate_definite') {
                    const expr = normalizeExpression(queryOrData.function_latex);
                    const a = queryOrData.params?.a ?? 0;
                    const b = queryOrData.params?.b ?? 1;
                    const reported = extractNumbers(solutionData.finalResult || '')[0];
                    if (Number.isFinite(reported)) {
                        try {
                            const compiled = math.compile(expr);
                            const n = 2000;
                            const dx = (b - a) / n;
                            let sum = 0;
                            for (let i = 0; i < n; i++) {
                                const x1 = a + i * dx;
                                const x2 = x1 + dx;
                                const y1 = compiled.evaluate({ x: x1 });
                                const y2 = compiled.evaluate({ x: x2 });
                                sum += (y1 + y2) / 2 * dx;
                            }
                            addCheck(nearlyEqual(sum, reported, 1e-2), 'مقارنة تكامل عددي', `فرق ≈ ${(sum - reported).toFixed(6)}`);
                        } catch (e) {
                            addCheck(null, 'مقارنة تكامل عددي', 'تعذر إعادة الحساب');
                        }
                    } else {
                        addCheck(null, 'مقارنة تكامل عددي', 'تعذر استخراج القيمة');
                    }
                }
            }

            if (tool === 'statistics_solver') {
                const op = queryOrData.operation;
                const values = queryOrData.values || [];
                if (Array.isArray(values) && values.length > 0) {
                    if (op === 'mean') {
                        const expected = values.reduce((a, b) => a + b, 0) / values.length;
                        const actual = solutionData.result ?? extractNumbers(solutionData.latex || solutionData.finalResult || '')[0];
                        addCheck(nearlyEqual(expected, actual, 1e-6), 'مقارنة المتوسط الحسابي', `القيمة = ${expected.toFixed(4)}`);
                    }
                    if (op === 'variance') {
                        const mean = values.reduce((a, b) => a + b, 0) / values.length;
                        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
                        const actual = solutionData.result ?? extractNumbers(solutionData.latex || solutionData.finalResult || '')[0];
                        addCheck(nearlyEqual(variance, actual, 1e-4), 'مقارنة التباين', `القيمة = ${variance.toFixed(4)}`);
                    }
                    if (op === 'correlation' && Array.isArray(queryOrData.x) && Array.isArray(queryOrData.y)) {
                        const x = queryOrData.x;
                        const y = queryOrData.y;
                        if (x.length === y.length && x.length > 1) {
                            const meanX = x.reduce((a, b) => a + b, 0) / x.length;
                            const meanY = y.reduce((a, b) => a + b, 0) / y.length;
                            let num = 0;
                            let denX = 0;
                            let denY = 0;
                            for (let i = 0; i < x.length; i++) {
                                const dx = x[i] - meanX;
                                const dy = y[i] - meanY;
                                num += dx * dy;
                                denX += dx * dx;
                                denY += dy * dy;
                            }
                            const expected = num / Math.sqrt(denX * denY);
                            const actual = solutionData.result ?? extractNumbers(solutionData.latex || solutionData.finalResult || '')[0];
                            addCheck(nearlyEqual(expected, actual, 1e-4), 'مقارنة معامل الارتباط', `القيمة = ${expected.toFixed(4)}`);
                        }
                    }
                } else {
                    addCheck(null, 'تحقق إحصائي', 'لم يتم توفير بيانات رقمية');
                }
            }

            if (tool === 'unit_converter') {
                const value = Number(queryOrData.value);
                const category = queryOrData.category;
                const fromUnit = queryOrData.fromUnit;
                const toUnit = queryOrData.toUnit;
                const actual = solutionData.numericResult ?? extractNumbers(solutionData.finalResult || '')[0];
                if (Number.isFinite(value) && category && fromUnit && toUnit && Number.isFinite(actual)) {
                    let expected = null;
                    if (category === 'temperature') {
                        expected = unitSolver.convertTemperature(value, fromUnit, toUnit);
                    } else if (unitSolver.unitsData && unitSolver.unitsData[category]) {
                        const from = unitSolver.unitsData[category][fromUnit];
                        const to = unitSolver.unitsData[category][toUnit];
                        if (from && to && from.factor && to.factor) {
                            expected = (value * from.factor) / to.factor;
                        }
                    }
                    if (expected !== null) {
                        addCheck(nearlyEqual(expected, actual, 1e-6), 'مقارنة التحويل', `القيمة = ${expected.toFixed(6)}`);
                    }
                }
            }

            if (tool === 'matrix_solver') {
                const op = queryOrData.operation;
                const A = matrixToArray(queryOrData.matrixA);
                const B = matrixToArray(queryOrData.matrixB);
                const latex = solutionData.finalResult || '';

                if (op === 'detA' && A) {
                    const expected = math.det(A);
                    const actual = extractNumbers(latex)[0];
                    addCheck(nearlyEqual(expected, actual, 1e-5), 'مقارنة المحدد', `القيمة = ${expected.toFixed(4)}`);
                }

                if (op === 'traceA' && A) {
                    const expected = A.reduce((sum, row, idx) => sum + (row[idx] || 0), 0);
                    const actual = extractNumbers(latex)[0];
                    addCheck(nearlyEqual(expected, actual, 1e-5), 'مقارنة الأثر', `القيمة = ${expected.toFixed(4)}`);
                }

                if (['add', 'subtract', 'multiply', 'scalarMultiply', 'power', 'invA'].includes(op) && A) {
                    const parsed = parseLatexMatrix(latex);
                    if (parsed) {
                        let expected = null;
                        try {
                            const matA = math.matrix(A);
                            const matB = B ? math.matrix(B) : null;
                            if (op === 'add' && matB) expected = math.add(matA, matB);
                            if (op === 'subtract' && matB) expected = math.subtract(matA, matB);
                            if (op === 'multiply' && matB) expected = math.multiply(matA, matB);
                            if (op === 'scalarMultiply') expected = math.multiply(matA, Number(queryOrData.param || 1));
                            if (op === 'power') expected = math.pow(matA, Number(queryOrData.param || 1));
                            if (op === 'invA') expected = math.inv(matA);
                        } catch (e) { /* ignore */ }
                        const expectedArr = matrixToArray(expected);
                        if (expectedArr) {
                            addCheck(matricesClose(expectedArr, parsed, 1e-4), 'مقارنة نتيجة المصفوفة', 'مطابقة حسابية');
                        } else {
                            addCheck(null, 'مقارنة نتيجة المصفوفة', 'تعذر إعادة الحساب');
                        }
                    } else {
                        addCheck(null, 'مقارنة نتيجة المصفوفة', 'تعذر قراءة الناتج');
                    }
                }
            }

            if (report.checks.length === 0) {
                report.score = 50;
                report.label = 'متوسطة';
                report.notes.push('لا تتوفر آليات تحقق لهذا النوع حالياً.');
            }
        } catch (e) {
            report.score = 45;
            report.label = 'متوسطة';
            report.notes.push('حدث خطأ أثناء التحقق.');
        }

        report.score = Math.max(10, Math.min(98, report.score));
        if (report.score >= 85) report.label = 'عالية';
        else if (report.score >= 70) report.label = 'جيدة';
        else if (report.score >= 50) report.label = 'متوسطة';
        else report.label = 'منخفضة';

        return report;
    }
};
