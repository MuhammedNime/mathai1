// ==================== ENHANCED DARK MODE TRANSITIONS ====================

/**
 * تحسين تجربة التنقل بين الأوضاع الفاتحة والمظلمة
 * مع animations سلسة واحترافية
 */

export const enhancedDarkMode = {
    /**
     * تفعيل الـ transitions المحسّنة عند تبديل الـ theme
     */
    init() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;

        darkModeToggle.addEventListener('click', () => {
            this.toggleWithAnimation();
        });

        // تطبيق الـ theme المحفوظ على التحميل
        this.applyStoredTheme();
    },

    /**
     * التبديل مع animation محسّنة
     */
    toggleWithAnimation() {
        // إضافة class للـ animation
        document.body.classList.add('theme-switching');
        
        // تنفيذ التبديل
        window.MathApp?.ui?.theme?.toggle?.();
        
        // إزالة class بعد الانتهاء من الـ animation
        setTimeout(() => {
            document.body.classList.remove('theme-switching');
        }, 600);
    },

    /**
     * تطبيق الـ theme المحفوظ بدون animation على التحميل
     */
    applyStoredTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    },

    /**
     * إضافة glow effect عند hover على dark mode toggle
     */
    addGlowEffect() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;

        darkModeToggle.addEventListener('mouseenter', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const isDark = document.body.classList.contains('dark-mode');
            const color = isDark ? 'rgba(124, 58, 237, 0.5)' : 'rgba(102, 126, 234, 0.5)';
            
            e.currentTarget.style.boxShadow = `0 0 20px ${color}`;
        });

        darkModeToggle.addEventListener('mouseleave', (e) => {
            e.currentTarget.style.boxShadow = '';
        });
    }
};

export default enhancedDarkMode;
