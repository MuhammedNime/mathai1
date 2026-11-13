// ==================== إضافات المحتوى العملاق ====================

// 1. قسم الفيزياء الرياضية (Mathematical Physics)
export const physicsData = [
    {
        topic: "الفيزياء الرياضية والنسبية",
        icon: "🌌",
        lessons: [
            {
                title: "الموترات والنسبية العامة (Tensors & General Relativity)",
                content: `
                 <h1>لغة الكون: كيف تصف الرياضيات انحناء الزمكان</h1>
                 <p>لدراسة النسبية العامة، نحتاج إلى كائنات رياضية تعمم المتجهات والمصفوفات، تسمى **الموترات (Tensors)**.</p>
                 
                 <h2>جبر الموترات (Tensor Algebra)</h2>
                 <ul>
                    <li>**موتّر متري (Metric Tensor) $g_{\\mu\\nu}$:** يحدد المسافة والزوايا في الفضاء المنحني. في الفضاء المسطح (Minkowski)، يكون $ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2$.</li>
                    <li>**رموز كريستوفل (Christoffel Symbols) $\\Gamma^\\lambda_{\\mu\\nu}$:** تصف كيفية تغير المتجهات الأساسية أثناء الانتقال في الفضاء المنحني (النقل الموازي).</li>
                 </ul>

                 <h2>معادلات أينشتاين للمجال (Einstein Field Equations)</h2>
                 <p>أجمل وأعقد معادلة في الفيزياء، تربط انحناء الهندسة (الجاذبية) بمحتوى الطاقة والمادة:</p>
                 <center>
                    <h2 style="font-size:1.4em; color:darkblue;">
                       $\\mathbf{R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}}$
                    </h2>
                 </center>
                 <p>حيث $R_{\\mu\\nu}$ موتر ريتشي (الانحناء)، و $T_{\\mu\\nu}$ موتر الطاقة-الزخم.</p>
                `
            },
            {
                title: "ميكانيكا الكم وفضاءات هلبرت (Quantum Mechanics & Hilbert Spaces)",
                content: `
                 <h1>الرياضيات خلف العالم الذري</h1>
                 <p>تعتمد ميكانيكا الكم على الجبر الخطي في فضاءات معقدة لا نهائية الأبعاد تسمى **فضاءات هلبرت (Hilbert Spaces)**.</p>
                 
                 <h2>تدوين برا-كيت (Bra-Ket Notation)</h2>
                 <p>طورها ديراك. الحالة الكمية هي متجه $|\\psi\\rangle$. الضرب الداخلي هو $\\langle \\phi | \\psi \\rangle$.</p>
                 
                 <h2>المؤثرات الهرميتية (Hermitian Operators)</h2>
                 <p>في الكم، الكميات الفيزيائية (الطاقة، الزخم) تمثلها مصفوفات (مؤثرات) تكون قيمها الذاتية (Eigenvalues) حقيقية دائماً.</p>
                 
                 <h2>معادلة شرودنغر (Schrödinger Equation)</h2>
                 <center>
                    $$ i\\hbar \\frac{\\partial}{\\partial t} |\\psi(t)\\rangle = \\hat{H} |\\psi(t)\\rangle $$
                 </center>
                `
            }
        ]
    }
];




