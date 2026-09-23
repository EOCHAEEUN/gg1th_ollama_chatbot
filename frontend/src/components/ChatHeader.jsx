// ============================================================
// [Component] ChatHeader
// 역할: 채팅 영역 상단 바 (제목 + 저장/불러오기/초기화 버튼)
// - onFileChange: 숨겨진 file input의 change 이벤트 (JSON 대화 불러오기)
// ============================================================
function ChatHeader({ hasMessages, onSave, onLoadClick, onReset, fileInputRef, onFileChange }) {
  return (
    <header className="chat-header">
      <div className="chat-title-wrap">
        <span className="terminal-icon-frame" aria-hidden="true">
          <img src="/assets/pixel/terminal.png" className="terminal-icon pixel-asset" alt="" />
        </span>
        <div>
          <h1>Local LLM Chat</h1>
          <p className="subtitle">React + FastAPI + Ollama 기반 로컬 AI 채팅 앱</p>
        </div>
      </div>
      <div className="chat-actions">
        <button type="button" className="utility-btn" onClick={onSave} disabled={!hasMessages} title="대화 저장">저장</button>
        <button type="button" className="utility-btn" onClick={onLoadClick} title="대화 불러오기">불러오기</button>
        <button type="button" className="reset-btn" onClick={onReset} disabled={!hasMessages}>
          <span aria-hidden="true">↶</span> 초기화
        </button>
        <input ref={fileInputRef} className="file-input" type="file" accept="application/json,.json" onChange={onFileChange} />
      </div>
    </header>
  )
}

export default ChatHeader
