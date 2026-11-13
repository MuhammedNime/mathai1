// ==================== AUTH MODULE ====================
export const auth = {
    firebaseConfig: {
        apiKey: "AIzaSyBrKIYo05h-acGOoH8zoFd0WfGHV-GBEp4",
        authDomain: "math-8db6a.firebaseapp.com",
        projectId: "math-8db6a",
        storageBucket: "math-8db6a.firebasestorage.app",
        messagingSenderId: "1097252771745",
        appId: "1:1097252771745:web:1304cbd705ade4482d5de0",
        measurementId: "G-Y26E947E4H"
                },
                currentMode: 'login',
                currentUser: null,

                initFirebase() {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(this.firebaseConfig);
                    }

                    firebase.auth().onAuthStateChanged((user) => {
                        this.currentUser = user;
                        this.renderStatus();
                        if (window.MathApp?.data?.refreshSavedChatsAccordion) {
                            window.MathApp.data.refreshSavedChatsAccordion();
                        }
                        if (user) {
                            console.log("User logged in:", user.email);
                        } else {
                            console.log("User logged out (Guest mode)");
                        }
                    });
                },

                openModal(mode) {
                    this.currentMode = mode;
                    const title = document.getElementById('authModalTitle');
                    const link = document.getElementById('toggleAuthModeLink');
                    const submitBtn = document.getElementById('authSubmitBtn');
                    const emailInput = window.MathApp.dom.emailInput;
                    const passwordInput = window.MathApp.dom.passwordInput;

                    if (window.MathApp && window.MathApp.ui && typeof window.MathApp.ui.closeSettings === 'function') {
                        window.MathApp.ui.closeSettings();
                    }
                    
                    emailInput.value = '';
                    passwordInput.value = '';
                    
                    if (mode === 'login') {
                        title.textContent = 'سجل الدخول';
                        link.innerHTML = 'ليس لديك حساب؟ سجل اشتراك الآن';
                        submitBtn.textContent = 'سجل الدخول';
                    } else {
                        title.textContent = 'سجل اشتراك جديد';
                        link.innerHTML = 'لديك حساب بالفعل؟ سجل الدخول';
                        submitBtn.textContent = 'إنشاء حساب';
                    }
                    window.MathApp.dom.authModal.style.display = 'block';
                },

                closeModal() {
                    window.MathApp.dom.authModal.style.display = 'none';
                },

                toggleMode() {
                    const newMode = this.currentMode === 'login' ? 'signup' : 'login';
                    this.openModal(newMode);
                },
                
                logout() {
                    window.MathApp.ui.showConfirm('هل أنت متأكد من تسجيل الخروج؟', () => {
                        firebase.auth().signOut().then(() => {
                            if (window.MathApp?.data?.refreshSavedChatsAccordion) {
                                window.MathApp.data.refreshSavedChatsAccordion();
                            }
                            window.MathApp.ui.closeSidebar();
                        }).catch((error) => {
                            window.MathApp.ui.showToast("حدث خطأ أثناء تسجيل الخروج: " + error.message);
                        });
                    });
                },

                handleAuthSubmit() {
                    const email = window.MathApp.dom.emailInput.value.trim();
                    const password = window.MathApp.dom.passwordInput.value.trim();
                    
                    if (!email || !password) {
                        window.MathApp.ui.showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور.', 'error');
                        return;
                    }

                    window.MathApp.dom.authSubmitBtn.disabled = true;
                    window.MathApp.dom.authSubmitBtn.textContent = 'جاري...';

                    const auth = firebase.auth();
                    let promise;

                    if (this.currentMode === 'signup') {
                        promise = auth.createUserWithEmailAndPassword(email, password)
                            .then((userCredential) => {
                                const user = userCredential.user;
                                return user.sendEmailVerification()
                                    .then(() => {
                                        return auth.signOut();
                                    })
                                    .then(() => {
                                        window.MathApp.ui.showToast('تم إنشاء الحساب بنجاح! تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى تأكيد البريد أولاً لتسجيل الدخول.');
                                        this.closeModal();
                                        window.MathApp.ui.closeSidebar();
                                        return Promise.resolve();
                                    });
                            });
                    } else {
                        promise = auth.signInWithEmailAndPassword(email, password)
                            .then((userCredential) => {
                                const user = userCredential.user;
                                
                                if (user.emailVerified) {
                                    window.MathApp.ui.showToast('تم تسجيل الدخول بنجاح!');
                                    this.closeModal();
                                    window.MathApp.ui.closeSidebar();
                                    return Promise.resolve();
                                } else {
                                    user.sendEmailVerification();
                                    
                                    return auth.signOut()
                                        .then(() => {
                                            throw new Error('حسابك غير مؤكد بعد. تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.');
                                        });
                                }
                            });
                    }

                    promise.catch((error) => {
                        let errorMessage = "حدث خطأ غير معروف.";
                        if (error.message.includes('حسابك غير مؤكد')) {
                            errorMessage = error.message;
                        } else if (error.code === 'auth/email-already-in-use') {
                            errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل.";
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = "صيغة البريد الإلكتروني غير صحيحة.";
                        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                            errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
                        } else {
                            errorMessage = error.message;
                        }
                        window.MathApp.ui.showToast(`خطأ في المصادقة: ${errorMessage}`, 'error');
                    }).finally(() => {
                        window.MathApp.dom.authSubmitBtn.disabled = false;
                        window.MathApp.dom.authSubmitBtn.textContent = this.currentMode === 'signup' ? 'إنشاء حساب' : 'سجل الدخول';
                    });
                },

                resetPassword() {
                    const email = prompt("أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:");
                    if (email) {
                        firebase.auth().sendPasswordResetEmail(email).then(() => {
                            window.MathApp.ui.showToast("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
                        }).catch((error) => {
                            window.MathApp.ui.showToast("حدث خطأ في إرسال رابط إعادة التعيين: " + error.message, 'error');
                        });
                    }
                },

                renderStatus() {
                    const user = this.currentUser;
                    const area = window.MathApp.dom.loginStatusArea;
                    const nameEl = document.getElementById('accountName');
                    const storedName = (() => {
                        try { return localStorage.getItem('user_display_name'); } catch (e) { return null; }
                    })();
                    if (nameEl) {
                        if (user) {
                            const displayName = user.displayName || storedName || user.email || 'مستخدم مسجل';
                            nameEl.textContent = displayName;
                            nameEl.setAttribute('title', displayName);
                        } else {
                            nameEl.textContent = 'سجل الدخول';
                            nameEl.setAttribute('title', 'سجل الدخول');
                        }
                    }

                    if (!area) return; 

                    area.innerHTML = ''; 
                    if (user) {
                        const displayName = user.displayName || storedName || user.email || 'مستخدم مسجل';
                        area.innerHTML = `
                            <div class="account-meta">
                                <span class="account-email">${displayName}</span>
                                <button type="button" class="account-action-btn danger" onclick="window.MathApp.auth.logout();">
                                    تسجيل الخروج
                                </button>
                            </div>
                        `;
                        const savedChatsLink = document.getElementById('savedChatsLink');
                        if (savedChatsLink) savedChatsLink.style.display = 'block';
                    } else {
                        area.innerHTML = `
                            <button type="button" class="account-action-btn primary" onclick="window.MathApp.auth.openModal('login');">
                                سجل الدخول
                            </button>
                            <button type="button" class="account-action-btn" onclick="window.MathApp.auth.openModal('signup');">
                                إنشاء حساب
                            </button>
                        `;
                        const savedChatsLink = document.getElementById('savedChatsLink');
                        if (savedChatsLink) savedChatsLink.style.display = 'none';
                    }
                }
            }
                
