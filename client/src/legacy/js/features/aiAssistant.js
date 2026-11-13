// Lightweight AI assistant helper: generates step-by-step hints, common errors
// and follow-up questions for locally-computed solutions.
const detectCategory = (text) => {
  if (!text) return 'unknown';
  const t = String(text);
  if (/derive|اشتق|مشتقة|d\/dx|d\/dx/i.test(t)) return 'calculus';
  if (/\b(det|محدد)\b|\\begin\{(?:pmatrix|bmatrix)\}/i.test(t)) return 'matrix';
  if (/=/.test(t) && /x/.test(t)) {
    if (/\^2|²/.test(t) || /quadratic|معادلة تربيعية/i.test(t)) return 'quadratic';
    return 'linear_eq';
  }
  if (/^[\d\s+\-*\/^().,]+$/.test(t.replace(/\s+/g, ''))) return 'arithmetic';
  return 'general';
};

const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const arithmeticSteps = (expr) => {
  try {
    const cleaned = expr.replace(/\s+/g,'');
    const value = (window.math && typeof window.math.evaluate === 'function') ? window.math.evaluate(cleaned) : null;
    const steps = [];
    steps.push('1) اتبع ترتيب العمليات: الأقواس → الأسس → الضرب/القسمة → الجمع/الطرح.');
    if (cleaned.includes('(')) steps.push('2) حساب التعبيرات داخل الأقواس أولاً.');
    if (value !== null) steps.push(`النتيجة النهائية: ${value}`);
    return steps;
  } catch (e) {
    return ['لا يمكن تحليل التعبير الحسابي تلقائياً.'];
  }
};

const linearSteps = (eq) => {
  const steps = [];
  steps.push('1) قم بتبسيط طرفي المعادلة: فك الأقواس وجمع الحدود المتشابهة.');
  steps.push('2) انقل جميع حدود المتغير إلى جهة والثوابت إلى الجهة الأخرى.');
  steps.push('3) اقسم أو اضرب للحصول على قيمة المتغير منفرداً.');
  return steps;
};

const quadraticSteps = (eq) => {
  const steps = [];
  steps.push('1) ضع المعادلة في الصورة القياسية: ax^2 + bx + c = 0.');
  steps.push('2) احسب المميز Δ = b^2 - 4ac.');
  steps.push('3) استعمل الصيغة: x = (-b ± √Δ) / (2a).');
  return steps;
};

const calculusSteps = (expr) => {
  const steps = [];
  steps.push('1) حدد قاعدة الاشتقاق المناسبة (قوة، حاصل ضرب، حاصل قسمة، سلسلة).');
  steps.push('2) طبق القاعدة خطوة بخطوة على كل حد أو عامل.');
  steps.push('3) بسط النتيجة إن أمكن.');
  return steps;
};

const commonErrorsFor = (category) => {
  const map = {
    arithmetic: ['إهمال ترتيب العمليات.', 'الخلط بين علامة الطرح والناقص في السالب.', 'نسيان تبسيط الكسور قبل الحساب.'],
    linear_eq: ['نقل الحد إلى الجهة الخاطئة (تبديل الإشارة).', 'نسيان قسمة كلا الطرفين عند تقسيم على معامل المتغير.'],
    quadratic: ['حساب المميز Δ خطأً (نسيان التعامل مع الإشارة).', 'تجاهل جذور مركبة عندما يكون Δ < 0.'],
    calculus: ['تطبيق قاعدة خاطئة (مثلاً استخدام قاعدة القوة على دالة تركيبية).', 'نسيان مشتقة الثوابت أو استخدام إشارة خاطئة عند تطبيق القاعدة.'],
    matrix: ['عدم التحقق من الأبعاد قبل الضرب.', 'خلط ترتيب العمليات (A×B ≠ B×A عادةً).'],
    general: ['التفسير الجزئي للنتيجة دون التحقق من الشروط أو نطاق التعريف.']
  };
  return map[category] || map.general;
};

const hintsFor = (category) => {
  const map = {
    arithmetic: ['حاول تبسيط الكسور أولاً أو تحويلها لأعداد عشرية عند الضرورة.', 'استخدم خطة خطوة بخطوة: أقواس → أسس → ضرب/قسمة → جمع/طرح.'],
    linear_eq: ['ابحث عن حدود مماثلة واجمعها قبل محاولة عزل المتغير.', 'افحص إذا كان هناك قواسم مشتركة يمكنك قسمة المعادلة عليها.'],
    quadratic: ['راجع معاملات a و b و c وحدد المميز أولاً.', 'إذا ظهر جذر مركب، هل ترغب في الجذور المركبة أم صيغة التحليل؟'],
    calculus: ['حاول إعادة كتابة الدالة لتسهيل تطبيق قاعدة الاشتقاق.', 'ابحث عن عوامل قابلة للاشتقاق المباشر (ثابت × دالة).'],
    matrix: ['تحقق من أبعاد المصفوفات قبل أي عملية.', 'اجعل التمثيل الرقمي للمصفوفات واضحاً (صفوف × أعمدة).'],
    general: ['اقرأ السؤال والمحاور المطلوبة بعناية: هل يطلب إثباتاً أم مجرد نتيجة؟']
  };
  return map[category] || map.general;
};

const followUpsFor = (category, input, solution) => {
  const q = [];
  if (category === 'arithmetic') {
    q.push('هل تريد رؤية حساب كل خطوة تفصيليًا؟');
    q.push('هل ترغب بتحويل الأعداد إلى كسور/عشري لعرض الفرق؟');
  } else if (category === 'linear_eq' || category === 'quadratic') {
    q.push('هل ترغب بالرسم البياني للحل أو تحليل جذور المعادلة؟');
    q.push('هل نحتاج للتحقق من الحل بإعادة التعويض؟');
    q.push('هل تريد تبسيط المعادلة أولاً (مثل قسمة كلا الطرفين على عامل مشترك)؟');
  } else if (category === 'calculus') {
    q.push('هل تريد شرحاً مرئياً للقاعدة المستخدمة؟');
    q.push('هل ترغب بحساب التكامل العكسي أو التحقق من النتيجة برسم الدالة؟');
  } else if (category === 'matrix') {
    q.push('هل تريد رؤية خطوات التحويل إلى صورة بايسون أو خطوة-بخطوة row-reduction؟');
    q.push('هل ترغب في تطبيق نفس العملية على مصفوفة أخرى كتمرين؟');
  } else {
    q.push('هل تريد توضيحاً أعمق للخطوات التي اتبعت؟');
    q.push('هل تفضل تلميحاً قبل الحل الكامل أم الحل الكامل مباشرة؟');
  }
  return q;
};

const formatSection = (title, items) => {
  const safeTitle = escapeHtml(title);
  const list = (items || []).map(it => `<li>${escapeHtml(it)}</li>`).join('');
  return `<div class="ai-assistant-section"><strong>${safeTitle}</strong><ul>${list}</ul></div>`;
};

const enhanceLocalSolution = (inputText, solutionTextOrObj) => {
  const category = detectCategory(inputText || solutionTextOrObj && String(solutionTextOrObj));
  const input = inputText || '';
  const solution = (typeof solutionTextOrObj === 'string') ? solutionTextOrObj : (JSON.stringify(solutionTextOrObj));

  // Build sections
  let stepItems = [];
  if (category === 'arithmetic') stepItems = arithmeticSteps(input);
  else if (category === 'linear_eq') stepItems = linearSteps(input);
  else if (category === 'quadratic') stepItems = quadraticSteps(input);
  else if (category === 'calculus') stepItems = calculusSteps(input);
  else stepItems = ['اتبع استراتيجية التحليل المناسبة: تبسيط → تنظيم → حل.'];

  const common = commonErrorsFor(category);
  const hints = hintsFor(category);
  const followups = followUpsFor(category, input, solution);

  const sections = [];
  // Show hints first; other sections are initially collapsed behind a toggle
  const hintsSection = formatSection('تلميحات قبل الحل الكامل', hints);
  const detailedSections = [];
  detailedSections.push(formatSection('شرح خطوة بخطوة', stepItems));
  detailedSections.push(formatSection('أخطاء شائعة محتملة', common));
  detailedSections.push(formatSection('أسئلة متابعة ذكية', followups));

  const toggleId = 'ai-details-' + Math.random().toString(36).slice(2,8);
  const out = `<div class="ai-enhanced-result">` +
    `<div class="ai-original-solution"><strong>الحل:</strong><div>${escapeHtml(solution)}</div></div>` +
    hintsSection +
    `<div style="margin-top:8px;"><button class="ai-toggle-btn" onclick="(function(btn){const target=document.getElementById('${toggleId}'); if(!target) return; if(target.style.display==='none'){target.style.display='block'; btn.textContent='إخفاء الشرح الكامل';} else {target.style.display='none'; btn.textContent='عرض الشرح الكامل';}})(this)">عرض الشرح الكامل</button></div>` +
    `<div id="${toggleId}" class="ai-details" style="display:none; margin-top:8px;">` + detailedSections.join('') + `</div>` +
    `</div>`;

  return { html: out, meta: { category } };
};

export default {
  enhanceLocalSolution,
  detectCategory,
  arithmeticSteps,
  linearSteps,
  quadraticSteps,
  calculusSteps,
  commonErrorsFor,
  hintsFor,
  followUpsFor
};
