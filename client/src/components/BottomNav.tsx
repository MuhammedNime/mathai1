export function BottomNav() {
  return (
    <div className="bottom-nav-menu" id="bottomNavMenu">
      <button className="bottom-nav-close-btn" id="closeBottomNavBtn">
        &times;
      </button>

      <div className="tool-row">
        <button className="bottom-nav-btn" data-tool="open-camera">
          <span className="icon">📷</span>
          <span>كاميرا</span>
        </button>
        <button className="bottom-nav-btn" data-tool="open-file">
          <span className="icon">📄</span>
          <span>ملف</span>
        </button>
        <button className="bottom-nav-btn" data-tool="open-drawing">
          <span className="icon">✏️</span>
          <span>رسم</span>
        </button>
      </div>

      <div className="tool-divider">الأدوات الذكية (Builders)</div>

      <div className="tool-row">
        <button className="bottom-nav-btn" data-tool="calculus-workspace">
          <span className="icon">∫∂</span>
          <span>التفاضل/التكامل</span>
        </button>
        <button className="bottom-nav-btn" data-tool="statistics-workspace">
          <span className="icon">📊</span>
          <span>ورشة الإحصاء</span>
        </button>
        <button className="bottom-nav-btn" data-tool="algebra-workspace">
          <span className="icon">🧮</span>
          <span>ورشة الجبر</span>
        </button>
        <button className="bottom-nav-btn" data-tool="exam-builder">
          <span className="icon">📝</span>
          <span>امتحان</span>
        </button>
      </div>
      <div className="tool-row">
        <button className="bottom-nav-btn" data-tool="geometry-workspace">
          <span className="icon">📐</span>
          <span>ورشة الهندسة</span>
        </button>
        <button className="bottom-nav-btn" data-tool="matrix-workspace">
          <span className="icon">🔢</span>
          <span>ورشة المصفوفات</span>
        </button>
        <button className="bottom-nav-btn" data-tool="open-calculator">
          <span className="icon">🧮</span>
          <span>الحاسبة</span>
        </button>
        <button className="bottom-nav-btn" data-tool="unit-converter">
          <span className="icon">🔄</span>
          <span>محول الوحدات</span>
        </button>
      </div>
    </div>
  )
}
