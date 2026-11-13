// ==================== محلل التفاضل والتكامل الشامل ====================
import { normalizeMathExpression } from '../../tools/mathNormalize.js';

const math = window.math;

const normalizeFunctionInput = (expr) => {
    return normalizeMathExpression(expr, { removeSpaces: true, preferExponent: true });
};

const detectVariable = (expr, fallback = 'x') => {
    const hasX = /x/i.test(expr);
    const hasY = /y/i.test(expr);
    if (hasY && !hasX) return 'y';
    return fallback || 'x';
};

const evaluateReal = (expr, variable, x) => {
    try {
        const v = math.evaluate(expr, { [variable]: x });
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (v && typeof v.re === 'number' && typeof v.im === 'number') {
            if (Math.abs(v.im) < 1e-8 && Number.isFinite(v.re)) return v.re;
        }
    } catch (e) { /* ignore */ }
    return NaN;
};

const bisectRoot = (expr, variable, a, b, fa, fb, maxIter = 60) => {
    let left = a;
    let right = b;
    let fLeft = fa;
    let fRight = fb;
    for (let i = 0; i < maxIter; i++) {
        const mid = (left + right) / 2;
        const fMid = evaluateReal(expr, variable, mid);
        if (!Number.isFinite(fMid)) break;
        if (Math.abs(fMid) < 1e-8) return mid;
        if (fLeft * fMid <= 0) {
            right = mid;
            fRight = fMid;
        } else {
            left = mid;
            fLeft = fMid;
        }
        if (Math.abs(right - left) < 1e-8) break;
    }
    return (left + right) / 2;
};

const dedupe = (values, tol = 1e-5) => {
    const sorted = values.slice().filter(Number.isFinite).sort((a, b) => a - b);
    const out = [];
    for (const v of sorted) {
        if (!out.length || Math.abs(out[out.length - 1] - v) > tol) out.push(v);
    }
    return out;
};

const findRootsNumeric = (expr, variable = 'x', options = {}) => {
    const rangeBase = options.range || 25;
    const samplesBase = options.samples || 900;
    const maxRanges = options.maxRanges || 3;
    const tol = options.tol || 1e-6;
    const roots = [];

    for (let k = 0; k < maxRanges; k++) {
        const range = rangeBase * Math.pow(2, k);
        const samples = samplesBase + k * 400;
        const step = (2 * range) / samples;
        let prevX = -range;
        let prevY = evaluateReal(expr, variable, prevX);

        for (let i = 1; i <= samples; i++) {
            const x = -range + i * step;
            const y = evaluateReal(expr, variable, x);

            if (Number.isFinite(prevY) && Number.isFinite(y)) {
                if (Math.abs(y) < tol) {
                    roots.push(x);
                } else if (prevY === 0) {
                    roots.push(prevX);
                } else if (prevY * y < 0) {
                    const root = bisectRoot(expr, variable, prevX, x, prevY, y);
                    roots.push(root);
                }
            }

            prevX = x;
            prevY = y;
        }

        if (roots.length) break;
    }

    return dedupe(roots, 1e-4);
};

const formatInterval = (interval) => {
    const left = interval.includeFrom ? '[' : '(';
    const right = interval.includeTo ? ']' : ')';
    const from = interval.from === -Infinity ? '-\\infty' : interval.from === Infinity ? '\\infty' : Number(interval.from).toFixed(4);
    const to = interval.to === Infinity ? '\\infty' : interval.to === -Infinity ? '-\\infty' : Number(interval.to).toFixed(4);
    return `${left}${from}, ${to}${right}`;
};

const mergeIntervals = (intervals) => {
    const sortVal = (v) => (v === -Infinity ? -1e308 : v === Infinity ? 1e308 : v);
    const sorted = intervals.slice().sort((a, b) => sortVal(a.from) - sortVal(b.from));
    const merged = [];
    for (const current of sorted) {
        if (!merged.length) {
            merged.push({ ...current });
            continue;
        }
        const last = merged[merged.length - 1];
        if (current.from < last.to || (current.from === last.to && (current.includeFrom || last.includeTo))) {
            const extendTo = current.to > last.to || (current.to === last.to && current.includeTo);
            if (extendTo) {
                last.to = current.to;
                last.includeTo = current.includeTo;
            }
        } else {
            merged.push({ ...current });
        }
    }
    return merged;
};

const intersectIntervals = (aList, bList) => {
    const out = [];
    for (const a of aList) {
        for (const b of bList) {
            const from = Math.max(a.from, b.from);
            const to = Math.min(a.to, b.to);
            if (from > to) continue;
            const includeFrom = (from > a.from || a.includeFrom) && (from > b.from || b.includeFrom);
            const includeTo = (to < a.to || a.includeTo) && (to < b.to || b.includeTo);
            if (from === to && !(includeFrom && includeTo)) continue;
            out.push({ from, to, includeFrom, includeTo });
        }
    }
    return mergeIntervals(out);
};

const subtractPoints = (intervals, points) => {
    let out = intervals.slice();
    points.forEach((p) => {
        out = out.flatMap((intv) => {
            if (p <= intv.from || p >= intv.to) return [intv];
            const left = { from: intv.from, to: p, includeFrom: intv.includeFrom, includeTo: false };
            const right = { from: p, to: intv.to, includeFrom: false, includeTo: intv.includeTo };
            return [left, right].filter(i => i.from < i.to);
        });
    });
    return out;
};

const solveInequalityApprox = (expr, op, variable = 'x', options = {}) => {
    const range = options.range || 25;
    const samples = options.samples || 1200;
    const breaks = [];

    // detect discontinuities
    const step = (2 * range) / samples;
    for (let i = 0; i <= samples; i++) {
        const x = -range + i * step;
        const y = evaluateReal(expr, variable, x);
        if (!Number.isFinite(y)) breaks.push(x);
    }

    const roots = findRootsNumeric(expr, variable, { range, samples });
    const cutPoints = dedupe([...breaks, ...roots], 1e-3).filter((v) => v > -range && v < range);

    const segments = [-range, ...cutPoints, range];
    const intervals = [];
    const isOk = (val) => {
        if (!Number.isFinite(val)) return false;
        if (op === '>=0') return val >= 0;
        if (op === '>0') return val > 0;
        if (op === '<=0') return val <= 0;
        if (op === '<0') return val < 0;
        return false;
    };

    for (let i = 0; i < segments.length - 1; i++) {
        const a = segments[i];
        const b = segments[i + 1];
        const mid = (a + b) / 2;
        const val = evaluateReal(expr, variable, mid);
        if (isOk(val)) {
            intervals.push({
                from: i === 0 ? -Infinity : a,
                to: i === segments.length - 2 ? Infinity : b,
                includeFrom: false,
                includeTo: false
            });
        }
    }

    return mergeIntervals(intervals);
};

const approximateFraction = (value) => {
    for (let d = 2; d <= 10; d++) {
        const n = Math.round(value * d);
        if (Math.abs(value - n / d) < 1e-6) return { n, d };
    }
    return null;
};

const collectConstraints = (node) => {
    const constraints = [];
    const visit = (n) => {
        if (!n) return;
        if (n.type === 'OperatorNode') {
            if (n.op === '/' && n.args && n.args[1]) {
                constraints.push({ type: 'neq', expr: n.args[1].toString() });
            }
            if (n.op === '^' && n.args && n.args[0] && n.args[1]) {
                const base = n.args[0].toString();
                const expNode = n.args[1];
                if (expNode.isConstantNode) {
                    const expVal = Number(expNode.value);
                    if (Number.isFinite(expVal) && expVal % 1 !== 0) {
                        const frac = approximateFraction(expVal);
                        if (frac && frac.d % 2 === 0) {
                            constraints.push({ type: 'ge', expr: base, note: 'أسّ كسري' });
                        }
                    }
                }
            }
            if (n.args) n.args.forEach(visit);
        } else if (n.type === 'FunctionNode') {
            const fnName = (n.fn && n.fn.name) || n.name || '';
            const arg = n.args && n.args[0] ? n.args[0].toString() : '';
            if (fnName === 'sqrt') constraints.push({ type: 'ge', expr: arg, note: 'الجذر يتطلب ≥ 0' });
            if (fnName === 'log' || fnName === 'ln') constraints.push({ type: 'gt', expr: arg, note: 'اللوغاريتم يتطلب > 0' });
            if (fnName === 'tan' || fnName === 'sec') constraints.push({ type: 'neq', expr: `cos(${arg})` });
            if (fnName === 'cot' || fnName === 'csc') constraints.push({ type: 'neq', expr: `sin(${arg})` });
            if (fnName === 'asin' || fnName === 'arcsin' || fnName === 'acos' || fnName === 'arccos' || fnName === 'atanh') {
                constraints.push({ type: 'between', expr: arg, min: -1, max: 1, open: fnName === 'atanh' });
            }
            if (fnName === 'acosh') {
                constraints.push({ type: 'ge', expr: `${arg}-1`, note: 'acosh يتطلب ≥ 1' });
            }
            if (n.args) n.args.forEach(visit);
        }
    };
    visit(node);
    return constraints;
};
export const calculusSolver = {
    
    // ==================== دوال مساعدة ====================
    
    parseExpression(expr) {
        try {
            return math.parse(expr);
        } catch (e) {
            return null;
        }
    },

    formatLatex(value, precision = 4) {
        if (typeof value === 'number') {
            return math.format(value, { notation: 'fixed', precision });
        }
        return math.format(value, { notation: 'fixed', precision });
    },

    // ==================== 1. إيجاد المجال (Domain) ====================
    
    findDomain(expr, variable = 'x') {
        const steps = [];
        steps.push({
            explanation: 'المجال (Domain) هو مجموعة جميع قيم المتغير التي تجعل الدالة معرّفة.',
            equation: ''
        });

        try {
            const varName = detectVariable(expr, variable);
            const node = this.parseExpression(expr);
            if (!node) return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: 'تعذر تحليل الدالة.' }] };

            const constraints = collectConstraints(node);
            let domainIntervals = [{ from: -Infinity, to: Infinity, includeFrom: false, includeTo: false }];

            if (constraints.length) {
                steps.push({
                    explanation: 'استخراج القيود من بنية الدالة (جذر/مقام/لوغاريتم/دوال مثلثية):',
                    equation: constraints.map((c, i) => `${i + 1}. ${c.type}`).join(' , ')
                });
            } else {
                return {
                    title: 'إيجاد المجال (Domain)',
                    finalResult: 'D = \\mathbb{R}',
                    steps: steps.concat([{ explanation: 'لا توجد قيود صريحة على الدالة.', equation: '\\mathbb{R}' }])
                };
            }

            constraints.forEach((constraint) => {
                const cExpr = normalizeFunctionInput(constraint.expr || '');
                if (!cExpr) return;

                if (constraint.type === 'neq') {
                    const roots = findRootsNumeric(cExpr, varName, { range: 25, samples: 900 });
                    if (roots.length) {
                        domainIntervals = subtractPoints(domainIntervals, roots);
                        steps.push({
                            explanation: 'استبعاد نقاط عدم التعريف (المقام = 0 أو شبيه):',
                            equation: `${varName} \\neq ${roots.map(r => +r.toFixed(4)).join(', ')}`
                        });
                    }
                }

                if (constraint.type === 'ge' || constraint.type === 'gt') {
                    const op = constraint.type === 'ge' ? '>=0' : '>0';
                    const intervals = solveInequalityApprox(cExpr, op, varName, { range: 25, samples: 1200 });
                    domainIntervals = intersectIntervals(domainIntervals, intervals);
                }

                if (constraint.type === 'between') {
                    const minExpr = normalizeFunctionInput(`${cExpr} - (${constraint.min})`);
                    const maxExpr = normalizeFunctionInput(`(${constraint.max}) - (${cExpr})`);
                    const op = constraint.open ? '>0' : '>=0';
                    const intervalsMin = solveInequalityApprox(minExpr, op, varName, { range: 25, samples: 1200 });
                    const intervalsMax = solveInequalityApprox(maxExpr, op, varName, { range: 25, samples: 1200 });
                    domainIntervals = intersectIntervals(domainIntervals, intersectIntervals(intervalsMin, intervalsMax));
                }
            });

            if (!domainIntervals.length) {
                return {
                    title: 'إيجاد المجال (Domain)',
                    finalResult: 'D = \\varnothing',
                    steps: steps.concat([{ explanation: 'لا توجد قيم تحقق القيود المستخرجة.', equation: '' }])
                };
            }

            const domainText = domainIntervals.map(formatInterval).join(' \\cup ');
            steps.push({
                explanation: 'المجال النهائي (تقريبي بناءً على القيود والتحقق العددي):',
                equation: `D = ${domainText}`
            });

            return {
                title: 'إيجاد المجال (Domain)',
                finalResult: `D = ${domainText}`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 2. إيجاد المدى (Range) ====================
    
    findRange(expr, variable = 'x', samples = 1200) {
        const steps = [];
        steps.push({
            explanation: 'المدى (Range) هو مجموعة جميع القيم التي تأخذها الدالة.',
            equation: ''
        });

        try {
            const varName = detectVariable(expr, variable);
            const range = 25;
            const values = [];

            for (let i = 0; i <= samples; i++) {
                const x = -range + (2 * range * i) / samples;
                const y = evaluateReal(expr, varName, x);
                if (Number.isFinite(y)) values.push(y);
            }

            // محاولة إيجاد نقاط حرجة من المشتقة
            try {
                const deriv = math.derivative(expr, varName).toString();
                const critPoints = findRootsNumeric(deriv, varName, { range, samples: 800 });
                critPoints.forEach((x) => {
                    const y = evaluateReal(expr, varName, x);
                    if (Number.isFinite(y)) values.push(y);
                });
                if (critPoints.length) {
                    steps.push({
                        explanation: 'تمت إضافة قيم عند نقاط حرجة تقريبية (حيث المشتقة ≈ 0).',
                        equation: ''
                    });
                }
            } catch (e) { /* ignore */ }

            if (values.length === 0) {
                return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: 'لم تتمكن من حساب قيم الدالة' }] };
            }

            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);

            steps.push({
                explanation: `القيمة الصغرى التقريبية: ${this.formatLatex(minVal)}`,
                equation: ''
            });
            steps.push({
                explanation: `القيمة الكبرى التقريبية: ${this.formatLatex(maxVal)}`,
                equation: ''
            });

            steps.push({
                explanation: 'المدى النهائي (تقريبي داخل نطاق الفحص العددي):',
                equation: `\\text{Range} \\approx [${this.formatLatex(minVal)}, ${this.formatLatex(maxVal)}]`
            });

            return {
                title: 'إيجاد المدى (Range)',
                finalResult: `R \\approx [${this.formatLatex(minVal)}, ${this.formatLatex(maxVal)}]`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 3. المستقيمات المائلة والأفقية ====================
    
    findAsymptotes(expr, variable = 'x') {
        const steps = [];
        steps.push({
            explanation: 'المستقيمات المقاربة (Asymptotes) هي خطوط تقترب منها الدالة.',
            equation: ''
        });

        const asymptotes = {
            horizontal: [],
            vertical: [],
            oblique: []
        };

        try {
            const varName = detectVariable(expr, variable);
            const node = this.parseExpression(expr);
            if (node) {
                const constraints = collectConstraints(node).filter(c => c.type === 'neq');
                constraints.forEach((c) => {
                    const roots = findRootsNumeric(normalizeFunctionInput(c.expr), varName, { range: 25, samples: 900 });
                    roots.forEach(r => asymptotes.vertical.push(`x = ${(+r.toFixed(4))}`));
                });
            }

            // أفقي/مائل عبر تقريب عددي
            const test = (x) => evaluateReal(expr, varName, x);
            const h1 = test(100);
            const h2 = test(200);
            if (Number.isFinite(h1) && Number.isFinite(h2) && Math.abs(h2 - h1) < 1e-2) {
                asymptotes.horizontal.push(`y = ${this.formatLatex((h1 + h2) / 2)}`);
            } else if (Number.isFinite(h1) && Number.isFinite(h2)) {
                const m = (h2 - h1) / 100;
                const b = h1 - m * 100;
                const check = test(300);
                if (Number.isFinite(check) && Math.abs(check - (m * 300 + b)) < 1e-1) {
                    asymptotes.oblique.push(`y = ${this.formatLatex(m)}x + ${this.formatLatex(b)}`);
                }
            }

            const hNeg1 = test(-100);
            const hNeg2 = test(-200);
            if (Number.isFinite(hNeg1) && Number.isFinite(hNeg2) && Math.abs(hNeg2 - hNeg1) < 1e-2) {
                asymptotes.horizontal.push(`y = ${this.formatLatex((hNeg1 + hNeg2) / 2)}`);
            }

            if (!asymptotes.horizontal.length && !asymptotes.vertical.length && !asymptotes.oblique.length) {
                steps.push({ explanation: 'لم يتم رصد مستقيمات مقاربة واضحة ضمن الفحص العددي.', equation: '' });
            } else {
                if (asymptotes.vertical.length) {
                    steps.push({ explanation: 'المستقيمات الرأسية (تقريبية):', equation: asymptotes.vertical.join(', ') });
                }
                if (asymptotes.horizontal.length) {
                    steps.push({ explanation: 'المستقيمات الأفقية (تقريبية):', equation: asymptotes.horizontal.join(', ') });
                }
                if (asymptotes.oblique.length) {
                    steps.push({ explanation: 'المستقيمات المائلة (تقريبية):', equation: asymptotes.oblique.join(', ') });
                }
            }

            const count = asymptotes.horizontal.length + asymptotes.vertical.length + asymptotes.oblique.length;
            return {
                title: 'إيجاد المستقيمات المقاربة',
                finalResult: count ? `${count} مستقيمات مقاربة (تقريبياً)` : 'لم يتم رصد مستقيمات مقاربة',
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 4. المشتقات (Derivatives) ====================
    
    differentiate(expr, variable = 'x', order = 1) {
        const steps = [];
        
        if (order === 1) {
            steps.push({
                explanation: 'حساب المشتقة الأولى باستخدام قواعد الاشتقاق.',
                equation: `\\frac{d}{d${variable}} \\left( ${expr} \\right)`
            });
        } else {
            steps.push({
                explanation: `حساب المشتقة من الرتبة ${order}.`,
                equation: `\\frac{d^${order}}{d${variable}^${order}} \\left( ${expr} \\right)`
            });
        }

        try {
            let derivative = expr;
            let latex = '';

            for (let i = 0; i < order; i++) {
                const node = math.parse(derivative);
                const derived = math.derivative(node, variable);
                derivative = derived.toString();
                try { latex = derived.toTex({ parenthesis: 'keep' }); } catch (e) { latex = derived.toString(); }
                
                steps.push({
                    explanation: i === 0 ? `المشتقة الأولى:` : `المشتقة من الرتبة ${i + 1}:`,
                    equation: `f^{(${i + 1})}(${variable}) = ${latex}`
                });
            }

            return {
                title: `المشتقة من الرتبة ${order}`,
                finalResult: `f^{(${order})} = ${latex || derivative}`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 5. النهايات (Limits) ====================
    
    findLimit(expr, variable = 'x', point = 0, direction = 'both') {
        const steps = [];
        steps.push({
            explanation: `حساب نهاية الدالة عند ${variable} = ${point}`,
            equation: `\\lim_{${variable} \\to ${point}} \\left( ${expr} \\right)`
        });

        try {
            const p = Number(point);
            const epsList = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5];

            const evalSide = (sign) => {
                const vals = [];
                epsList.forEach((eps) => {
                    const x = p + sign * eps;
                    const v = evaluateReal(expr, variable, x);
                    if (Number.isFinite(v)) vals.push(v);
                });
                if (!vals.length) return { kind: 'undefined' };
                const tail = vals.slice(-3);
                const avg = tail.reduce((a, b) => a + b, 0) / tail.length;
                const spread = Math.max(...tail) - Math.min(...tail);
                const sameSign = tail.every(v => Math.sign(v) === Math.sign(tail[0]));
                if (tail.every(v => Math.abs(v) > 1e6) && sameSign) {
                    return { kind: 'infinite', value: tail[0] > 0 ? Infinity : -Infinity };
                }
                if (spread < 1e-3) return { kind: 'finite', value: avg };
                return { kind: 'oscillate' };
            };

            const left = evalSide(-1);
            const right = evalSide(1);

            if (left.kind === 'finite') {
                steps.push({
                    explanation: `النهاية من اليسار: ${this.formatLatex(left.value)}`,
                    equation: `\\lim_{${variable} \\to ${point}^-} = ${this.formatLatex(left.value)}`
                });
            }
            if (right.kind === 'finite') {
                steps.push({
                    explanation: `النهاية من اليمين: ${this.formatLatex(right.value)}`,
                    equation: `\\lim_{${variable} \\to ${point}^+} = ${this.formatLatex(right.value)}`
                });
            }

            if (left.kind === 'finite' && right.kind === 'finite' && Math.abs(left.value - right.value) < 1e-3) {
                const limit = (left.value + right.value) / 2;
                return {
                    title: 'حساب النهاية',
                    finalResult: `\\lim_{${variable} \\to ${point}} = ${this.formatLatex(limit)}`,
                    numericValue: limit,
                    steps
                };
            }

            if (left.kind === 'infinite' && right.kind === 'infinite' && left.value === right.value) {
                return {
                    title: 'حساب النهاية',
                    finalResult: `\\lim_{${variable} \\to ${point}} = ${left.value > 0 ? '\\infty' : '-\\infty'}`,
                    numericValue: left.value,
                    steps
                };
            }

            steps.push({
                explanation: 'النهايات من اليسار واليمين غير متساوية أو غير مستقرة.',
                equation: ''
            });
            return {
                title: 'النهاية غير موجودة',
                finalResult: `\\text{الحد غير موجود}`,
                numericValue: null,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 6. الاستمرار (Continuity) ====================
    
    checkContinuity(expr, variable = 'x', point = 0) {
        const steps = [];
        steps.push({
            explanation: 'الدالة تكون مستمرة عند نقطة إذا كانت: 1) معرّفة، 2) لها نهاية، 3) النهاية = القيمة',
            equation: '\\lim_{x \\to a} f(x) = f(a)'
        });

        try {
            const compiled = math.compile(expr);
            
            // 1. التحقق من تعريف الدالة
            let valueAtPoint;
            try {
                valueAtPoint = compiled.evaluate({ [variable]: point });
                steps.push({
                    explanation: `قيمة الدالة عند ${variable} = ${point}: f(${point}) = ${this.formatLatex(valueAtPoint)}`,
                    equation: ''
                });
            } catch (e) {
                steps.push({
                    explanation: `الدالة غير معرّفة عند ${variable} = ${point}`,
                    equation: ''
                });
                return {
                    title: 'الدالة غير مستمرة',
                    finalResult: 'الدالة غير معرّفة عند النقطة',
                    steps
                };
            }

            // 2. التحقق من النهاية
            const limitResult = this.findLimit(expr, variable, point);
            steps.push({
                explanation: 'حساب النهاية عند النقطة',
                equation: limitResult.finalResult
            });

            // 3. مقارنة
            const limitVal = Number.isFinite(limitResult.numericValue) ? limitResult.numericValue : NaN;
            if (Number.isFinite(limitVal) && Math.abs(valueAtPoint - limitVal) < 1e-4) {
                steps.push({
                    explanation: 'الدالة مستمرة - القيمة = النهاية',
                    equation: ''
                });
                return {
                    title: 'الدالة مستمرة',
                    finalResult: `\\text{الدالة مستمرة عند } x = ${point}`,
                    steps
                };
            } else {
                return {
                    title: 'الدالة غير مستمرة',
                    finalResult: `\\text{الدالة غير مستمرة عند } x = ${point}`,
                    steps
                };
            }
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 7. المجموع والمتتاليات (Series & Sequences) ====================
    
    analyzeSeries(expr, variable = 'n', startN = 1, endN = 100) {
        const steps = [];
        steps.push({
            explanation: 'تحليل المتسلسلة من خلال حساب الحدود الأولى',
            equation: `\\sum_{${variable}=${startN}}^{\\infty} ${expr}`
        });

        try {
            const compiled = math.compile(expr);
            const terms = [];
            let sum = 0;

            for (let i = startN; i <= endN; i++) {
                const term = compiled.evaluate({ [variable]: i });
                terms.push(term);
                sum += term;
            }

            steps.push({
                explanation: `أول 5 حدود: ${terms.slice(0, 5).map(t => this.formatLatex(t)).join(', ')}`,
                equation: ''
            });

            steps.push({
                explanation: `مجموع أول ${endN - startN + 1} حد: ${this.formatLatex(sum)}`,
                equation: ''
            });

            // اختبار التقارب
            const lastTerm = terms[terms.length - 1];
            if (Math.abs(lastTerm) < 1e-6) {
                steps.push({
                    explanation: 'يبدو أن المتسلسلة متقاربة - الحدود تقترب من صفر',
                    equation: ''
                });
            } else {
                steps.push({
                    explanation: 'يبدو أن المتسلسلة متباعدة - الحدود لا تقترب من صفر',
                    equation: ''
                });
            }

            return {
                title: 'تحليل المتسلسلة',
                finalResult: `\\sum_{${variable}=1}^{${endN}} = ${this.formatLatex(sum)}`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 8. التكامل (Integration) ====================
    
    integrate(expr, variable = 'x', isDefinite = false, lowerBound = 0, upperBound = 1) {
        const steps = [];
        
        if (isDefinite) {
            steps.push({
                explanation: 'حساب التكامل المحدود',
                equation: `\\int_{${lowerBound}}^{${upperBound}} ${expr} \\, d${variable}`
            });
        } else {
            steps.push({
                explanation: 'حساب التكامل غير المحدود',
                equation: `\\int ${expr} \\, d${variable}`
            });
        }

        try {
            // استخدام تقريب عددي للتكامل المحدود
            if (isDefinite) {
                let a = Number(lowerBound);
                let b = Number(upperBound);
                if (!Number.isFinite(a) || !Number.isFinite(b)) {
                    return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: 'حدود التكامل غير صالحة.' }] };
                }
                let sign = 1;
                if (a > b) { const tmp = a; a = b; b = tmp; sign = -1; }

                let n = 1000;
                if (n % 2 !== 0) n += 1;
                const h = (b - a) / n;
                let sum = evaluateReal(expr, variable, a) + evaluateReal(expr, variable, b);
                for (let i = 1; i < n; i++) {
                    const x = a + i * h;
                    const fx = evaluateReal(expr, variable, x);
                    if (!Number.isFinite(fx)) continue;
                    sum += (i % 2 === 0 ? 2 : 4) * fx;
                }
                const result = sign * (h / 3) * sum;

                steps.push({
                    explanation: 'استخدام طريقة سمبسون للتكامل العددي',
                    equation: `\\int_{${lowerBound}}^{${upperBound}} f(x) \\, dx \\approx ${this.formatLatex(result)}`
                });

                return {
                    title: 'التكامل المحدود',
                    finalResult: `\\int_{${lowerBound}}^{${upperBound}} = ${this.formatLatex(result)}`,
                    steps
                };
            } else {
                if (typeof nerdamer !== 'undefined' && typeof nerdamer.integrate === 'function') {
                    const res = nerdamer.integrate(expr, variable).toString();
                    steps.push({
                        explanation: 'تم استخدام محرك رمزي لإيجاد التكامل.',
                        equation: ''
                    });
                    return {
                        title: 'التكامل غير المحدود',
                        finalResult: `${res} + C`,
                        steps
                    };
                }

                steps.push({
                    explanation: 'التكامل غير المحدود يتطلب محرك رمزي متقدم (Nerdamer).',
                    equation: ''
                });

                return {
                    title: 'التكامل غير المحدود',
                    finalResult: `\\int ${expr} \\, d${variable} + C`,
                    steps
                };
            }
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 9. حجم الدوران (Volume of Revolution) ====================
    
    volumeOfRevolution(expr, variable = 'x', axis = 'x', lowerBound = 0, upperBound = 1) {
        const steps = [];
        
        if (axis === 'x') {
            steps.push({
                explanation: 'حساب حجم الجسم الناتج عن دوران الدالة حول محور x',
                equation: `V = \\pi \\int_{${lowerBound}}^{${upperBound}} [f(x)]^2 \\, dx`
            });
        } else if (axis === 'y') {
            steps.push({
                explanation: 'حساب حجم الجسم الناتج عن دوران الدالة حول محور y',
                equation: `V = \\pi \\int_{${lowerBound}}^{${upperBound}} x^2 \\, dx`
            });
        }

        try {
            const compiled = math.compile(expr);
            const n = 1000;
            const dx = (upperBound - lowerBound) / n;
            let sum = 0;

            for (let i = 0; i < n; i++) {
                const x = lowerBound + i * dx;
                const y = compiled.evaluate({ [variable]: x });
                sum += Math.PI * (y * y) * dx;
            }

            steps.push({
                explanation: `استخدام صيغة الحجم بالتكامل العددي`,
                equation: `V = ${this.formatLatex(sum)}`
            });

            return {
                title: 'حجم الدوران',
                finalResult: `V = ${this.formatLatex(sum)} \\, \\text{وحدات مكعبة}`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== 10. طول القوس (Arc Length) ====================
    
    arcLength(expr, variable = 'x', lowerBound = 0, upperBound = 1) {
        const steps = [];
        steps.push({
            explanation: 'حساب طول القوس باستخدام الصيغة',
            equation: `L = \\int_{${lowerBound}}^{${upperBound}} \\sqrt{1 + [f\'(x)]^2} \\, dx`
        });

        try {
            const derivative = this.differentiate(expr, variable, 1);
            const derivExpr = derivative.finalResult.split('=')[1]?.trim() || expr;

            const compiled = math.compile(expr);
            const derivCompiled = math.compile(derivExpr);
            const n = 1000;
            const dx = (upperBound - lowerBound) / n;
            let sum = 0;

            for (let i = 0; i < n; i++) {
                const x = lowerBound + i * dx;
                try {
                    const deriv = derivCompiled.evaluate({ [variable]: x });
                    const integrand = Math.sqrt(1 + deriv * deriv);
                    sum += integrand * dx;
                } catch (e) {
                    // تجاهل الأخطاء
                }
            }

            steps.push({
                explanation: `طول القوس من ${variable} = ${lowerBound} إلى ${variable} = ${upperBound}`,
                equation: `L = ${this.formatLatex(sum)}`
            });

            return {
                title: 'طول القوس',
                finalResult: `L = ${this.formatLatex(sum)} \\, \\text{وحدات}`,
                steps
            };
        } catch (e) {
            return { title: 'خطأ', finalResult: 'Error', steps: [{ explanation: e.message }] };
        }
    },

    // ==================== الدالة الرئيسية ====================
    
    solve(data) {
        const { operation, function_latex, params = {}, expression } = data;
        const normalized = normalizeFunctionInput(function_latex || expression || '');
        const varName = detectVariable(normalized, 'x');

        try {
            switch (operation) {
                case 'domain':
                    return this.findDomain(normalized, varName);
                
                case 'range':
                    return this.findRange(normalized, varName);
                
                case 'asymptotes':
                    return this.findAsymptotes(normalized, varName);
                
                case 'differentiate':
                    return this.differentiate(normalized, varName, 1);
                
                case 'limit':
                    return this.findLimit(normalized, varName, params.paramValue || 0);
                
                case 'continuity':
                    return this.checkContinuity(normalized, varName, params.paramValue || 0);
                
                case 'series_convergence':
                    return this.analyzeSeries(normalized, 'n');
                
                case 'integrate_indefinite':
                    return this.integrate(normalized, varName, false);
                
                case 'integrate_definite':
                    return this.integrate(normalized, varName, true, params.a || 0, params.b || 1);
                
                case 'volume_revolution':
                    return this.volumeOfRevolution(normalized, varName, 'x', params.a || 0, params.b || 1);
                
                case 'arc_length':
                    return this.arcLength(normalized, varName, params.a || 0, params.b || 1);
                
                default:
                    return null;
            }
        } catch (e) {
            return { 
                title: 'خطأ في المحلل', 
                finalResult: 'Error', 
                steps: [{ explanation: e.message }] 
            };
        }
    }
};

