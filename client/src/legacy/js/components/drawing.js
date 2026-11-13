// ==================== DRAWING MODULE ====================
export const drawing = {
    open() {
        window.MathApp.dom.drawingModal.style.display = 'block';
        window.MathApp.drawing.initCanvas();
        window.MathApp.drawing.resizeCanvas();
    },

    close() {
        window.MathApp.dom.drawingModal.style.display = 'none';
    },

    initCanvas() {
        const canvas = window.MathApp.dom.canvas;
                    window.MathApp.state.ctx = canvas.getContext('2d');
                    window.MathApp.state.ctx.lineCap = 'round';
                    window.MathApp.state.ctx.lineJoin = 'round';
                    window.MathApp.drawing.setPenWidth(document.getElementById('penWidth').value);
                    window.MathApp.drawing.setPenColor(document.getElementById('penColor').value);
                    window.MathApp.drawing.clear();
                },

                resizeCanvas() {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = window.MathApp.dom.canvas.width;
                    tempCanvas.height = window.MathApp.dom.canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(window.MathApp.dom.canvas, 0, 0);

                    const modalContent = window.MathApp.dom.drawingModal.querySelector('.modal-content');
                    const newWidth = Math.min(480, modalContent.clientWidth - 60);
                    const newHeight = newWidth * (320 / 480);
                    
                    window.MathApp.dom.canvas.width = newWidth;
                    window.MathApp.dom.canvas.height = newHeight;

                    window.MathApp.state.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
                },

                setPenWidth(width) {
                    window.MathApp.state.ctx.lineWidth = width;
                },

                setPenColor(color) {
                    window.MathApp.state.ctx.strokeStyle = color;
                },

                getMousePos(e) {
                    const rect = window.MathApp.dom.canvas.getBoundingClientRect();
                    const scaleX = window.MathApp.dom.canvas.width / rect.width;
                    const scaleY = window.MathApp.dom.canvas.height / rect.height;
                    
                    let clientX, clientY;
                    if (e.touches && e.touches.length > 0) {
                        clientX = e.touches[0].clientX;
                        clientY = e.touches[0].clientY;
                    } else {
                        clientX = e.clientX;
                        clientY = e.clientY;
                    }

                    return {
                        x: (clientX - rect.left) * scaleX,
                        y: (clientY - rect.top) * scaleY
                    };
                },

                startDrawing(e) {
                    e.preventDefault();
                    window.MathApp.state.isDrawing = true;
                    const pos = window.MathApp.drawing.getMousePos(e);
                    window.MathApp.state.lastX = pos.x;
                    window.MathApp.state.lastY = pos.y;
                },

                draw(e) {
                    if (!window.MathApp.state.isDrawing) return;
                    e.preventDefault();
                    const pos = window.MathApp.drawing.getMousePos(e);
                    
                    window.MathApp.state.ctx.beginPath();
                    window.MathApp.state.ctx.moveTo(window.MathApp.state.lastX, window.MathApp.state.lastY);
                    window.MathApp.state.ctx.lineTo(pos.x, pos.y);
                    window.MathApp.state.ctx.stroke();

                    window.MathApp.state.lastX = pos.x;
                    window.MathApp.state.lastY = pos.y;
                },

                stopDrawing() {
                    window.MathApp.state.isDrawing = false;
                },

                clear() {
                    window.MathApp.state.ctx.clearRect(0, 0, window.MathApp.dom.canvas.width, window.MathApp.dom.canvas.height);
                    window.MathApp.state.ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e9edef' : 'white';
                    window.MathApp.state.ctx.fillRect(0, 0, window.MathApp.dom.canvas.width, window.MathApp.dom.canvas.height);
                },

                process() {
                    const dataURL = window.MathApp.dom.canvas.toDataURL('image/png');
                    window.MathApp.state.selectedImageMimeType = 'image/png';
                    window.MathApp.state.selectedImageBase64 = dataURL.split(',')[1];

                    window.MathApp.drawing.close();
                    window.MathApp.photo.open();
                    window.MathApp.photo.confirm();
                    
                    window.MathApp.ui.showToast('تم إرفاق الرسم بنجاح. أرسل رسالتك الآن.');
                }
            }