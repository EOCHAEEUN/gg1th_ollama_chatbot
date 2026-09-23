// ============================================================
// [Component] CopyButton
// 역할: 전달받은 텍스트를 클립보드에 복사하는 아이콘 버튼
// - 성공 시 1.6초간 체크 아이콘 + "복사됨"
// - 실패 시 1.6초간 "실패" 표시 (조용히 넘어가지 않도록)
// - 복사 자체는 utils/clipboard.js가 환경별로 처리
// ============================================================
import { useState } from 'react'
import { copyText } from '../utils/clipboard'

function CopyButton({ text, label = '답변 전체 복사' }) {
  const [status, setStatus] = useState('idle') // idle | copied | failed

  const handleCopy = async () => {
    const ok = await copyText(text)
    setStatus(ok ? 'copied' : 'failed')
    window.setTimeout(() => setStatus('idle'), 1600)
  }

  const buttonLabel = { idle: '복사', copied: '복사됨', failed: '실패' }[status]

  return (
    <button
      type="button"
      className={`copy-btn ${status}`}
      onClick={handleCopy}
      aria-label={label}
      title={status === 'failed' ? '복사할 수 없습니다 (브라우저 권한 확인)' : label}
    >
      {status === 'copied' ? (
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path
            d="M3 8.5l3.5 3.5L13 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 2.5h-8v9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )}
      <span className="copy-btn-text">{buttonLabel}</span>
    </button>
  )
}

export default CopyButton
