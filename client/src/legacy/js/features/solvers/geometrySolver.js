// features/solvers/geometrySolver.js - النسخة المحسّنة

export const geometrySolver = {
    solve(data) {
         const { shape, givens, solve_for } = data;
        
        // ✨ الموجه الآن يتحقق من الهدف أولاً
        if (shape === 'triangle') {
            if (solve_for.type === 'angle' && Object.keys(givens.angles || {}).length === 2) {
                return this.triangleAngleSum(givens.angles, solve_for.target);
            }
            if (solve_for.type === 'side') {
                const rightAngle = Object.entries(givens.angles || {}).find(([k, v]) => v === 90);
                if (rightAngle && Object.keys(givens.sides || {}).length === 2) {
                    return this.pythagorean(givens.sides, rightAngle[0], solve_for.target);
                }
            }
            // ✨ إذا كان الهدف هو حساب كل شيء، استدع الدالة الشاملة
            if (solve_for.type === 'all') {
                return this.solveTriangle(givens);
            }
        }
        // ... (يمكن إضافة المزيد من القواعد الموجهة بالأهداف هنا)
        
        
        switch(shape) {
            case 'triangle':
                return this.solveTriangle(givens);
            case 'rectangle':
                return this.solveRectangle(givens);
            case 'circle':
                return this.solveCircle(givens);
            case 'ellipse':
                return this.solveEllipse(givens);
            case 'cone':
                return this.solveCone(givens);
            default:
                return null;
        }
    },

    solveTriangle(givens) {
        const { sides, angles } = givens;
        const knownSides = Object.keys(sides || {}).length;
        const knownAngles = Object.keys(angles || {}).length;
        
        // قاعدة مجموع الزوايا
        if (knownAngles === 2) {
            return this.triangleAngleSum(angles);
        }
        
        // نظرية فيثاغورس
        const rightAngle = Object.entries(angles || {}).find(([k, v]) => v === 90);
        if (rightAngle && knownSides === 2) {
            return this.pythagorean(sides, rightAngle[0]);
        }
        
        // قانون الجيب وجيب التمام
        if (knownSides === 3) {
            return this.triangleSidesOnly(sides);
        }
        
        if (knownSides === 2 && knownAngles === 1) {
            return this.triangleSAS(sides, angles);
        }
        
        return null;
    },
    // ✨ تم تعديل الدوال لتقبل "الهدف"
    triangleAngleSum(angles, targetAngle) {
        const sum = Object.values(angles).reduce((a, b) => a + b, 0);
        if (sum >= 180) { /* ... (رسالة الخطأ) ... */ }
        const missing = 180 - sum;
        
        return {
            title: `حساب الزاوية ${targetAngle}`,
            finalResult: `\\angle ${targetAngle} = ${missing}^\\circ`,
            steps: [
                { explanation: "القاعدة: مجموع زوايا المثلث = 180°", equation: `...` },
                { explanation: "الحل:", equation: `\\angle ${targetAngle} = 180^\\circ - ${sum}^\\circ = ${missing}^\\circ` }
            ]
        };
    },

    pythagorean(sides, rightAngleKey) {
        const hyp = rightAngleKey.toLowerCase();
        const legs = ['a', 'b', 'c'].filter(s => s !== hyp);
        const knownLegs = legs.filter(l => sides[l] !== undefined);
        
        if (sides[hyp] && knownLegs.length === 1) {
            // حساب ضلع قائم
            const known = knownLegs[0];
            const missing = legs.find(l => !sides[l]);
            const result = Math.sqrt(sides[hyp]**2 - sides[known]**2);
            
            return {
                title: `حساب الضلع ${missing}`,
                finalResult: `${missing} = ${result.toFixed(4)}`,
                steps: [
                    { explanation: "نظرية فيثاغورس:", equation: `${missing}^2 = ${hyp}^2 - ${known}^2` },
                    { explanation: "التعويض:", equation: `${missing}^2 = ${sides[hyp]}^2 - ${sides[known]}^2 = ${(sides[hyp]**2 - sides[known]**2).toFixed(4)}` },
                    { explanation: "الحل:", equation: `${missing} = \\sqrt{${(sides[hyp]**2 - sides[known]**2).toFixed(4)}} = ${result.toFixed(4)}` }
                ]
            };
        } else if (knownLegs.length === 2) {
            // حساب الوتر
            const a = sides[knownLegs[0]];
            const b = sides[knownLegs[1]];
            const result = Math.sqrt(a**2 + b**2);
            
            return {
                title: `حساب الوتر ${hyp}`,
                finalResult: `${hyp} = ${result.toFixed(4)}`,
                steps: [
                    { explanation: "نظرية فيثاغورس:", equation: `${hyp}^2 = ${knownLegs[0]}^2 + ${knownLegs[1]}^2` },
                    { explanation: "التعويض:", equation: `${hyp}^2 = ${a}^2 + ${b}^2 = ${(a**2 + b**2).toFixed(4)}` },
                    { explanation: "الحل:", equation: `${hyp} = ${result.toFixed(4)}` }
                ]
            };
        }
        
        return null;
    },

    triangleSidesOnly(sides) {
        const [a, b, c] = Object.values(sides);
        
        // حساب الزوايا باستخدام قانون جيب التمام
        const angleA = Math.acos((b**2 + c**2 - a**2) / (2*b*c)) * (180/Math.PI);
        const angleB = Math.acos((a**2 + c**2 - b**2) / (2*a*c)) * (180/Math.PI);
        const angleC = 180 - angleA - angleB;
        
        // حساب المساحة بصيغة هيرون
        const s = (a + b + c) / 2;
        const area = Math.sqrt(s * (s-a) * (s-b) * (s-c));
        
        return {
            title: "حساب خصائص المثلث",
            finalResult: `\\text{المساحة} = ${area.toFixed(4)}`,
            steps: [
                { explanation: "المحيط:", equation: `P = ${a} + ${b} + ${c} = ${(a+b+c).toFixed(4)}` },
                { explanation: "نصف المحيط:", equation: `s = \\frac{P}{2} = ${s.toFixed(4)}` },
                { explanation: "صيغة هيرون للمساحة:", equation: `A = \\sqrt{s(s-a)(s-b)(s-c)} = ${area.toFixed(4)}` },
                { explanation: "الزوايا (قانون جيب التمام):", equation: `A=${angleA.toFixed(2)}^\\circ, B=${angleB.toFixed(2)}^\\circ, C=${angleC.toFixed(2)}^\\circ` }
            ]
        };
    },

    solveRectangle(givens) {
        const { width, height } = givens;
        
        if (!width || !height) return null;
        
        const area = width * height;
        const perimeter = 2 * (width + height);
        const diagonal = Math.sqrt(width**2 + height**2);
        
        return {
            title: "خصائص المستطيل",
            finalResult: `\\text{المساحة} = ${area.toFixed(4)}`,
            steps: [
                { explanation: "المساحة:", equation: `A = w \\times h = ${width} \\times ${height} = ${area.toFixed(4)}` },
                { explanation: "المحيط:", equation: `P = 2(w + h) = 2(${width} + ${height}) = ${perimeter.toFixed(4)}` },
                { explanation: "القطر:", equation: `d = \\sqrt{w^2 + h^2} = \\sqrt{${width}^2 + ${height}^2} = ${diagonal.toFixed(4)}` }
            ]
        };
    },

    solveCircle(givens) {
        const { radius } = givens;
        
        if (!radius) return null;
        
        const area = Math.PI * radius**2;
        const circumference = 2 * Math.PI * radius;
        
        return {
            title: "خصائص الدائرة",
            finalResult: `\\text{المساحة} = ${area.toFixed(4)}`,
            steps: [
                { explanation: "المساحة:", equation: `A = \\pi r^2 = \\pi \\times ${radius}^2 = ${area.toFixed(4)}` },
                { explanation: "المحيط:", equation: `C = 2\\pi r = 2\\pi \\times ${radius} = ${circumference.toFixed(4)}` },
                { explanation: "القطر:", equation: `d = 2r = ${(2*radius).toFixed(4)}` }
            ]
        };
    },

    solveEllipse(givens) {
        const { radiusX, radiusY } = givens;
        
        if (!radiusX || !radiusY) return null;
        
        const area = Math.PI * radiusX * radiusY;
        // تقريب المحيط (صيغة رامانوجان)
        const h = ((radiusX - radiusY)**2) / ((radiusX + radiusY)**2);
        const perimeter = Math.PI * (radiusX + radiusY) * (1 + (3*h)/(10 + Math.sqrt(4 - 3*h)));
        
        return {
            title: "خصائص القطع الناقص",
            finalResult: `\\text{المساحة} = ${area.toFixed(4)}`,
            steps: [
                { explanation: "المساحة:", equation: `A = \\pi a b = \\pi \\times ${radiusX} \\times ${radiusY} = ${area.toFixed(4)}` },
                { explanation: "المحيط (تقريبي):", equation: `P \\approx ${perimeter.toFixed(4)}` },
                { explanation: "المحورين:", equation: `a = ${radiusX}, b = ${radiusY}` }
            ]
        };
    },

    solveCone(givens) {
        const { width: radius, height } = givens;
        
        if (!radius || !height) return null;
        
        const slantHeight = Math.sqrt(radius**2 + height**2);
        const baseArea = Math.PI * radius**2;
        const lateralArea = Math.PI * radius * slantHeight;
        const totalArea = baseArea + lateralArea;
        const volume = (1/3) * Math.PI * radius**2 * height;
        
        return {
            title: "خصائص المخروط",
            finalResult: `\\text{الحجم} = ${volume.toFixed(4)}`,
            steps: [
                { explanation: "نصف القطر:", equation: `r = ${radius}` },
                { explanation: "الارتفاع:", equation: `h = ${height}` },
                { explanation: "الراسم:", equation: `l = \\sqrt{r^2 + h^2} = ${slantHeight.toFixed(4)}` },
                { explanation: "مساحة القاعدة:", equation: `A_{base} = \\pi r^2 = ${baseArea.toFixed(4)}` },
                { explanation: "المساحة الجانبية:", equation: `A_{lateral} = \\pi r l = ${lateralArea.toFixed(4)}` },
                { explanation: "المساحة الكلية:", equation: `A_{total} = ${totalArea.toFixed(4)}` },
                { explanation: "الحجم:", equation: `V = \\frac{1}{3}\\pi r^2 h = ${volume.toFixed(4)}` }
            ]
        };
    }
};