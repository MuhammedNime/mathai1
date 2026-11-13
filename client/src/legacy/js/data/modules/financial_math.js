// 2. قسم الرياضيات المالية (Financial Mathematics)
export const financialData = [
    {
        topic: "الرياضيات المالية",
        icon: "📈",
        lessons: [
            {
                title: "حساب التفاضل والتكامل العشوائي (Stochastic Calculus)",
                content: `
                 <h1>نمذجة الأسواق المالية</h1>
                 <p>حركة الأسهم لا تتبع دوالاً ملساء عادية، بل تتبع حركة براونية (عشوائية). نحتاج لرياضيات خاصة للتعامل معها.</p>
                 
                 <h2>معادلة بلاك-شولز (Black-Scholes Equation)</h2>
                 <p>المعادلة التي منحت جائزة نوبل، تستخدم لتسعير الخيارات (Options Pricing). هي معادلة تفاضلية جزئية:</p>
                 <center>
                    $$ \\frac{\\partial V}{\\partial t} + \\frac{1}{2}\\sigma^2 S^2 \\frac{\\partial^2 V}{\\partial S^2} + rS \\frac{\\partial V}{\\partial S} - rV = 0 $$
                 </center>
                 
                 <h2>تمهيدية إيتو (Itô's Lemma)</h2>
                 <p>هي قاعدة السلسلة (Chain Rule) ولكن للدوال العشوائية. تنص على أن $df(X_t)$ يحتوي على حد إضافي بسبب التذبذب العشوائي.</p>
                `
            }
        ]
    }
];