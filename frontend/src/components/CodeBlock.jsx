// ============================================================
// [Component] CodeBlock
// 역할: 메시지 안의 코드 조각 하나를 표시
// - 언어명 표시 + 클립보드 복사 버튼 (복사 시 1.6초간 "복사됨" 표시)
// ============================================================
import { useState } from 'react'
import { copyText } from '../utils/clipboard'

function CodeBlock({ language, code }) {
  const [status, setStatus] = useState('idle') // idle | copied | failed

  const handleCopy = async () => {
    const ok = await copyText(code)
    setStatus(ok ? 'copied' : 'failed')
    window.setTimeout(() => setStatus('idle'), 1600)
  }

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{language || 'code'}</span>
        <button type="button" onClick={handleCopy} aria-label="코드 복사">
          {{ idle: '복사', copied: '복사됨 ✓', failed: '실패' }[status]}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

export default CodeBlock
