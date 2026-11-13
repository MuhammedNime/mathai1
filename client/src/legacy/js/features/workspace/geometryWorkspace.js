// ==================== GEOMETRY WORKSPACE v4.0 - PROFESSIONAL EDITION ====================
export const GeometryWorkspace = {
    state: {
        activeTool: 'select',
        scene: { 
            points: {}, 
            objects: [], // Array of {id, type, points, props}
            values: {} 
        },
        isDragging: false,
        selectedPoint: null,
        selectedObject: null,
        draggingObject: null,
        dragLastPos: null,
        tempPoints: [],
        mousePos: { x: 0, y: 0 },
        canvas: { width: 800, height: 600, scale: 20 }, // مقياس: 1 وحدة = 20 بكسل
        grid: { size: 20, snap: true },
        freehand: { isDrawing: false, currentStroke: [] },
        history: { undo: [], redo: [] },
        lastActionHadChanges: false,
    },
    dom: {},
    
    init() {
        this.dom.modal = document.getElementById('geometry-workspace-modal');
        this.dom.canvas = document.getElementById('geometry-canvas');
        this.dom.toolbar = this.dom.modal.querySelector('.workspace-toolbar');
        this.dom.inspector = document.getElementById('geo-inspector-content');
        this.dom.inspectorDetails = document.getElementById('geo-inspector-details');
        this.dom.layersList = document.getElementById('geo-layers-list');
        this.dom.layersEmpty = document.getElementById('geo-layers-empty');
        this.dom.helperText = document.getElementById('draw-helper-text');
        this.dom.previewImage = document.getElementById('geo-preview-image');
        this.dom.refreshPreviewBtn = document.getElementById('geo-refresh-preview');
        this.dom.exportPreviewBtn = document.getElementById('geo-export-preview');
        this.dom.questionInput = document.getElementById('geo-user-question');
        this.dom.unitSelect = document.getElementById('geo-unit-select');
        this.dom.snapToggle = document.getElementById('geoSnapToggle');
        this.dom.coordDisplay = document.getElementById('geo-coord-display');
        this.dom.undoBtn = document.getElementById('geoUndoBtn');
        this.dom.redoBtn = document.getElementById('geoRedoBtn');
        
        this.ctx = this.dom.canvas.getContext('2d');
        
        // Mouse Events
        this.dom.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.dom.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.dom.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.dom.canvas.addEventListener('mouseout', () => { 
            this.state.isDragging = false; 
            this.drawScene(); 
        });

        // Touch Events
        this.dom.canvas.addEventListener('touchstart', (e) => this.handleMouseDown(e), { passive: false });
        this.dom.canvas.addEventListener('touchmove', (e) => this.handleMouseMove(e), { passive: false });
        this.dom.canvas.addEventListener('touchend', (e) => this.handleMouseUp(e));

        // Buttons
        document.getElementById('solve-geometry-btn').addEventListener('click', () => this.solve());
        
        // Toolbar
        this.dom.toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.tool-btn');
            if (btn && btn.dataset.tool) this.setActiveTool(btn.dataset.tool);
        });

        if (this.dom.snapToggle) {
            this.dom.snapToggle.addEventListener('click', () => {
                this.state.grid.snap = !this.state.grid.snap;
                this.updateSnapUI();
            });
        }

        if (this.dom.undoBtn) {
            this.dom.undoBtn.addEventListener('click', () => this.undo());
        }
        if (this.dom.redoBtn) {
            this.dom.redoBtn.addEventListener('click', () => this.redo());
        }

        if (this.dom.refreshPreviewBtn) {
            this.dom.refreshPreviewBtn.addEventListener('click', () => this.updatePreviewImage());
        }
        if (this.dom.exportPreviewBtn) {
            this.dom.exportPreviewBtn.addEventListener('click', () => this.exportPreviewImage());
        }

        if (this.dom.layersList) {
            this.dom.layersList.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.geo-layer-btn');
                if (actionBtn) {
                    const objectId = actionBtn.dataset.objectId;
                    if (actionBtn.dataset.action === 'toggle-visibility') {
                        this.toggleObjectVisibility(objectId);
                    }
                    if (actionBtn.dataset.action === 'toggle-lock') {
                        this.toggleObjectLock(objectId);
                    }
                    return;
                }
                const item = e.target.closest('.geo-layer-item');
                if (!item) return;
                this.state.selectedObject = item.dataset.objectId;
                this.updateInspector();
                this.drawScene();
            });
        }

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateInspectorCollapse();
        });
    },

    open() {
        this.reset();
        this.dom.modal.style.display = 'flex';
        setTimeout(() => {
            this.resizeCanvas();
            this.updateInspectorCollapse();
        }, 50); 
    },

    reset() {
        this.state.scene = { points: {}, objects: [], values: {} };
        this.state.isDragging = false;
        this.state.selectedPoint = null;
        this.state.selectedObject = null;
        this.state.draggingObject = null;
        this.state.dragLastPos = null;
        this.state.tempPoints = [];
        this.state.freehand = { isDrawing: false, currentStroke: [] };
        this.state.history = { undo: [], redo: [] };
        this.state.lastActionHadChanges = false;
        this.setActiveTool('select');
        this.updateSnapUI();
        this.drawScene();
        this.updateInspector();
        this.updatePreviewImage();
        if (this.dom.questionInput) this.dom.questionInput.value = '';
        this.pushHistory();
    },

    updateInspectorCollapse() {
        if (!this.dom.inspectorDetails) return;
        const isCompact = window.innerWidth < 1024;
        this.dom.inspectorDetails.open = !isCompact;
    },

    resizeCanvas() { 
        const container = this.dom.canvas.parentElement;
        if (!container) return;
        
        const w = Math.min(container.clientWidth - 20, 1200);
        const h = Math.min(container.clientHeight - 20, 800);
        
        this.dom.canvas.width = w;
        this.dom.canvas.height = h;
        this.state.canvas.width = w;
        this.state.canvas.height = h;
        
        this.drawScene();
    },

    setActiveTool(toolName) { 
        this.state.activeTool = toolName;
        this.dom.toolbar.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
        this.state.tempPoints = [];
        this.updateHelperText();
        this.drawScene();
    },

    _getCanvasPos(e) {
        e.preventDefault();
        const rect = this.dom.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    },

    _snapToGrid(pos) {
        if (!this.state.grid.snap) return pos;
        const size = this.state.grid.size || 20;
        return {
            x: Math.round(pos.x / size) * size,
            y: Math.round(pos.y / size) * size
        };
    },

    handleMouseDown(e) {
        const rawPos = this._getCanvasPos(e);
        const pos = this._snapToGrid(rawPos);
        const snappedPoint = this.getClosestPoint(pos, 15);

        if (this.state.activeTool === 'select') {
            if (snappedPoint) {
                this.state.isDragging = true;
                this.state.selectedPoint = snappedPoint.name;
                this.state.lastActionHadChanges = true;
            } else {
                // التحقق من النقر على شكل
                const clickedObj = this.getObjectAtPosition(pos);
                if (clickedObj) {
                    this.state.selectedObject = clickedObj.id;
                    if (!clickedObj.locked) {
                        this.state.draggingObject = clickedObj.id;
                        this.state.dragLastPos = rawPos;
                        this.state.lastActionHadChanges = true;
                    }
                    this.updateInspector();
                }
            }
        } else if (this.state.activeTool === 'delete') {
            if (snappedPoint) {
                this.deletePoint(snappedPoint.name);
            } else {
                const clickedObj = this.getObjectAtPosition(pos);
                if (clickedObj) this.deleteObject(clickedObj.id);
            }
        } else if (this.state.activeTool === 'freehand') {
            this.state.freehand.isDrawing = true;
            this.state.freehand.currentStroke = [rawPos];
            this.state.lastActionHadChanges = true;
        } else {
            this.handleToolClick(snappedPoint || pos);
        }
    },

    handleMouseMove(e) {
        const rawPos = this._getCanvasPos(e);
        const pos = this._snapToGrid(rawPos);
        this.state.mousePos = this.state.activeTool === 'freehand' ? rawPos : pos;
        this.updateCoordDisplay(rawPos);

        if (this.state.isDragging && this.state.selectedPoint) {
            const p = this.state.scene.points[this.state.selectedPoint];
            const objUsingPoint = this.state.scene.objects.find(o => o.points && o.points.includes(this.state.selectedPoint));
            if (!objUsingPoint || !objUsingPoint.locked) {
                this.state.scene.points[this.state.selectedPoint] = pos;
            }
        }
        if (this.state.draggingObject) {
            const dx = rawPos.x - this.state.dragLastPos.x;
            const dy = rawPos.y - this.state.dragLastPos.y;
            this.translateObject(this.state.draggingObject, dx, dy);
            this.state.dragLastPos = rawPos;
        }
        if (this.state.freehand.isDrawing) {
            this.state.freehand.currentStroke.push(rawPos);
        }
        this.drawScene();
    },

    handleMouseUp(e) {
        this.state.isDragging = false;
        this.state.selectedPoint = null;
        this.state.draggingObject = null;
        this.state.dragLastPos = null;
        if (this.state.freehand.isDrawing) {
            this.state.freehand.isDrawing = false;
            if (this.state.freehand.currentStroke.length > 2) {
                this.createFreehandObject([...this.state.freehand.currentStroke]);
            }
            this.state.freehand.currentStroke = [];
        }
        if (this.state.lastActionHadChanges) {
            this.recomputeAllProps();
            this.pushHistory();
            this.state.lastActionHadChanges = false;
        }
        this.updateInspector();
        this.updatePreviewImage();
    },

    handleToolClick(point) {
        if (this.state.activeTool === 'point') {
            const p = this._snapToGrid(point);
            this.addPoint(p.x, p.y);
            return;
        }

        const p = this._snapToGrid(point);
        this.state.tempPoints.push(p);
        const requiredPoints = {
            line: 2, triangle: 3, rectangle: 2, circle: 2, 
            cone: 2, ellipse: 3, polygon: 4
        };

        if (this.state.tempPoints.length === requiredPoints[this.state.activeTool]) {
            this.createObject(this.state.activeTool, [...this.state.tempPoints]);
            this.state.tempPoints = [];
        }
    },
    
    createObject(type, points) {
        const pointNames = this._ensurePointsExist(points);
        const obj = {
            id: `${type}-${Date.now()}`,
            type: type,
            points: pointNames,
            props: this._generateDefaultProps(type, points),
            color: null,
            lineWidth: 3,
            hidden: false,
            locked: false
        };
        this.state.scene.objects.push(obj);
        this.state.selectedObject = obj.id;
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    createFreehandObject(pathPoints) {
        const obj = {
            id: `freehand-${Date.now()}`,
            type: 'freehand',
            points: [],
            props: {
                path: pathPoints,
                length: this._getPathLength(pathPoints) / this.state.canvas.scale
            },
            color: null,
            lineWidth: 2,
            hidden: false,
            locked: false
        };
        this.state.scene.objects.push(obj);
        this.state.selectedObject = obj.id;
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    _generateDefaultProps(type, points) {
        const props = {};
        const scale = this.state.canvas.scale;
        
        if (type === 'triangle') {
            props.sides = {
                a: this._getDistance(points[1], points[2]) / scale,
                b: this._getDistance(points[0], points[2]) / scale,
                c: this._getDistance(points[0], points[1]) / scale
            };
            props.angles = {
                A: this._calculateAngle(points[1], points[0], points[2]),
                B: this._calculateAngle(points[0], points[1], points[2]),
                C: this._calculateAngle(points[0], points[2], points[1])
            };
        } else if (type === 'rectangle' || type === 'cone') {
            props.width = Math.abs(points[0].x - points[1].x) / scale;
            props.height = Math.abs(points[0].y - points[1].y) / scale;
        } else if (type === 'circle') {
            props.radius = this._getDistance(points[0], points[1]) / scale;
        } else if (type === 'ellipse') {
            props.radiusX = Math.abs(points[0].x - points[1].x) / scale;
            props.radiusY = Math.abs(points[0].y - points[2].y) / scale;
        }
        
        return props;
    },
    
    getClosestPoint(target, radius) {
        let closest = null;
        let minDistance = radius;
        for (const name in this.state.scene.points) {
            const point = this.state.scene.points[name];
            const distance = this._getDistance(point, target);
            if (distance < minDistance) {
                minDistance = distance;
                closest = { name, ...point };
            }
        }
        return closest;
    },

    getObjectAtPosition(pos) {
        // البحث عكسياً لإعطاء الأولوية للأشكال الأحدث
        for (let i = this.state.scene.objects.length - 1; i >= 0; i--) {
            const obj = this.state.scene.objects[i];
            if (obj.hidden) continue;
            if (this._isPointInObject(pos, obj)) return obj;
        }
        return null;
    },

    _isPointInObject(pos, obj) {
        const points = obj.type === 'freehand' ? [] : obj.points.map(n => this.state.scene.points[n]);
        if (obj.type !== 'freehand' && !points.every(p => p)) return false;

        if (obj.type === 'triangle') {
            return this._isPointInTriangle(pos, points[0], points[1], points[2]);
        } else if (obj.type === 'rectangle') {
            const [p1, p2] = points;
            return pos.x >= Math.min(p1.x, p2.x) && pos.x <= Math.max(p1.x, p2.x) &&
                   pos.y >= Math.min(p1.y, p2.y) && pos.y <= Math.max(p1.y, p2.y);
        } else if (obj.type === 'circle') {
            const dist = this._getDistance(pos, points[0]);
            const radius = this._getDistance(points[0], points[1]);
            return dist <= radius;
        } else if (obj.type === 'freehand') {
            const path = (obj.props && obj.props.path) || [];
            return this._isPointNearStroke(pos, path, 6);
        }
        return false;
    },

    _isPointInTriangle(p, p0, p1, p2) {
        const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        const s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y);
        const t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y);
        return s > 0 && t > 0 && (1 - s - t) > 0;
    },

    getNextPointName() {
        const existingNames = Object.keys(this.state.scene.points);
        for (let i = 65; i < 91; i++) {
            const name = String.fromCharCode(i);
            if (!existingNames.includes(name)) return name;
        }
        return `P${existingNames.length}`;
    },

    addPoint(x, y) {
        const name = this.getNextPointName();
        this.state.scene.points[name] = { x, y };
        this.drawScene();
        return name;
    },

    deletePoint(pointName) {
        delete this.state.scene.points[pointName];
        this.state.scene.objects = this.state.scene.objects.filter(
            obj => !obj.points.includes(pointName)
        );
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    deleteObject(objectId) {
        this.state.scene.objects = this.state.scene.objects.filter(obj => obj.id !== objectId);
        if (this.state.selectedObject === objectId) {
            this.state.selectedObject = null;
        }
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    translateObject(objectId, dx, dy) {
        const obj = this.state.scene.objects.find(o => o.id === objectId);
        if (!obj) return;
        if (obj.locked) return;
        if (obj.type === 'freehand') {
            if (obj.props && obj.props.path) {
                obj.props.path = obj.props.path.map(p => ({ x: p.x + dx, y: p.y + dy }));
            }
        } else {
            obj.points.forEach(name => {
                const p = this.state.scene.points[name];
                if (!p) return;
                p.x += dx;
                p.y += dy;
            });
        }
        this.drawScene();
        this.updatePreviewImage();
    },

    _ensurePointsExist(points) {
        return points.map(p => {
            if (p.name) return p.name; // إذا كانت نقطة موجودة
            const existing = Object.entries(this.state.scene.points)
                .find(([name, pos]) => Math.abs(pos.x - p.x) < 5 && Math.abs(pos.y - p.y) < 5);
            return existing ? existing[0] : this.addPoint(p.x, p.y);
        });
    },
    
    // ==================== DRAWING ENGINE ====================
    drawScene() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const { points, objects } = this.state.scene;
        
        const bg = getComputedStyle(document.body).getPropertyValue('--bg-container') || '#ffffff';
        ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        ctx.fillStyle = bg.trim();
        ctx.fillRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        this._drawGridBackground();
        
        // 1. رسم المعاينة المباشرة
        this._drawLivePreview();

        // 2. رسم الأشكال المكتملة
        objects.forEach(obj => {
            if (obj.hidden) return;
            this._drawObject(obj);
        });
        
        // 3. رسم النقاط
        for (const name in points) {
            this._drawPoint(name, points[name]);
        }
    },

    updatePreviewImage() {
        if (!this.dom.previewImage || !this.dom.canvas) return;
        try {
            const dataUrl = this.createPreviewImage();
            this.dom.previewImage.src = dataUrl;
        } catch (e) {
            // ignore preview failures
        }
    },

    createPreviewImage() {
        const bounds = this.getSceneBounds();
        const padding = 20;
        const targetW = 520;
        const targetH = 320;

        const sourceCanvas = this.dom.canvas;
        const off = document.createElement('canvas');
        off.width = targetW;
        off.height = targetH;
        const ctx = off.getContext('2d');

        const bg = getComputedStyle(document.body).getPropertyValue('--bg-container') || '#ffffff';
        ctx.fillStyle = bg.trim();
        ctx.fillRect(0, 0, targetW, targetH);

        const srcW = Math.max(1, bounds.maxX - bounds.minX);
        const srcH = Math.max(1, bounds.maxY - bounds.minY);
        const scale = Math.min((targetW - padding * 2) / srcW, (targetH - padding * 2) / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = (targetW - drawW) / 2;
        const dy = (targetH - drawH) / 2;

        ctx.drawImage(
            sourceCanvas,
            bounds.minX,
            bounds.minY,
            srcW,
            srcH,
            dx,
            dy,
            drawW,
            drawH
        );
        return off.toDataURL('image/png');
    },

    exportPreviewImage() {
        if (!this.dom.canvas) return;
        const dataUrl = this.createPreviewImage();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `geometry-preview-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getSceneBounds() {
        const width = this.state.canvas.width || this.dom.canvas.width;
        const height = this.state.canvas.height || this.dom.canvas.height;
        let minX = width, minY = height, maxX = 0, maxY = 0;

        const addPoint = (p) => {
            if (!p) return;
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        };

        Object.values(this.state.scene.points).forEach(addPoint);
        this.state.scene.objects.forEach(obj => {
            if (obj.type === 'freehand' && obj.props && obj.props.path) {
                obj.props.path.forEach(addPoint);
            }
        });

        if (minX > maxX || minY > maxY) {
            return { minX: 0, minY: 0, maxX: width, maxY: height };
        }
        return { minX, minY, maxX, maxY };
    },

    serializeScene() {
        const scale = this.state.canvas.scale;
        const objects = this.state.scene.objects.map(obj => this.serializeObject(obj, scale));
        return {
            canvas: {
                width: this.state.canvas.width,
                height: this.state.canvas.height,
                scale: scale
            },
            selected_object_id: this.state.selectedObject,
            objects: objects
        };
    },

    serializeObject(obj, scale) {
        if (obj.type === 'freehand') {
            const path = (obj.props && obj.props.path) || [];
            const reduced = this.downsamplePath(path, 60).map(p => ({
                x: +(p.x / scale).toFixed(3),
                y: +(p.y / scale).toFixed(3)
            }));
            return {
                id: obj.id,
                type: obj.type,
                props: { length: +(obj.props.length || 0).toFixed(3) },
                path_units: reduced,
                style: { color: obj.color || null, lineWidth: obj.lineWidth || 2 },
                flags: { hidden: !!obj.hidden, locked: !!obj.locked }
            };
        }

        const pointsPx = obj.points.map(name => this.state.scene.points[name]).filter(Boolean);
        const pointsUnits = pointsPx.map(p => ({
            x: +(p.x / scale).toFixed(3),
            y: +(p.y / scale).toFixed(3)
        }));
        return {
            id: obj.id,
            type: obj.type,
            props: obj.props,
            points_units: pointsUnits,
            style: { color: obj.color || null, lineWidth: obj.lineWidth || 3 },
            flags: { hidden: !!obj.hidden, locked: !!obj.locked }
        };
    },

    downsamplePath(path, maxPoints) {
        if (!path || path.length <= maxPoints) return path;
        const result = [];
        const step = Math.ceil(path.length / maxPoints);
        for (let i = 0; i < path.length; i += step) {
            result.push(path[i]);
        }
        if (path.length) result.push(path[path.length - 1]);
        return result;
    },

    _drawLivePreview() {
        if (this.state.activeTool === 'freehand') {
            if (this.state.freehand.currentStroke.length === 0) return;
        } else if (this.state.tempPoints.length === 0) {
            return;
        }
        
        const ctx = this.ctx;
        const points = this.state.activeTool === 'freehand' ? this.state.freehand.currentStroke : this.state.tempPoints;
        const currentPos = this.state.mousePos;
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (this.state.activeTool === 'freehand' && this.state.freehand.currentStroke.length > 1) {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        } else if (['line', 'triangle', 'polygon'].includes(this.state.activeTool)) {
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(currentPos.x, currentPos.y);
        } else if (this.state.activeTool === 'rectangle' || this.state.activeTool === 'cone') {
            const [start] = points;
            ctx.rect(start.x, start.y, currentPos.x - start.x, currentPos.y - start.y);
        } else if (this.state.activeTool === 'circle') {
            const radius = this._getDistance(points[0], currentPos);
            ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI);
        } else if (this.state.activeTool === 'ellipse' && points.length === 2) {
            const rx = Math.abs(points[0].x - points[1].x);
            const ry = Math.abs(points[0].y - currentPos.y);
            ctx.ellipse(points[0].x, points[0].y, rx, ry, 0, 0, 2 * Math.PI);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    },

    _drawObject(obj) {
        const points = obj.type === 'freehand' ? [] : obj.points.map(name => this.state.scene.points[name]);
        if (obj.type !== 'freehand' && points.some(p => !p)) return;
        
        const ctx = this.ctx;
        const isSelected = this.state.selectedObject === obj.id;
        const strokeColor = obj.color || (document.body.classList.contains('dark-mode') ? '#a5b4fc' : '#3f51b5');
        
        ctx.beginPath();
        ctx.strokeStyle = isSelected ? '#f59e0b' : strokeColor;
        ctx.lineWidth = isSelected ? Math.max((obj.lineWidth || 3) + 1, 3) : (obj.lineWidth || 3);
        ctx.lineJoin = 'round';

        if (obj.type === 'line') {
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
        } else if (obj.type === 'triangle') {
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.closePath();
        } else if (obj.type === 'rectangle') {
            const [p1, p2] = points;
            ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        } else if (obj.type === 'circle') {
            const radius = this._getDistance(points[0], points[1]);
            ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI);
        } else if (obj.type === 'cone') {
            this._drawCone(points[0], points[1]);
        } else if (obj.type === 'ellipse') {
            const rx = Math.abs(points[0].x - points[1].x);
            const ry = Math.abs(points[0].y - points[2].y);
            ctx.ellipse(points[0].x, points[0].y, rx, ry, 0, 0, 2 * Math.PI);
        } else if (obj.type === 'freehand') {
            const path = (obj.props && obj.props.path) || [];
            if (path.length > 1) {
                const freeColor = obj.color || (document.body.classList.contains('dark-mode') ? '#fcd34d' : '#0f172a');
                ctx.strokeStyle = isSelected ? '#f59e0b' : freeColor;
                ctx.lineWidth = isSelected ? Math.max((obj.lineWidth || 2) + 1, 3) : (obj.lineWidth || 2);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
            }
        }
        
        ctx.stroke();
        
        // رسم التسميات
        if (obj.type === 'triangle') {
            this._drawTriangleLabels(obj, points);
        }
    },

    _drawCone(p1, p2) {
        const ctx = this.ctx;
        const tipX = p1.x;
        const tipY = p1.y;
        const baseY = p2.y;
        const radius = Math.abs(p2.x - p1.x);
        
        // القاعدة (ellipse)
        ctx.ellipse(tipX, baseY, radius, radius * 0.3, 0, 0, 2 * Math.PI);
        ctx.stroke();
        
        // الخطوط الجانبية
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - radius, baseY);
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + radius, baseY);
        ctx.stroke();
    },

    _drawTriangleLabels(obj, points) {
        // رسم أطوال الأضلاع
        this._drawLabel(points[0], points[1]);
        this._drawLabel(points[1], points[2]);
        this._drawLabel(points[2], points[0]);
        
        // رسم الزوايا
        this._drawAngleLabel(points[1], points[0], points[2]);
        this._drawAngleLabel(points[0], points[1], points[2]);
        this._drawAngleLabel(points[0], points[2], points[1]);
    },

    _drawPoint(name, p) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = this.state.selectedPoint === name ? '#f59e0b' : 'var(--primary-color)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 16px Inter';
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e2e8f0' : '#1e293b';
        ctx.shadowColor = "white";
        ctx.shadowBlur = 4;
        ctx.fillText(name, p.x + 10, p.y - 10);
        ctx.shadowBlur = 0;
    },
    
    _drawGridBackground() {
        const ctx = this.ctx;
        const gridSize = 20;
        const gridColor = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        
        ctx.beginPath();
        for (let x = 0; x <= this.dom.canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.dom.canvas.height);
        }
        for (let y = 0; y <= this.dom.canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.dom.canvas.width, y);
        }
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    _getDistance(p1, p2) {
        if (!p1 || !p2) return 0;
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },

    _getMidpoint(p1, p2) {
        if (!p1 || !p2) return { x: 0, y: 0 };
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    },

    _getPathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            length += this._getDistance(path[i - 1], path[i]);
        }
        return length;
    },

    _isPointNearStroke(pos, path, tolerance) {
        if (!path || path.length < 2) return false;
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1];
            const b = path[i];
            const dist = this._distanceToSegment(pos, a, b);
            if (dist <= tolerance) return true;
        }
        return false;
    },

    _distanceToSegment(p, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx === 0 && dy === 0) return this._getDistance(p, a);
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
        const clamped = Math.max(0, Math.min(1, t));
        const proj = { x: a.x + clamped * dx, y: a.y + clamped * dy };
        return this._getDistance(p, proj);
    },

    _calculateAngle(p1, p2, p3) {
        const a = this._getDistance(p2, p3);
        const b = this._getDistance(p1, p2);
        const c = this._getDistance(p1, p3);
        const angleRad = Math.acos((a * a + b * b - c * c) / (2 * a * b));
        return angleRad * (180 / Math.PI);
    },

    _drawLabel(p1, p2) {
        const dist = this._getDistance(p1, p2) / this.state.canvas.scale;
        const mid = this._getMidpoint(p1, p2);
        
        this.ctx.font = 'bold 13px Inter';
        this.ctx.fillStyle = '#e11d48';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        this.ctx.shadowBlur = 6;
        this.ctx.fillText(dist.toFixed(1), mid.x, mid.y - 8);
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'start';
    },

    _drawAngleLabel(p1, p2, p3) {
        const angle = this._calculateAngle(p1, p2, p3);
        if (isNaN(angle)) return;
        
        const offset = 22;
        const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y;
        const dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy2, dx2);
        let bisectorAngle = (angle1 + angle2) / 2;

        if (Math.abs(angle1 - angle2) > Math.PI) {
            bisectorAngle += Math.PI;
        }

        const textX = p2.x + offset * Math.cos(bisectorAngle);
        const textY = p2.y + offset * Math.sin(bisectorAngle);

        this.ctx.font = 'bold 12px Inter';
        this.ctx.fillStyle = '#059669';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        this.ctx.shadowBlur = 6;
        this.ctx.fillText(angle.toFixed(0) + '°', textX, textY);
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'start';
    },
    
    // ==================== INSPECTOR ====================
    updateInspector() {
        const title = document.getElementById('geo-inspector-title');
        const icon = document.getElementById('geo-inspector-icon');
        const content = this.dom.inspector;

        this.updateLayersList();
        content.innerHTML = '';

        if (!this.state.selectedObject) {
            title.textContent = 'لم يتم تحديد شكل. ارسم أو حدد شكلاً';
            icon.textContent = '✏️';
            return;
        }

        const obj = this.state.scene.objects.find(o => o.id === this.state.selectedObject);
        if (!obj) return;

        title.textContent = `خصائص ${this._getObjectTypeName(obj.type)}`;
        icon.textContent = this._getObjectIcon(obj.type);

        const fields = this._generateInspectorFields(obj);
        
        fields.forEach(group => {
            content.innerHTML += this._createInputGroup(group.title, group.fields);
        });

        // Style controls
        content.innerHTML += `
            <div class="input-group">
                <div class="input-group-title">المظهر</div>
                <div class="input-row">
                    <label>لون الحد:</label>
                    <input type="color" class="geo-style-color" value="${obj.color || '#3f51b5'}" data-object-id="${obj.id}">
                </div>
                <div class="input-row">
                    <label>سماكة الخط:</label>
                    <input type="number" class="geo-style-width" min="1" max="8" step="1" value="${obj.lineWidth || 3}" data-object-id="${obj.id}">
                </div>
            </div>
        `;

        // Results
        const results = this._computeObjectResults(obj);
        if (results && results.length) {
            content.innerHTML += this._createInputGroup('النتائج', results);
        }

        this._bindInspectorInputs();
    },

    updateLayersList() {
        const list = this.dom.layersList;
        const empty = this.dom.layersEmpty;
        if (!list || !empty) return;

        list.innerHTML = '';
        const objects = this.state.scene.objects;

        if (!objects.length) {
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        objects.forEach((obj, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `geo-layer-item${this.state.selectedObject === obj.id ? ' active' : ''}`;
            item.dataset.objectId = obj.id;
            const label = this._getObjectLabel(obj, index);
            const meta = this._getObjectMeta(obj);
            item.innerHTML = `
                <span class="geo-layer-icon">${this._getObjectIcon(obj.type)}</span>
                <span class="geo-layer-title">${label}</span>
                <span class="geo-layer-meta">${meta}</span>
                <span class="geo-layer-actions">
                    <button type="button" class="geo-layer-btn" data-action="toggle-visibility" data-object-id="${obj.id}" title="إظهار/إخفاء">${obj.hidden ? '🙈' : '👁️'}</button>
                    <button type="button" class="geo-layer-btn" data-action="toggle-lock" data-object-id="${obj.id}" title="قفل/فتح">${obj.locked ? '🔒' : '🔓'}</button>
                </span>
            `;
            list.appendChild(item);
        });
    },

    updateHelperText() {
        if (!this.dom.helperText) return;
        const textMap = {
            select: '✋ تحديد/تحريك: اضغط على شكل أو نقطة',
            point: '📍 أضف نقطة واحدة بالنقر',
            line: '➖ اختر نقطتين لرسم قطعة مستقيمة',
            freehand: '🖊️ ارسم بحرية على اللوحة',
            triangle: '🔺 اختر ثلاث نقاط للمثلث',
            rectangle: '⬜ نقطتان متقابلتان للمستطيل',
            circle: '⭕ نقطة مركز ثم نقطة على المحيط',
            ellipse: '⚪ المركز ثم نقطتان لتحديد المحورين',
            cone: '🔻 قمة ثم قاعدة لتحديد المخروط',
            polygon: '⬡ أربع نقاط للمضلع',
            delete: '🗑️ احذف نقطة أو شكل بالنقر'
        };
        this.dom.helperText.textContent = textMap[this.state.activeTool] || '💡 حدد أداة للبدء';
    },

    updateSnapUI() {
        if (!this.dom.snapToggle) return;
        const isOn = this.state.grid.snap;
        this.dom.snapToggle.textContent = `🧲 Snap: ${isOn ? 'On' : 'Off'}`;
        this.dom.snapToggle.classList.toggle('active', isOn);
    },

    pushHistory() {
        const snapshot = this._cloneState();
        this.state.history.undo.push(snapshot);
        if (this.state.history.undo.length > 50) {
            this.state.history.undo.shift();
        }
        this.state.history.redo = [];
        this.updateHistoryUI();
    },

    undo() {
        if (this.state.history.undo.length <= 1) return;
        const current = this.state.history.undo.pop();
        this.state.history.redo.push(current);
        const prev = this.state.history.undo[this.state.history.undo.length - 1];
        this._restoreState(prev);
        this.updateHistoryUI();
    },

    redo() {
        if (this.state.history.redo.length === 0) return;
        const next = this.state.history.redo.pop();
        this.state.history.undo.push(next);
        this._restoreState(next);
        this.updateHistoryUI();
    },

    updateHistoryUI() {
        if (this.dom.undoBtn) this.dom.undoBtn.disabled = this.state.history.undo.length <= 1;
        if (this.dom.redoBtn) this.dom.redoBtn.disabled = this.state.history.redo.length === 0;
    },

    _cloneState() {
        const sceneCopy = JSON.parse(JSON.stringify(this.state.scene));
        return {
            scene: sceneCopy,
            selectedObject: this.state.selectedObject,
            selectedPoint: this.state.selectedPoint
        };
    },

    _restoreState(snapshot) {
        this.state.scene = JSON.parse(JSON.stringify(snapshot.scene));
        this.state.selectedObject = snapshot.selectedObject || null;
        this.state.selectedPoint = snapshot.selectedPoint || null;
        this.drawScene();
        this.updateInspector();
        this.updatePreviewImage();
    },

    updateCoordDisplay(pos) {
        if (!this.dom.coordDisplay) return;
        const scale = this.state.canvas.scale || 20;
        const x = (pos.x / scale).toFixed(2);
        const y = (pos.y / scale).toFixed(2);
        this.dom.coordDisplay.textContent = `x: ${x} , y: ${y}`;
    },

    recomputeAllProps() {
        this.state.scene.objects.forEach(obj => {
            if (obj.type === 'freehand') {
                if (obj.props && obj.props.path) {
                    obj.props.length = this._getPathLength(obj.props.path) / this.state.canvas.scale;
                }
                return;
            }
            const points = obj.points.map(name => this.state.scene.points[name]).filter(Boolean);
            if (!points.length) return;
            obj.props = this._generateDefaultProps(obj.type, points);
        });
        this.updateInspector();
    },

    toggleObjectVisibility(objectId) {
        const obj = this.state.scene.objects.find(o => o.id === objectId);
        if (!obj) return;
        obj.hidden = !obj.hidden;
        if (obj.hidden && this.state.selectedObject === objectId) {
            this.state.selectedObject = null;
        }
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    toggleObjectLock(objectId) {
        const obj = this.state.scene.objects.find(o => o.id === objectId);
        if (!obj) return;
        obj.locked = !obj.locked;
        this.updateInspector();
        this.drawScene();
        this.updatePreviewImage();
        this.pushHistory();
    },

    _getObjectLabel(obj, index) {
        return `${this._getObjectTypeName(obj.type)} ${index + 1}`;
    },

    _getObjectMeta(obj) {
        if (!obj || !obj.props) return '';
        if (obj.type === 'circle') return `r=${obj.props.radius.toFixed(2)}`;
        if (obj.type === 'rectangle' || obj.type === 'cone') return `${obj.props.width.toFixed(2)}×${obj.props.height.toFixed(2)}`;
        if (obj.type === 'triangle') return `a=${obj.props.sides.a.toFixed(1)} b=${obj.props.sides.b.toFixed(1)}`;
        if (obj.type === 'ellipse') return `rx=${obj.props.radiusX.toFixed(1)} ry=${obj.props.radiusY.toFixed(1)}`;
        if (obj.type === 'freehand') return `طول≈${obj.props.length.toFixed(1)}`;
        return '';
    },

    _getObjectTypeName(type) {
        const names = {
            triangle: 'المثلث', rectangle: 'المستطيل', circle: 'الدائرة',
            line: 'القطعة المستقيمة', cone: 'المخروط', ellipse: 'القطع الناقص',
            freehand: 'رسم حر'
        };
        return names[type] || type;
    },

    _getObjectIcon(type) {
        const icons = {
            triangle: '🔺', rectangle: '⬜', circle: '⭕',
            line: '➖', cone: '🔻', ellipse: '⚪', freehand: '🖊️'
        };
        return icons[type] || '📐';
    },

    _generateInspectorFields(obj) {
        const groups = [];
        
        if (obj.type === 'triangle') {
            groups.push({
                title: 'الأضلاع',
                fields: [
                    { label: `الضلع a`, value: obj.props.sides.a.toFixed(2), key: 'side_a' },
                    { label: `الضلع b`, value: obj.props.sides.b.toFixed(2), key: 'side_b' },
                    { label: `الضلع c`, value: obj.props.sides.c.toFixed(2), key: 'side_c' }
                ]
            });
            groups.push({
                title: 'الزوايا',
                fields: [
                    { label: `الزاوية A`, value: obj.props.angles.A.toFixed(0) + '°', key: 'angle_A' },
                    { label: `الزاوية B`, value: obj.props.angles.B.toFixed(0) + '°', key: 'angle_B' },
                    { label: `الزاوية C`, value: obj.props.angles.C.toFixed(0) + '°', key: 'angle_C' }
                ]
            });
        } else if (obj.type === 'rectangle' || obj.type === 'cone') {
            groups.push({
                title: 'الأبعاد',
                fields: [
                    { label: 'العرض', value: obj.props.width.toFixed(2), key: 'width' },
                    { label: 'الارتفاع', value: obj.props.height.toFixed(2), key: 'height' }
                ]
            });
        } else if (obj.type === 'circle') {
            groups.push({
                title: 'الخصائص',
                fields: [
                    { label: 'نصف القطر', value: obj.props.radius.toFixed(2), key: 'radius' }
                ]
            });
        } else if (obj.type === 'ellipse') {
            groups.push({
                title: 'الخصائص',
                fields: [
                    { label: 'نصف القطر الأفقي', value: obj.props.radiusX.toFixed(2), key: 'radiusX' },
                    { label: 'نصف القطر العمودي', value: obj.props.radiusY.toFixed(2), key: 'radiusY' }
                ]
            });
        } else if (obj.type === 'freehand') {
            groups.push({
                title: 'الخصائص',
                fields: [
                    { label: 'طول المسار (تقريبي)', value: obj.props.length.toFixed(2), key: 'path_length' }
                ]
            });
        }
        
        return groups;
    },


    _bindInspectorInputs() {
        if (!this.dom.inspector) return;
        this.dom.inspector.querySelectorAll('.geo-style-color').forEach(input => {
            input.addEventListener('input', (e) => {
                const obj = this.state.scene.objects.find(o => o.id === e.target.dataset.objectId);
                if (!obj) return;
                obj.color = e.target.value;
                this.drawScene();
                this.updatePreviewImage();
            });
            input.addEventListener('change', () => this.pushHistory());
        });
        this.dom.inspector.querySelectorAll('.geo-style-width').forEach(input => {
            input.addEventListener('input', (e) => {
                const obj = this.state.scene.objects.find(o => o.id === e.target.dataset.objectId);
                if (!obj) return;
                obj.lineWidth = parseInt(e.target.value, 10) || obj.lineWidth;
                this.drawScene();
                this.updatePreviewImage();
            });
            input.addEventListener('change', () => this.pushHistory());
        });
    },

    _computeObjectResults(obj) {
        const results = [];
        if (obj.type === 'rectangle' || obj.type === 'cone') {
            const w = obj.props.width || 0;
            const h = obj.props.height || 0;
            results.push({ label: 'المساحة', value: (w * h).toFixed(3), key: 'area' });
            results.push({ label: 'المحيط', value: (2 * (w + h)).toFixed(3), key: 'perimeter' });
        } else if (obj.type === 'circle') {
            const r = obj.props.radius || 0;
            results.push({ label: 'المساحة', value: (Math.PI * r * r).toFixed(3), key: 'area' });
            results.push({ label: 'المحيط', value: (2 * Math.PI * r).toFixed(3), key: 'circumference' });
            results.push({ label: 'القطر', value: (2 * r).toFixed(3), key: 'diameter' });
        } else if (obj.type === 'triangle') {
            const a = obj.props.sides.a || 0;
            const b = obj.props.sides.b || 0;
            const c = obj.props.sides.c || 0;
            const s = (a + b + c) / 2;
            const area = Math.sqrt(Math.max(s * (s - a) * (s - b) * (s - c), 0));
            results.push({ label: 'المحيط', value: (a + b + c).toFixed(3), key: 'perimeter' });
            results.push({ label: 'المساحة', value: area.toFixed(3), key: 'area' });
        } else if (obj.type === 'ellipse') {
            const rx = obj.props.radiusX || 0;
            const ry = obj.props.radiusY || 0;
            const area = Math.PI * rx * ry;
            results.push({ label: 'المساحة', value: area.toFixed(3), key: 'area' });
        }
        return results;
    },

    _createInputGroup(title, fields) {
        let html = `<div class="input-group"><div class="input-group-title">${title}</div>`;
        fields.forEach(field => {
            html += `
                <div class="input-row" data-key="${field.key}">
                    <label>${field.label}:</label>
                    <input type="text" class="geo-input" value="${field.value}" data-object-key="${field.key}" ${title === 'النتائج' ? 'readonly' : ''}>
                </div>
            `;
        });
        html += '</div>';
        return html;
    },
    
    // ==================== SOLVE & SEND ====================
    solve() {
        if (!this.state.selectedObject) {
            alert('يرجى تحديد شكل هندسي أولاً');
            return;
        }

        const obj = this.state.scene.objects.find(o => o.id === this.state.selectedObject);
        if (!obj) return;

        // جمع القيم المدخلة من المستخدم
        const userInputs = {};
        this.dom.inspector.querySelectorAll('.input-row').forEach(row => {
            const key = row.dataset.key;
            const input = row.querySelector('input');
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                userInputs[key] = value;
            }
        });

        // إنشاء كائن المسألة المنظمة
        const problemData = this.formatProblemData(obj, userInputs);
        
        // إرسال للمحادثة
        window.MathApp.chat.send(problemData);
        this.dom.modal.style.display = 'none';
    },

    formatProblemData(obj, userInputs) {
        const questionText = this.dom.questionInput ? this.dom.questionInput.value.trim() : '';
        let previewImage = null;
        try {
            if (this.dom.canvas) previewImage = this.createPreviewImage();
        } catch (e) {
            previewImage = null;
        }
        const unit = this.dom.unitSelect ? this.dom.unitSelect.value : 'unit';
        const data = {
            type: 'structured_problem',
            tool: 'geometry_solver',
            shape: obj.type,
            givens: {},
            solve_for: { type: 'all' },
            question: questionText || null,
            selected_object_id: obj.id,
            scene_summary: this.serializeScene(),
            preview_image: previewImage,
            unit: unit
        };

        if (obj.type === 'triangle') {
            data.givens = {
                sides: {},
                angles: {}
            };
            
            // جمع الأضلاع المعطاة
            ['side_a', 'side_b', 'side_c'].forEach(key => {
                if (userInputs[key]) {
                    data.givens.sides[key.replace('side_', '')] = userInputs[key];
                }
            });
            
            // جمع الزوايا المعطاة
            ['angle_A', 'angle_B', 'angle_C'].forEach(key => {
                if (userInputs[key]) {
                    data.givens.angles[key.replace('angle_', '')] = userInputs[key];
                }
            });
        } else if (obj.type === 'rectangle' || obj.type === 'cone') {
            data.givens = {
                width: userInputs.width || obj.props.width,
                height: userInputs.height || obj.props.height
            };
        } else if (obj.type === 'circle') {
            data.givens = {
                radius: userInputs.radius || obj.props.radius
            };
        } else if (obj.type === 'ellipse') {
            data.givens = {
                radiusX: userInputs.radiusX || obj.props.radiusX,
                radiusY: userInputs.radiusY || obj.props.radiusY
            };
        } else if (obj.type === 'freehand') {
            data.givens = {
                path_length: userInputs.path_length || obj.props.length
            };
        }
        
        return data;
    },

    formatProblemToHTML(data) {
        let html = '<h3>📐 مسألة هندسية من ورشة الهندسة</h3>';
        if (data.preview_image) {
            html += '<div class="geo-chat-preview"><img src="' + data.preview_image + '" alt="معاينة الرسم الهندسي"></div>';
        }
        html += `<p><strong>الشكل:</strong> ${this._getObjectTypeName(data.shape)}</p>`;
        if (data.unit && data.unit !== 'unit') {
            html += `<p><strong>الوحدة:</strong> ${data.unit}</p>`;
        }
        html += '<p><strong>المعطيات:</strong></p><ul>';
        
        if (data.shape === 'triangle') {
            if (data.givens.sides) {
                Object.entries(data.givens.sides).forEach(([key, val]) => {
                    html += `<li>الضلع ${key} = ${val}</li>`;
                });
            }
            if (data.givens.angles) {
                Object.entries(data.givens.angles).forEach(([key, val]) => {
                    html += `<li>الزاوية ${key} = ${val}°</li>`;
                });
            }
        } else if (data.shape === 'rectangle' || data.shape === 'cone') {
            html += `<li>العرض = ${data.givens.width}</li>`;
            html += `<li>الارتفاع = ${data.givens.height}</li>`;
        } else if (data.shape === 'circle') {
            html += `<li>نصف القطر = ${data.givens.radius}</li>`;
        } else if (data.shape === 'ellipse') {
            html += `<li>نصف القطر الأفقي = ${data.givens.radiusX}</li>`;
            html += `<li>نصف القطر العمودي = ${data.givens.radiusY}</li>`;
        }
        
        html += '</ul>';
        if (data.question) {
            html += `<p><strong>سؤال المستخدم:</strong> ${data.question}</p>`;
        }
        html += '<p>يرجى حساب جميع الخصائص المطلوبة بدقة اعتماداً على الرسم والمعطيات.</p>';
        return html;
    }
};
