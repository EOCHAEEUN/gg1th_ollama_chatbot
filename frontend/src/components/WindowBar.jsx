// ============================================================
// [Component] WindowBar
// 역할: 최상단 타이틀바 (브랜드 로고 + 다크/라이트 모드 토글 버튼)
// ============================================================
function WindowBar({ theme, onToggleTheme }) {
  return (
    <header className="window-bar">
      <div className="window-brand">
        <span className="brand-paw-frame" aria-hidden="true">
          <img src="/assets/pixel/paw.png" className="brand-paw pixel-asset" alt="" />
        </span>
        <span>CAPY AI</span>
      </div>
      <div className="window-actions">
        <span className="window-motto">SMALL STEPS, BIG THINGS</span>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? '다크 모드 켜기' : '라이트 모드 켜기'}
          title={theme === 'light' ? '다크 모드' : '라이트 모드'}
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  )
}

export default WindowBar
