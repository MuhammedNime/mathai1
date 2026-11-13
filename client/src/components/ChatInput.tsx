export function ChatInput() {
  return (
    <>
      <input
        type="file"
        id="fileInputForEquation"
        style={{ display: 'none' }}
        accept=".pdf,.txt,.docx,.xlsx,image/*"
      />

      <div className="chat-input-area">
        <div id="imageAttachedIndicator" style={{ display: 'none' }}>
          <span>صورة مرفقة</span>
          <span style={{ marginRight: '5px' }}>🖼️</span>
        </div>

        <div className="chat-input-row">
          <div className="chat-input-left">
            <button id="sendMessageBtn" className="action-btn" style={{ display: 'none' }}>
              ✅
            </button>
            <button
              id="recordBtn"
              className="action-btn"
              style={{ backgroundColor: 'var(--secondary-bg)' }}
              aria-label="تسجيل صوتي"
            >
              🎙️
            </button>
          </div>

          <div className="chat-input-center">
            <div className="text-input-wrapper">
              <button className="math-tool-btn" id="openMathModalBtn">
                ⌨️
              </button>
              <div
                className="editor-area"
                contentEditable={true}
                suppressContentEditableWarning={true}
                id="editor"
                data-placeholder="اسال المستشار..."
              ></div>
            </div>
          </div>

          <div className="chat-input-right">
            <button id="plusBtn" className="action-btn" aria-label="إظهار الأدوات">
              +
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
