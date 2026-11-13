
 // ==================== DATA MODULE ====================
export const data = {
                isSavedChatsOpen: false,
                
                refreshSavedChatsAccordion() {
                    if (!this.isSavedChatsOpen) return;
                    const content = document.getElementById('saved-chats-content');
                    if (!content) return;
                    this.renderSavedChatsInAccordion();
                    // Ensure height recalculates after re-render
                    setTimeout(() => {
                        if (this.isSavedChatsOpen) {
                            content.style.maxHeight = content.scrollHeight + "px";
                        }
                    }, 50);
                },

                toggleSavedChatsAccordion() {
                    const content = document.getElementById('saved-chats-content');
                    const icon = document.getElementById('saved-chats-icon');
                    
                    if (!content || !icon) return;

                    this.isSavedChatsOpen = !this.isSavedChatsOpen;

                    if (this.isSavedChatsOpen) {
                        // فتح قسم الدردشات المحفوظة
                        content.classList.add('open');
                        // افتح فوراً حتى لو التحميل بطيء
                        content.style.maxHeight = "70vh";
                        icon.innerHTML = '▼';
                        icon.style.transform = 'rotate(90deg)';
                        
                        // تحميل الدردشات
                        this.renderSavedChatsInAccordion();
                        
                        // تحديث الارتفاع بعد التحميل
                        setTimeout(() => {
                            content.style.maxHeight = content.scrollHeight + "px";
                        }, 100);
                    } else {
                        // إغلاق قسم الدردشات المحفوظة
                        content.classList.remove('open');
                        content.style.maxHeight = null;
                        icon.innerHTML = '▶';
                        icon.style.transform = 'rotate(0deg)';
                    }
                },

                renderSavedChatsInAccordion() {
                    if (!window.MathApp.auth.currentUser) {
                        const content = document.getElementById('saved-chats-content');
                        content.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">👤 سجّل دخولك لعرض محادثاتك</p>';
                        return;
                    }

                    const uid = window.MathApp.auth.currentUser.uid;
                    const db = firebase.firestore();
                    const content = document.getElementById('saved-chats-content');
                    
                    content.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">جاري التحميل...</p>';

                    db.collection('userChats').doc(uid).collection('chats')
                      .orderBy('isPinned', 'desc')
                      .orderBy('createdAt', 'desc')
                      .limit(20)
                      .get()
                      .then(snapshot => {
                          if (snapshot.empty) {
                              content.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">لا توجد محادثات محفوظة</p>';
                              return;
                          }
                          
                          content.innerHTML = '';
                          snapshot.forEach(doc => {
                              const chat = doc.data();
                              const title = (chat.isPinned ? '📌 ' : '') + (chat.title || 'بدون عنوان');
                              
                              const item = document.createElement('div');
                              item.id = `saved-chat-item-${doc.id}`;
                              item.style.cssText = `
                                  display: flex;
                                  justify-content: space-between;
                                  align-items: center;
                                  padding: 8px 10px; 
                                  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
                                  transition: background 0.2s;
                              `;
                              item.onmouseover = () => item.style.background = 'var(--bg-input-area)';
                              item.onmouseout = () => item.style.background = 'transparent';
                              
                              const titleDiv = document.createElement('div');
                              titleDiv.style.flexGrow = '1';
                              titleDiv.style.cursor = 'pointer';
                              titleDiv.onclick = () => { window.MathApp.data.loadSpecificChat(doc.id); window.MathApp.ui.closeSidebar(); };
                              
                              const titleSpan = document.createElement('span');
                              titleSpan.textContent = title;
                              titleSpan.style.cssText = 'color: var(--primary-color); font-size: 14px;';
                              titleDiv.appendChild(titleSpan);
                              
                              const optionsContainer = document.createElement('div');
                              optionsContainer.className = 'chat-options-container';
                              optionsContainer.innerHTML = `
                                  <button class="chat-options-btn" onclick="window.MathApp.data.toggleChatOptions(event, '${doc.id}')">⋮</button>
                                  <div id="options-dropdown-${doc.id}" class="chat-options-dropdown">
                                      <a href="#" onclick="window.MathApp.data.pinChat(event, '${doc.id}', ${chat.isPinned || false})">
                                          ${chat.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                      </a>
                                      <a href="#" onclick="window.MathApp.data.renameChat(event, '${doc.id}', \`${chat.title || 'بدون عنوان'}\`)">
                                          إعادة تسمية
                                      </a>
                                      <a href="#" onclick="window.MathApp.data.deleteChat(event, '${doc.id}')" style="color: var(--delete-bg);">
                                          حذف
                                      </a>
                                  </div>
                              `;
                              
                              item.appendChild(titleDiv);
                              item.appendChild(optionsContainer);
                              content.appendChild(item);
                          });

                          // تحديث الارتفاع
                          setTimeout(() => {
                              const contentDiv = document.getElementById('saved-chats-content');
                              if (contentDiv && this.isSavedChatsOpen) {
                                  contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
                              }
                          }, 50);
                      })
                      .catch(error => {
                          console.error("Error loading chats: ", error);
                          content.innerHTML = `<p style="text-align: center; color: var(--delete-bg); padding: 10px; font-size: 12px;">خطأ: ${error.message}</p>`;
                      });
                },

                loadSavedChats() {
                    const listContainer = document.getElementById('savedChatsList');
                    window.MathApp.dom.savedChatsModal.style.display = 'block';
                    listContainer.innerHTML = '<p style="text-align: center;">جاري تحميل الدردشات...</p>';

                    // If user not logged in, try loading local saved chats from localStorage
                    if (!window.MathApp.auth.currentUser) {
                        const raw = localStorage.getItem('localSavedChats');
                        if (!raw) {
                            // Fallback to prompt login
                            window.MathApp.ui.showToast('يرجى تسجيل الدخول لعرض المحادثات المحفوظة.', 'info');
                            window.MathApp.auth.openModal('login');
                            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">لا توجد محادثات محلية محفوظة. يرجى تسجيل الدخول.</p>';
                            return;
                        }

                        try {
                            const arr = JSON.parse(raw) || [];
                            if (!arr.length) {
                                listContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">لم يتم العثور على محادثات محفوظة محلياً.</p>';
                                return;
                            }

                            listContainer.innerHTML = '';
                            arr.forEach(itemObj => {
                                const id = itemObj.id || ('local-' + (itemObj.createdAt || Date.now()));
                                const titleText = (itemObj.isPinned ? '📌 ' : '') + (itemObj.title || 'محادثة محلية');

                                const item = document.createElement('div');
                                item.id = `chat-item-${id}`;
                                item.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--modal-border);`;

                                const titleDiv = document.createElement('div');
                                titleDiv.onclick = () => window.MathApp.data.loadSpecificLocalChat(id);
                                titleDiv.style.cursor = 'pointer';
                                titleDiv.style.flexGrow = '1';

                                const title = document.createElement('strong');
                                title.textContent = titleText;
                                title.style.color = 'var(--primary-color)';

                                const dateSpan = document.createElement('span');
                                dateSpan.textContent = new Date(itemObj.createdAt || Date.now()).toLocaleString('ar-EG');
                                dateSpan.style.fontSize = '12px';
                                dateSpan.style.color = 'var(--text-secondary)';

                                titleDiv.appendChild(title);
                                titleDiv.appendChild(document.createElement('br'));
                                titleDiv.appendChild(dateSpan);

                                const optionsContainer = document.createElement('div');
                                optionsContainer.className = 'chat-options-container';
                                optionsContainer.innerHTML = `
                                    <button class="chat-options-btn" onclick="window.MathApp.data.toggleChatOptions(event, '${id}')">⋮</button>
                                    <div id="options-dropdown-${id}" class="chat-options-dropdown">
                                        <a href="#" onclick="window.MathApp.data.togglePinLocal(event, '${id}')">${itemObj.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</a>
                                        <a href="#" onclick="window.MathApp.data.renameLocalChat(event, '${id}', \`${itemObj.title || 'محادثة محلية'}\`)">إعادة تسمية</a>
                                        <a href="#" onclick="window.MathApp.data.deleteLocalChat(event, '${id}')" style="color: var(--delete-bg);">حذف</a>
                                    </div>
                                `;

                                item.appendChild(titleDiv);
                                item.appendChild(optionsContainer);
                                listContainer.appendChild(item);
                            });
                        } catch (e) {
                            console.error('Error parsing localSavedChats', e);
                            listContainer.innerHTML = '<p style="text-align: center; color: var(--delete-bg);">خطأ بقراءة المحفوظات المحلية.</p>';
                        }

                        return;
                    }

                    // Otherwise load from Firestore as before
                    const uid = window.MathApp.auth.currentUser.uid;
                    const db = firebase.firestore();
                    
                    db.collection('userChats').doc(uid).collection('chats')
                      .orderBy('isPinned', 'desc')
                      .orderBy('createdAt', 'desc')
                      .limit(30)
                      .get()
                      .then(snapshot => {
                          const listContainer = document.getElementById('savedChatsList');
                          if (snapshot.empty) {
                              listContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">لم يتم العثور على محادثات محفوظة.</p>';
                              return;
                          }
                          
                          listContainer.innerHTML = '';
                          snapshot.forEach(doc => {
                              const chat = doc.data();
                              const chatDate = chat.createdAt ? chat.createdAt.toDate().toLocaleString('ar-EG') : 'بدون تاريخ';
                              
                              const item = document.createElement('div');
                              item.id = `chat-item-${doc.id}`;
                              item.style.cssText = `
                                  display: flex; justify-content: space-between; align-items: center;
                                  padding: 12px; border-bottom: 1px solid var(--modal-border);
                                  transition: background 0.2s;
                              `;

                              const titleDiv = document.createElement('div');
                              titleDiv.onclick = () => window.MathApp.data.loadSpecificChat(doc.id);
                              titleDiv.style.cursor = 'pointer';
                              titleDiv.style.flexGrow = '1';
                              
                              const title = document.createElement('strong');
                              const titleText = (chat.isPinned ? '📌 ' : '') + (chat.title || 'محادثة بلا عنوان');
                              title.textContent = titleText;
                              title.style.color = 'var(--primary-color)';
                              
                              const dateSpan = document.createElement('span');
                              dateSpan.textContent = chatDate;
                              dateSpan.style.fontSize = '12px';
                              dateSpan.style.color = 'var(--text-secondary)';
                              
                              titleDiv.appendChild(title);
                              titleDiv.appendChild(document.createElement('br'));
                              titleDiv.appendChild(dateSpan);
                              
                              const optionsContainer = document.createElement('div');
                              optionsContainer.className = 'chat-options-container';
                              
                              optionsContainer.innerHTML = `
                                  <button class="chat-options-btn" onclick="window.MathApp.data.toggleChatOptions(event, '${doc.id}')">⋮</button>
                                  <div id="options-dropdown-${doc.id}" class="chat-options-dropdown">
                                      <a href="#" onclick="window.MathApp.data.pinChat(event, '${doc.id}', ${chat.isPinned || false})">
                                          ${chat.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                      </a>
                                      <a href="#" onclick="window.MathApp.data.renameChat(event, '${doc.id}', \`${chat.title || 'محادثة بلا عنوان'}\`)">
                                          إعادة تسمية
                                      </a>
                                      <a href="#" onclick="window.MathApp.data.deleteChat(event, '${doc.id}')" style="color: var(--delete-bg);">
                                          حذف
                                      </a>
                                  </div>
                              `;
                              
                              item.appendChild(titleDiv);
                              item.appendChild(optionsContainer);
                              listContainer.appendChild(item);
                          });
                      })
                      .catch(error => {
                          console.error("Error loading chats: ", error);
                          listContainer.innerHTML = `<p style="text-align: center; color: var(--delete-bg);">حدث خطأ: ${error.message}</p>`;
                      });
                },

                loadSpecificLocalChat(chatId) {
                    try {
                        const raw = localStorage.getItem('localSavedChats');
                        if (!raw) {
                            window.MathApp.ui.showToast('لا توجد محادثات محلية محفوظة.', 'error');
                            return;
                        }
                        const arr = JSON.parse(raw) || [];
                        const item = arr.find(i => (i.id === chatId) || (`local-${i.createdAt}` === chatId) || (i.id && (`local-${i.id}` === chatId)));
                        if (!item) {
                            // Try strip prefix
                            const normalizedId = chatId.replace(/^local-/, '');
                            const item2 = arr.find(i => String(i.id) === normalizedId || String(i.createdAt) === normalizedId);
                            if (!item2) {
                                window.MathApp.ui.showToast('لم يتم العثور على المحادثة المحلية.', 'error');
                                return;
                            }
                            return this.loadSpecificLocalChat(item2.id || ('local-' + item2.createdAt));
                        }

                        const history = item.history || [];
                        window.MathApp.state.chatHistory = history;
                        window.MathApp.state.currentChatId = null; // local

                        window.MathApp.dom.chatMessages.innerHTML = '';
                        for (let i = 1; i < history.length; i++) {
                            const msg = history[i];
                            const content = msg.parts && msg.parts[0] && msg.parts[0].text ? msg.parts[0].text : '';
                            const type = msg.role === 'model' ? 'outgoing' : 'incoming';
                            window.MathApp.chat.displayMessage(content, type, false, null);
                        }

                        window.MathApp.chat.scrollToBottom();
                        window.MathApp.data.closeLoadModal();
                        window.MathApp.ui.closeSidebar();
                        window.MathApp.ui.showToast('تم تحميل المحادثة المحلية بنجاح.', false);
                    } catch (e) {
                        console.error('loadSpecificLocalChat error', e);
                        window.MathApp.ui.showToast('حدث خطأ أثناء تحميل المحادثة المحلية.', 'error');
                    }
                },

                deleteLocalChat(event, chatId) {
                    event.stopPropagation();
                    try {
                        const raw = localStorage.getItem('localSavedChats');
                        if (!raw) return;
                        let arr = JSON.parse(raw) || [];
                        const idx = arr.findIndex(i => i.id === chatId || (`local-${i.createdAt}` === chatId));
                        if (idx === -1) {
                            window.MathApp.ui.showToast('المحادثة غير موجودة.', 'error');
                            return;
                        }
                        arr.splice(idx, 1);
                        localStorage.setItem('localSavedChats', JSON.stringify(arr));
                        const itemElement = document.getElementById(`chat-item-${chatId}`);
                        if (itemElement) itemElement.remove();
                        window.MathApp.ui.showToast('تم حذف المحادثة المحلية.', false);
                        this.refreshSavedChatsAccordion();
                    } catch (e) {
                        console.error('deleteLocalChat error', e);
                        window.MathApp.ui.showToast('حدث خطأ أثناء حذف المحادثة المحلية.', 'error');
                    }
                },

                togglePinLocal(event, chatId) {
                    event.stopPropagation();
                    try {
                        const raw = localStorage.getItem('localSavedChats');
                        if (!raw) return;
                        let arr = JSON.parse(raw) || [];
                        const idx = arr.findIndex(i => i.id === chatId || (`local-${i.createdAt}` === chatId));
                        if (idx === -1) return;
                        arr[idx].isPinned = !arr[idx].isPinned;
                        localStorage.setItem('localSavedChats', JSON.stringify(arr));
                        this.loadSavedChats();
                        this.refreshSavedChatsAccordion();
                        window.MathApp.ui.showToast(arr[idx].isPinned ? 'تم تثبيت المحادثة محلياً.' : 'تم إلغاء تثبيت المحادثة محلياً.');
                    } catch (e) {
                        console.error('togglePinLocal error', e);
                    }
                },

                renameLocalChat(event, chatId, oldTitle) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    const itemEl = document.getElementById(`chat-item-${chatId}`);
                    if (itemEl) {
                        const titleEl = itemEl.querySelector('strong');
                        if (titleEl) {
                            const originalText = titleEl.textContent || '';
                            const isPinned = originalText.startsWith('📌');
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = (oldTitle || originalText.replace(/^📌\s*/, '') || '').trim();
                            input.style.cssText = 'width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--modal-border); font-size: 14px;';
                            titleEl.replaceWith(input);
                            input.focus();
                            input.select();
                            const finish = (commit) => {
                                const value = input.value.trim();
                                if (!commit || !value) {
                                    input.replaceWith(titleEl);
                                    return;
                                }
                                this.commitRenameLocalChat(chatId, value, titleEl, isPinned);
                            };
                            input.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') finish(true);
                                if (e.key === 'Escape') finish(false);
                            });
                            input.addEventListener('blur', () => finish(true));
                            return;
                        }
                    }
                    const newTitle = prompt('أدخل العنوان الجديد للمحادثة:', oldTitle || '');
                    if (!newTitle) return;
                    this.commitRenameLocalChat(chatId, newTitle);
                },

                commitRenameLocalChat(chatId, newTitle, titleEl = null, isPinned = false) {
                    try {
                        const raw = localStorage.getItem('localSavedChats');
                        if (!raw) return;
                        let arr = JSON.parse(raw) || [];
                        const idx = arr.findIndex(i => i.id === chatId || (`local-${i.createdAt}` === chatId));
                        if (idx === -1) return;
                        arr[idx].title = newTitle;
                        localStorage.setItem('localSavedChats', JSON.stringify(arr));
                        if (titleEl) {
                            titleEl.textContent = (isPinned ? '📌 ' : '') + newTitle;
                            const inputEl = titleEl.previousSibling && titleEl.previousSibling.tagName === 'INPUT' ? titleEl.previousSibling : null;
                            if (inputEl && inputEl.parentNode) {
                                inputEl.replaceWith(titleEl);
                            }
                        }
                        this.loadSavedChats();
                        this.refreshSavedChatsAccordion();
                        window.MathApp.ui.showToast('تمت إعادة تسمية المحادثة محلياً.');
                    } catch (e) {
                        console.error('renameLocalChat error', e);
                    }
                },

                closeLoadModal() {
                    window.MathApp.dom.savedChatsModal.style.display = 'none';
                },

                saveChat(options = {}) {
    const silent = options === true || options?.silent === true;
    if (!window.MathApp.auth.currentUser) {
        if (!silent) {
            window.MathApp.ui.showToast('يرجى تسجيل الدخول لحفظ المحادثة.', 'error');
            window.MathApp.auth.openModal('login');
        }
        return;
    }
    if (window.MathApp.state.chatHistory.length <= 2) {
        if (!silent) {
            window.MathApp.ui.showToast('لا يوجد شيء لحفظه. ابدأ محادثة أولاً.', 'error');
        }
        return;
    }

    if (!silent) {
        window.MathApp.ui.showToast('جاري حفظ المحادثة...', false);
    }

    const uid = window.MathApp.auth.currentUser.uid;
    const db = firebase.firestore();
    const collectionRef = db.collection('userChats').doc(uid).collection('chats');

    const firstRealQuestion = window.MathApp.state.chatHistory[2]?.parts[0]?.text || 'محادثة جديدة';
    const title = firstRealQuestion.substring(0, 40) + (firstRealQuestion.length > 40 ? '...' : '');

    // نستخدم 'set' مع 'merge: true' للتحديث الآمن
    // ونضيف الحقول الناقصة لضمان التوافق
    const chatData = {
        title: title,
        history: window.MathApp.state.chatHistory,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isPinned: false // تأكد من وجود هذا الحقل دائماً
    };

    let promise;
    if (window.MathApp.state.currentChatId) {
        // إذا كنا نعدل محادثة موجودة، نستخدم .set()
        // set مع merge:true آمن جداً: يقوم بتحديث الحقول أو إنشائها إذا لم تكن موجودة.
        promise = collectionRef.doc(window.MathApp.state.currentChatId).set(chatData, { merge: true });
    } else {
        // إذا كانت محادثة جديدة، أنشئ ID فوراً لتجنب حفظ مزدوج عند الطلبات السريعة
        const newDocRef = collectionRef.doc();
        window.MathApp.state.currentChatId = newDocRef.id;
        promise = newDocRef.set(chatData, { merge: true });
    }

    promise.then((docRef) => {
        // إذا كانت محادثة جديدة، قم بتحديث currentChatId (احتياط)
        if (docRef && docRef.id) {
            window.MathApp.state.currentChatId = docRef.id;
        }
        if (!silent) {
            window.MathApp.ui.showToast('✅ تم حفظ المحادثة بنجاح!', false);
        }
        this.refreshSavedChatsAccordion();
        
        // تحديث قائمة المحادثات المحفوظة إذا كانت مفتوحة
        if (document.getElementById('savedChatsModal')?.style.display === 'block') {
            this.loadSavedChats();
        }
    })
    .catch(error => {
        // هذا هو الجزء الأهم: عرض الخطأ الفعلي للمستخدم
        console.error("FIREBASE SAVE ERROR:", error);
        if (!silent) {
            window.MathApp.ui.showToast(`❌ فشل الحفظ: ${error.message}`, 'error');
        }
    });
},
                loadSpecificChat(chatId) {
                    // --- 🔴 FIX START: Removed incorrect code block here ---
                    if (!window.MathApp.auth.currentUser) return;
                    // --- 🔴 FIX END ---

                    window.MathApp.ui.showConfirm('سيتم استبدال المحادثة الحالية بالمحادثة المحفوظة. هل أنت متأكد؟', () => {
                        const uid = window.MathApp.auth.currentUser.uid;
                        const db = firebase.firestore();
                        
                        db.collection('userChats').doc(uid).collection('chats').doc(chatId).get()
                          .then(doc => {
                              if (!doc.exists) {
                                  window.MathApp.ui.showToast('لم يتم العثور على هذه المحادثة.', 'error');
                                  return;
                              }
                              
                              const chatData = doc.data();
                              const history = chatData.history;
                              
                              window.MathApp.state.chatHistory = history;
                              window.MathApp.state.currentChatId = doc.id;
                              
                              window.MathApp.dom.chatMessages.innerHTML = '';
                              for (let i = 1; i < history.length; i++) {
                                  const msg = history[i];
                                  const content = msg.parts[0].text;
                                  const type = msg.role === 'model' ? 'outgoing' : 'incoming';
                                  
                                  // This assumes saved chats don't have complex parts like images for now.
                                  // For a more robust solution, this part would need to handle different part types.
                                  window.MathApp.chat.displayMessage(content, type, false, null);
                              }
                              
                              window.MathApp.chat.scrollToBottom();
                              window.MathApp.data.closeLoadModal();
                              window.MathApp.ui.closeSidebar();
                              window.MathApp.ui.showToast('تم تحميل المحادثة بنجاح.', false);
                              
                          })
                          .catch(error => {
                              window.MathApp.ui.showToast('حدث خطأ أثناء تحميل المحادثة: ' + error.message, 'error');
                          });
                    });
                },


                deleteChat(event, chatId) {
                    event.stopPropagation();
                    if (!window.MathApp.auth.currentUser) return;

                    window.MathApp.ui.showConfirm('هل أنت متأكد من حذف هذه المحادثة نهائياً؟', () => {
                        const uid = window.MathApp.auth.currentUser.uid;
                        const db = firebase.firestore();
                        
                        db.collection('userChats').doc(uid).collection('chats').doc(chatId).delete()
                          .then(() => {
                              const itemElement = document.getElementById(`chat-item-${chatId}`);
                              if (itemElement) itemElement.remove(); 
                              
                              window.MathApp.ui.showToast('تم الحذف بنجاح.', false);
                              this.refreshSavedChatsAccordion();
                              
                              if (window.MathApp.state.currentChatId === chatId) {
                                  window.MathApp.chat.startNew();
                              }
                          })
                          .catch(error => {
                              window.MathApp.ui.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
                          });
                    });
                },

                toggleChatOptions(event, chatId) {
                    event.stopPropagation();
                    const dropdownId = `options-dropdown-${chatId}`;
                    const currentDropdown = document.getElementById(dropdownId);
                    
                    document.querySelectorAll('.chat-options-dropdown.show').forEach(dropdown => {
                        if (dropdown.id !== dropdownId) {
                            dropdown.classList.remove('show');
                        }
                    });
                    
                    currentDropdown.classList.toggle('show');
                },

                pinChat(event, chatId, isCurrentlyPinned) {
                    event.stopPropagation();
                    if (!window.MathApp.auth.currentUser) return;

                    const uid = window.MathApp.auth.currentUser.uid;
                    const db = firebase.firestore();
                    const newPinState = !isCurrentlyPinned;

                    db.collection('userChats').doc(uid).collection('chats').doc(chatId)
                      .update({
                          isPinned: newPinState
                      })
                      .then(() => {
                          window.MathApp.ui.showToast(newPinState ? 'تم تثبيت المحادثة.' : 'تم إلغاء تثبيت المحادثة.', false);
                          if (document.getElementById('savedChatsModal')?.style.display === 'block') {
                              window.MathApp.data.loadSavedChats();
                          }
                          window.MathApp.data.refreshSavedChatsAccordion();
                      })
                      .catch(error => {
                          window.MathApp.ui.showToast('حدث خطأ أثناء التثبيت: ' + error.message);
                      });
                },

                renameChat(event, chatId, oldTitle) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    if (!window.MathApp.auth.currentUser) return;

                    const inlineContainer = document.getElementById(`saved-chat-item-${chatId}`) || document.getElementById(`chat-item-${chatId}`);
                    if (inlineContainer) {
                        const titleSpan = inlineContainer.querySelector('span, strong');
                        if (titleSpan) {
                            const originalText = titleSpan.textContent || '';
                            const original = originalText.replace(/^📌\s*/, '');
                            const isPinned = originalText.startsWith('📌');
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = original || oldTitle || '';
                            input.style.cssText = 'width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--modal-border); font-size: 14px;';
                            titleSpan.replaceWith(input);
                            input.focus();
                            input.select();
                            const finish = (commit) => {
                                const value = input.value.trim();
                                if (!commit || !value || value === original) {
                                    input.replaceWith(titleSpan);
                                    return;
                                }
                                this.commitRenameChat(chatId, value, titleSpan, isPinned);
                            };
                            input.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') finish(true);
                                if (e.key === 'Escape') finish(false);
                            });
                            input.addEventListener('blur', () => finish(true));
                            return;
                        }
                    }

                    const newTitle = prompt("أدخل الاسم الجديد للمحادثة:", oldTitle);

                    if (newTitle && newTitle.trim() !== '' && newTitle !== oldTitle) {
                        this.commitRenameChat(chatId, newTitle);
                    } else {
                        document.getElementById(`options-dropdown-${chatId}`)?.classList.remove('show');
                    }
                },

                commitRenameChat(chatId, newTitle, titleSpan = null, isPinned = false) {
                    if (!window.MathApp.auth.currentUser) return;
                    const uid = window.MathApp.auth.currentUser.uid;
                    const db = firebase.firestore();
                    
                    db.collection('userChats').doc(uid).collection('chats').doc(chatId)
                      .update({
                          title: newTitle
                      })
                      .then(() => {
                          window.MathApp.ui.showToast('تم تحديث الاسم بنجاح.', false);
                          if (titleSpan) {
                              titleSpan.textContent = (isPinned ? '📌 ' : '') + newTitle;
                              const inputEl = titleSpan.previousSibling && titleSpan.previousSibling.tagName === 'INPUT' ? titleSpan.previousSibling : null;
                              if (inputEl && inputEl.parentNode) {
                                  inputEl.replaceWith(titleSpan);
                              }
                          }
                          const titleElement = document.querySelector(`#chat-item-${chatId} strong`);
                          if (titleElement && !titleSpan) {
                              const pinned = titleElement.textContent.startsWith('📌');
                              titleElement.textContent = (pinned ? '📌 ' : '') + newTitle;
                          }
                          document.getElementById(`options-dropdown-${chatId}`)?.classList.remove('show');
                          window.MathApp.data.refreshSavedChatsAccordion();
                      })
                      .catch(error => {
                          window.MathApp.ui.showToast('حدث خطأ أثناء إعادة التسمية: ' + error.message, 'error');
                          if (titleSpan) {
                              titleSpan.textContent = (isPinned ? '📌 ' : '') + (newTitle || '');
                              const inputEl = titleSpan.previousSibling && titleSpan.previousSibling.tagName === 'INPUT' ? titleSpan.previousSibling : null;
                              if (inputEl && inputEl.parentNode) {
                                  inputEl.replaceWith(titleSpan);
                              }
                          }
                      });
                },
            }
