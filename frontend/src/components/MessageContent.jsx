// ============================================================
// [Component] MessageContent
// 역할: 메시지 한 건의 본문을 파싱해서 렌더링
// - ```코드``` 마크다운 펜스를 정규식으로 찾아 텍스트/코드 블록으로 분리
// - 코드 블록은 CodeBlock 컴포넌트(복사 버튼 포함)로 렌더링
// - 나머지 텍스트는 renderMarkdown으로 굵게/목록/제목 등을 해석해 표시
// - 단, 사용자가 쓴 메시지(markdown=false)는 입력한 그대로 보여준다
// ============================================================
import CodeBlock from './CodeBlock'
import { renderMarkdown } from '../utils/markdown'

function MessageContent({ content, markdown = true }) {
  const blocks = []
  const fencePattern = /```([\w+-]*)\n?([\s\S]*?)```/g
  let cursor = 0
  let match

  while ((match = fencePattern.exec(content)) !== null) {
    if (match.index > cursor) {
      blocks.push({ type: 'text', value: content.slice(cursor, match.index) })
    }
    blocks.push({ type: 'code', language: match[1], value: match[2].replace(/\n$/, '') })
    cursor = match.index + match[0].length
  }

  if (cursor < content.length) {
    blocks.push({ type: 'text', value: content.slice(cursor) })
  }

  if (blocks.length === 0) blocks.push({ type: 'text', value: content })

  return (
    <div className="content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        if (block.type === 'code') {
          return <CodeBlock key={key} language={block.language} code={block.value} />
        }

        if (markdown) {
          return <div className="md-body" key={key}>{renderMarkdown(block.value, key)}</div>
        }

        return <span className="message-text" key={key}>{block.value}</span>
      })}
    </div>
  )
}

export default MessageContent
