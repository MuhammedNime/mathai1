// ══════════════════════════════════════════════════════════════════════════
//                  ALGEBRA SOLVER - CORE IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════

import { normalizeMathExpression } from '../../tools/mathNormalize.js';

const math = window.math;

const normalizeMathInput = (expr) => {
    return normalizeMathExpression(expr, { removeSpaces: true, preferExponent: true });
};

const splitEquationSides = (equation) => {
    const raw = String(equation || '');
    const parts = raw.split('=');
    if (parts.length === 1) return { lhs: raw, rhs: '0' };
    return { lhs: parts[0], rhs: parts.slice(1).join('=') };
};

const buildZeroExpression = (equation) => {
    const { lhs, rhs } = splitEquationSides(equation);
    return `(${lhs})-(${rhs})`;
};

const nearlyEqual = (a, b, tol = 1e-6) => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    const diff = Math.abs(a - b);
    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    return diff <= tol * scale;
};

const safeEvalAt = (expr, variable, value) => {
    try {
        return math.evaluate(expr, { [variable]: value });
    } catch (e) {
        return NaN;
    }
};

const detectVariable = (expr, fallback = 'x') => {
    const hasX = /x/i.test(expr);
    const hasY = /y/i.test(expr);
    if (hasY && !hasX) return 'y';
    return fallback || 'x';
};

const fitLinearCoeffs = (expr, variable = 'x') => {
    const f0 = safeEvalAt(expr, variable, 0);
    const f1 = safeEvalAt(expr, variable, 1);
    const f2 = safeEvalAt(expr, variable, 2);
    if (!Number.isFinite(f0) || !Number.isFinite(f1) || !Number.isFinite(f2)) return null;
    const a = f1 - f0;
    const b = f0;
    const expected2 = 2 * a + b;
    if (!nearlyEqual(f2, expected2, 1e-4)) return null;
    return { a, b };
};

const fitQuadraticCoeffs = (expr, variable = 'x') => {
    const f0 = safeEvalAt(expr, variable, 0);
    const f1 = safeEvalAt(expr, variable, 1);
    const f2 = safeEvalAt(expr, variable, 2);
    const f3 = safeEvalAt(expr, variable, 3);
    if (![f0, f1, f2, f3].every(Number.isFinite)) return null;
    const a = (f2 - 2 * f1 + f0) / 2;
    const b = f1 - a - f0;
    const c = f0;
    const expected3 = 9 * a + 3 * b + c;
    if (!nearlyEqual(f3, expected3, 1e-3)) return null;
    return { a, b, c };
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

const dedupeRoots = (roots, tol = 1e-5) => {
    const sorted = roots.slice().filter(Number.isFinite).sort((a, b) => a - b);
    const out = [];
    for (const r of sorted) {
        if (!out.length || Math.abs(out[out.length - 1] - r) > tol) out.push(r);
    }
    return out;
};

const findRootsNumeric = (expr, variable = 'x', options = {}) => {
    const rangeBase = options.range || 20;
    const samplesBase = options.samples || 800;
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

    return dedupeRoots(roots, 1e-4);
};

export const algebraSolver = {
    
    // دوال مساعدة للتنسيق والتحليل
    utils: {
        toLatex: (node) => node ? node.toTex({ parenthesis: 'keep' }) : '',
        formatNumber: (n) => Number.isInteger(n) ? n : n.toFixed(4),
        parse: (expr) => math.parse(expr),
        normalize: (expr) => normalizeMathInput(expr)
    },

    polynomials: {
        // جمع كثيرات الحدود: P(x) + Q(x)
        addition: {
            solve(data) {
                const { expr1, expr2 } = data; // يتوقع تعبيرين
                const steps = [];
                
                try {
                    const node1 = math.parse(expr1);
                    const node2 = math.parse(expr2);
                    
                    steps.push({
                        explanation: 'كتابة المقدارين لجمعهما:',
                        equation: `(${node1.toTex()}) + (${node2.toTex()})`
                    });

                    // الجمع الرمزي
                    const sumNode = math.add(node1, node2);
                    
                    steps.push({
                        explanation: 'تجميع الحدود المتشابهة:',
                        equation: sumNode.toTex()
                    });

                    // التبسيط النهائي
                    const simplified = math.simplify(sumNode);
                    
                    steps.push({
                        explanation: 'الصيغة المبسطة النهائية:',
                        equation: simplified.toTex()
                    });

                    return {
                        title: 'جمع كثيرات الحدود',
                        finalResult: simplified.toTex(),
                        steps,
                        lessonLink: '/library/algebra/polynomials'
                    };
                } catch (e) {
                    return { error: `خطأ في الجمع: ${e.message}` };
                }
            }
        },

        // ضرب كثيرات الحدود: P(x) * Q(x)
        multiplication: {
            solve(data) {
                const { expr1, expr2 } = data;
                const steps = [];

                try {
                    const node1 = math.parse(expr1);
                    const node2 = math.parse(expr2);

                    steps.push({
                        explanation: 'ضرب المقدارين (توزيع الضرب):',
                        equation: `(${node1.toTex()}) \\cdot (${node2.toTex()})`
                    });

                    // استخدام rational لتوسيع الأقواس إذا لزم الأمر، أو simplify
                    // math.js rational does expansion well
                    const expanded = math.simplify(math.multiply(node1, node2)); // أو استخدام دالة expand مخصصة
                    
                    steps.push({
                        explanation: 'توزيع الحدود وتجميع المتشابه:',
                        equation: expanded.toTex()
                    });

                    return {
                        title: 'ضرب كثيرات الحدود',
                        finalResult: expanded.toTex(),
                        steps
                    };
                } catch (e) {
                    return { error: `خطأ في الضرب: ${e.message}` };
                }
            }
        },

        // تحليل العوامل (Basic Factoring for Quadratics)
        // ملاحظة: التحليل الرمزي العام في JS صعب، سنركز على التربيعية ax^2+bx+c
        factoring: {
            solve(data) {
                const { expression } = data;
                const steps = [];
                steps.push({ explanation: 'تحليل المقدار:', equation: expression });

                // محاولة التعرف على المعادلة التربيعية
                // هذا تنفيذ مبسط، المكتبات المتقدمة مثل Algebrite أو Nerdamer أفضل هنا
                // لكن سنقوم بمحاولة يدوية للمعادلات التربيعية البسيطة
                try {
                    // نفترض الصيغة ax^2 + bx + c
                    // سنستخدم الجذور للتحليل: a(x - x1)(x - x2)
                    // ... (هنا يمكن دمج منطق حل المعادلة التربيعية أدناه لاستخراج الجذور ثم كتابة التحليل)
                    
                    // placeholder للتحليل المتقدم
                    return {
                        title: 'تحليل كثيرات الحدود',
                        finalResult: `\\text{تحليل } ${expression} \\text{ (يتطلب مكتبة رمزية متقدمة)}`,
                        steps: [{ explanation: 'جاري تطوير خوارزمية التحليل الرمزي الكامل...', equation: '' }]
                    };
                } catch (e) {
                    return { error: e.message };
                }
            }
        }
    },

    equations: {
        // حل المعادلات الخطية: ax + b = c
        linear: {
            solve(data) {
                const { equation, variable = 'x' } = data; 
                // data قد تكون { equation: "2x + 5 = 15" }
                const steps = [];
                
                try {
                    const normalizedEq = normalizeMathInput(equation || '');
                    const zeroExprRaw = buildZeroExpression(normalizedEq);
                    const zeroExpr = normalizeMathInput(zeroExprRaw);
                    const varName = detectVariable(zeroExpr, variable);

                    // تقسيم المعادلة إلى طرفين
                    let [lhs, rhs] = normalizedEq.split('=').map(s => s.trim());
                    if (!rhs) { rhs = "0"; } // إذا كانت "2x+5" نفترض "=0"

                    steps.push({
                        explanation: 'المعادلة الأصلية:',
                        equation: `${lhs} = ${rhs}`
                    });

                    // 1) محاولة تحليل خطي عبر التقييم العددي (أكثر تحملاً للأشكال البسيطة)
                    const coeffs = fitLinearCoeffs(zeroExpr, varName);
                    if (coeffs) {
                        const { a, b } = coeffs;
                        steps.push({
                            explanation: 'استخراج المعاملات من الصورة $a\\,x + b = 0$:',
                            equation: `a = ${a.toFixed(6)}, \\quad b = ${b.toFixed(6)}`
                        });

                        if (Math.abs(a) < 1e-10) {
                            if (Math.abs(b) < 1e-10) {
                                return {
                                    title: 'معادلة خطية',
                                    finalResult: `\\text{عدد لا نهائي من الحلول}`,
                                    steps
                                };
                            }
                            return { error: 'لا يوجد حل لأن المعادلة تؤدي إلى تناقض.' };
                        }

                        const solution = -b / a;
                        steps.push({
                            explanation: 'حل المعادلة الخطية:',
                            equation: `${varName} = ${solution}`
                        });

                        return {
                            title: 'حل معادلة خطية',
                            finalResult: `${varName} = ${solution}`,
                            steps
                        };
                    }

                    // 2) إذا كانت المعادلة ليست خطية صريحة، جرّب Nerdamer إن وُجد
                    if (typeof nerdamer !== 'undefined') {
                        const sol = nerdamer.solve(normalizedEq, varName);
                        const solution = sol.toString(); // e.g. [5]
                        
                        steps.push({
                            explanation: 'عزل المتغير وحل المعادلة:',
                            equation: `${varName} = ${solution.replace(/[\[\]]/g, '')}`
                        });

                        return {
                            title: 'حل معادلة خطية',
                            finalResult: `${varName} = ${solution.replace(/[\[\]]/g, '')}`,
                            steps
                        };
                    }

                    return { 
                        title: 'تنبيه', 
                        steps: [{ explanation: 'تعذر حل المعادلة خطياً (قد تكون غير خطية أو تحتاج مكتبة رمزية).', equation: '' }] 
                    };

                } catch (e) {
                    return { error: `خطأ في حل المعادلة: ${e.message}` };
                }
            }
        },

        // حل المعادلات التربيعية: ax^2 + bx + c = 0
        quadratic: {
            solve(data) {
                // data: { a: 1, b: -5, c: 6 } OR { equation: "x^2 - 5x + 6 = 0" }
                let a, b, c;
                let variable = data.variable || 'x';
                const steps = [];

                // إذا جاءت كمعاملات مباشرة
                if (data.a !== undefined) {
                    a = Number(data.a);
                    b = Number(data.b);
                    c = Number(data.c);
                } else {
                    const normalizedEq = normalizeMathInput(data.equation || '');
                    const zeroExprRaw = buildZeroExpression(normalizedEq);
                    const zeroExpr = normalizeMathInput(zeroExprRaw);
                    variable = detectVariable(zeroExpr, variable);
                    const coeffs = fitQuadraticCoeffs(zeroExpr, variable);
                    if (!coeffs) {
                        const linearCoeffs = fitLinearCoeffs(zeroExpr, variable);
                        if (linearCoeffs && Math.abs(linearCoeffs.a) > 1e-10) {
                            const x = -linearCoeffs.b / linearCoeffs.a;
                            return {
                                title: 'حل معادلة خطية',
                                finalResult: `${variable} = ${x}`,
                                steps: [
                                    { explanation: 'المعادلة ليست تربيعية، وتم التعامل معها كمعادلة خطية.', equation: '' }
                                ]
                            };
                        }
                        return { error: "تعذر استخراج معاملات المعادلة التربيعية من النص." };
                    }
                    a = coeffs.a;
                    b = coeffs.b;
                    c = coeffs.c;

                    steps.push({
                        explanation: 'تحويل المعادلة للصيغة القياسية واستخراج المعاملات:',
                        equation: `a = ${a.toFixed(6)}, \\quad b = ${b.toFixed(6)}, \\quad c = ${c.toFixed(6)}`
                    });
                }

                steps.push({
                    explanation: 'المعادلة التربيعية في الصورة القياسية:',
                    equation: `${a}${variable}^2 ${b >= 0 ? '+' : ''}${b}${variable} ${c >= 0 ? '+' : ''}${c} = 0`
                });

                // 1. المميز (Discriminant)
                const delta = b * b - 4 * a * c;
                steps.push({
                    explanation: 'حساب المميز (Discriminant) $\\Delta = b^2 - 4ac$:',
                    equation: `\\Delta = (${b})^2 - 4(${a})(${c}) = ${delta}`
                });

                let roots = [];
                if (delta > 0) {
                    const x1 = (-b + Math.sqrt(delta)) / (2 * a);
                    const x2 = (-b - Math.sqrt(delta)) / (2 * a);
                    roots = [x1, x2].sort((u,v)=>u-v);
                    steps.push({
                        explanation: 'بما أن $\\Delta > 0$، يوجد جذران حقيقيان مختلفان باستخدام القانون العام:',
                        equation: `${variable} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}`
                    });
                    steps.push({
                        explanation: 'التعويض:',
                        equation: `${variable}_{1,2} = \\frac{-(${b}) \\pm \\sqrt{${delta}}}{2(${a})}`
                    });
                    steps.push({
                        explanation: 'الحلول:',
                        equation: `${variable}_1 = ${+roots[0].toFixed(4)}, \\quad ${variable}_2 = ${+roots[1].toFixed(4)}`
                    });
                } else if (delta === 0) {
                    const x = -b / (2 * a);
                    roots = [x];
                    steps.push({
                        explanation: 'بما أن $\\Delta = 0$، يوجد جذر حقيقي واحد (مكرر):',
                        equation: `${variable} = \\frac{-b}{2a} = \\frac{-(${b})}{2(${a})} = ${+x.toFixed(4)}`
                    });
                } else {
                    // جذور مركبة
                    const realPart = -b / (2 * a);
                    const imagPart = Math.sqrt(-delta) / (2 * a);
                    const x1 = `${+realPart.toFixed(4)} + ${+imagPart.toFixed(4)}i`;
                    const x2 = `${+realPart.toFixed(4)} - ${+imagPart.toFixed(4)}i`;
                    steps.push({
                        explanation: 'بما أن $\\Delta < 0$، يوجد جذران مركبان:',
                        equation: `${variable} = \\frac{-b \\pm i\\sqrt{|\\Delta|}}{2a}`
                    });
                    steps.push({
                        explanation: 'الحلول:',
                        equation: `${variable}_1 = ${x1}, \\quad ${variable}_2 = ${x2}`
                    });
                }

                return {
                    title: 'حل المعادلة التربيعية',
                    finalResult: delta >= 0 ? `${variable} \\in \\{ ${roots.map(n=>+n.toFixed(4)).join(', ')} \\}` : 'جذور مركبة',
                    steps
                };
            }
        },

        // حل عددي عام لمعادلات غير خطية: f(x)=0
        numeric: {
            solve(data) {
                const equation = data.equation || '';
                const steps = [];
                try {
                    const normalizedEq = normalizeMathInput(equation);
                    const zeroExpr = normalizeMathInput(buildZeroExpression(normalizedEq));
                    const variable = detectVariable(zeroExpr, data.variable || 'x');

                    steps.push({
                        explanation: 'تحويل المعادلة إلى صورة $f(x)=0$:',
                        equation: `${zeroExpr} = 0`
                    });

                    const roots = findRootsNumeric(zeroExpr, variable, { range: 25, samples: 900 });
                    if (!roots.length) {
                        return { error: 'لم يتم العثور على حلول حقيقية ضمن النطاق العددي المفحوص.' };
                    }

                    const formatted = roots.map((r) => +r.toFixed(6));
                    steps.push({
                        explanation: 'استخدام البحث العددي عن الجذور:',
                        equation: `${variable} \\approx ${formatted.join(', ')}`
                    });

                    return {
                        title: 'حل عددي لمعادلة غير خطية',
                        finalResult: `${variable} \\approx \\{ ${formatted.join(', ')} \\}`,
                        steps
                    };
                } catch (e) {
                    return { error: `خطأ في الحل العددي: ${e.message}` };
                }
            }
        },
        
        // أنظمة المعادلات الخطية (2x2 أو 3x3)
        // هذا مجرد Wrapper لـ matrixSolver الذي هو قوي جداً لديك
        systemsLinear: {
            solve(data) {
                // data: { matrixA: [[2,1],[1,-1]], vectorB: [5,1] }
                // نفترض أننا قمنا بتحليل النص في chat.js وحولناه لمصفوفات
                const steps = [];
                steps.push({ explanation: 'تحويل النظام إلى صيغة مصفوفات $Ax = b$', equation: '' });
                
                // استدعاء linearSystems solver من matrixSolver
                // سنحتاج لاستيراد matrixSolver هنا أو تمرير الطلب له
                // بما أننا داخل algebraSolver، الأفضل أن يكون هذا "واجهة" فقط
                
                // سنقوم بتنفيذ Cramer's rule يدوياً هنا للسرعة إذا كان 2x2
                // للتوضيح التعليمي
                const A = data.matrixA;
                const B = data.vectorB;
                
                if (A.length === 2 && A[0].length === 2) {
                    const D = A[0][0]*A[1][1] - A[0][1]*A[1][0];
                    steps.push({ explanation: 'حساب محدد المصفوفة D:', equation: `D = (${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]}) = ${D}` });
                    
                    if (D === 0) return { error: "المحدد صفر، لا يوجد حل وحيد." };

                    const Dx = B[0]*A[1][1] - A[0][1]*B[1];
                    steps.push({ explanation: 'حساب Dx (استبدال العمود الأول بالثوابت):', equation: `D_x = ${Dx}` });

                    const Dy = A[0][0]*B[1] - B[0]*A[1][0];
                    steps.push({ explanation: 'حساب Dy (استبدال العمود الثاني بالثوابت):', equation: `D_y = ${Dy}` });

                    const x = Dx / D;
                    const y = Dy / D;

                    steps.push({ explanation: 'تطبيق قاعدة كرامر:', equation: `x = \\frac{D_x}{D} = ${x}, \\quad y = \\frac{D_y}{D} = ${y}` });

                    return {
                        title: 'حل نظام خطي (كرامر)',
                        finalResult: `x=${x}, y=${y}`,
                        steps
                    };
                }
                
                return { error: "حالياً يدعم الحل التفصيلي لأنظمة 2x2 فقط هنا. استخدم ورشة المصفوفات للأنظمة الأكبر." };
            }
        },

        // ========== INEQUALITIES ==========
        inequalities: {
            // Linear inequalities like '2x + 3 > 7'
            solve(data) {
                const { inequality, operator, left, right, variable = 'x' } = data;
                const steps = [];
                try {
                    steps.push({ explanation: 'المسألة الأصلية:', equation: inequality });
                    // Bring to one side: left - right [operator] 0
                    const exprNode = math.parse(`${left} - (${right})`);
                    const simplified = math.simplify(exprNode);
                    steps.push({ explanation: 'نقل الحدود إلى طرف واحد:', equation: `${simplified.toTex()} ${operator} 0` });

                    // For linear case, try to extract coefficient a and b in ax + b
                    // Use nerdamer if available for safe solve
                    if (typeof nerdamer !== 'undefined') {
                        // Solve equality simplified = 0 for boundary
                        const eqSym = `${nerdamer(simplified.toString()).toString()}=0`;
                        const roots = nerdamer.solve(eqSym, variable).toString().replace(/\[|\]/g,'').split(',').map(s=>s.trim()).filter(Boolean).map(Number);
                        const boundary = roots.length ? roots[0] : null;
                        if (boundary === null || isNaN(boundary)) {
                            return { error: 'لا يمكن إيجاد نقاط تقاطع حقيقية.' };
                        }

                        // Determine direction by testing point
                        const testPoint = boundary + 1; // test to the right
                        const valueAtTest = math.evaluate(simplified.toString().replace(new RegExp(variable,'g'), `(${testPoint})`));

                        const op = operator;
                        let intervalLatex = '';

                        // For linear, single boundary
                        // Determine if solution is x < boundary or x > boundary, taking strictness into account
                        const includeBoundary = /<=|>=|≤|≥/.test(op);

                        if ((valueAtTest > 0 && ['>','>=','≥'].includes(op)) || (valueAtTest < 0 && ['<','<=','≤'].includes(op))) {
                            // right side satisfies, so solution is (boundary, +inf) or [boundary, +inf]
                            intervalLatex = `x \\in ${includeBoundary ? '[' : '('}${boundary},\\infty)`;
                        } else {
                            intervalLatex = `x \\in (-\\infty, ${includeBoundary ? ']' : ')'}${boundary}`;
                        }

                        steps.push({ explanation: 'اختبار جهة الحل وتحديد الفترة:', equation: intervalLatex });

                        return { title: 'حل متباينة خطية', finalResult: intervalLatex, steps };
                    } else {
                        // Fallback: numeric attempt
                        const coeffs = simplified.toString();
                        return { error: 'يتطلب حل المتباينات وجود مكتبة حل رمزي (Nerdamer).' };
                    }
                } catch (e) {
                    return { error: `خطأ في حل المتباينة: ${e.message}` };
                }
            },

            // Quadratic inequalities like 'x^2 - 5x + 6 <= 0'
            quadratic(data) {
                const { inequality, operator, left, right, variable = 'x' } = data;
                const steps = [];

                try {
                    steps.push({ explanation: 'المسألة الأصلية:', equation: inequality });
                    const expr = math.simplify(math.parse(`${left} - (${right})`));
                    // extract coefficients via numeric evaluation at symbolic levels using math.js's polyCoeffs not available -> use nerdamer
                    if (typeof nerdamer !== 'undefined') {
                        // Try to get polynomial coefficients for variable
                        const poly = nerdamer(expr.toString()).expand();
                        // Use derivative roots (solve poly = 0)
                        const rootsRaw = nerdamer.solve(`${poly.toString()}=0`, variable).toString().replace(/\[|\]/g,'').split(',').map(s=>s.trim()).filter(Boolean).map(Number);
                        if (rootsRaw.length === 0) return { error: 'لا جذور حقيقية للمقارنة' };
                        const roots = rootsRaw.sort((a,b)=>a-b);
                        const a = Number(nerdamer(`coeff(${poly.toString()}, ${variable}, 2)`).toString());

                        // Determine intervals based on parabola direction
                        const includeBoundary = /<=|>=|≤|≥/.test(operator);
                        let intervals = [];
                        if (roots.length === 1) {
                            if (a > 0) {
                                // Upwards: <=0 at exactly root if includeBoundary
                                intervals = includeBoundary ? [`[${roots[0]},${roots[0]}]`] : [];
                            } else {
                                intervals = includeBoundary ? [`(-\\infty, ${roots[0]}]`, `[${roots[0]}, \\infty)`] : [`(-\\infty, ${roots[0]})`, `(${roots[0]}, \\infty)`];
                            }
                        } else if (roots.length >= 2) {
                            const r1 = roots[0]; const r2 = roots[1];
                            if (a > 0) {
                                intervals = includeBoundary ? [`[${r1},${r2}]`] : [`(${r1},${r2})`];
                            } else {
                                intervals = includeBoundary ? [`(-\\infty, ${r1}]`, `[${r2}, \\infty)`] : [`(-\\infty, ${r1})`, `(${r2}, \\infty)`];
                            }
                        }

                        steps.push({ explanation: 'حساب الجذور:', equation: `x = ${roots.join(', ')}` });
                        steps.push({ explanation: 'الفترة/الفترات الحل:', equation: intervals.join(' \\cup ') });

                        return { title: 'حل متباينة تربيعية', finalResult: `x \\in ${intervals.join(' \\cup ')}`, steps };
                    }

                    return { error: 'يتطلب حل المتباينات وجود مكتبة حل رمزي (Nerdamer).' };
                } catch (e) {
                    return { error: `خطأ في حل المتباينة التربيعية: ${e.message}` };
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    //              HELPER: Main Entry Point
    // ══════════════════════════════════════════════════════════════════════════
    
    solve(data) {
        // الموجه الرئيسي (Router)
        try {
            if (data.category === 'polynomials') {
                if (data.method === 'add') return this.polynomials.addition.solve(data);
                if (data.method === 'multiply') return this.polynomials.multiplication.solve(data);
                if (data.method === 'factoring') return this.polynomials.factoring.solve(data);
            }

            if (data.category === 'equations') {
                // inequalities
                if (data.method === 'inequality') {
                    const lhs = data.left || '';
                    if (/\^2|²|x\s*\*?\s*x/.test(lhs)) return this.inequalities.quadratic(data);
                    return this.inequalities.solve(data);
                }

                if (data.type === 'linear') return this.equations.linear.solve(data);
                if (data.type === 'quadratic') return this.equations.quadratic.solve(data);
                if (data.type === 'system') return this.equations.systemsLinear.solve(data);
                if (data.equation) return this.equations.numeric.solve(data);
            }

            if (data.category === 'expressions') {
                if (data.method === 'simplifyRational') return this.expressions.simplifyRational(data);
                if (data.method === 'evaluate') return this.expressions.evaluate(data);
            }
            
            return { error: "نوع المسألة الجبرية غير مدعوم بعد في الحل المحلي." };
        } catch (e) {
            console.error("Algebra Solver Error:", e);
            return { error: "حدث خطأ أثناء المعالجة الجبرية." };
        }
    },

    // Expressions helpers
    expressions: {
        evaluate(data) {
            const { expression } = data;
            const steps = [];
            try {
                steps.push({ explanation: 'التعبير الأصلي:', equation: expression });
                // Use math.js to safely evaluate numeric expressions
                const value = math.evaluate(expression);
                // Attempt to get LaTeX for display
                let parsedTex = expression;
                try { parsedTex = math.parse(expression).toTex(); } catch (e) { /* ignore */ }
                steps.push({ explanation: 'القيمة العددية:', equation: String(value) });
                return { title: 'تقييم تعبير عددي', finalResult: String(value), steps };
            } catch (e) {
                return { error: `خطأ في تقييم التعبير: ${e.message}` };
            }
        },

        simplifyRational(data) {
            const { expression } = data;
            const steps = [];
            try {
                steps.push({ explanation: 'التعبير الأصلي:', equation: expression });

                // Use Nerdamer or Algebrite if available
                let simplified = null;
                if (typeof nerdamer !== 'undefined') {
                    try {
                        simplified = nerdamer(`simplify(${expression})`).toString();
                    } catch (e) { /* ignore */ }
                }
                if (!simplified && typeof Algebrite !== 'undefined') {
                    try { simplified = Algebrite.run(`simplify(${expression})`); } catch (e) { /* ignore */ }
                }
                if (!simplified) return { error: 'لا يوجد محرك تبسيط رمزي متاح.' };

                steps.push({ explanation: 'النتيجة المبسطة:', equation: simplified });

                // Try to find denominator roots for domain restrictions
                const denom = (function findDenominator(expr) {
                    // crude top-level slash parsing to find denom of a simple rational expr
                    let s = expr.trim();
                    let depth = 0;
                    for (let i = 0; i < s.length; i++) {
                        const ch = s[i];
                        if (ch === '(') depth++; if (ch === ')') depth--; if (ch === '/' && depth === 0) {
                            return s.slice(i+1).trim();
                        }
                    }
                    return null;
                })(expression);

                let domainNote = '';
                if (denom) {
                    // attempt solve denom = 0
                    if (typeof nerdamer !== 'undefined') {
                        try {
                            const sol = nerdamer.solve(`${denom}=0`, 'x').toString().replace(/\[|\]/g,'');
                            if (sol) {
                                const roots = sol.split(',').map(s=>s.trim()).filter(Boolean);
                                domainNote = `\\text{Domain: } x \\neq ${roots.join(', ')}`;
                                steps.push({ explanation: 'شرط وجود التعبير (المقام ≠ 0):', equation: domainNote });
                            }
                        } catch (e) { /* ignore */ }
                    }
                }

                return { title: 'تبسيط تعبير جبري', finalResult: simplified + (domainNote ? `\\\; (${domainNote})` : ''), steps };
            } catch (e) {
                return { error: `خطأ في تبسيط التعبير: ${e.message}` };
            }
        }
    }
};
