import { normalizeMathExpression } from '../../tools/mathNormalize.js';

export const MatrixWorkspace = {
   state: {
        A: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        B: [[9, 8, 7], [6, 5, 4], [3, 2, 1]],
        C: [[1], [2], [3]],
        lastResult: null,
        lastOperation: null,
    },
    dom: {},
    paramModalOpen: false,

    normalizeCellValue(raw) {
        return normalizeMathExpression(raw, { removeSpaces: true, preferExponent: true });
    },

    parseCellValue(raw) {
        const cleaned = this.normalizeCellValue(raw);
        if (!cleaned) return { ok: false };
        try {
            const val = window.math.evaluate(cleaned);
            const num = (typeof val === 'number') ? val : Number(val && val.valueOf ? val.valueOf() : NaN);
            if (Number.isFinite(num)) return { ok: true, value: num };
        } catch (e) { /* ignore */ }
        return { ok: false };
    },

    setCellValidity(cell, isValid) {
        if (!cell) return;
        cell.classList.toggle('matrix-cell-invalid', !isValid);
    },

    validateCell(cell, matrixId, row, col, commit = false) {
        const raw = (cell.value || '').trim();
        if (!raw) {
            if (commit) this.state[matrixId][row][col] = 0;
            this.setCellValidity(cell, true);
            return true;
        }
        const parsed = this.parseCellValue(raw);
        if (parsed.ok) {
            if (commit) this.state[matrixId][row][col] = parsed.value;
            this.setCellValidity(cell, true);
            return true;
        }
        if (commit) {
            this.state[matrixId][row][col] = 0;
            cell.value = '0';
            this.setCellValidity(cell, true);
        } else {
            this.setCellValidity(cell, false);
        }
        return false;
    },

   init() {
    this.dom.modal = document.getElementById('matrix-workspace-modal');
    this.dom.gridA = document.getElementById('matrix-a-grid');
    this.dom.gridB = document.getElementById('matrix-b-grid');
    this.dom.gridC = document.getElementById('matrix-c-grid');
    this.dom.controlsA = document.getElementById('matrix-a-controls');
    this.dom.controlsB = document.getElementById('matrix-b-controls');
    this.dom.controlsC = document.getElementById('matrix-c-controls');
    this.dom.operationSelect = document.getElementById('matrix-operation-select');
    this.dom.matrixB_fieldset = document.getElementById('matrix-b-fieldset');
    this.dom.sendBtn = document.getElementById('matrix-send-to-chat-btn');
    this.dom.paramFieldset = document.getElementById('matrix-param-fieldset');
    this.dom.paramLabel = document.getElementById('matrix-param-label');
    this.dom.paramInput = document.getElementById('matrix-param-input');
    this.dom.matrixC_fieldset = document.getElementById('matrix-c-fieldset');
    
    // ربط الأحداث
    this.dom.controlsA.addEventListener('input', () => this.createMatrixGrid('A'));
    this.dom.controlsB.addEventListener('input', () => this.createMatrixGrid('B'));
    this.dom.controlsC.addEventListener('input', () => this.createMatrixGrid('C')); 
    this.dom.operationSelect.addEventListener('change', () => this.handleOperationChange());
    this.dom.sendBtn.addEventListener('click', () => this.validateAndSend());
    
    // تهيئة الواجهة
    this.createMatrixGrid('A');
    this.createMatrixGrid('B');
    this.createMatrixGrid('C');
    this.handleOperationChange();
},

open() { 
    this.dom.modal.style.display = 'flex';
    // تركيز على أول حقل إدخال
    setTimeout(() => {
        const firstInput = this.dom.gridA.querySelector('.matrix-cell');
        if (firstInput) firstInput.focus();
    }, 100);
},

close() {
    this.dom.modal.style.display = 'none';
},

handleOperationChange() {
    const selectedOption = this.dom.operationSelect.options[this.dom.operationSelect.selectedIndex];
    const requiresB = selectedOption.dataset.requiresB === 'true';
    const requiresC = selectedOption.dataset.requiresC === 'true'; 
    const requiresParam = selectedOption.dataset.requiresParam === 'true';
    const operation = this.dom.operationSelect.value;

    this.dom.matrixB_fieldset.style.display = requiresB ? 'block' : 'none';
    this.dom.matrixC_fieldset.style.display = requiresC ? 'block' : 'none'; 
    this.dom.paramFieldset.style.display = requiresParam ? 'block' : 'none';
    
    if (requiresParam) {
        if (operation === 'scalarMultiply') {
            this.dom.paramLabel.textContent = 'العدد (k):';
            this.dom.paramInput.placeholder = 'مثال: 2, 0.5, 1/3';
        } else if (operation === 'power') {
            this.dom.paramLabel.textContent = 'القوة (n):';
            this.dom.paramInput.placeholder = 'مثال: 2, 3, 4';
        }
    }

    this.showOperationDescription(operation);
},

showOperationDescription(operation) {
    const descriptions = {
        'add': 'جمع عناصر المصفوفتين A و B',
        'subtract': 'طرح عناصر المصفوفة B من A',
        'multiply': 'ضرب المصفوفتين A و B',
        'scalarMultiply': 'ضرب كل عنصر في المصفوفة بالعدد k',
        'power': 'رفع المصفوفة A للقوة n',
        'transA': 'إيجاد منقول المصفوفة A',
        'detA': 'حساب محدد المصفوفة A',
        'invA': 'إيجاد معكوس المصفوفة A',
        'adjA': 'حساب المصفوفة المرافقة للـ A',
        'traceA': 'مجموع عناصر القطر الرئيسي',
        'rowEchelon': 'تحويل A إلى الشكل الصفي المختزل',
        'rankA': 'إيجاد رتبة المصفوفة (Rank)',
        'solveSystem': 'حل النظام Ax = b بـ 3 طرق',
        'colSpace': 'إيجاد أساس فضاء الأعمدة',
        'rowSpace': 'إيجاد أساس فضاء الصفوف',
        'nullSpace': 'إيجاد أساس الفضاء الصفري',
        'charPoly': 'إيجاد متعددة الحدود المميزة',
        'eigen': 'حساب القيم والمتجهات الذاتية',
    };

    const description = descriptions[operation] || '';
    this.dom.operationSelect.title = description;
    
    let descDiv = document.getElementById('operation-description');
    if (!descDiv) {
        descDiv = document.createElement('div');
        descDiv.id = 'operation-description';
        descDiv.style.cssText = 'padding: 10px; background: var(--bg-container); border-radius: 8px; margin: 10px 0; font-size: 14px; color: var(--text-secondary);';
        this.dom.operationSelect.parentNode.insertBefore(descDiv, this.dom.operationSelect.nextSibling);
    }
    descDiv.textContent = description;
},

validateAndSend() {
    const operation = this.dom.operationSelect.value;
    
    // التحقق من صحة الإدخال
    const matrixA_data = this.getMatrixFromUI('A', false);
    if (!matrixA_data) {
        window.MathApp.ui.showToast('❌ خطأ في المصفوفة A. تأكد من أن جميع القيم أرقام صحيحة.', 'error');
        return;
    }

    const selectedOption = this.dom.operationSelect.options[this.dom.operationSelect.selectedIndex];
    
    if (selectedOption.dataset.requiresB === 'true') {
        const matrixB_data = this.getMatrixFromUI('B', false);
        if (!matrixB_data) {
            window.MathApp.ui.showToast('❌ خطأ في المصفوفة B. تأكد من أن جميع القيم أرقام صحيحة.', 'error');
            return;
        }
    }

    if (selectedOption.dataset.requiresParam === 'true') {
        if (!this.dom.paramInput.value.trim()) {
            window.MathApp.ui.showToast('❌ يرجى إدخال قيمة المعامل.', 'error');
            return;
        }
    }

    // إرسال للحل
    this.calculateAndSend();
},

calculateAndSend() {
    const operation = this.dom.operationSelect.value;
    
    if (operation === 'custom') {
        this.handleCustomOperation();
        return;
    }

    const matrixA_data = this.getMatrixFromUI('A')?.toArray();
    if (!matrixA_data) return;

    let matrixB_data = null, matrixC_data = null, paramValue = null;
    const selectedOption = this.dom.operationSelect.options[this.dom.operationSelect.selectedIndex];
    
    if (selectedOption.dataset.requiresB === 'true') { 
        matrixB_data = this.getMatrixFromUI('B')?.toArray(); 
        if (!matrixB_data) return; 
    }
    
    if (selectedOption.dataset.requiresC === 'true') { 
        matrixC_data = this.getMatrixFromUI('C')?.toArray(); 
        if (!matrixC_data) return; 
    }
    
    if (selectedOption.dataset.requiresParam === 'true') { 
        try { 
            const normalizedParam = this.normalizeCellValue(this.dom.paramInput.value);
            if (!normalizedParam) throw new Error('empty');
            paramValue = window.math.evaluate(normalizedParam); 
        } catch { 
            window.MathApp.ui.showToast('❌ قيمة المعامل غير صالحة.', 'error'); 
            return; 
        } 
    }

    const problemData = {
        type: 'structured_problem',
        tool: 'matrix_solver',
        operation: operation,
        matrixA: matrixA_data,
        matrixB: matrixB_data,
        matrixC: matrixC_data, 
        param: paramValue
    };
    
    window.MathApp.chat.send(problemData);
    this.close();
    window.MathApp.ui.showToast('✅ تم إرسال المسألة للحل!', 'success');
},

handleCustomOperation() {
    const customPrompt = window.prompt(
        'أدخل العملية المخصصة التي تريد تنفيذها على المصفوفة A:\n\n' +
        'أمثلة:\n' +
        '• "احسب مربع المصفوفة A"\n' +
        '• "أوجد المصفوفة القطرية من A"\n' +
        '• "اضرب الصف الأول في 5"\n' +
        '• أي عملية رياضية أخرى...'
    );

    if (!customPrompt || customPrompt.trim() === '') {
        return;
    }

    const matrixA_data = this.getMatrixFromUI('A')?.toArray();
    if (!matrixA_data) return;

    const customProblemData = {
        type: 'custom_matrix_operation',
        matrixA: matrixA_data,
        customOperation: customPrompt.trim()
    };

    window.MathApp.chat.send(customProblemData);
    this.close();
},

formatProblemToHTML(problemData) {
    const { operation, matrixA, matrixB, matrixC, param } = problemData;

    const formatMatrixToLatex = (m) => {
        if (!m) return '';
        let latex = '\\begin{pmatrix}\n';
        latex += m.map(row => row.join(' & ')).join(' \\\\\n');
        latex += '\n\\end{pmatrix}';
        return latex;
    };

    const operationsMap = {
        add: 'جمع المصفوفات', 
        subtract: 'طرح المصفوفات', 
        multiply: 'ضرب المصفوفات',
        scalarMultiply: `ضرب المصفوفة في عدد (${param})`, 
        power: `رفع المصفوفة للقوة (${param})`,
        detA: 'إيجاد المحدد', 
        invA: 'إيجاد المعكوس', 
        transA: 'إيجاد المنقول',
        adjA: 'إيجاد المصفوفة المرافقة', 
        traceA: 'إيجاد أثر المصفوفة', 
        rowEchelon: 'الشكل الصفي المختزل (RREF)', 
        rankA: 'إيجاد رتبة المصفوفة (Rank)',
        colSpace: 'أساس فضاء الأعمدة', 
        rowSpace: 'أساس فضاء الصفوف', 
        nullSpace: 'أساس الفضاء الصفري',
        charPoly: 'متعددة الحدود المميزة', 
        eigen: 'القيم والمتجهات الذاتية',
        solveSystem: 'حل النظام الخطي Ax=b بـ 3 طرق',
    };

    let html = `<h3>📊 ${operationsMap[operation] || operation}</h3>`;

    html += `<p><strong>المصفوفة A:</strong></p>$$A = ${formatMatrixToLatex(matrixA)}$$`;
    if (matrixB) {
        html += `<p><strong>المصفوفة B:</strong></p>$$B = ${formatMatrixToLatex(matrixB)}$$`;
    }
    if (matrixC) {
        html += `<p><strong>المتجه b:</strong></p>$$b = ${formatMatrixToLatex(matrixC)}$$`;
    }
    if (param !== null && operation !== 'solveSystem') {
        const paramName = operation === 'scalarMultiply' ? 'k' : 'n';
        html += `<p><strong>المعامل (${paramName}):</strong> <code>${param}</code></p>`;
    }
    
    html += '<p><strong>المطلوب:</strong> يرجى شرح الخطوات بالتفصيل وإظهار النتيجة النهائية.</strong></p>';
    
    return html;
},

// تنسيق تقرير التحليل الشامل للمصفوفة (Matrix report formatter)
formatReportToHTML(analysisResult, A) {
    const formatMatrixToLatex = (m) => {
        if (!m) return '';
        let latex = '\\begin{pmatrix}\n';
        latex += m.map(row => row.join(' & ')).join(' \\\\n');
        latex += '\\n\\end{pmatrix}';
        return latex;
    };

    if (!analysisResult || !analysisResult.analyses) {
        return `<div>⚠️ لم يتمكن النظام من توليد تقرير التحليل للمصفوفة.</div>`;
    }

    const analyses = analysisResult.analyses;
    let html = `<div class="matrix-report" style="padding:10px; border-radius:8px; background:var(--bg-container);">`;
    html += `<h3>📊 تقرير تحليلي للمصفوفة</h3>`;
    html += `<p><strong>المصفوفة A:</strong></p>$$A = ${formatMatrixToLatex(A)}$$`;

    if (analyses.dimensions) {
        html += `<p><strong>الأبعاد:</strong> ${analyses.dimensions.rows} × ${analyses.dimensions.cols} — مربع: ${analyses.dimensions.isSquare ? 'نعم' : 'لا'}</p>`;
    }

    if (analyses.rank) {
        html += `<p><strong>الرتبة:</strong> ${analyses.rank.rank} (nullity: ${analyses.rank.nullity}) — طريقة: ${analyses.rank.method || 'N/A'}</p>`;
    }

    if (analyses.determinant) {
        html += `<p><strong>المحدد:</strong> ${typeof analyses.determinant.value !== 'undefined' ? analyses.determinant.value : 'N/A'}</p>`;
    }

    if (analyses.conditionNumber) {
        html += `<p><strong>رقم الحالة:</strong> ${analyses.conditionNumber.value ? analyses.conditionNumber.value.toExponential(3) : 'غير معرّف'} — تفسير: ${analyses.conditionNumber.interpretation || analyses.conditionNumber.note || ''}</p>`;
    }

    if (analyses.norms) {
        html += `<p><strong>المعيار (Frobenius):</strong> ${analyses.norms.frobenius ? analyses.norms.frobenius.toFixed(4) : 'N/A'}</p>`;
    }

    html += '<details style="margin-top:10px;"><summary style="cursor:pointer; font-weight:700">📝 تفاصيل إضافية</summary><div style="padding:10px;">';

    Object.entries(analyses).forEach(([k, v]) => {
        if (['dimensions','rank','determinant','conditionNumber','norms'].includes(k)) return;
        try { html += `<div><strong>${k}:</strong> <pre style="white-space:pre-wrap">${JSON.stringify(v, null, 2)}</pre></div>`; } catch(e) { /* ignore */ }
    });

    html += '</div></details>';
    html += '</div>';
    return html;
},

createMatrixGrid(matrixId) {
    const rowsInput = document.querySelector(`.matrix-dim[data-matrix="${matrixId}"][data-dim="rows"]`);
    const colsInput = document.querySelector(`.matrix-dim[data-matrix="${matrixId}"][data-dim="cols"]`);
    if (!rowsInput || !colsInput) return;

    const grid = (matrixId === 'A') ? this.dom.gridA : (matrixId === 'B' ? this.dom.gridB : this.dom.gridC);
    
    if (!rowsInput.value || !colsInput.value) return;

    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);

    // التحقق من الحد الأقصى
    if (rows > 25 || cols > 25) {
        window.MathApp.ui.showToast('⚠️ الحد الأقصى للأبعاد هو 25×25', 'warning');
        rowsInput.value = Math.min(rows, 25);
        colsInput.value = Math.min(cols, 25);
        return;
    }

    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gap = '5px';

    const oldMatrix = this.state[matrixId] || [];
    this.state[matrixId] = Array(rows).fill(null).map((_, i) => 
        Array(cols).fill(null).map((__, j) => oldMatrix[i]?.[j] || 0)
    );

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.className = 'matrix-cell';
            const value = this.state[matrixId][i][j];
            cell.value = value;
            cell.placeholder = '0';
            
            // إضافة معالجات للتحقق والتحديث
            cell.addEventListener('input', () => this.validateCell(cell, matrixId, i, j, false));
            cell.addEventListener('change', () => this.validateCell(cell, matrixId, i, j, true));
            this.setCellValidity(cell, true);

            grid.appendChild(cell);
        }
    }
},

getMatrixFromUI(matrixId, showError = true) {
    const grid = (matrixId === 'A') ? this.dom.gridA : (matrixId === 'B' ? this.dom.gridB : this.dom.gridC);
    
    if (!grid.hasChildNodes()) {
        return window.math.matrix(this.state[matrixId]);
    }

    const rowsInput = document.querySelector(`.matrix-dim[data-matrix="${matrixId}"][data-dim="rows"]`);
    const colsInput = document.querySelector(`.matrix-dim[data-matrix="${matrixId}"][data-dim="cols"]`);
    
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);
    const matrixData = [];
    const cells = grid.querySelectorAll('.matrix-cell');

    for (let i = 0; i < rows; i++) {
        const rowData = [];
        for (let j = 0; j < cols; j++) {
            const cell = cells[i * cols + j];
            const cellValue = (cell.value || '').trim();
            if (!cellValue) {
                rowData.push(0);
                this.setCellValidity(cell, true);
                continue;
            }
            const parsed = this.parseCellValue(cellValue);
            if (!parsed.ok) {
                this.setCellValidity(cell, false);
                if (showError) window.MathApp.ui.showToast(`❌ قيمة غير صالحة في المصفوفة ${matrixId}: "${cellValue}"`, 'error');
                return null;
            }
            this.setCellValidity(cell, true);
            rowData.push(parsed.value);
        }
        matrixData.push(rowData);
    }

    this.state[matrixId] = matrixData;
    return window.math.matrix(matrixData);
}
}
