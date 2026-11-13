// ==================== PHOTO MODULE ====================
export const photo = {
    open() {
        MathApp.dom.photoModal.style.display = 'block';
        MathApp.photo.updateReviewArea();
    },

    close() {
        MathApp.dom.photoModal.style.display = 'none';
        MathApp.photo.stopCamera();
                },

                openCamera() {
                    const cameraArea = document.getElementById('cameraCaptureArea');
                    cameraArea.style.display = 'block';
                    MathApp.dom.confirmImageBtn.disabled = true;

                    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                        .then(stream => {
                            MathApp.state.cameraStream = stream;
                            MathApp.dom.cameraStream.srcObject = stream;
                        })
                        .catch(err => {
                            console.error("Error accessing camera: ", err);
                            MathApp.ui.showToast("تعذر الوصول إلى الكاميرا. تأكد من إعطاء الأذونات اللازمة.");
                            cameraArea.style.display = 'none';
                        });
                },

                stopCamera() {
                    const cameraArea = document.getElementById('cameraCaptureArea');
                    if (MathApp.state.cameraStream) {
                        MathApp.state.cameraStream.getTracks().forEach(track => track.stop());
                        MathApp.state.cameraStream = null;
                        cameraArea.style.display = 'none';
                    }
                },

                previewFile(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            MathApp.state.selectedImageBase64 = e.target.result.split(',')[1];
                            MathApp.state.selectedImageMimeType = file.type;
                            MathApp.photo.updateReviewArea(e.target.result);
                        };
                        reader.readAsDataURL(file);
                        MathApp.photo.stopCamera();
                    }
                },

                capture() {
                    const video = MathApp.dom.cameraStream;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const mimeType = 'image/jpeg';
                    const dataURL = canvas.toDataURL(mimeType, 0.9);
                    
                    MathApp.state.selectedImageBase64 = dataURL.split(',')[1];
                    MathApp.state.selectedImageMimeType = mimeType;
                    MathApp.photo.stopCamera();
                    MathApp.photo.updateReviewArea(dataURL);
                },

                updateReviewArea(dataURL = null) {
                    const base64Data = dataURL || (MathApp.state.selectedImageBase64 ? `data:${MathApp.state.selectedImageMimeType};base64,${MathApp.state.selectedImageBase64}` : null);

                    if (base64Data) {
                        MathApp.dom.reviewImagePreview.src = base64Data;
                        MathApp.dom.imageReviewArea.style.display = 'block';
                        MathApp.dom.confirmImageBtn.disabled = false;
                        document.getElementById('photoSelectionArea').style.display = 'none';
                    } else {
                        MathApp.dom.imageReviewArea.style.display = 'none';
                        MathApp.dom.confirmImageBtn.disabled = true;
                        document.getElementById('photoSelectionArea').style.display = 'block';
                    }
                },

                confirm() {
                    MathApp.dom.imageAttachedIndicator.style.display = 'flex';
                    MathApp.photo.close();
                    if (MathApp.updateInputButtons) MathApp.updateInputButtons();
                },

                clearAttachment(showConfirm = false) {
                    const doClear = () => {
                        MathApp.state.selectedImageBase64 = null;
                        MathApp.state.selectedImageMimeType = null;
                        document.getElementById('imageFileInput').value = null;
                        MathApp.dom.imageAttachedIndicator.style.display = 'none';
                        MathApp.photo.updateReviewArea();
                        MathApp.photo.stopCamera();
                        if (MathApp.updateInputButtons) MathApp.updateInputButtons();
                    };
                    
                    if (showConfirm) {
                        MathApp.ui.showConfirm('هل أنت متأكد من إزالة الصورة المرفقة؟', doClear);
                    } else {
                        doClear();
                    }
                }
            };
