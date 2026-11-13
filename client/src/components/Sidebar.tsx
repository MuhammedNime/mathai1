export function Sidebar() {
  return (
    <div id="sidebarNav" className="sidebar-nav">
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <button
            className="sidebar-account-btn"
            id="accountButton"
            type="button"
            aria-label="إعدادات الحساب"
          >
            <span id="accountName" className="sidebar-account-name">
              سجل الدخول
            </span>
          </button>

          <button className="sidebar-close-btn" id="closeSidebarBtn">
            &times;
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <a href="#" className="sidebar-menu-item" id="startNewChatBtn">
          بدء محادثة جديدة
        </a>

        <div className="sidebar-section">
          <div className="dropdown-container sidebar-export">
            <button className="sidebar-menu-item sidebar-menu-button" id="toggleExportDropdownBtn">
              تصدير المحادثة
            </button>
            <div id="exportDropdown" className="dropdown-content">
              <a href="#" id="exportPdfBtn">
                📄 PDF
              </a>
              <a href="#" id="exportWordBtn">
                📄 Word
              </a>
            </div>
          </div>
        </div>

        <div
          id="saved-chats-menu"
          style={{
            borderTop: '1px solid var(--modal-border)',
            borderBottom: '1px solid var(--modal-border)',
            margin: '5px 0'
          }}
        >
          <div className="library-main-header" id="toggleSavedChatsBtn">
            <span>💬 الدردشات المحفوظة</span>
            <span className="icon" id="saved-chats-icon">
              ▶
            </span>
          </div>
          <div id="saved-chats-content" className="library-content">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '10px' }}>
              سجّل دخولك لعرض محادثاتك المحفوظة
            </p>
          </div>
        </div>

        <div id="library-menu">
          <div
            id="library-accordion"
            style={{
              borderTop: '1px solid var(--modal-border)',
              borderBottom: '1px solid var(--modal-border)',
              margin: '5px 0'
            }}
          >
            <div className="library-main-header" id="toggleLibraryBtn">
              <span>📚 مكتبة الدروس</span>
              <span className="icon" id="library-main-icon">
                ▶
              </span>
            </div>
            <div id="library-content" className="library-content"></div>
          </div>
        </div>

      </div>

      <div id="contactToggleArea" className="sidebar-contact-footer">
        <button
          id="showContactBtn"
          className="contact-link-btn"
          style={{ background: 'var(--primary-color)', width: '100%' }}
        >
          تواصل مع استاذ الرياضيات محمد جمال نعمه مجانا
        </button>
        <div id="contactMenu" style={{ display: 'none' }}>
          <p style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--text-secondary)' }}>
            وسائل التواصل:
          </p>
          <a
            href="https://wa.me/qr/WLRRIAB7FMM5A1"
            target="_blank"
            rel="noreferrer"
            className="contact-link-btn"
            style={{ background: '#25D366' }}
          >
            واتساب ✉
          </a>
          <a
            href="https://www.facebook.com/share/15hRUiky32/"
            target="_blank"
            rel="noreferrer"
            className="contact-link-btn"
            style={{ background: '#1877F2' }}
          >
            فيسبوك 📰
          </a>
          <a
            href="https://t.me/Muhammed_Cemal_Nime"
            target="_blank"
            rel="noreferrer"
            className="contact-link-btn"
            style={{ background: '#0088CC' }}
          >
            تلغرام 📩
          </a>
          <button
            id="hideContactMenuBtn"
            className="contact-link-btn"
            style={{ background: 'var(--secondary-bg)', width: '100%', marginTop: '10px' }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
