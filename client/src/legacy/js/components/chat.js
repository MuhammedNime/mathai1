import { localSolver } from '../features/localSolver.js';
import aiAssistant from '../features/aiAssistant.js';
import { normalizeMathExpression, stripMathDelimiters, toLatinDigits } from '../tools/mathNormalize.js';

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const convertLatexDelimiters = (value) => String(value || '')
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (match, inner) => `$$${String(inner || '').trim()}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => `$${String(inner || '').trim()}$`);

const sanitizeHtml = (html) => {
    if (!html || typeof document === 'undefined') return html;
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((el) => el.remove());
    template.content.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                return;
            }
            if ((name === 'href' || name === 'src') && /^javascript:/i.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return template.innerHTML;
};

const getAppLanguage = () => {
    try { return localStorage.getItem('app_language') || 'ar'; } catch (e) { return 'ar'; }
};

const getExplanationInstruction = () => {
    try {
        const mode = (window.MathApp && window.MathApp.config && window.MathApp.config.explanationMode) || 'detailed';
        const lang = getAppLanguage();
        const instructions = {
            quick: {
                ar: 'وضع الشرح: سريع (أولوية عليا على القواعد التفصيلية). قدّم الإجابة بخطوات مختصرة جدًا (3-6 خطوات كحد أقصى) بدون حشو، واذكر النتيجة النهائية بوضوح.',
                en: 'Explanation mode: Quick. Provide very concise steps (max 3–6) without fluff, and state the final result clearly.',
                tr: 'Açıklama modu: Hızlı. Çok kısa adımlar ver (en fazla 3–6 adım), gereksiz ayrıntılardan kaçın ve sonucu net belirt.'
            },
            detailed: {
                ar: 'وضع الشرح: تفصيلي. قدّم كل خطوة بوضوح مع ذكر القاعدة المستخدمة، ولا تتجاوز أي انتقال منطقي.',
                en: 'Explanation mode: Detailed. Explain each step clearly and mention the rule used; do not skip logical steps.',
                tr: 'Açıklama modu: Detaylı. Her adımı açıkça açıkla ve kullanılan kuralı belirt; mantıksal adımları atlama.'
            }
        };
        return (instructions[mode] && instructions[mode][lang]) || instructions[mode].ar;
    } catch (e) {
        return '';
    }
};

const getLanguageInstruction = () => {
    try {
        const lang = getAppLanguage();
        if (lang === 'en') {
            return 'OUTPUT LANGUAGE OVERRIDE: Respond strictly in English. Do not use Arabic. Treat any Arabic text in the system prompt as formatting examples only. Keep HTML tags and KaTeX delimiters unchanged; translate all human-readable text to English.';
        }
        if (lang === 'tr') {
            return 'OUTPUT LANGUAGE OVERRIDE: Respond strictly in Turkish. Do not use Arabic. Treat any Arabic text in the system prompt as formatting examples only. Keep HTML tags and KaTeX delimiters unchanged; translate all human-readable text to Turkish.';
        }
        return 'لغة الإجابة: العربية الفصحى.';
    } catch (e) {
        return '';
    }
};

const getUserProfileInstruction = () => {
    try {
        const lang = getAppLanguage();
        const name = localStorage.getItem('user_display_name') || '';
        const country = localStorage.getItem('user_country') || '';
        const bio = localStorage.getItem('user_bio') || '';
        const lines = [];
        if (name) lines.push(name);
        if (country) lines.push(country);
        if (bio) lines.push(bio);
        if (lines.length === 0) return '';

        if (lang === 'en') {
            const parts = [];
            if (name) parts.push(`Name: ${name}`);
            if (country) parts.push(`Country: ${country}`);
            if (bio) parts.push(`Bio: ${bio}`);
            return `User profile (remember this when asked about the user):\n${parts.join('\n')}`;
        }
        if (lang === 'tr') {
            const parts = [];
            if (name) parts.push(`İsim: ${name}`);
            if (country) parts.push(`Ülke: ${country}`);
            if (bio) parts.push(`Hakkında: ${bio}`);
            return `Kullanıcı profili (sorulduğunda hatırla):\n${parts.join('\n')}`;
        }
        const parts = [];
        if (name) parts.push(`الاسم: ${name}`);
        if (country) parts.push(`البلد: ${country}`);
        if (bio) parts.push(`نبذة: ${bio}`);
        return `معلومات المستخدم (تذكّرها عند السؤال عنه):\n${parts.join('\n')}`;
    } catch (e) {
        return '';
    }
};

const getUserPreferencesInstruction = () => {
    try {
        const lang = getAppLanguage();
        const stageKey = localStorage.getItem('ai_stage') || 'secondary';
        const mode = localStorage.getItem('ai_explain_mode') || 'detailed';

        const stageLabels = {
            ar: {
                elementary: 'ابتدائي',
                preparatory: 'إعدادي',
                secondary: 'ثانوي',
                higher_ed: 'جامعي/عالي',
                general: 'عام'
            },
            en: {
                elementary: 'Elementary',
                preparatory: 'Middle school',
                secondary: 'High school',
                higher_ed: 'University',
                general: 'General'
            },
            tr: {
                elementary: 'İlkokul',
                preparatory: 'Ortaokul',
                secondary: 'Lise',
                higher_ed: 'Üniversite',
                general: 'Genel'
            }
        };
        const explainLabels = {
            ar: { quick: 'سريع', detailed: 'تفصيلي' },
            en: { quick: 'Quick', detailed: 'Detailed' },
            tr: { quick: 'Hızlı', detailed: 'Detaylı' }
        };
        const labelStage = (stageLabels[lang] && stageLabels[lang][stageKey]) || stageLabels.ar[stageKey] || stageKey;
        const labelExplain = (explainLabels[lang] && explainLabels[lang][mode]) || explainLabels.ar[mode] || mode;

        if (lang === 'en') {
            return `User preferences: Stage = ${labelStage}, Explanation = ${labelExplain}.`;
        }
        if (lang === 'tr') {
            return `Kullanıcı tercihleri: Seviye = ${labelStage}, Açıklama = ${labelExplain}.`;
        }
        return `تفضيلات المستخدم: المرحلة = ${labelStage}، الشرح = ${labelExplain}.`;
    } catch (e) {
        return '';
    }
};

const normalizeAIResponse = (rawText) => {
    let text = String(rawText || '').trim();
    if (!text) return '';

    // Preserve chart blocks and block-math blocks during normalization
    const placeholders = [];
    const stash = (regex, transform) => {
        text = text.replace(regex, (match, ...groups) => {
            const id = placeholders.length;
            const value = transform ? transform(match, ...groups) : match;
            placeholders.push(value);
            return `__PLACEHOLDER_${id}__`;
        });
    };

    stash(/```chart[\s\S]*?```/g);
    stash(/```(?!chart)([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>${escapeHtml(String(code || '').trim())}</code></pre>`;
    });
    text = convertLatexDelimiters(text);
    stash(/\$\$[\s\S]*?\$\$/g);

    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(text);
    if (!hasHtmlTags) {
        const tokens = text.split(/(__PLACEHOLDER_\d+__)/g).filter(Boolean);
        const parts = tokens.map((token) => {
            if (/^__PLACEHOLDER_\d+__$/.test(token)) {
                return token;
            }
            const escaped = escapeHtml(token);
            const trimmed = escaped.trim();
            if (!trimmed) return '';

            const lines = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
            const isBulletList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));
            const isNumberedList = lines.length > 1 && lines.every((line) => /^\d+\.\s+/.test(line));

            if (isBulletList) {
                const items = lines.map((line) => line.replace(/^[-*]\s+/, '')).map((line) => `<li>${line}</li>`).join('');
                return `<ul>${items}</ul>`;
            }

            if (isNumberedList) {
                const items = lines.map((line) => line.replace(/^\d+\.\s+/, '')).map((line) => `<li>${line}</li>`).join('');
                return `<ol>${items}</ol>`;
            }

            const paragraphs = escaped
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`);
            return paragraphs.join('');
        });
        text = parts.join('');
    } else {
        text = text.replace(/[\r\n]+/g, '');
    }

    // Restore placeholders
    text = text.replace(/__PLACEHOLDER_(\d+)__/g, (match, index) => {
        const idx = Number(index);
        return Number.isFinite(idx) && placeholders[idx] ? placeholders[idx] : match;
    });

    text = sanitizeHtml(text);
    return text;
};

// SmartRouter: يحدد النية ويستخرج البيانات البسيطة لتوجيه الطلب للمحللات المحلية
const SmartRouter = {
    patterns: [
        // Matrix: common ops + comprehensive analysis
        { regex: /(تحليل|خصائص|report).*(مصفوفة|matrix)/i, type: 'matrix', action: 'comprehensive_analysis' },
        { regex: /محدد|determinant|det/i, type: 'matrix', action: 'detA' },
        { regex: /معكوس|inverse|inv/i, type: 'matrix', action: 'invA' },
        { regex: /صفّي|رصيف|rowEchelon|rref/i, type: 'matrix', action: 'rowEchelon' },
        { regex: /مرتبة|rank/i, type: 'matrix', action: 'rankA' },

        // Calculus
        { regex: /اشتق|مشتقة|derivative|differentiate/i, type: 'calculus', action: 'differentiate' },
        { regex: /تكامل|integral|∫/i, type: 'calculus', action: 'integrate' },
        { regex: /نهاية|limit/i, type: 'calculus', action: 'limit' },
        { regex: /مجال|مجموعة\s*التعريف|domain/i, type: 'calculus', action: 'domain' },
        { regex: /مدى|range/i, type: 'calculus', action: 'range' },
        { regex: /استمرارية|continuity/i, type: 'calculus', action: 'continuity' },
        { regex: /مقارب|asymptote/i, type: 'calculus', action: 'asymptotes' },

        // Algebra
        { regex: /حل.*معادلة|حل المعادلة|جذور|roots|solve/i, type: 'algebra', action: 'solve_eq' },
        { regex: /متباين|متباينات|متباينة|معادلة\s*غير\s*متساوية|<=|>=|≤|≥|\>|\</, type: 'algebra', action: 'inequality' },
        { regex: /تبسيط|simplify|بسط|تبسيط\s+كسر|simplify\s+frac/i, type: 'algebra', action: 'simplify' },

        // Statistics (descriptive)
        { regex: /\b(متوسط|mean)\b/i, type: 'statistics', action: 'mean' },
        { regex: /\b(تباين|variance)\b/i, type: 'statistics', action: 'variance' },
        { regex: /\b(ارتباط|correlation)\b/i, type: 'statistics', action: 'correlation' },

        // Unit Conversion
        { regex: /حول|تحويل|كم\s+في|convert|from|to|محول|وحدات/i, type: 'unit', action: 'convert' },
    ],

    // Normalize functions to clean editor/inline content and convert Arabic-Indic digits
    normalizeInvisible(s) {
        if (!s) return '';
        return s.replace(/\u200B|\u00A0|\u200E|\u200F/g, '').trim();
    },

    convertArabicIndicDigits(s) {
        if (!s) return s;
        return toLatinDigits(s);
    },

    stripDelimiters(text) {
        return stripMathDelimiters(this.normalizeInvisible(text));
    },

    normalizeForSolver(expr) {
        return normalizeMathExpression(expr, { removeSpaces: true, preferExponent: true });
    },

    looksLikeEquation(text) {
        if (!text) return false;
        const hasOperator = /[=≤≥<>]/.test(text);
        const hasVariable = /[A-Za-z\u0621-\u064A]/.test(text);
        return hasOperator && hasVariable;
    },

    // Try to extract an arithmetic substring (contains at least one operator) and normalize it
    extractArithmetic(text) {
        if (!text) return null;
        const raw = this.convertArabicIndicDigits(this.stripDelimiters(text));

        const isArithmeticCandidate = (expr) => {
            if (!expr) return false;
            if (!/[+\-*/^]/.test(expr)) return false;
            const stripped = expr.replace(/\b(pi|sqrt|sin|cos|tan|log|ln|exp)\b/gi, '');
            return /^[0-9+\-*/^().,]+$/.test(stripped);
        };

        const normalizedWhole = this.normalizeForSolver(raw);
        if (isArithmeticCandidate(normalizedWhole)) return normalizedWhole;

        const inline = String(text).match(/\$([\s\S]*?)\$/);
        if (inline) {
            const innerNorm = this.normalizeForSolver(inline[1]);
            if (isArithmeticCandidate(innerNorm)) return innerNorm;
        }

        const seg = raw.match(/([0-9][0-9\s+\-*/^().,]*[+\-*/^][0-9\s+\-*/^().,]*)/);
        if (seg) {
            const candidate = this.normalizeForSolver(seg[1]);
            if (isArithmeticCandidate(candidate)) return candidate;
        }

        return null;
    },

    parseAndRoute(userText) {
        // 0. Try to extract arithmetic expression from editor / input and evaluate locally
        try {
            const extracted = this.extractArithmetic(userText);
            if (extracted) {
                return localSolver.solve({ type: 'structured_problem', tool: 'algebra_solver', category: 'expressions', method: 'evaluate', expression: extracted });
            }
        } catch (e) { /* ignore */ }

        // 0.a If editor contains only a math-expression element, try to evaluate its latex numerically
        try {
            const editorEl = (window.MathApp && MathApp.dom && MathApp.dom.editor) ? MathApp.dom.editor : null;
            if (editorEl) {
                // Check if editor children are only whitespace/text nodes and exactly one math-expression
                const children = Array.from(editorEl.childNodes).filter(n => {
                    if (n.nodeType === Node.ELEMENT_NODE && n.classList && n.classList.contains('math-expression')) return true;
                    if (n.nodeType === Node.TEXT_NODE) return !/\S/.test(n.textContent);
                    return false;
                });
                const mathSpans = editorEl.querySelectorAll('.math-expression');
                const onlyMath = children.length === editorEl.childNodes.length && mathSpans.length === 1;
                if (onlyMath) {
                    const latex = mathSpans[0].getAttribute('data-latex') || '';
                    let simplified = latex.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1)/($2)').replace(/\\cdot|\\times/g, '*').replace(/\\\s*/g, '');
                    simplified = simplified.replace(/\s+/g, '');
                    if (/^[\d+\-*/^().,]+$/.test(simplified)) {
                        return localSolver.solve({ type: 'structured_problem', tool: 'algebra_solver', category: 'expressions', method: 'evaluate', expression: simplified });
                    }
                }
            }
        } catch (e) { /* ignore */ }

        // 0.b Inline $...$ arithmetic inside a sentence: extract and try to evaluate inner part
        const inlineMatch = (typeof userText === 'string') ? userText.match(/\$([\s\S]*?)\$/) : null;
        if (inlineMatch) {
            const inner = this.normalizeForSolver(inlineMatch[1].trim());
            const stripped = inner.replace(/\b(pi|sqrt|sin|cos|tan|log|ln|exp)\b/gi, '');
            if (/^[\d+\-*/^().,]+$/.test(stripped) && /[+\-*/^]/.test(inner)) {
                return localSolver.solve({ type: 'structured_problem', tool: 'algebra_solver', category: 'expressions', method: 'evaluate', expression: inner });
            }
        }

        // Binary matrix operations: detect two matrices with an operator between them (LaTeX or JSON arrays)
        try {
            const bin = this.extractBinaryMatrices(userText);
            if (bin) {
                const problem = {
                    type: 'structured_problem',
                    tool: 'matrix_solver',
                    operation: bin.op, // add | subtract | multiply | scalarMultiply | power
                    matrixA: bin.A,
                    matrixB: bin.B
                };
                return localSolver.solve(problem);
            }
        } catch (e) { /* ignore */ }

        // 1. تحديد النية
        const intent = this.patterns.find(p => p.regex.test(userText));
        if (!intent) {
            const cleaned = this.stripDelimiters(userText);
            const matrixOnly = this.extractData(cleaned, 'matrix');
            if (matrixOnly && matrixOnly.matrix) {
                return localSolver.solve({
                    type: 'structured_problem',
                    tool: 'matrix_solver',
                    operation: 'comprehensive_analysis',
                    matrixA: matrixOnly.matrix
                });
            }
            if (this.looksLikeEquation(cleaned)) {
                const eqProblem = {
                    type: 'structured_problem',
                    tool: 'algebra_solver',
                    category: 'equations',
                    equation: cleaned.trim()
                };
                return localSolver.solve(eqProblem);
            }
            return null;
        }

        // 2. استخراج البيانات حسب النوع
        const extracted = this.extractData(userText, intent.type);
        if (!extracted) return null;

        // 3. بناء جسم الطلب المهيكل وتوجيهه للمحلل المحلي المناسب
        if (intent.type === 'matrix') {
            const problem = {
                type: 'structured_problem',
                tool: 'matrix_solver',
                operation: intent.action === 'comprehensive_analysis' ? 'comprehensive_analysis' : intent.action,
                matrixA: extracted.matrix
            };
            return localSolver.solve(problem);
        }

        if (intent.type === 'algebra') {
            // Handle inequalities and simplification specially
            if (intent.action === 'inequality') {
                const cleanedText = this.stripDelimiters(userText);
                const inequalityMatch = cleanedText.match(/([\s\S]*?)(<=|>=|≤|≥|<|>)([\s\S]*)/);
                if (!inequalityMatch) return null;
                const left = inequalityMatch[1].trim();
                const op = inequalityMatch[2];
                const right = inequalityMatch[3].trim();

                const eq = `${left} ${op} ${right}`;
                const problem = {
                    type: 'structured_problem',
                    tool: 'algebra_solver',
                    category: 'equations',
                    method: 'inequality',
                    inequality: eq,
                    operator: op,
                    left: left,
                    right: right
                };
                return localSolver.solve(problem);
            }

            if (intent.action === 'simplify') {
                // extract expression (between quotes or after keyword)
                const cleanedText = this.stripDelimiters(userText);
                const exprMatch = cleanedText.match(/(?:تبسيط|simplify|بسط)[:\s]*([\s\S]+)/i);
                const expr = exprMatch ? exprMatch[1].trim() : cleanedText.trim();
                if (!expr) return null;
                return localSolver.solve({ type: 'structured_problem', tool: 'algebra_solver', category: 'expressions', method: 'simplifyRational', expression: expr });
            }

            const eq = extracted.equation;
            let eqType = 'linear';
            const normalizedEq = this.normalizeForSolver(eq);
            if (/\^2|²|([xysصس])\s*\*?\s*\1/i.test(normalizedEq)) eqType = 'quadratic';

            const problem = {
                type: 'structured_problem',
                tool: 'algebra_solver',
                category: 'equations',
                type: eqType,
                equation: eq
            };
            return localSolver.solve(problem);
        }

        if (intent.type === 'calculus') {
            const extractFunction = (text) => {
                let cleaned = this.stripDelimiters(String(text || ''));
                const fxMatch = cleaned.match(/f\s*\(\s*x\s*\)\s*=\s*([\s\S]+)/i);
                if (fxMatch) cleaned = fxMatch[1];
                cleaned = cleaned
                    .replace(/(?:اشتق(?:|\s+)|مشتقة|تكامل|نهاية|مجال|مجموعة\s*التعريف|مدى|استمرارية|مقارب|limit|integral|domain|range|continuity|asymptote)/gi, '')
                    .replace(/من\s*[-\d\.]+\s*(?:إلى|الى|لـ|ل)\s*[-\d\.]+/gi, '')
                    .replace(/عند\s*[-\d\.]+/gi, '')
                    .replace(/x\s*(?:->|→)\s*[-\d\.]+/gi, '')
                    .replace(/^\s*[:\-]\s*/, '')
                    .trim();
                return cleaned || String(text || '').trim();
            };

            const normalizedText = this.convertArabicIndicDigits(userText);
            let operation = intent.action || 'differentiate';
            const params = {};

            if (operation === 'integrate') {
                const boundMatch = normalizedText.match(/من\s*([-\d\.]+)\s*(?:إلى|الى|لـ|ل)\s*([-\d\.]+)/i);
                if (boundMatch) {
                    operation = 'integrate_definite';
                    params.a = boundMatch[1];
                    params.b = boundMatch[2];
                } else {
                    operation = 'integrate_indefinite';
                }
            }

            if (operation === 'limit' || operation === 'continuity') {
                const limitMatch = normalizedText.match(/(?:عند|x\s*(?:->|→))\s*([-\d\.]+)/i);
                if (limitMatch) params.paramValue = limitMatch[1];
            }

            const expr = extractFunction(userText);
            const problem = {
                type: 'structured_problem',
                tool: 'calculus_solver',
                operation,
                function_latex: expr,
                params
            };
            return localSolver.solve(problem);
        }
        if (intent.type === 'unit') {
        const extracted = this.extractUnitData(userText);
          if (extracted) {
        const result = unitSolver.solve({
            value: extracted.value,
            fromUnit: extracted.fromUnit,
            toUnit: extracted.toUnit,
            category: extracted.category
        });
        if (result && !result.error && localSolver && typeof localSolver.assessConfidence === 'function') {
            result.confidenceReport = localSolver.assessConfidence({
                type: 'structured_problem',
                tool: 'unit_converter',
                value: extracted.value,
                fromUnit: extracted.fromUnit,
                toUnit: extracted.toUnit,
                category: extracted.category
            }, result);
        }
        return unitSolver.formatAsHTML(result);
       }
          return null;
         }

        if (intent.type === 'statistics') {
            // استخراج القيم الرقمية
            const values = extracted.values;
            if (!values || values.length === 0) return null;
            const op = intent.action; // mean/variance/correlation

            if (op === 'correlation') {
                // محاولة استخراج قائمتين: [1,2,3] و [4,5,6]
                const pairMatch = userText.match(/\[([\d\s,\.-]+)\].*\[([\d\s,\.-]+)\]/);
                if (pairMatch) {
                    const v1 = pairMatch[1].split(/[,\s]+/).filter(Boolean).map(Number);
                    const v2 = pairMatch[2].split(/[,\s]+/).filter(Boolean).map(Number);
                    return localSolver.solve({ type: 'structured_problem', tool: 'statistics_solver', category: 'regression', operation: 'correlation', x: v1, y: v2 });
                }
                return null;
            }

            return localSolver.solve({ type: 'structured_problem', tool: 'statistics_solver', category: 'descriptiveStatistics', operation: op, values: values });
        }

        return null;
    },

    extractData(text, type) {
        // استخراج المصفوفة بصيغة JSON-like [[1,2],[3,4]] أو بصيغة LaTeX \begin{pmatrix} ... \end{pmatrix}
        if (type === 'matrix') {
            const cleanedText = this.stripDelimiters(text);
            // Attempt JSON array first
            const mMatch = cleanedText.match(/\[\s*\[[\s\S]*?\]\s*\]/);
            if (mMatch) {
                const raw = mMatch[0];
                try {
                    const parsed = JSON.parse(this.convertArabicIndicDigits(raw).replace(/\s+/g, ''));
                    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
                        return { matrix: parsed };
                    }
                } catch (e) {
                    try {
                        const normalizedRaw = this.convertArabicIndicDigits(raw).replace(/([0-9])[،]([0-9])/g, '$1.$2');
                        const rows = normalizedRaw.replace(/^\[\s*\[/, '[').replace(/\]\s*\]$/,']').split(/\],\s*\[/).map(r => r.replace(/\[|\]|\s/g, ''));
                        const mat = rows.map(r => r.split(',').filter(s=>s!=='').map(n=>Number(n)));
                        if (mat.every(r => r.every(n => !isNaN(n)))) return { matrix: mat };
                    } catch (ee) { /* fallthrough */ }
                }
            }

            // Then try LaTeX matrices like \begin{pmatrix} ... \end{pmatrix}
            try {
                const latexMatch = cleanedText.match(/\\begin\{(pmatrix|bmatrix|matrix)\}([\s\S]*?)\\end\{(?:pmatrix|bmatrix|matrix)\}/);
                if (latexMatch) {
                    let content = latexMatch[2];
                    // replace common latex constructs
                    // split rows by \\\\ (latex new row)
                    const rows = content.split(/\\\\/).map(r => r.trim()).filter(Boolean);
                    const mat = rows.map(row => row.split('&').map(c => {
                        const raw = (c || '').trim();
                        const normalized = this.normalizeForSolver(raw);
                        // try to evaluate the cell as expression (handles (1)/(2), decimals, etc.)
                        let num = NaN;
                        try {
                            if (window.math && typeof window.math.evaluate === 'function') {
                                const val = window.math.evaluate(normalized);
                                if (typeof val === 'number' && !isNaN(val)) num = val;
                                else if (val && val.valueOf && typeof val.valueOf === 'function') {
                                    const v = Number(val.valueOf()); if (!isNaN(v)) num = v;
                                }
                            }
                        } catch (e) { /* ignore */ }
                        if (isNaN(num)) {
                            // fallback parse float (remove commas)
                            const cleaned = normalized.replace(/,/g, '.').replace(/[^0-9+\-\.eE()\/\*]/g, '');
                            num = parseFloat(cleaned);
                        }
                        return num;
                    }));
                    if (mat.length > 0 && mat.every(r => r.every(n => !isNaN(n)))) return { matrix: mat };
                }
            } catch (e) { /* ignore */ }

            const looseMatrix = this.parseLooseMatrix(cleanedText);
            if (looseMatrix) return { matrix: looseMatrix };

            return null;
        }

        if (type === 'algebra') {
            const cleanedText = this.stripDelimiters(text);
            const eqMatch = cleanedText.match(/([\s\S]*?=|حل(?:\s+)?)([\s\S]+)/i);
            if (eqMatch) {
                const candidate = (eqMatch[2] || eqMatch[1] || cleanedText).trim();
                const cleaned = candidate.replace(/^(المعادلة|العدد|الوظيفة)\s*/i, '').trim();
                return { equation: cleaned };
            }
            return { equation: cleanedText.trim() };
        }

        if (type === 'statistics') {
            const cleanedText = this.convertArabicIndicDigits(this.stripDelimiters(text)).replace(/([0-9])[،,]([0-9])/g, '$1.$2');
            // حاول استخراج قائمة الأرقام بين [] أو منفصلة بواسطة ,
            const bracketMatch = cleanedText.match(/\[([\d\s,\.-]+)\]/);
            if (bracketMatch) {
                const values = bracketMatch[1].split(/[,\s]+/).filter(Boolean).map(Number);
                return { values: values.filter(v => !isNaN(v)) };
            }
            // استخراج أي أرقام مفصولة بفواصل
            const numbers = cleanedText.match(/-?\d+(?:\.\d+)?/g);
            if (numbers) return { values: numbers.map(Number) };

            return { values: [] };
        }

        return null;
    }
    ,
    extractUnitData(text) {
    // استخراج الرقم من النص
    const cleanedText = this.convertArabicIndicDigits(this.stripDelimiters(text));
    const numMatch = cleanedText.match(/(\d+(?:[.,]\d+)?)/);
    if (!numMatch) return null;
    const value = parseFloat(numMatch[1].replace(',', '.'));

    // محاولة إيجاد الوحدات من قاعدة البيانات
    const categories = Object.keys(unitSolver.unitsData);
    let foundUnits = [];
    
    for (const category of categories) {
        const units = unitSolver.unitsData[category];
        for (const [key, info] of Object.entries(units)) {
            // البحث عن اسم الوحدة أو رمزها
            if (text.includes(info.name) || text.includes(info.symbol)) {
                foundUnits.push({ key, category, name: info.name, symbol: info.symbol });
            }
        }
    }

    // يجب أن نجد وحدتين على الأقل من نفس الفئة
    if (foundUnits.length < 2) return null;

    // تحقق من أن كلا الوحدتين من نفس الفئة
    const firstCategory = foundUnits[0].category;
    if (!foundUnits.every(u => u.category === firstCategory)) {
        return null; // الوحدات من فئات مختلفة
    }

    return {
        value,
        fromUnit: foundUnits[0].key,
        toUnit: foundUnits[1].key,
        category: firstCategory
    };
},

    // Parse loose matrix blocks like (1 2; 3 4) or [1,2|3,4]
    parseLooseMatrix(text) {
        if (!text) return null;
        const cleaned = this.stripDelimiters(text);

        let body = null;
        const bracketMatch = cleaned.match(/[\[\(\{]([\s\S]*?)[\]\)\}]/);
        if (bracketMatch && bracketMatch[1]) {
            body = bracketMatch[1];
        } else {
            const pipeMatch = cleaned.match(/\|([\s\S]*?)\|/);
            if (pipeMatch && pipeMatch[1]) {
                body = pipeMatch[1];
            } else {
                body = cleaned;
            }
        }

        if (!/\d/.test(body)) return null;

        let rows = body.split(/\\\\|;|؛|\n+/).map(r => r.trim()).filter(Boolean);
        if (rows.length < 2 && body.includes('|')) {
            rows = body.split('|').map(r => r.trim()).filter(Boolean);
        }

        if (rows.length === 0) return null;

        const matrix = rows.map((row) => {
            const cols = row.split(/&|,|\s+/).filter(Boolean);
            return cols.map((cell) => {
                const normalized = this.normalizeForSolver(cell);
                if (!normalized) return NaN;
                try {
                    if (window.math && typeof window.math.evaluate === 'function') {
                        const val = window.math.evaluate(normalized);
                        if (typeof val === 'number' && Number.isFinite(val)) return val;
                        if (val && val.valueOf && typeof val.valueOf === 'function') {
                            const v = Number(val.valueOf());
                            if (Number.isFinite(v)) return v;
                        }
                    }
                } catch (e) { /* ignore */ }
                const fallback = Number(normalized);
                return Number.isFinite(fallback) ? fallback : NaN;
            });
        });

        const totalCells = matrix.reduce((sum, r) => sum + r.length, 0);
        const colsCount = matrix[0] ? matrix[0].length : 0;
        if (totalCells < 2 || colsCount === 0) return null;
        if (matrix.some(r => r.length !== colsCount)) return null;
        if (matrix.some(r => r.some(v => !Number.isFinite(v)))) return null;

        return matrix;
    },

    // Parse a LaTeX matrix string (including \begin...\end) and return numeric matrix if possible
    parseLatexMatrix(latexString) {
        try {
            const parsed = this.extractData(latexString, 'matrix');
            return parsed ? parsed.matrix : null;
        } catch (e) {
            return null;
        }
    },

    // Detect matrix operation from a short string between two matrices
    detectMatrixOpFromString(s) {
        if (!s) return null;
        const small = s.replace(/\s+/g, ' ').toLowerCase();
        if (/[+]/.test(s) || /\b(جمع|مجموع|sum)\b/.test(small)) return 'add';
        if (/[-]/.test(s) || /\b(طرح|فرق|subtract)\b/.test(small)) return 'subtract';
        if (/\b(\*|×|\\times|\\cdot|ضرب|multiply|product)\b/.test(s) || /[×*·]/.test(s)) return 'multiply';
        // Could detect scalar multiply like 2 \times \begin{pmatrix} ... if one side numeric
        if (/\d+\s*[×x\*]/.test(s)) return 'scalarMultiply';
        return null;
    },

    // Try to find two matrices in the text (JSON or LaTeX) and detect operation between them
    extractBinaryMatrices(text) {
        if (!text) return null;
        const sourceText = this.stripDelimiters(text);

        // 1) JSON-like matrices
        const jsonRegex = /\[\s*\[[\s\S]*?\]\s*\]/g;
        const jsonMatches = [...sourceText.matchAll(jsonRegex)];
        if (jsonMatches.length >= 2) {
            const m1 = jsonMatches[0];
            const m2 = jsonMatches[1];
            const between = sourceText.slice(m1.index + m1[0].length, m2.index);
            const op = this.detectMatrixOpFromString(between) || this.detectMatrixOpFromString(sourceText);
            if (!op) return null;
            const A = (this.extractData(m1[0], 'matrix') || {}).matrix;
            const B = (this.extractData(m2[0], 'matrix') || {}).matrix;
            if (A && B) return { op, A, B };
        }

        // 2) LaTeX matrices
        const latexRegex = /\\begin\{(?:pmatrix|bmatrix|matrix)\}[\s\S]*?\\end\{(?:pmatrix|bmatrix|matrix)\}/g;
        const latexMatches = [...sourceText.matchAll(latexRegex)];
        if (latexMatches.length >= 2) {
            const m1 = latexMatches[0];
            const m2 = latexMatches[1];
            const between = sourceText.slice(m1.index + m1[0].length, m2.index);
            const op = this.detectMatrixOpFromString(between) || this.detectMatrixOpFromString(sourceText);
            if (!op) return null;
            const A = this.parseLatexMatrix(m1[0]);
            const B = this.parseLatexMatrix(m2[0]);
            if (A && B) return { op, A, B };
        }

        // 3) Loose bracketed matrices like (1 2; 3 4) or [1,2|3,4]
        const looseRegex = /[\[\(\{][\s\S]*?[\]\)\}]/g;
        const looseMatches = [...sourceText.matchAll(looseRegex)];
        if (looseMatches.length >= 2) {
            const m1 = looseMatches[0];
            const m2 = looseMatches[1];
            const between = sourceText.slice(m1.index + m1[0].length, m2.index);
            const op = this.detectMatrixOpFromString(between) || this.detectMatrixOpFromString(sourceText);
            if (!op) return null;
            const A = this.parseLooseMatrix(m1[0]);
            const B = this.parseLooseMatrix(m2[0]);
            if (A && B) return { op, A, B };
        }

        return null;
    }
};

export const chat = {
    send(dataToSend = null) {
        let userText; // النص الذي سيعرض للمستخدم
        let dataForSolver; // البيانات التي سترسل للمحلل
        let isStructured = (dataToSend && dataToSend.type === 'structured_problem');
        const isImageAttached = !!MathApp.state.selectedImageBase64;
        const appLang = getAppLanguage();
        const allowLocalSolve = appLang === 'ar';
        
        if (isStructured) {
            // إذا كانت البيانات منظمة، جهزها للمحلل
            dataForSolver = dataToSend;
            // وقم بتنسيقها للعرض في الواجهة
            if (dataToSend.tool === 'geometry_solver') {
                userText = MathApp.GeometryWorkspace.formatProblemToHTML(dataToSend);
            } else if (dataToSend.tool === 'matrix_solver') {
                userText = MathApp.MatrixWorkspace.formatProblemToHTML(dataToSend);
            }
            else if (dataToSend.tool === 'calculus_solver') { 
                userText = MathApp.CalculusWorkspace.formatProblemToHTML(dataToSend);
            }
            else if (dataToSend.tool === 'algebra_solver') { 
                userText = MathApp.AlgebraWorkspace.formatProblemToHTML(dataToSend);
            }
            else if (dataToSend.tool === 'statistics_solver') { 
                userText = MathApp.StatisticsWorkspace.formatProblemToHTML(dataToSend);
            }
            else if (dataToSend.tool === 'unit_converter') { 
                if (MathApp.UnitConverterWorkspace && typeof MathApp.UnitConverterWorkspace.formatProblemToHTML === 'function') {
                    userText = MathApp.UnitConverterWorkspace.formatProblemToHTML(dataToSend);
                } else {
                    userText = dataToSend.displayText || `تحويل وحدات: ${dataToSend.value} ${dataToSend.fromUnit} → ${dataToSend.toUnit}`;
                }
            }
            else {
                userText = "سؤال من أداة غير معروفة.";
            }
        } else {
            // إذا كان مجرد نص من المحرر
            const editorContent = MathApp.editor.getContent();
            userText = MathApp.editor.convertToText(editorContent);
            dataForSolver = userText;
        }

        // التحقق من وجود شيء لإرساله
        if (!userText && !isImageAttached && !MathApp.state.attachedFileContent) {
            MathApp.ui.showToast("الرجاء إدخال سؤال أو إرفاق ملف.");
            return;
        }

        // عرض رسالة المستخدم
        let imageDisplayData = isImageAttached ? { src: `data:${MathApp.state.selectedImageMimeType};base64,${MathApp.state.selectedImageBase64}` } : null;
        this.displayMessage(userText, 'incoming', false, imageDisplayData);

        // تحضير البيانات للمحفوظات
        const parts = [];
        if (isImageAttached) {
            parts.push({ inlineData: { data: MathApp.state.selectedImageBase64, mimeType: MathApp.state.selectedImageMimeType } });
        }
        
        let finalText = userText;
        if (MathApp.state.attachedFileContent) {
            finalText = `[ملف مرفق: ${MathApp.state.attachedFileName}]\n\n${MathApp.state.attachedFileContent}\n\n---\n\nسؤال المستخدم: ${userText}`;
        }
        
        parts.push({ text: finalText });
        parts.push({ text: `\n\n[Stage Context: ${MathApp.stage.getContext()}]` });

        MathApp.state.chatHistory.push({ role: "user", parts: parts });
        try {
            console.log('chat.send: chatHistory length=', MathApp.state.chatHistory.length, 'last=', MathApp.state.chatHistory[MathApp.state.chatHistory.length - 1]);
        } catch (e) {
            console.warn('chat.send: failed to log chatHistory', e);
        }
        MathApp.editor.clear(false);
        MathApp.file.clearAttachment();
        // حفظ تلقائي
        MathApp.data.saveChat({ silent: true });

        // Debug logging for send
        try {
            console.log('chat.send: isStructured=', isStructured, 'tool=', dataToSend && dataToSend.tool, 'dataForSolver=', dataForSolver, 'isImageAttached=', isImageAttached);
            console.log('chat.send: navigator.onLine=', navigator.onLine);
        } catch (e) {
            console.warn('chat.send: debug log failed', e);
        }

        // محاولة حل المسألة محلياً أولاً (في العربية فقط حالياً)
        let localSolution = null;
        let localTypingBubble = null;
        if (allowLocalSolve) {
            const localComputeTimer = setTimeout(() => {
                try {
                    localTypingBubble = this.displayMessage('⏳ جاري الحساب محلياً... يرجى الانتظار', 'outgoing', true);
                } catch (e) { /* ignore */ }
            }, 2000);

            try {
                // حاول التحليل/التوجيه الذكي للنص الحر أولاً
                if (!isStructured) {
                    try {
                        const smartRes = SmartRouter.parseAndRoute(userText);
                        if (smartRes) {
                            localSolution = smartRes;
                            console.log('chat.send: SmartRouter handled message locally.');
                        }
                    } catch (e) {
                        console.warn('chat.send: SmartRouter error', e);
                    }
                }

                // إذا لم يعالج SmartRouter، فاجرب الموجه التقليدي للمحلل المحلي
                if (!localSolution) {
                    localSolution = localSolver.solve(dataForSolver);
                }
            } finally {
                clearTimeout(localComputeTimer);
                try { if (localTypingBubble && localTypingBubble.remove) localTypingBubble.remove(); } catch (e) { /* ignore */ }
            }
        }

        if (localSolution) {
            // إذا وجد المحلل المحلي حلاً، حسنه واظهره مع شرح خطوة بخطوة وتلميحات
            setTimeout(() => {
                try {
                    const isHtml = (typeof localSolution === 'string') && /<\/?[a-z][\s\S]*>/i.test(localSolution);
                    if (isHtml) {
                        this.displayMessage(localSolution, 'outgoing');
                    } else {
                        const enhanced = aiAssistant.enhanceLocalSolution(userText, localSolution);
                        this.displayMessage(enhanced.html, 'outgoing');
                    }
                    MathApp.state.chatHistory.push({ role: 'model', parts: [{ text: (typeof localSolution === 'string') ? localSolution : JSON.stringify(localSolution) }] });
                } catch (e) {
                    // fallback: عرض الحل الخام إذا فشل أي خط
                    this.displayMessage(localSolution, 'outgoing');
                    MathApp.state.chatHistory.push({ role: 'model', parts: [{ text: (typeof localSolution === 'string') ? localSolution : JSON.stringify(localSolution) }] });
                }
                this.scrollToBottom();
                // حفظ تلقائي
                MathApp.data.saveChat({ silent: true });
            }, 300);
        } else {
            // إذا لم يجد حلاً محلياً، أرسل إلى الذكاء الاصطناعي
            if (!navigator.onLine) {
                this.displayMessage('<h3>⚠️ أنت غير متصل</h3><p>حل هذه المسألة يتطلب اتصالاً بالذكاء الاصطناعي.</p>', 'outgoing');
            } else {
                // تجنب استدعاءات متزامنة قد تخلط المحادثة
                if (MathApp.state.aiCallInProgress) {
                    console.warn('chat.send: AI call already in progress — queuing is not allowed.');
                    this.displayMessage('<p>هناك طلب سابق جارٍ — الرجاء الانتظار لبعض الثواني ثم المحاولة مجدداً.</p>', 'outgoing');
                    return;
                }

                try {
                    console.log('chat.send: No local solution. Will call AI. parts.length=', parts.length, 'partsSample=', parts.slice(0,3).map(p => ({ text: (p.text || '').slice(0,200) })));
                } catch (e) {
                    console.warn('chat.send: failed to log parts', e);
                }
                const typingBubble = this.displayMessage('... جاري الرد', 'outgoing', true);
                MathApp.state.aiCallInProgress = true;
                this.callAI(parts, typingBubble).finally(() => {
                    MathApp.state.aiCallInProgress = false;
                });
            }
        }
    },

    async callAI(userParts, typingBubble) {
        if (!MathApp.config || !MathApp.config.apiBaseUrl) {
            console.warn('callAI aborted: missing API base URL (MathApp.config.apiBaseUrl).');
            if (typingBubble && typingBubble.remove) typingBubble.remove();
            this.displayMessage('<h3>⚠️ إعداد الذكاء غير مكتمل</h3><p>لم يتم إعداد خادم الوسيط. الرجاء ضبط <code>API_BASE_URL</code> في <code>js/config.js</code>.</p>', 'outgoing');
            return;
        }
        if (!MathApp.config.model) {
            console.warn('callAI aborted: missing model (MathApp.config.model).');
            if (typingBubble && typingBubble.remove) typingBubble.remove();
            this.displayMessage('<h3>⚠️ إعداد الذكاء غير مكتمل</h3><p>لم يتم تحديد النموذج (model) في الإعدادات.</p>', 'outgoing');
            return;
        }

        const API_URL = (() => {
            const base = MathApp.config.apiBaseUrl || '/api/gemini';
            const model = MathApp.config.model;
            try {
                const url = new URL(base, window.location.origin);
                url.searchParams.set('model', model);
                return url.toString();
            } catch (e) {
                const sep = base.includes('?') ? '&' : '?';
                return `${base}${sep}model=${encodeURIComponent(model)}`;
            }
        })();
        const historyForAPI = MathApp.state.chatHistory
            .filter(msg => msg.role !== 'system')
            .slice(-10);

        // Use AbortController to timeout the fetch if it hangs
        const controller = new AbortController();
        const timeoutMs = 15000; // 15 seconds
        const timeout = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        try {
            const explanationInstruction = getExplanationInstruction();
            const languageInstruction = getLanguageInstruction();
            const profileInstruction = getUserProfileInstruction();
            const prefsInstruction = getUserPreferencesInstruction();
            const systemText = [languageInstruction, MathApp.config.systemPrompt, explanationInstruction, profileInstruction, prefsInstruction].filter(Boolean).join('\n\n');

            const requestBody = {
                contents: historyForAPI,
                systemInstruction: {
                    parts: [{ text: systemText }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            };

            try {
                const safeSummary = historyForAPI.map(h => ({ role: h.role, parts: h.parts && h.parts.map(p => ({ text: (p.text || '').slice(0,300) })) }));
                console.log('callAI: START API_CALL', { API_URL, safeSummaryLength: safeSummary.length });
            } catch (e) {
                console.warn('callAI: failed to build history summary', e);
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const text = await response.text();
                let apiMessage = text;
                try {
                    const parsed = JSON.parse(text);
                    apiMessage = parsed?.error?.message || text;
                } catch (e) { /* ignore non-JSON */ }
                console.error('API Error Response (text):', text);
                throw new Error(`HTTP ${response.status}: ${apiMessage}`);
            }

            const data = await response.json();
            const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من الحصول على إجابة.";
            const normalizedResponse = normalizeAIResponse(aiResponseText) || aiResponseText;

            // remove typing bubble and show result (enhanced with aiAssistant)
            try { typingBubble.remove(); } catch (e) { /* ignore */ }
            // عرض الرد كما هو بدون تعزيز لتجنب خربطة التنسيق
            this.displayMessage(normalizedResponse, 'outgoing');
            MathApp.state.chatHistory.push({ role: "model", parts: [{ text: normalizedResponse }] });
            // حفظ تلقائي
            MathApp.data.saveChat({ silent: true });

        } catch (error) {
            clearTimeout(timeout);
            console.error('Gemini API Error or aborted:', error);
            try { typingBubble.remove(); } catch (e) { /* ignore */ }

            // Show a retryable error message with a button
            const errorHtml = document.createElement('div');
            const rawMessage = (error && error.message) ? error.message : 'حدث خطأ غير متوقع.';
            let hint = '';
            if (/models\/.*not found/i.test(rawMessage)) {
                hint = 'تأكد من اسم النموذج (model) في الإعدادات أو جرّب نموذجًا افتراضيًا مثل gemini-2.5-flash.';
            } else if (/API_KEY|key/i.test(rawMessage)) {
                hint = 'تأكد من صحة مفتاح API_KEY في ملف .env على الخادم.';
            } else if (/timeout|aborted/i.test(rawMessage)) {
                hint = 'قد يكون الاتصال بطيئًا، جرّب إعادة المحاولة.';
            }
            errorHtml.innerHTML = `<div style="padding:10px; border:1px solid #f2dede; background: var(--bg-container); border-radius:6px;">
                <div style="margin-top:4px; font-weight:600;">تعذر الاتصال بالذكاء الاصطناعي</div>
                <div style="margin-top:8px">${rawMessage}</div>
                ${hint ? `<div style="margin-top:8px; opacity:0.9;">${hint}</div>` : ''}
                <div style="margin-top:10px"><button class="ai-retry-btn">أعد المحاولة</button></div>
            </div>`;

            const containerHtml = errorHtml.innerHTML;
            this.displayMessage(containerHtml, 'outgoing');

            // Add a handler for retry (delegate: last .ai-retry-btn)
            setTimeout(() => {
                const lastBtn = document.querySelector('.ai-retry-btn');
                if (!lastBtn) return;
                lastBtn.addEventListener('click', () => {
                    // Show typing bubble and retry
                    const tb = this.displayMessage('... جاري إعادة المحاولة', 'outgoing', true);
                    MathApp.state.aiCallInProgress = true;
                    this.callAI(userParts, tb).finally(() => { MathApp.state.aiCallInProgress = false; });
                });
            }, 50);

            // keep chat history intact; do not remove the user's message
        }

        this.scrollToBottom();
    },


    displayMessage(rawContent, type, isTypingIndicator = false, imageData = null) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${type}`;

        if (type === 'outgoing') {
            const lang = getAppLanguage();
            const isLtr = lang === 'en' || lang === 'tr';
            bubble.setAttribute('dir', isLtr ? 'ltr' : 'rtl');
            if (isLtr) {
                bubble.classList.add('ltr');
            } else {
                bubble.classList.remove('ltr');
            }
        }
        
        if (isTypingIndicator) {
            bubble.innerHTML = `<span class="typing-indicator">${rawContent}</span>`;
        } else {
            if (imageData) {
                const img = document.createElement('img');
                img.src = imageData.src;
                bubble.appendChild(img);
            }
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = this.processForDisplay(rawContent);
            bubble.appendChild(contentDiv);

            if (type === 'outgoing') {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                actionsDiv.innerHTML = `
                    <button class="action-icon-btn share-btn" title="مشاركة كصورة">🔗</button>
                    <button class="action-icon-btn rate-good-btn" title="إجابة جيدة">👍</button>
                    <button class="action-icon-btn rate-bad-btn" title="إجابة سيئة">👎</button>
                `;
                bubble.appendChild(actionsDiv);
            }
        }
        MathApp.dom.chatMessages.appendChild(bubble);
        this.scrollToBottom();
        return bubble;
    },

    processForDisplay(rawText) {
        let html = rawText.trim();

        // معالجة رموز Chart.js
        html = html.replace(/```chart\s*([\s\S]*?)```/g, (match, jsonContent) => {
            try {
                const chartConfig = JSON.parse(jsonContent.trim());
                const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
                
                setTimeout(() => {
                    MathApp.chart.render(chartId, chartConfig);
                }, 100);
                
                return `<div class="chart-container" style="margin: 10px 0;"><canvas id="${chartId}"></canvas></div>`;
            } catch (e) {
                console.error('Chart.js parsing error:', e);
                return `<div style="color: var(--delete-bg); padding: 10px; border: 1px solid var(--delete-bg); border-radius: 5px; margin: 10px 0;">خطأ في تحليل بيانات الرسم البياني</div>`;
            }
        });

        // معالجة المعادلات الكتلية $$...$$
        html = html.replace(/\$\$(.*?)\$\$/gs, (match, p1) => {
            return `<div class="katex-block-container">
                <span class="math-expression" data-latex="${p1.trim()}" 
                onclick="MathApp.math.editExisting(this)"></span>
            </div>`;
        });

        // معالجة المعادلات المضمنة $...$
        html = html.replace(/\$(.*?)\$/g, (match, p1) => {
            return `<span class="math-expression" data-latex="${p1.trim()}" 
                style="margin: 0 2px; display: inline-block;" 
                onclick="MathApp.math.editExisting(this)"></span>`;
        });
        
        // رسم KaTeX بعد إنشاء كل العناصر
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        tempDiv.querySelectorAll('.math-expression').forEach(span => {
            const latex = span.getAttribute('data-latex');
            try {
                katex.render(latex, span, {
                    throwOnError: false,
                    displayMode: span.parentElement.tagName === 'DIV'
                });
            } catch (e) {
                console.error("KaTeX Error:", e);
                span.textContent = `[خطأ في المعادلة: ${latex}]`;
            }
        });
        
        // إزالة وسوم <p> الفارغة
        tempDiv.querySelectorAll('p:empty').forEach(p => p.remove());

        return tempDiv.innerHTML;
    },

    scrollToBottom() {
        MathApp.dom.chatMessages.scrollTop = MathApp.dom.chatMessages.scrollHeight;
    },

    startNew() {
        MathApp.ui.showConfirm('هل أنت متأكد من بدء محادثة جديدة؟ سيتم حذف السجل الحالي (دون التأثير على المحفوظات).', () => {
            MathApp.state.chatHistory = MathApp.state.chatHistory.slice(0, 2);
            MathApp.state.currentChatId = null;
            MathApp.dom.chatMessages.innerHTML = '';
            MathApp.editor.clear(false);
            MathApp.displayWelcomeMessage();
        });
    }
}
