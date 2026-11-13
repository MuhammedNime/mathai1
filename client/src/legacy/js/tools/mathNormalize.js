const ARABIC_DIGITS_MAP = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

const SUPERSCRIPT_MAP = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};

const MATH_INVISIBLE_CHARS = /[\u200B-\u200F\uFEFF\u2060]/g;

export const toLatinDigits = (input) => {
  return String(input || '').replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS_MAP[d] || d);
};

export const stripMathDelimiters = (text) => {
  if (!text) return '';
  let s = String(text);
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  s = s.replace(/\$([^$]+)\$/g, '$1');
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  return s;
};

const normalizeSuperscripts = (text) => {
  return String(text || '').replace(/([A-Za-z\u0621-\u064A0-9\)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g, (match, base, sup) => {
    const converted = sup.split('').map((c) => SUPERSCRIPT_MAP[c] || '').join('');
    if (!converted) return match;
    return `${base}^${converted}`;
  });
};

export const normalizeMathExpression = (input, options = {}) => {
  const opts = {
    removeSpaces: true,
    preferExponent: false,
    keepCommas: false,
    ...options
  };

  let s = stripMathDelimiters(String(input || ''));
  s = toLatinDigits(s);
  s = s.replace(MATH_INVISIBLE_CHARS, '');
  s = s.replace(/[−–—﹣－]/g, '-');
  s = s.replace(/[＋]/g, '+');
  s = s.replace(/[×·∙•⋅]/g, '*');
  s = s.replace(/÷/g, '/');
  s = s.replace(/√/g, 'sqrt');
  s = s.replace(/π/g, 'pi');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\,/g, '');
  s = s.replace(/\\;/g, '');
  s = s.replace(/\\!/g, '');
  s = s.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\s*\{([^}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|ln|log|sqrt)\b/g, '$1');
  s = s.replace(/\bln\(/g, 'log(');
  s = normalizeSuperscripts(s);

  if (opts.keepCommas) {
    s = s.replace(/([0-9])[،]([0-9])/g, '$1.$2');
  } else {
    s = s.replace(/([0-9])[،,]([0-9])/g, '$1.$2');
  }

  s = s.replace(/[س]/g, 'x').replace(/[ص]/g, 'y');
  s = s.replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'));

  if (opts.preferExponent) {
    s = s.replace(/([A-Za-z\u0621-\u064A])\s*([2-9])(?!\d)/g, '$1^$2');
    s = s.replace(/([)\]])\s*([2-9])(?!\d)/g, '$1^$2');
  }

  s = s.replace(/(\d)([A-Za-z\u0621-\u064A(])/g, (match, d, ch, offset) => {
    if ((ch === 'e' || ch === 'E') && /[+-]?\d/.test(s.slice(offset + 2, offset + 4))) {
      return match;
    }
    return `${d}*${ch}`;
  });
  s = s.replace(/([A-Za-z\u0621-\u064A])(\d)/g, (match, v, d, offset) => {
    const prev = s[offset - 1];
    if ((v === 'e' || v === 'E') && prev && /\d/.test(prev)) {
      return match;
    }
    if (opts.preferExponent && /^[2-9]$/.test(d)) return `${v}^${d}`;
    return `${v}*${d}`;
  });
  s = s.replace(/(\))([A-Za-z\u0621-\u064A(])/g, '$1*$2');
  s = s.replace(/(\))(\()/g, '$1*$2');
  s = s.replace(/([A-Za-z\u0621-\u064A])(\()/g, '$1*$2');

  if (opts.removeSpaces) {
    s = s.replace(/\s+/g, '');
  }
  return s;
};

export const isLikelyMathText = (text) => {
  const s = String(text || '').trim();
  if (!s) return false;
  const mathTokens = (s.match(/[0-9=+\-*/^()√π\[\]{}]/g) || []).length;
  const letters = (s.match(/[A-Za-z\u0621-\u064A]/g) || []).length;
  return mathTokens >= Math.max(2, letters);
};

export const normalizeOCRText = (text) => {
  if (!text) return '';
  const lines = String(text).split(/\r?\n/);
  const normalizedLines = lines.map((line) => {
    if (!isLikelyMathText(line)) return line.trim();
    let s = toLatinDigits(line);
    s = s.replace(MATH_INVISIBLE_CHARS, '');
    s = s.replace(/[−–—﹣－]/g, '-');
    s = s.replace(/[＋]/g, '+');
    s = s.replace(/[×·∙•⋅]/g, '*');
    s = s.replace(/÷/g, '/');
    s = s.replace(/([0-9])[،,]([0-9])/g, '$1.$2');
    s = s.replace(/([A-Za-z\u0621-\u064A])\s*([2-9])(?!\d)/g, '$1^$2');
    s = s.replace(/([)\]])\s*([2-9])(?!\d)/g, '$1^$2');
    return s.replace(/\s+/g, ' ').trim();
  });
  return normalizedLines.filter(Boolean).join('\n').trim();
};
