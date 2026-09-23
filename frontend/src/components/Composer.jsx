// ============================================================
// [Component] Composer
// 역할: 하단 메시지 입력 폼
// - textarea 입력 + Enter(전송)/Shift+Enter(줄바꿈) 처리는 상위(useChat)에서 받음
// - 모델이 준비되지 않았거나 로딩 중이면 입력/전송 버튼 비활성화
// ============================================================
function Composer({
  inputRef,
  input,
  onInputChange,
  onKeyDown,
  onSubmit,
  placeholder,
  isLoading,
  isModelReady,
  modelStatus,
}) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <div className="composer-input-wrap">
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="메시지 입력"
          disabled={isLoading || !isModelReady}
        />
        <span className="composer-paw-frame" aria-hidden="true">
          <img src="/assets/pixel/paw.png" className="composer-paw pixel-asset" alt="" />
        </span>
      </div>
      <button type="submit" disabled={isLoading || !isModelReady || !input.trim()}>
        {isLoading ? '생성 중…' : modelStatus === 'loading' ? '준비 중…' : '전송'}
      </button>
    </form>
  )
}

export default Composer
