// ==================== LIBRARY MODULE  ====================
import { libraryData } from '../data/libraryData.js';

export const Library = {
    isLibraryOpen: false,

    // تهيئة المكتبة
    async init() {
        await this.renderLibraryContent();
    },

    // فتح/إغلاق المكتبة الرئيسية
    toggleLibrary() {
        const content = document.getElementById('library-content');
        const icon = document.getElementById('library-main-icon');
        
        if (!content || !icon) return;

        this.isLibraryOpen = !this.isLibraryOpen;

        if (this.isLibraryOpen) {
            // فتح المكتبة
            content.classList.add('open');
            content.style.maxHeight = content.scrollHeight + "px";
            icon.innerHTML = '▼';
            icon.style.transform = 'rotate(90deg)';
            
            // تحديث الارتفاع بعد التحميل الكامل
            setTimeout(() => {
                content.style.maxHeight = content.scrollHeight + "px";
            }, 100);
        } else {
            // إغلاق المكتبة
            content.classList.remove('open');
            content.style.maxHeight = null;
            icon.innerHTML = '▶';
            icon.style.transform = 'rotate(0deg)';
            
            // إغلاق جميع المواضيع المفتوحة
            this.closeAllTopics();
        }
    },

    // إغلاق جميع المواضيع
    closeAllTopics() {
        document.querySelectorAll('.lesson-list').forEach(list => {
            list.style.maxHeight = null;
            if (list.previousElementSibling) {
                list.previousElementSibling.classList.remove('active');
                const icon = list.previousElementSibling.querySelector('.icon');
                if (icon) icon.innerHTML = '▶';
            }
        });
    },

   // عرض محتوى المكتبة (المواضيع والدروس)
            async renderLibraryContent() {
                const container = document.getElementById('library-content');
                if (!container) return;

                // 🔴 تنظيف الحاوية تماماً لمنع التكرار
                container.innerHTML = '';

                // 1. بناء واجهة البحث والتحكم مرة واحدة
                const controlsWrap = document.createElement('div');
                controlsWrap.className = 'library-controls';
                
                // مربع البحث
                const searchWrap = document.createElement('div');
                searchWrap.className = 'library-search-wrap';
                const searchInput = document.createElement('input');
                searchInput.id = 'librarySearchInput';
                searchInput.className = 'library-search-input';
                searchInput.placeholder = 'ابحث في المكتبة...';
                searchWrap.appendChild(searchInput);

                // أزرار التحكم
                const favoritesBtn = document.createElement('button');
                favoritesBtn.id = 'libraryShowFavs';
                favoritesBtn.className = 'library-fav-btn';
                favoritesBtn.textContent = '⭐';
                favoritesBtn.title = 'المفضلة';

                const openAllBtn = document.createElement('button');
                openAllBtn.id = 'libraryOpenAll';
                openAllBtn.className = 'library-openall-btn';
                openAllBtn.textContent = 'فتح الكل';

                // تجميع العناصر
                controlsWrap.appendChild(searchWrap);
                controlsWrap.appendChild(favoritesBtn);
                controlsWrap.appendChild(openAllBtn);
                container.appendChild(controlsWrap);

                // حاوية نتائج البحث
                const resultsBox = document.createElement('div');
                resultsBox.id = 'librarySearchResults';
                resultsBox.className = 'library-search-results';
                container.appendChild(resultsBox);

                // دالة مساعدة لإنشاء عنصر درس
    const createLessonRow = (lesson) => {
        const li = document.createElement('div');
        li.className = 'lesson-item';
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = lesson.title || 'درس';
        a.onclick = (e) => {
            e.preventDefault();
            this.sendLessonToChat(lesson.title, lesson.content);
            window.MathApp.ui.closeSidebar();
        };
        li.appendChild(a);
        return li;
    };

    // دالة مساعدة لتحديث ارتفاع حاوية المكتبة
    const refreshLibraryHeight = () => {
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent || !this.isLibraryOpen) return;
        libraryContent.style.maxHeight = libraryContent.scrollHeight + "px";
    };

    // دالة مساعدة لفتح/إغلاق القوائم (Accordion Logic)
    const toggleAccordion = (header, contentDiv) => {
        const icon = header.querySelector('.icon');
        const isOpen = contentDiv.style.maxHeight;

        // إغلاق كل الأخوة في نفس المستوى (اختياري - لجعل القائمة أنظف)
        const parent = contentDiv.parentElement;
        parent.querySelectorAll(':scope > .accordion-content').forEach(c => {
            if (c !== contentDiv) c.style.maxHeight = null;
        });
        parent.querySelectorAll(':scope > .active-header .icon').forEach(i => {
            if(i !== icon) i.classList.remove('rotate-90');
        });

        // تبديل الحالة
        if (isOpen) {
            contentDiv.style.maxHeight = null;
            icon.classList.remove('rotate-90');
            header.classList.remove('active-header');
            setTimeout(refreshLibraryHeight, 0);
        } else {
            // إعادة حساب الارتفاع لضمان فتح المحتوى المتداخل
            contentDiv.style.maxHeight = contentDiv.scrollHeight + 500 + "px"; // إضافة بيكسلات إضافية للأمان
            icon.classList.add('rotate-90');
            header.classList.add('active-header');
            
            // تحديث ارتفاع الآباء (عشان ما يختفي المحتوى)
            let ancestor = parent.closest('.accordion-content');
            while(ancestor) {
                ancestor.style.maxHeight = ancestor.scrollHeight + contentDiv.scrollHeight + "px";
                ancestor = ancestor.parentElement.closest('.accordion-content');
            }
            setTimeout(refreshLibraryHeight, 0);
        }
    };

    // --- بناء المحتوى الرئيسي ---
    if (Array.isArray(libraryData) && libraryData.length > 0) {
        libraryData.forEach((topic) => {
            // 1. المستوى الأول: الموضوع الرئيسي (Topic)
            const topicContainer = document.createElement('div');
            
            const topicHeader = document.createElement('div');
            topicHeader.className = 'topic-header';
            topicHeader.innerHTML = `<span>${topic.icon || ''} ${topic.topic}</span><span class="icon">◀</span>`;
            
            const topicContent = document.createElement('div');
            topicContent.className = 'accordion-content';

            topicHeader.onclick = () => toggleAccordion(topicHeader, topicContent);

            // فحص نوع البيانات داخل الموضوع
            if (topic.levels) {
                // === الحالة أ: الموضوع مقسم لمستويات (ابتدائي، ثانوي...) ===
                topic.levels.forEach(level => {
                    const levelContainer = document.createElement('div');
                    
                    const levelHeader = document.createElement('div');
                    levelHeader.className = 'level-header';
                    levelHeader.innerHTML = `<span>${level.icon || '▫️'} ${level.level}</span><span class="icon">◀</span>`;
                    
                    const levelContent = document.createElement('div');
                    levelContent.className = 'accordion-content';

                    levelHeader.onclick = (e) => {
                        e.stopPropagation(); // منع إغلاق القائمة الأب
                        toggleAccordion(levelHeader, levelContent);
                    };

                    // إضافة الدروس داخل المستوى
                    (level.chapters || level.lessons || []).forEach(lesson => {
                        levelContent.appendChild(createLessonRow(lesson));
                    });

                    levelContainer.appendChild(levelHeader);
                    levelContainer.appendChild(levelContent);
                    topicContent.appendChild(levelContainer);
                });

            } else if (topic.lessons) {
                // === الحالة ب: الموضوع يحتوي دروس مباشرة ===
                topic.lessons.forEach(lesson => {
                    topicContent.appendChild(createLessonRow(lesson));
                });
            }

            topicContainer.appendChild(topicHeader);
            topicContainer.appendChild(topicContent);
            container.appendChild(topicContainer);
        });
    }
},

    // فتح/إغلاق موضوع معين
    toggleTopic(element) {
        const lessonList = element.nextElementSibling;
        const icon = element.querySelector('.icon');
        const libraryContent = document.getElementById('library-content');

        // إغلاق المواضيع الأخرى
        document.querySelectorAll('.lesson-list').forEach(list => {
            if (list !== lessonList && list.style.maxHeight) {
                list.style.maxHeight = null;
                list.previousElementSibling.classList.remove('active');
                const otherIcon = list.previousElementSibling.querySelector('.icon');
                if (otherIcon) otherIcon.innerHTML = '▶';
            }
        });

        // فتح/إغلاق الموضوع الحالي
        element.classList.toggle('active');
        
        if (lessonList.style.maxHeight) {
            // إغلاق
            lessonList.style.maxHeight = null;
            icon.innerHTML = '▶';
        } else {
            // فتح
            lessonList.style.maxHeight = lessonList.scrollHeight + "px";
            icon.innerHTML = '▼';
        }

        // تحديث ارتفاع المكتبة الرئيسية
        setTimeout(() => {
            if (libraryContent) {
                libraryContent.style.maxHeight = libraryContent.scrollHeight + "px";
            }
        }, 350);
    },

    // إرسال درس مُبني من فهرس الإنترنت (index) إلى الدردشة
    async sendLessonFromIndex(item) {
        // يحاول استرجاع الدرس من المصدر الأصلي (module file) ثم يعرضه، وإلا يعرض مقتطف من الفهرس
        try {
            if (!item || !item.sourceFile) {
                // fallback: send excerpt
                this.sendLessonToChat(item.titleAr || item.titleEn || 'درس', item.excerpt || '');
                return;
            }

            const moduleUrl = '/' + item.sourceFile;
            const mod = await import(moduleUrl);

            // search within module exports for matching lesson id or matching title
            let found = null;
            for (const key of Object.keys(mod)) {
                const value = mod[key];
                if (!Array.isArray(value)) continue;
                for (const topic of value) {
                    // lessons
                    if (Array.isArray(topic.lessons)) {
                        for (const lesson of topic.lessons) {
                            if (lesson.id === item.id || lesson.title === item.titleAr || (lesson.title && lesson.title.ar === item.titleAr)) { found = lesson; break; }
                        }
                    }
                    // levels -> chapters
                    if (!found && Array.isArray(topic.levels)) {
                        for (const level of topic.levels) {
                            const chapters = Array.isArray(level.chapters) ? level.chapters : [];
                            for (const ch of chapters) {
                                if (ch.id === item.id || ch.title === item.titleAr || (ch.title && ch.title.ar === item.titleAr)) { found = ch; break; }
                            }
                            if (found) break;
                        }
                    }
                    // chapters directly
                    if (!found && Array.isArray(topic.chapters)) {
                        for (const ch of topic.chapters) {
                            if (ch.id === item.id || ch.title === item.titleAr || (ch.title && ch.title.ar === item.titleAr)) { found = ch; break; }
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }

            if (found) {
                // prefer content.html or content
                const content = (found.content && (found.content.html || found.content)) || found.content || found;
                const title = (found.title && (found.title.ar || found.title)) || found.title || item.titleAr || 'درس';
                this.sendLessonToChat(title, content || item.excerpt || '');
            } else {
                // fallback to index excerpt
                this.sendLessonToChat(item.titleAr || item.titleEn || 'درس', item.excerpt || '');
            }
        } catch (e) {
            console.warn('Failed to load lesson from source', e);
            this.sendLessonToChat(item.titleAr || item.titleEn || 'درس', item.excerpt || '');
        }
    },

    // إرسال الدرس إلى الدردشة
    sendLessonToChat(title, content) {
        const formattedContent = `
<h3>📚 ${title}</h3>
${content}
<p style="background: ; padding: 10px; border-radius: 5px; margin: 10px 0; border-right: 4px solid var(--primary-color);">
    💡 <strong>ملاحظة:</strong> يمكنك طرح أي سؤال متعلق بهذا الدرس وسأساعدك في فهمه بشكل أفضل.
</p>
        `.trim();

        // عرض في الدردشة
        MathApp.chat.displayMessage(formattedContent, 'outgoing');
        
        // إضافة للتاريخ
        MathApp.state.chatHistory.push({
            role: "model",
            parts: [{ text: `[درس من المكتبة: ${title}]\n\n${content}` }]
        });

        MathApp.chat.scrollToBottom();
        
        // إظهار رسالة نجاح
        MathApp.ui.showToast(`✅ تم عرض درس: ${title}`);
    }
};
