// js/features/solvers/unitSolver.js

export const unitSolver = {
    // قاعدة بيانات الوحدات (نقلناها هنا لتكون مركزية)
    unitsData: {
        length: {
            meter: { name: 'متر', symbol: 'm', factor: 1 },
            centimeter: { name: 'سنتيمتر', symbol: 'cm', factor: 0.01 },
            kilometer: { name: 'كيلومتر', symbol: 'km', factor: 1000 },
            millimeter: { name: 'ميليمتر', symbol: 'mm', factor: 0.001 },
            mile: { name: 'ميل', symbol: 'mi', factor: 1609.344 },
            yard: { name: 'ياردة', symbol: 'yd', factor: 0.9144 },
            foot: { name: 'قدم', symbol: 'ft', factor: 0.3048 },
            inch: { name: 'إنش', symbol: 'in', factor: 0.0254 }
        },
        mass: {
            kilogram: { name: 'كيلوغرام', symbol: 'kg', factor: 1 },
            gram: { name: 'غرام', symbol: 'g', factor: 0.001 },
            milligram: { name: 'ميليغرام', symbol: 'mg', factor: 0.000001 },
            pound: { name: 'رطل', symbol: 'lb', factor: 0.453592 },
            ounce: { name: 'أونصة', symbol: 'oz', factor: 0.0283495 }
        },
        temperature: {
            celsius: { name: 'درجة مئوية', symbol: '°C' },
            fahrenheit: { name: 'فهرنهايت', symbol: '°F' },
            kelvin: { name: 'كلفن', symbol: 'K' }
        },
        // ... يمكنك إضافة باقي الفئات هنا بنفس النمط
    },

    solve(data) {
        const { value, fromUnit, toUnit, category } = data;

        // التحقق الأساسي من المدخلات
        if (value === null || value === undefined || !isFinite(Number(value)) || !fromUnit || !toUnit || !category) {
            return { error: "بيانات التحويل غير مكتملة أو غير صالحة" };
        }

        const val = Number(value);
        let result, steps = [];

        // دعم الـ SI prefixes وإيجاد الوحدة حسب المفتاح أو الرمز أو الاسم (حساس لحالة الأحرف غير مهم)
        const PREFIXES = [
            { names: ['yotta'], symbols: ['Y'], factor: 1e24 },
            { names: ['zetta'], symbols: ['Z'], factor: 1e21 },
            { names: ['exa'], symbols: ['E'], factor: 1e18 },
            { names: ['peta'], symbols: ['P'], factor: 1e15 },
            { names: ['tera'], symbols: ['T'], factor: 1e12 },
            { names: ['giga'], symbols: ['G'], factor: 1e9 },
            { names: ['mega'], symbols: ['M'], factor: 1e6 },
            { names: ['kilo'], symbols: ['k'], factor: 1e3 },
            { names: ['hecto'], symbols: ['h'], factor: 1e2 },
            { names: ['deca'], symbols: ['da'], factor: 1e1 },
            { names: ['deci'], symbols: ['d'], factor: 1e-1 },
            { names: ['centi'], symbols: ['c'], factor: 1e-2 },
            { names: ['milli'], symbols: ['m'], factor: 1e-3 },
            { names: ['micro'], symbols: ['μ', 'u'], factor: 1e-6 },
            { names: ['nano'], symbols: ['n'], factor: 1e-9 },
            { names: ['pico'], symbols: ['p'], factor: 1e-12 }
        ];

        const getUnitInfo = (cat, key) => {
            const catData = this.unitsData[cat];
            if (!catData) return null;

            // تطابق مباشر بالمفتاح
            if (catData[key]) return { key, info: catData[key] };

            const lowerKey = String(key).toLowerCase();

            // محاولة المطابقة بالمفتاح/الرمز/الاسم الكامل
            for (const [k, info] of Object.entries(catData)) {
                if (k.toLowerCase() === lowerKey) return { key: k, info };
                if ((info.symbol && info.symbol.toLowerCase() === lowerKey) || (info.name && info.name.toLowerCase() === lowerKey)) return { key: k, info };
            }

            // محاولة مطابقة بالـ prefix + symbol (مثل 'mm' -> milli + meter)
            // نرتب الرموز حسب الطول لتفادي تصادم 'da' مقابل 'd' مثلاً
            const prefixSymbols = PREFIXES.flatMap(p => p.symbols.map(s => ({ s, factor: p.factor, name: p.names[0] }))).sort((a, b) => b.s.length - a.s.length);

            for (const { s: prefixSym, factor: prefixFactor, name: prefixName } of prefixSymbols) {
                const pref = prefixSym.toLowerCase();
                if (!lowerKey.startsWith(pref)) continue;
                const rest = lowerKey.slice(pref.length);
                for (const [k, info] of Object.entries(catData)) {
                    const baseSym = (info.symbol || '').toLowerCase();
                    const baseKey = k.toLowerCase();
                    const baseName = (info.name || '').toLowerCase().replace(/\s+/g, '');

                    if (baseSym && rest === baseSym) {
                        if (!info.factor) continue; // لا ندعم prefixes للحرارة مثلاً
                        const derived = { ...info };
                        derived.factor = info.factor * prefixFactor;
                        derived.name = `${prefixName}${info.name}`;
                        derived.symbol = `${prefixSym}${info.symbol}`;
                        return { key: `${prefixSym}${k}`, info: derived };
                    }

                    // دعم أسماء مثل 'micrometer' = 'micro' + 'meter'
                    if (rest === baseKey || rest === baseName) {
                        if (!info.factor) continue;
                        const derived = { ...info };
                        derived.factor = info.factor * prefixFactor;
                        derived.name = `${prefixName}${info.name}`;
                        derived.symbol = `${prefixSym}${info.symbol || ''}`;
                        return { key: `${prefixSym}${k}`, info: derived };
                    }
                }
            }

            return null;
        };

        const from = getUnitInfo(category, fromUnit);
        const to = getUnitInfo(category, toUnit);

        if (!from) return { error: `الوحدة المرسلة غير معروفة: ${fromUnit}` };
        if (!to) return { error: `الوحدة الهدف غير معروفة: ${toUnit}` };

        steps.push({
            explanation: `تحويل ${val} من ${from.info.name} إلى ${to.info.name}`,
            equation: `${val} \\, ${from.info.symbol || from.key} \\rightarrow ? \\, ${to.info.symbol || to.key}`
        });

        if (category === 'temperature') {
            result = this.convertTemperature(val, from.key, to.key);
            if (!isFinite(result)) return { error: 'خطأ في تحويل درجات الحرارة' };

            // فحص حالة أقل من الصفر المطلق (بالكيلفن)
            const kelvin = this.convertTemperature(val, from.key, 'kelvin');
            if (typeof kelvin === 'number' && !isFinite(kelvin)) return { error: 'خطأ في تحويل درجات الحرارة' };
            if (kelvin < 0) {
                steps.push({ explanation: 'تحذير: القيمة أقل من الصفر المطلق (غير صالحة فيزيائياً).' });
            }

            steps.push({
                explanation: 'استخدام معادلة تحويل الحرارة:',
                equation: `Result = ${result.toFixed(6)} \\, ${to.info.symbol || to.key}`
            });
        } else {
            // التحويل القياسي باستخدام المعاملات
            const fromFactor = from.info.factor;
            const toFactor = to.info.factor;

            // 1. التحويل للوحدة الأساسية
            const baseValue = val * fromFactor;
            
            // 2. التحويل للوحدة الهدف
            result = baseValue / toFactor;

            steps.push({
                explanation: `الضرب في معامل التحويل: ${fromFactor} / ${toFactor}`,
                equation: `${val} \\times \\frac{${fromFactor}}{${toFactor}} = ${result.toExponential(6)}`
            });
        }

        return {
            title: "محول الوحدات الذكي",
            finalResult: `${Number(result.toFixed(6)).toString()} ${to.info.symbol || to.key}`,
            numericResult: result,
            fromSymbol: from.info.symbol || from.key,
            toSymbol: to.info.symbol || to.key,
            steps: steps
        };
    },

    convertTemperature(value, from, to) {
        const v = Number(value);
        if (!isFinite(v)) return NaN;
        let celsius;
        // إلى سيليزيوس
        if (from === 'celsius') celsius = v;
        else if (from === 'fahrenheit') celsius = (v - 32) * 5/9;
        else if (from === 'kelvin') celsius = v - 273.15;
        else return NaN;

        // من سيليزيوس
        if (to === 'celsius') return celsius;
        else if (to === 'fahrenheit') return celsius * 9/5 + 32;
        else if (to === 'kelvin') return celsius + 273.15;
        else return NaN;
    },

    // ✨ الدالة الجديدة: تحويل النتيجة إلى HTML جميل يظهر على الواجهة
    formatAsHTML(result) {
        if (result.error) {
            return `<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 5px; border: 1px solid #ef5350;">
                ❌ <strong>خطأ:</strong> ${result.error}
            </div>`;
        }

        let html = `<div style="padding: 15px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea; margin-bottom: 10px;">📐 ${result.title || 'محول الوحدات'}</h3>
            
            <div style="margin: 15px 0; padding: 12px; background: white; border-radius: 6px; border: 2px solid #667eea; text-align: center;">
                <span style="font-size: 28px; font-weight: bold; color: #667eea;">${result.finalResult}</span>
            </div>`;

        if (result.confidenceReport) {
            const report = result.confidenceReport;
            const score = Math.max(0, Math.min(100, Math.round(report.score || 0)));
            const label = report.label || 'متوسطة';
            const color = score >= 85 ? '#2e7d32' : score >= 70 ? '#1565c0' : score >= 50 ? '#ef6c00' : '#c62828';
            html += `<div style="margin: 10px 0; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1; background: #fff;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <strong>📊 درجة الثقة: <span style="color:${color};">${label}</span></strong>
                    <span style="font-size:12px; color:#64748b;">${score}%</span>
                </div>
                ${Array.isArray(report.checks) && report.checks.length ? `<ul style="margin: 8px 0 0; padding-right: 18px; line-height:1.6;">
                    ${report.checks.map((check) => {
                        const icon = check.ok === true ? '✅' : check.ok === false ? '❌' : '⚪';
                        const detail = check.detail ? ` <span style="color:#64748b;">(${check.detail})</span>` : '';
                        return `<li>${icon} ${check.label}${detail}</li>`;
                    }).join('')}
                </ul>` : ''}
            </div>`;
        }

        if (result.steps && result.steps.length > 0) {
            html += `<h4 style="margin-top: 15px; margin-bottom: 10px; color: #555;">الخطوات التفصيلية:</h4>
            <ol style="direction: rtl; text-align: right; margin: 0; padding-right: 20px;">`;
            
            result.steps.forEach((step, idx) => {
                html += `<li style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                    <strong style="color: #333;">${step.explanation}</strong>`;
                if (step.equation) {
                    html += `<div style="margin-top: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px; direction: ltr; text-align: center; border-left: 3px solid #667eea;">
                        <span class="math-expression" data-latex="${step.equation.replace(/"/g, '&quot;')}"></span>
                    </div>`;
                }
                html += `</li>`;
            });
            
            html += `</ol>`;
        }

        html += `</div>`;
        return html;
    }
};
