export const algebraData = [
    {
        topic: "الجبر والحساب الشامل",
        icon: "🧮",
        levels: [
            // =================================================================
            // المستوى الأول: التأسيس الحسابي (الكسور، الإشارات، الجذور)
            // مناسب للصفوف: الخامس - السادس - السابع
            // =================================================================
            {
                level: "المرحلة التأسيسية (أهم القواعد)",
                icon: "🏗️",
                chapters: [
                    {
                        title: "1. قواعد الإشارات (السالب والموجب)",
                        content: `
                        <h1>قواعد التعامل مع الأعداد الصحيحة</h1>
                        <p>قبل البدء بالجبر، يجب إتقان التعامل مع الإشارات السالبة والموجبة.</p>

                        <h2>أولاً: الجمع والطرح</h2>
                        <div style="background:#f9f9f9; padding:10px; border-radius:5px;">
                            <ul>
                                <li><strong>إشارات متشابهة:</strong> نجمع العددين ونضع نفس الإشارة.
                                    <br>مثال: $3 + 2 = 5$
                                    <br>مثال: $-3 - 2 = -5$ (خسرت 3 وخسرت 2، المجموع خسارة 5)
                                </li>
                                <li><strong>إشارات مختلفة:</strong> نطرح الرقم الصغير من الكبير ونضع إشارة الكبير.
                                    <br>مثال: $-7 + 3 = -4$ (إشارة الكبير سالبة)
                                    <br>مثال: $10 - 4 = 6$ (إشارة الكبير موجبة)
                                </li>
                            </ul>
                        </div>

                        <h2>ثانياً: الضرب والقسمة</h2>
                        <div style="background:; padding:10px; border-radius:5px;">
                            <p><strong>قاعدة الوجه المبتسم:</strong></p>
                            <ul>
                                <li>موجب × موجب = <strong>موجب</strong> ($2 \\times 3 = 6$)</li>
                                <li>سالب × سالب = <strong>موجب</strong> ($-2 \\times -3 = 6$)</li>
                                <li>موجب × سالب = <strong>سالب</strong> ($2 \\times -3 = -6$)</li>
                                <li>سالب ÷ موجب = <strong>سالب</strong> ($-10 \\div 2 = -5$)</li>
                            </ul>
                        </div>
                        `
                    },
                    {
                        title: "2. عالم الكسور (الجمع، الطرح، الضرب، القسمة)",
                        content: `
                        <h1>العمليات على الكسور الاعتيادية</h1>
                        <p>الكسر يتكون من بسط (فوق) ومقام (تحت). $\\frac{a}{b}$</p>

                        <h2>أولاً: ضرب وقسمة الكسور (السهل)</h2>
                        <p>لا نحتاج لتوحيد مقامات هنا.</p>
                        <ul>
                            <li><strong>الضرب:</strong> نضرب البسط في البسط، والمقام في المقام.
                                <br>مثال: $\\frac{2}{3} \\times \\frac{4}{5} = \\frac{2 \\times 4}{3 \\times 5} = \\frac{8}{15}$
                            </li>
                            <li><strong>القسمة:</strong> نقلب الكسر الثاني ونحول القسمة إلى ضرب.
                                <br>مثال: $\\frac{2}{3} \\div \\frac{5}{7} = \\frac{2}{3} \\times \\frac{7}{5} = \\frac{14}{15}$
                            </li>
                        </ul>

                        <h2>ثانياً: جمع وطرح الكسور (توحيد المقامات)</h2>
                        <p style="color:red; font-weight:bold;">قاعدة ذهبية: لا يمكن جمع أو طرح كسرين إلا إذا كان المقام (الرقم اللي تحت) متشابهاً!</p>

                        <h3>الحالة 1: المقامات موحدة جاهزة</h3>
                        <p>نجمع البسط فقط ونبقي المقام كما هو.</p>
                        <p>مثال: $\\frac{2}{7} + \\frac{3}{7} = \\frac{2+3}{7} = \\frac{5}{7}$</p>

                        <h3>الحالة 2: المقامات مختلفة (كيف نجد كسرين؟)</h3>
                        <p>يجب إيجاد المضاعف المشترك الأصغر (LCM) للمقامين.</p>
                        
                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال تفصيلي:</strong> $\\frac{1}{3} + \\frac{1}{4}$
                            <ol>
                                <li>المقامات هي 3 و 4. نضربهم ببعض: $3 \\times 4 = 12$. (المقام الجديد هو 12).</li>
                                <li>نوحد الكسر الأول: نضرب البسط والمقام في 4 $\\rightarrow \\frac{1 \\times 4}{3 \\times 4} = \\frac{4}{12}$</li>
                                <li>نوحد الكسر الثاني: نضرب البسط والمقام في 3 $\\rightarrow \\frac{1 \\times 3}{4 \\times 3} = \\frac{3}{12}$</li>
                                <li>نجمع الآن: $\\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$</li>
                            </ol>
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال آخر (الطرح):</strong> $\\frac{5}{6} - \\frac{1}{2}$
                            <ol>
                                <li>المقام 2 يمكن تحويله لـ 6 بضربه في 3.</li>
                                <li>الكسر الثاني يصبح: $\\frac{1 \\times 3}{2 \\times 3} = \\frac{3}{6}$</li>
                                <li>المسألة تصبح: $\\frac{5}{6} - \\frac{3}{6} = \\frac{2}{6}$</li>
                                <li>التبسيط (اختياري): $\\frac{2}{6} = \\frac{1}{3}$</li>
                            </ol>
                        </div>
                        `
                    },
                    {
                        title: "3. تأسيس الجذور (الجمع والضرب)",
                        content: `
                        <h1>العمليات على الجذور التربيعية</h1>
                        <p>الجذر التربيعي $\\sqrt{x}$ هو الرقم الذي إذا ضربته في نفسه يعطيك $x$.</p>
                        <p>أمثلة: $\\sqrt{9}=3$, $\\sqrt{16}=4$, $\\sqrt{25}=5$.</p>

                        <h2>أولاً: ضرب وقسمة الجذور</h2>
                        <p>القاعدة: "البيوت مفتوحة على بعض". يمكنك دمج الجذور.</p>
                        <ul>
                            <li><strong>الضرب:</strong> $\\sqrt{a} \\times \\sqrt{b} = \\sqrt{a \\times b}$
                                <br>مثال: $\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6}$
                                <br>مثال: $\\sqrt{2} \\times \\sqrt{8} = \\sqrt{16} = 4$
                            </li>
                            <li><strong>القسمة:</strong> $\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$
                                <br>مثال: $\\frac{\\sqrt{20}}{\\sqrt{5}} = \\sqrt{4} = 2$
                            </li>
                        </ul>

                        <h2>ثانياً: جمع وطرح الجذور</h2>
                        <p style="color:red; font-weight:bold;">قاعدة ذهبية: نجمع فقط الجذور المتشابهة (مثل السينات والصادات).</p>
                        <ul>
                            <li><strong>جذور متشابهة:</strong> نجمع الأرقام الخارجية فقط.
                                <br>مثال: $3\\sqrt{5} + 2\\sqrt{5} = 5\\sqrt{5}$ (تخيلها 3 تفاحات + 2 تفاحات)
                                <br>مثال: $7\\sqrt{2} - 1\\sqrt{2} = 6\\sqrt{2}$
                            </li>
                            <li><strong>جذور مختلفة:</strong> لا يمكن جمعها! تبقى كما هي.
                                <br>مثال: $\\sqrt{3} + \\sqrt{2}$ (تبقى هكذا، لا تساوي $\\sqrt{5}$ أبداً ❌).
                            </li>
                        </ul>

                        <h2>ثالثاً: تبسيط الجذور (للأذكياء)</h2>
                        <p>كيف نحسب $\\sqrt{12}$ وهي ليست مربعاً كاملاً؟</p>
                        <ol>
                            <li>نبحث عن رقمين حاصل ضربهما 12، أحدهما له جذر (4 أو 9 أو 16...).</li>
                            <li>$12 = 4 \\times 3$</li>
                            <li>$\\sqrt{12} = \\sqrt{4 \\times 3} = \\sqrt{4} \\times \\sqrt{3} = 2\\sqrt{3}$</li>
                        </ol>
                        `
                    }
                ]
            },

            // =================================================================
            // المستوى الثاني: الجبر الأساسي (المتغيرات والمعادلات)
            // مناسب للصفوف: السابع - الثامن - التاسع
            // =================================================================
            {
                level: "أساسيات الجبر والمعادلات",
                icon: "📐",
                chapters: [
                    {
                        title: "1. المتغيرات والحدود الجبرية",
                        content: `
                        <h1>ما هو المتغير (س أو x)؟</h1>
                        <p>المتغير هو "صندوق مجهول" نضع مكانه حرفاً لعدم معرفتنا قيمته.</p>
                        
                        <h2>جمع وطرح الحدود الجبرية</h2>
                        <p>نطبق نفس قاعدة الجذور: نجمع "العائلات" المتشابهة فقط.</p>
                        <ul>
                            <li>$3x + 2x = 5x$ (عائلة x)</li>
                            <li>$4y - y = 3y$ (عائلة y)</li>
                            <li>$2x + 3y$ (لا يمكن جمعها، عائلات مختلفة)</li>
                            <li>$x^2 + x$ (لا يمكن جمعها، الأسس مختلفة)</li>
                        </ul>

                        <h2>ضرب الحدود الجبرية</h2>
                        <p>نضرب الأرقام في الأرقام، ونجمع أسس الحروف المتشابهة.</p>
                        <p>مثال: $(2x) \\times (3x) = 6x^2$</p>
                        <p>مثال: $(4a) \\times (2b) = 8ab$</p>
                        `
                    },
                    {
                        title: "2. حل المعادلات من الدرجة الأولى",
                        content: `
                        <h1>الميزان: حل المعادلات</h1>
                        <p>الهدف: إبقاء المجهول $x$ لوحده في طرف.</p>
                        <p>القاعدة: أي شيء تنقله للطرف الآخر، <strong>اعكس إشارته أو عمليته</strong>.</p>

                        <h3>النوع الأول: الجمع والطرح</h3>
                        <ul>
                            <li>$x + 5 = 9$ $\\rightarrow$ انقل 5 واطرحها $\\rightarrow$ $x = 9 - 5 = 4$</li>
                            <li>$x - 3 = 7$ $\\rightarrow$ انقل -3 واجمعها $\\rightarrow$ $x = 7 + 3 = 10$</li>
                        </ul>

                        <h3>النوع الثاني: الضرب والقسمة</h3>
                        <ul>
                            <li>$3x = 12$ $\\rightarrow$ اقسم على 3 $\\rightarrow$ $x = \\frac{12}{3} = 4$</li>
                            <li>$\\frac{x}{2} = 5$ $\\rightarrow$ اضرب في 2 $\\rightarrow$ $x = 5 \\times 2 = 10$</li>
                        </ul>

                        <h3>النوع الثالث: الخطوتين (مهم جداً)</h3>
                        <p>المعادلة: $2x + 3 = 13$</p>
                        <ol>
                            <li>تخلص من الجمع/الطرح أولاً: $2x = 13 - 3 \\rightarrow 2x = 10$</li>
                            <li>تخلص من الضرب ثانياً: $x = \\frac{10}{2} = 5$</li>
                        </ol>
                        `
                    }
                ]
            },

            // =================================================================
            // المستوى الثالث: الجبر المتقدم
            // مناسب للمرحلة الثانوية
            // =================================================================
            {
                level: "الجبر المتقدم (الثانوي)",
                icon: "🚀",
                chapters: [
                    {
                        title: "1. تحليل كثيرات الحدود (Factoring)",
                        content: `
                        <h1>تحليل المعادلات (التفكيك)</h1>
                        
                        <h2>1. العامل المشترك الأكبر</h2>
                        <p>$2x^2 + 4x$ $\\rightarrow$ نخرج $2x$ مشترك $\\rightarrow$ $2x(x + 2)$</p>

                        <h2>2. فرق بين مربعين (شهير جداً)</h2>
                        <p>القاعدة: $x^2 - a^2 = (x-a)(x+a)$</p>
                        <ul>
                            <li>$x^2 - 9 = (x-3)(x+3)$</li>
                            <li>$4x^2 - 25 = (2x-5)(2x+5)$</li>
                        </ul>

                        <h2>3. تحليل العبارة التربيعية الثلاثية</h2>
                        <p>$x^2 + 5x + 6$</p>
                        <p>نبحث عن عددين: ضربهما 6 وجمعهما 5.</p>
                        <p>هما 2 و 3. $\\rightarrow (x+2)(x+3)$</p>
                        `
                    },
                    {
                        title: "2. حل المعادلات التربيعية (القانون العام)",
                        content: `
                        <h1>القانون العام لحل أي معادلة تربيعية</h1>
                        <p>الشكل: $ax^2 + bx + c = 0$</p>
                        <p class="formula-box">$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$</p>

                        <h3>مثال: $x^2 - 5x + 6 = 0$</h3>
                        <ul>
                            <li>$a=1, b=-5, c=6$</li>
                            <li>نحسب المميز: $b^2 - 4ac = (-5)^2 - 4(1)(6) = 25 - 24 = 1$</li>
                            <li>نطبق القانون: $x = \\frac{5 \\pm \\sqrt{1}}{2}$</li>
                            <li>الحل الأول: $\\frac{5+1}{2} = 3$</li>
                            <li>الحل الثاني: $\\frac{5-1}{2} = 2$</li>
                        </ul>
                        `
                    },
                    {
                        title: "3. الأسس واللوغاريتمات",
                        content: `
                        <h1>قوانين الأسس</h1>
                        
                        <h2>قوانين الأسس الأساسية</h2>
                        <ul>
                            <li>$a^m \\times a^n = a^{m+n}$ (نجمع الأسس عند الضرب)</li>
                            <li>$\\frac{a^m}{a^n} = a^{m-n}$ (نطرح الأسس عند القسمة)</li>
                            <li>$(a^m)^n = a^{m \\times n}$ (نضرب الأسس)</li>
                            <li>$(ab)^n = a^n b^n$ (نوزع الأس)</li>
                            <li>$a^0 = 1$ (أي عدد مرفوع للقوة صفر = 1)</li>
                            <li>$a^{-n} = \\frac{1}{a^n}$ (الأس السالب)</li>
                        </ul>

                        <h3>أمثلة تطبيقية:</h3>
                        <ul>
                            <li>$2^3 \\times 2^2 = 2^{3+2} = 2^5 = 32$</li>
                            <li>$\\frac{x^5}{x^2} = x^{5-2} = x^3$</li>
                            <li>$(x^2)^3 = x^6$</li>
                            <li>$2^{-3} = \\frac{1}{2^3} = \\frac{1}{8}$</li>
                        </ul>

                        <h2>اللوغاريتمات (عكس الأسس)</h2>
                        <p>إذا كان $a^x = b$، فإن $\\log_a(b) = x$</p>
                        
                        <div style="background:#ffe6e6; padding:10px; border-radius:5px; margin:10px 0;">
                            <strong>مثال:</strong> إذا كان $2^3 = 8$، فإن $\\log_2(8) = 3$
                            <br><strong>مثال آخر:</strong> إذا كان $10^2 = 100$، فإن $\\log_{10}(100) = 2$
                        </div>

                        <h3>قوانين اللوغاريتمات</h3>
                        <ul>
                            <li>$\\log_a(xy) = \\log_a(x) + \\log_a(y)$ (لوغاريتم الضرب)</li>
                            <li>$\\log_a(\\frac{x}{y}) = \\log_a(x) - \\log_a(y)$ (لوغاريتم القسمة)</li>
                            <li>$\\log_a(x^n) = n \\log_a(x)$ (لوغاريتم القوة)</li>
                            <li>$\\log_a(a) = 1$ و $\\log_a(1) = 0$</li>
                        </ul>
                        `
                    }
                ]
            },

            // =================================================================
            // المستوى الرابع: حساب التفاضل والتكامل (Calculus)
            // مناسب للجامعة والمستويات المتقدمة
            // =================================================================
            {
                level: "حساب التفاضل والتكامل 📊",
                icon: "📈",
                chapters: [
                    {
                        title: "1. مقدمة في الاشتقاق (المشتقات)",
                        content: `
                        <h1>ما هي المشتقة؟ (Derivative)</h1>
                        <p>المشتقة تقيس <strong>معدل التغيير</strong> - أي كم تتغير الدالة عند نقطة معينة.</p>
                        <p>تخيل أنك تقود سيارة: السرعة هي المشتقة (معدل تغير المسافة)!</p>

                        <h2>التعريف الرياضي للمشتقة</h2>
                        <p>المشتقة للدالة $f(x)$ يُرمز لها بـ $f'(x)$ أو $\\frac{df}{dx}$</p>
                        <p class="formula-box">$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$</p>

                        <h2>قواعد الاشتقاق السريعة</h2>
                        <ul>
                            <li><strong>مشتقة الثابت:</strong> إذا كانت $f(x) = c$، فإن $f'(x) = 0$</li>
                            <li><strong>قاعدة القوة:</strong> إذا كانت $f(x) = x^n$، فإن $f'(x) = n x^{n-1}$</li>
                            <li><strong>قاعدة الجمع:</strong> $(f + g)' = f' + g'$</li>
                            <li><strong>قاعدة الضرب:</strong> $(fg)' = f'g + fg'$</li>
                            <li><strong>قاعدة القسمة:</strong> $\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}$</li>
                        </ul>

                        <h3>أمثلة تطبيقية:</h3>
                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 1:</strong> أوجد مشتقة $f(x) = x^3$
                            <br>باستخدام قاعدة القوة: $f'(x) = 3x^2$
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 2:</strong> أوجد مشتقة $f(x) = 3x^2 + 2x + 5$
                            <br>نشتق كل حد على حدة:
                            <br>$f'(x) = 6x + 2 + 0 = 6x + 2$
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 3:</strong> أوجد مشتقة $f(x) = (x^2)(\\sin x)$ (قاعدة الضرب)
                            <br>نرمز: $f = x^2$، $g = \\sin x$
                            <br>إذاً: $f' = 2x$، $g' = \\cos x$
                            <br>حسب القاعدة: $(fg)' = 2x \\sin x + x^2 \\cos x$
                        </div>

                        <h2>تطبيقات المشتقات</h2>
                        <ul>
                            <li><strong>إيجاد النقاط الحرجة:</strong> نحل $f'(x) = 0$</li>
                            <li><strong>التحديد ما إذا كانت قيمة أكبر أو أصغر:</strong> نستخدم اختبار المشتقة الثانية</li>
                            <li><strong>حساب السرعة والتسارع:</strong> $v = \\frac{dx}{dt}$، $a = \\frac{dv}{dt}$</li>
                        </ul>
                        `
                    },
                    {
                        title: "2. المشتقات للدوال المثلثية واللوغاريتمية",
                        content: `
                        <h1>مشتقات الدوال الخاصة</h1>

                        <h2>مشتقات الدوال المثلثية</h2>
                        <ul>
                            <li>$\\frac{d}{dx}(\\sin x) = \\cos x$</li>
                            <li>$\\frac{d}{dx}(\\cos x) = -\\sin x$</li>
                            <li>$\\frac{d}{dx}(\\tan x) = \\sec^2 x$</li>
                            <li>$\\frac{d}{dx}(\\cot x) = -\\csc^2 x$</li>
                            <li>$\\frac{d}{dx}(\\sec x) = \\sec x \\tan x$</li>
                            <li>$\\frac{d}{dx}(\\csc x) = -\\csc x \\cot x$</li>
                        </ul>

                        <h2>مشتقات الدوال اللوغاريتمية والأسية</h2>
                        <ul>
                            <li>$\\frac{d}{dx}(\\ln x) = \\frac{1}{x}$</li>
                            <li>$\\frac{d}{dx}(\\log_a x) = \\frac{1}{x \\ln a}$</li>
                            <li>$\\frac{d}{dx}(e^x) = e^x$</li>
                            <li>$\\frac{d}{dx}(a^x) = a^x \\ln a$</li>
                        </ul>

                        <h3>أمثلة:</h3>
                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> أوجد مشتقة $f(x) = \\ln(3x)$
                            <br>باستخدام قاعدة السلسلة: $f'(x) = \\frac{1}{3x} \\times 3 = \\frac{1}{x}$
                        </div>

                        <h2>قاعدة السلسلة (Chain Rule)</h2>
                        <p>إذا كانت $f(x) = g(h(x))$، فإن:</p>
                        <p class="formula-box">$$f'(x) = g'(h(x)) \\times h'(x)$$</p>

                        <strong>مثال:</strong> أوجد مشتقة $f(x) = (2x+1)^5$
                        <br>نرمز: $g(u) = u^5$، $h(x) = 2x+1$
                        <br>$g'(u) = 5u^4 = 5(2x+1)^4$
                        <br>$h'(x) = 2$
                        <br>إذاً: $f'(x) = 5(2x+1)^4 \\times 2 = 10(2x+1)^4$
                        `
                    },
                    {
                        title: "3. مقدمة في التكامل (Integral)",
                        content: `
                        <h1>ما هو التكامل؟</h1>
                        <p>التكامل هو <strong>عكس الاشتقاق</strong>. إذا كانت المشتقة تقيس معدل التغيير، فالتكامل يجمع هذه التغييرات.</p>
                        <p>تطبيق عملي: إذا كانت السرعة هي المشتقة، فالتكامل يعطيك المسافة الكلية!</p>

                        <h2>الرمز والتعريف</h2>
                        <p>التكامل غير المحدود يُرمز له بـ $\\int f(x) dx$</p>
                        <p class="formula-box">$$\\int f(x) dx = F(x) + C$$</p>
                        <p>حيث $F(x)$ هي الدالة الأصلية و $C$ ثابت التكامل (مهم جداً!).</p>

                        <h2>القواعد الأساسية للتكامل</h2>
                        <ul>
                            <li><strong>تكامل الثابت:</strong> $\\int c dx = cx + C$</li>
                            <li><strong>قاعدة القوة:</strong> $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ (حيث $n \\neq -1$)</li>
                            <li><strong>الجمع:</strong> $\\int (f+g) dx = \\int f dx + \\int g dx$</li>
                            <li><strong>الضرب بثابت:</strong> $\\int kf(x) dx = k\\int f(x) dx$</li>
                        </ul>

                        <h3>أمثلة تطبيقية:</h3>
                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 1:</strong> $\\int x^3 dx = \\frac{x^4}{4} + C$
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 2:</strong> $\\int (3x^2 + 2x + 1) dx = x^3 + x^2 + x + C$
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 3:</strong> $\\int 5 dx = 5x + C$
                        </div>

                        <h2>تكاملات الدوال الخاصة</h2>
                        <ul>
                            <li>$\\int \\sin x dx = -\\cos x + C$</li>
                            <li>$\\int \\cos x dx = \\sin x + C$</li>
                            <li>$\\int \\frac{1}{x} dx = \\ln|x| + C$</li>
                            <li>$\\int e^x dx = e^x + C$</li>
                            <li>$\\int a^x dx = \\frac{a^x}{\\ln a} + C$</li>
                        </ul>
                        `
                    },
                    {
                        title: "4. التكامل المحدود وحساب المساحات",
                        content: `
                        <h1>التكامل المحدود (Definite Integral)</h1>
                        <p>يُستخدم لحساب المساحة تحت الدالة بين نقطتين.</p>

                        <h2>التعريف والرمز</h2>
                        <p class="formula-box">$$\\int_a^b f(x) dx = F(b) - F(a)$$</p>
                        <p>حيث $a$ و $b$ هما حدود التكامل، و $F(x)$ هي الدالة الأصلية.</p>

                        <h3>خطوات الحل:</h3>
                        <ol>
                            <li>نجد التكامل غير المحدود $\\int f(x) dx = F(x)$</li>
                            <li>نعوض بالحد الأعلى: $F(b)$</li>
                            <li>نعوض بالحد الأسفل: $F(a)$</li>
                            <li>الإجابة: $F(b) - F(a)$</li>
                        </ol>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> احسب $\\int_0^2 (3x^2 + 1) dx$
                            <br><br>
                            <strong>الحل:</strong>
                            <br>1. التكامل غير المحدود: $\\int (3x^2 + 1) dx = x^3 + x + C$
                            <br>2. التكامل المحدود: $[x^3 + x]_0^2$
                            <br>3. $= (2^3 + 2) - (0^3 + 0) = (8 + 2) - 0 = 10$
                        </div>

                        <h2>حساب المساحات</h2>
                        <p><strong>المساحة تحت المنحنى</strong> من $x = a$ إلى $x = b$:</p>
                        <p class="formula-box">$$A = \\int_a^b |f(x)| dx$$</p>

                        <p><strong>المساحة بين منحنيين</strong> من $x = a$ إلى $x = b$ (حيث $f(x) \\geq g(x)$):</p>
                        <p class="formula-box">$$A = \\int_a^b [f(x) - g(x)] dx$$</p>

                        <h2>خصائص التكامل المحدود</h2>
                        <ul>
                            <li>$\\int_a^a f(x) dx = 0$ (إذا كانت الحدود متساوية)</li>
                            <li>$\\int_a^b f(x) dx = -\\int_b^a f(x) dx$ (إذا بدلنا الحدود تتغير الإشارة)</li>
                            <li>$\\int_a^c f(x) dx = \\int_a^b f(x) dx + \\int_b^c f(x) dx$ (التجزئة)</li>
                        </ul>
                        `
                    },
                    {
                        title: "5. تقنيات التكامل المتقدمة",
                        content: `
                        <h1>طرق التكامل المتقدمة</h1>

                        <h2>1. التكامل بالتعويض (Substitution)</h2>
                        <p>تُستخدم عندما تكون الدالة معقدة. نستبدل جزءاً من الدالة بمتغير جديد.</p>

                        <strong>الخطوات:</strong>
                        <ol>
                            <li>نرمز: $u = g(x)$</li>
                            <li>نشتق: $du = g'(x) dx$</li>
                            <li>نعوض في المسألة</li>
                            <li>نحل التكامل بدلالة $u$</li>
                            <li>نعود للمتغير الأصلي</li>
                        </ol>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> احسب $\\int (2x)(x^2 + 3)^5 dx$
                            <br><br>
                            <strong>الحل:</strong>
                            <br>لنفرض $u = x^2 + 3$
                            <br>إذاً $du = 2x dx$
                            <br>المسألة تصبح: $\\int u^5 du = \\frac{u^6}{6} + C = \\frac{(x^2+3)^6}{6} + C$
                        </div>

                        <h2>2. التكامل بالأجزاء (Integration by Parts)</h2>
                        <p>تُستخدم للدوال التي هي حاصل ضرب دالتين.</p>

                        <p class="formula-box">$$\\int u \\, dv = uv - \\int v \\, du$$</p>

                        <strong>نصيحة LIATE:</strong> اختر $u$ من الدالة التي تأتي أولاً:
                        <ul>
                            <li><strong>L</strong>ogarithmic (اللوغاريتم)</li>
                            <li><strong>I</strong>nverse (الدوال العكسية)</li>
                            <li><strong>A</strong>lgebraic (الجبرية)</li>
                            <li><strong>T</strong>rigonometric (المثلثية)</li>
                            <li><strong>E</strong>xponential (الأسية)</li>
                        </ul>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> احسب $\\int x \\sin x \\, dx$
                            <br><br>
                            <strong>الحل:</strong>
                            <br>نرمز: $u = x$، $dv = \\sin x \\, dx$
                            <br>إذاً: $du = dx$، $v = -\\cos x$
                            <br>تطبيق الصيغة: $\\int x \\sin x \\, dx = x(-\\cos x) - \\int (-\\cos x) \\, dx$
                            <br>$= -x\\cos x + \\int \\cos x \\, dx$
                            <br>$= -x\\cos x + \\sin x + C$
                        </div>

                        <h2>3. التكامل بالكسور الجزئية</h2>
                        <p>تُستخدم لتكامل الدوال الكسرية (rational functions).</p>
                        <p>الفكرة: تحويل كسر معقد إلى مجموع كسور بسيطة.</p>

                        <strong>مثال:</strong>
                        <br>$\\frac{5x + 3}{(x+1)(x+2)} = \\frac{A}{x+1} + \\frac{B}{x+2}$
                        <br>بإيجاد $A$ و $B$، نستطيع تكامل كل حد على حدة.
                        `
                    }
                ]
            },

            // =================================================================
            // المستوى الخامس: المصفوفات (Matrices)
            // مناسب للجامعة
            // =================================================================
            {
                level: "الجبر الخطي والمصفوفات 📊",
                icon: "⬜",
                chapters: [
                    {
                        title: "1. مقدمة في المصفوفات",
                        content: `
                        <h1>ما هي المصفوفة (Matrix)؟</h1>
                        <p>المصفوفة هي ترتيب منظم من الأرقام في صفوف (rows) وأعمدة (columns).</p>

                        <h2>الرمز والبنية</h2>
                        <p>مصفوفة بحجم $m \\times n$ (m صفوف، n أعمدة):</p>
                        <p class="formula-box">$$A = \\begin{pmatrix} a_{11} & a_{12} & \\cdots & a_{1n} \\\\ a_{21} & a_{22} & \\cdots & a_{2n} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ a_{m1} & a_{m2} & \\cdots & a_{mn} \\end{pmatrix}$$</p>

                        <h3>مثال:</h3>
                        <p>$$A = \\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\end{pmatrix}$$</p>
                        <p>هذه مصفوفة بحجم $2 \\times 3$ (صفان وثلاثة أعمدة)</p>

                        <h2>أنواع المصفوفات</h2>
                        <ul>
                            <li><strong>المصفوفة المربعة:</strong> عدد الصفوف = عدد الأعمدة ($n \\times n$)</li>
                            <li><strong>مصفوفة الصف:</strong> صف واحد فقط ($1 \\times n$)</li>
                            <li><strong>مصفوفة العمود:</strong> عمود واحد فقط ($m \\times 1$)</li>
                            <li><strong>المصفوفة الصفرية:</strong> جميع العناصر = 0</li>
                            <li><strong>مصفوفة الوحدة (Identity Matrix):</strong> $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$</li>
                        </ul>

                        <h2>المصفوفة المنقولة (Transpose)</h2>
                        <p>تحويل الصفوف إلى أعمدة والعكس. يُرمز لها بـ $A^T$</p>
                        
                        <strong>مثال:</strong>
                        <br>إذا كانت $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$
                        <br>فإن $A^T = \\begin{pmatrix} 1 & 3 \\\\ 2 & 4 \\end{pmatrix}$
                        `
                    },
                    {
                        title: "2. العمليات على المصفوفات",
                        content: `
                        <h1>العمليات الحسابية على المصفوفات</h1>

                        <h2>1. جمع وطرح المصفوفات</h2>
                        <p>نجمع (أو نطرح) العناصر المتناظرة. يجب أن تكون المصفوفات بنفس الحجم!</p>

                        <strong>مثال:</strong>
                        <br>$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} + \\begin{pmatrix} 5 & 6 \\\\ 7 & 8 \\end{pmatrix} = \\begin{pmatrix} 6 & 8 \\\\ 10 & 12 \\end{pmatrix}$$

                        <h2>2. ضرب المصفوفة بعدد (Scalar Multiplication)</h2>
                        <p>نضرب كل عنصر بهذا العدد.</p>

                        <strong>مثال:</strong>
                        <br>$$3 \\times \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} = \\begin{pmatrix} 3 & 6 \\\\ 9 & 12 \\end{pmatrix}$$

                        <h2>3. ضرب المصفوفات (Matrix Multiplication) ⚠️ مهم جداً</h2>
                        <p style="color:red; font-weight:bold;">قاعدة ذهبية: لا يمكن ضرب مصفوفتين إلا إذا كان عدد أعمدة الأولى = عدد صفوف الثانية!</p>

                        <p>إذا كانت $A$ بحجم $m \\times n$ و $B$ بحجم $n \\times p$، فإن $AB$ ستكون بحجم $m \\times p$.</p>

                        <strong>طريقة الحساب:</strong>
                        <br>العنصر $(AB)_{ij}$ = (الصف $i$ من $A$) · (العمود $j$ من $B$)

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong>
                            <br>$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\times \\begin{pmatrix} 5 & 6 \\\\ 7 & 8 \\end{pmatrix}$$
                            
                            <br><br>العنصر $(1,1)$: $(1)(5) + (2)(7) = 5 + 14 = 19$
                            <br>العنصر $(1,2)$: $(1)(6) + (2)(8) = 6 + 16 = 22$
                            <br>العنصر $(2,1)$: $(3)(5) + (4)(7) = 15 + 28 = 43$
                            <br>العنصر $(2,2)$: $(3)(6) + (4)(8) = 18 + 32 = 50$
                            
                            <br><br>$$= \\begin{pmatrix} 19 & 22 \\\\ 43 & 50 \\end{pmatrix}$$
                        </div>

                        <p style="color:red;"><strong>⚠️ تحذير:</strong> ضرب المصفوفات <strong>غير تبديلي</strong> أي $AB \\neq BA$</p>
                        `
                    },
                    {
                        title: "3. المحدد والمصفوفة العكسية",
                        content: `
                        <h1>المحدد (Determinant)</h1>
                        <p>المحدد رقم خاص مرتبط بمصفوفة مربعة. يُرمز له بـ $\\det(A)$ أو $|A|$</p>

                        <h2>محدد مصفوفة 2×2</h2>
                        <p class="formula-box">$$\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$</p>

                        <strong>مثال:</strong>
                        <br>$$\\det\\begin{pmatrix} 3 & 2 \\\\ 1 & 4 \\end{pmatrix} = (3)(4) - (2)(1) = 12 - 2 = 10$$

                        <h2>محدد مصفوفة 3×3 (قاعدة الساروس)</h2>
                        <p class="formula-box">
                            $$\\det\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix} = aei + bfg + cdh - ceg - afh - bdi$$
                        </p>

                        <h2>المصفوفة العكسية (Inverse Matrix)</h2>
                        <p>العكس من مصفوفة $A$ يُرمز له بـ $A^{-1}$، بحيث $A \\cdot A^{-1} = I$ (مصفوفة الوحدة)</p>

                        <p style="color:red; font-weight:bold;">شرط مهم: المصفوفة يجب أن تكون مربعة و $\\det(A) \\neq 0$</p>

                        <h3>عكس مصفوفة 2×2:</h3>
                        <p class="formula-box">
                            $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$$
                        </p>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> أوجد معكوس $A = \\begin{pmatrix} 2 & 1 \\\\ 3 & 2 \\end{pmatrix}$
                            
                            <br><br>1. المحدد: $\\det(A) = (2)(2) - (1)(3) = 4 - 3 = 1$
                            <br>2. المعكوس: $A^{-1} = \\frac{1}{1} \\begin{pmatrix} 2 & -1 \\\\ -3 & 2 \\end{pmatrix} = \\begin{pmatrix} 2 & -1 \\\\ -3 & 2 \\end{pmatrix}$
                        </div>

                        <h2>تطبيقات العكس</h2>
                        <p>حل نظام معادلات خطية: $AX = B \\Rightarrow X = A^{-1}B$</p>
                        `
                    },
                    {
                        title: "4. حل الأنظمة الخطية باستخدام المصفوفات",
                        content: `
                        <h1>الأنظمة الخطية (Linear Systems)</h1>

                        <h2>الصيغة العامة</h2>
                        <p>نظام معادلات خطية:</p>
                        $$\\begin{cases} a_1x + b_1y = c_1 \\\\ a_2x + b_2y = c_2 \\end{cases}$$

                        <h2>الصيغة المصفوفية</h2>
                        <p class="formula-box">
                            $$\\begin{pmatrix} a_1 & b_1 \\\\ a_2 & b_2 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} c_1 \\\\ c_2 \\end{pmatrix}$$
                            
                            أو ببساطة: $$AX = B$$
                        </p>

                        <h3>الحل:</h3>
                        <p>بضرب الطرفين في $A^{-1}$:</p>
                        <p class="formula-box">$$X = A^{-1}B$$</p>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> حل النظام:
                            <br>$$\\begin{cases} 2x + y = 5 \\\\ 3x + 2y = 8 \\end{cases}$$
                            
                            <br><br>1. الصيغة المصفوفية: $\\begin{pmatrix} 2 & 1 \\\\ 3 & 2 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 5 \\\\ 8 \\end{pmatrix}$
                            
                            <br>2. نحسب المعكوس (من المثال السابق): $A^{-1} = \\begin{pmatrix} 2 & -1 \\\\ -3 & 2 \\end{pmatrix}$
                            
                            <br>3. الحل:
                            <br>$$\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 2 & -1 \\\\ -3 & 2 \\end{pmatrix} \\begin{pmatrix} 5 \\\\ 8 \\end{pmatrix} = \\begin{pmatrix} 10 - 8 \\\\ -15 + 16 \\end{pmatrix} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$$
                            
                            <br>إذاً: $x = 2$، $y = 1$
                        </div>

                        <h2>طريقة المحو (Gaussian Elimination)</h2>
                        <p>طريقة بديلة لحل الأنظمة بدون حساب العكس:</p>
                        <ol>
                            <li>نكتب المصفوفة الموسعة (Augmented Matrix)</li>
                            <li>نطبق عمليات صفية (Row Operations) للوصول للشكل المصفوفي للصفوف</li>
                            <li>نرجع إلى النظام الأصلي ونحل</li>
                        </ol>

                        <p><strong>العمليات الصفية المسموحة:</strong></p>
                        <ul>
                            <li>تبديل صفين</li>
                            <li>ضرب صف بعدد غير صفر</li>
                            <li>إضافة مضاعف من صف لآخر</li>
                        </ul>
                        `
                    },
                    {
                        title: "5. القيم الذاتية والمتجهات الذاتية",
                        content: `
                        <h1>المتجهات والقيم الذاتية (Eigenvalues & Eigenvectors)</h1>

                        <h2>التعريف</h2>
                        <p>للمصفوفة $A$، المتجه الذاتي $v$ والقيمة الذاتية $\\lambda$ يحققان:</p>
                        <p class="formula-box">$$Av = \\lambda v$$</p>

                        <p>بمعنى: بضرب $A$ في المتجه $v$، نحصل على نسخة مضروبة من نفس المتجه بمعامل $\\lambda$</p>

                        <h2>كيفية الإيجاد</h2>
                        <p>من المعادلة $Av = \\lambda v$، نعيد الكتابة:</p>
                        <p>$$Av - \\lambda Iv = 0$$</p>
                        <p>$$(A - \\lambda I)v = 0$$</p>

                        <p>لكي يكون لدينا حل غير صفري:</p>
                        <p class="formula-box">$$\\det(A - \\lambda I) = 0$$</p>

                        <p>هذه المعادلة تُسمى <strong>المعادلة المميزة (Characteristic Equation)</strong></p>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> أوجد القيم والمتجهات الذاتية لـ $A = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$
                            
                            <br><br>1. المعادلة المميزة:
                            <br>$\\det(A - \\lambda I) = \\det\\begin{pmatrix} 3-\\lambda & 1 \\\\ 0 & 2-\\lambda \\end{pmatrix} = 0$
                            
                            <br>2. $(3-\\lambda)(2-\\lambda) = 0$
                            
                            <br>3. القيم الذاتية: $\\lambda_1 = 3$، $\\lambda_2 = 2$
                            
                            <br>4. لكل قيمة، نحل $(A - \\lambda I)v = 0$ لإيجاد المتجه الذاتي
                        </div>

                        <h2>التطبيقات</h2>
                        <ul>
                            <li>تحليل الاستقرار في الأنظمة الديناميكية</li>
                            <li>Google PageRank algorithm</li>
                            <li>تحليل المكونات الرئيسية (PCA) في البيانات</li>
                            <li>اهتزازات الأنظمة الميكانيكية</li>
                        </ul>
                        `
                    }
                ]
            },

            // =================================================================
            // المستوى السادس: مواضيع متقدمة إضافية
            // =================================================================
            {
                level: "مواضيع متقدمة وتطبيقات 🔬",
                icon: "⭐",
                chapters: [
                    {
                        title: "1. المتتاليات والمتسلسلات",
                        content: `
                        <h1>المتتاليات (Sequences)</h1>
                        <p>متتالية من الأرقام تتبع نمطاً محدداً.</p>

                        <h2>المتتالية الحسابية (Arithmetic Sequence)</h2>
                        <p>فرق ثابت بين كل حدين متتاليين.</p>
                        
                        <p class="formula-box">
                            $$a_n = a_1 + (n-1)d$$
                            حيث $d$ هو الفرق المشترك
                        </p>

                        <strong>مثال:</strong> $2, 5, 8, 11, 14, ...$
                        <br>الفرق $d = 3$
                        <br>الحد النوني: $a_n = 2 + (n-1)(3) = 3n - 1$

                        <h2>المتتالية الهندسية (Geometric Sequence)</h2>
                        <p>نسبة ثابتة بين كل حدين متتاليين.</p>
                        
                        <p class="formula-box">
                            $$a_n = a_1 \\cdot r^{n-1}$$
                            حيث $r$ هو النسبة المشتركة
                        </p>

                        <strong>مثال:</strong> $2, 6, 18, 54, ...$
                        <br>النسبة $r = 3$
                        <br>الحد النوني: $a_n = 2 \\cdot 3^{n-1}$

                        <h2>المتسلسلات (Series)</h2>
                        <p>مجموع حدود المتتالية.</p>

                        <h3>مجموع المتسلسلة الحسابية:</h3>
                        <p class="formula-box">
                            $$S_n = \\frac{n(a_1 + a_n)}{2}$$
                        </p>

                        <h3>مجموع المتسلسلة الهندسية المحدودة:</h3>
                        <p class="formula-box">
                            $$S_n = a_1 \\cdot \\frac{1 - r^n}{1 - r} \\quad (r \\neq 1)$$
                        </p>

                        <h3>مجموع المتسلسلة الهندسية غير المحدودة (إذا كان |r| < 1):</h3>
                        <p class="formula-box">
                            $$S = \\frac{a_1}{1 - r}$$
                        </p>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال:</strong> أوجد مجموع $2 + 4 + 8 + 16$ (4 حدود)
                            <br>$a_1 = 2$, $r = 2$, $n = 4$
                            <br>$S_4 = 2 \\cdot \\frac{1 - 2^4}{1 - 2} = 2 \\cdot \\frac{1 - 16}{-1} = 2 \\cdot 15 = 30$
                        </div>
                        `
                    },
                    {
                        title: "2. الدوال والدوال المركبة",
                        content: `
                        <h1>الدوال (Functions)</h1>
                        <p>الدالة ربط بين مجموعتين: المدخلات (المجال) والمخرجات (المدى).</p>

                        <h2>رمز الدالة</h2>
                        <p class="formula-box">$$f(x) = y$$</p>
                        <p>حيث $x$ هو المدخل و $y$ هو المخرج</p>

                        <h2>أنواع الدوال</h2>
                        <ul>
                            <li><strong>الدالة الخطية:</strong> $f(x) = mx + b$</li>
                            <li><strong>الدالة التربيعية:</strong> $f(x) = ax^2 + bx + c$</li>
                            <li><strong>الدالة الكسرية:</strong> $f(x) = \\frac{p(x)}{q(x)}$</li>
                            <li><strong>الدالة الجذرية:</strong> $f(x) = \\sqrt[n]{x}$</li>
                            <li><strong>الدالة الأسية:</strong> $f(x) = a^x$</li>
                            <li><strong>الدالة اللوغاريتمية:</strong> $f(x) = \\log_a(x)$</li>
                        </ul>

                        <h2>الدالة العكسية (Inverse Function)</h2>
                        <p>إذا كانت $f(x) = y$، فإن الدالة العكسية $f^{-1}(y) = x$</p>

                        <strong>مثال:</strong> إذا كانت $f(x) = 2x + 3$
                        <br>للعكس: $y = 2x + 3$
                        <br>نحل لـ $x$: $x = \\frac{y - 3}{2}$
                        <br>إذاً: $f^{-1}(x) = \\frac{x - 3}{2}$

                        <h2>الدالة المركبة (Composite Function)</h2>
                        <p>تركيب دالتين: $(f \\circ g)(x) = f(g(x))$</p>

                        <strong>مثال:</strong> إذا كانت $f(x) = 2x$ و $g(x) = x + 1$
                        <br>$(f \\circ g)(x) = f(g(x)) = f(x+1) = 2(x+1) = 2x + 2$
                        `
                    },
                    {
                        title: "3. حدود الدوال والاستمرارية",
                        content: `
                        <h1>الحد (Limit)</h1>
                        <p>قيمة الدالة عندما تقترب $x$ من قيمة معينة.</p>

                        <h2>الرمز والتعريف</h2>
                        <p class="formula-box">
                            $$\\lim_{x \\to a} f(x) = L$$
                        </p>
                        <p>تعني: عندما تقترب $x$ من $a$، تقترب قيمة الدالة من $L$</p>

                        <h3>أمثلة:</h3>
                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 1:</strong> $\\lim_{x \\to 2} (3x + 1) = 3(2) + 1 = 7$
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
                            <strong>مثال 2:</strong> $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (حد مشهور)
                        </div>

                        <h2>خصائص الحدود</h2>
                        <ul>
                            <li>$\\lim_{x \\to a} [f(x) + g(x)] = \\lim_{x \\to a} f(x) + \\lim_{x \\to a} g(x)$</li>
                            <li>$\\lim_{x \\to a} [f(x) \\cdot g(x)] = \\lim_{x \\to a} f(x) \\cdot \\lim_{x \\to a} g(x)$</li>
                            <li>$\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\frac{\\lim_{x \\to a} f(x)}{\\lim_{x \\to a} g(x)}$ (إذا كان المقام ≠ 0)</li>
                        </ul>

                        <h2>الاستمرارية (Continuity)</h2>
                        <p>الدالة مستمرة عند $x = a$ إذا:</p>
                        <ol>
                            <li>$f(a)$ موجودة</li>
                            <li>$\\lim_{x \\to a} f(x)$ موجود</li>
                            <li>$\\lim_{x \\to a} f(x) = f(a)$</li>
                        </ol>
                        `
                    },
                    {
                        title: "4. تطبيقات عملية (بناء الجسور والاقتصاد)",
                        content: `
                        <h1>تطبيقات عملية للرياضيات</h1>

                        <h2>في الهندسة والعمارة 🏗️</h2>
                        <ul>
                            <li><strong>حساب المساحات والأحجام:</strong> تصميم الأبنية والجسور</li>
                            <li><strong>المثلثات والزوايا:</strong> حساب الارتفاعات والمسافات</li>
                            <li><strong>المنحنيات:</strong> تصميم الأقواس والأسطح المنحنية</li>
                            <li><strong>المصفوفات:</strong> معالجة الرسومات ثلاثية الأبعاد</li>
                        </ul>

                        <h2>في الاقتصاد والمالية 💰</h2>
                        <ul>
                            <li><strong>الدوال الخطية:</strong> حساب الأرباح والخسائر</li>
                            <li><strong>المشتقات:</strong> إيجاد أقصى ربح أو أقل خسارة (optimization)</li>
                            <li><strong>التكامل:</strong> حساب المساحة تحت منحنى الطلب (Consumer Surplus)</li>
                            <li><strong>المتسلسلات:</strong> حساب الفائدة المركبة</li>
                        </ul>

                        <strong>مثال:</strong> الربح = الإيراد - التكاليف
                        <br>$P(x) = R(x) - C(x)$
                        <br>لإيجاد أقصى ربح: $\\frac{dP}{dx} = 0$

                        <h2>في الفيزياء والعلوم 🔬</h2>
                        <ul>
                            <li><strong>المشتقات:</strong> السرعة والتسارع</li>
                            <li><strong>التكامل:</strong> الإزاحة والعمل والطاقة</li>
                            <li><strong>المعادلات التفاضلية:</strong> قانون التبريد، النمو الأسي، الاهتزازات</li>
                            <li><strong>المصفوفات:</strong> الحسابات الكمومية، معالجة الصور</li>
                        </ul>

                        <h2>في علوم الحاسوب والذكاء الاصطناعي 🤖</h2>
                        <ul>
                            <li><strong>الجبر الخطي:</strong> نماذج التعلم الآلي (Linear Regression, Neural Networks)</li>
                            <li><strong>المصفوفات والمتجهات:</strong> معالجة البيانات والصور</li>
                            <li><strong>التفاضل:</strong> تدريب الشبكات العصبية (Gradient Descent)</li>
                            <li><strong>الاحتمالات والإحصاء:</strong> تحليل البيانات الضخمة</li>
                        </ul>
                        `
                    }
                ]
            }
        ]
    }
];