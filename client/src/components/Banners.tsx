export function Banners() {
  return (
    <>
      <div
        id="pwaInstallBanner"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 100000,
          maxWidth: '90%',
          animation: 'slideUp 0.5s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '40px' }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '5px' }}>ثبّت التطبيق</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>للوصول السريع والعمل بدون إنترنت</div>
          </div>
          <button
            id="pwaInstallBtn"
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            تثبيت
          </button>
          <button
            id="pwaCloseBanner"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            &times;
          </button>
        </div>
      </div>

      <div
        id="updateNotification"
        style={{
          display: 'none',
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#48bb78',
          color: 'white',
          padding: '12px 25px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100000,
          animation: 'slideDown 0.5s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎉</span>
          <span style={{ fontWeight: 600 }}>تحديث جديد متوفر!</span>
          <button
            id="updateBtn"
            style={{
              background: 'white',
              color: '#48bb78',
              border: 'none',
              padding: '6px 15px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            تحديث الآن
          </button>
        </div>
      </div>

      <div
        id="offlineIndicator"
        style={{
          display: 'none',
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#f56565',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 100000,
          fontSize: '14px',
          fontWeight: 600
        }}
      >
        <span style={{ marginLeft: '5px' }}>📡</span>
        غير متصل بالإنترنت - الوضع Offline
      </div>

      <style>{`@keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
      <style>{`@keyframes slideDown { from { transform: translate(-50%, -100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
    </>
  )
}
