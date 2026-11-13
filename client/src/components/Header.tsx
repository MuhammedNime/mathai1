export function Header() {
  return (
    <div className="chat-header">
      <div className="header-actions-left">
        <button className="icon-btn" id="openSidebarBtn" aria-label="فتح القائمة">
          ☰
        </button>
      </div>

      <div className="header-center">
        <h1>المستشار الرياضي</h1>
      </div>

      <div className="header-actions-right">
        <button className="icon-btn" id="darkModeToggle" aria-label="تبديل الوضع">
          ☀️
        </button>
      </div>
    </div>
  )
}
