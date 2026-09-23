// ============================================================
// [Util] markdown
// 역할: LLM 답변에 섞여 오는 마크다운을 React 엘리먼트로 변환
//
// 코드 펜스(```)는 MessageContent가 이미 분리해서 CodeBlock으로 넘기므로,
// 여기서는 펜스를 제외한 "텍스트 조각"만 다룬다.
//
// 지원 범위 (LLM이 실제로 자주 쓰는 것 위주):
//   블록  - #~###### 제목, - * + 불릿, 1. 번호 목록, > 인용, --- 구분선
//   인라인 - **굵게**, *기울임*, `코드`, ~~취소선~~, [링크](url)
//
// dangerouslySetInnerHTML을 쓰지 않으므로 HTML 주입(XSS) 위험이 없다.
// ============================================================

// ── 인라인 파싱 ────────────────────────────────────────────
// 여러 문법을 한 정규식에 모아 등장 순서대로 처리한다.
// 순서 주의: ** 를 * 보다 먼저 잡아야 굵게가 기울임으로 쪼개지지 않는다.
const INLINE_PATTERN = new RegExp(
  [
    '(`[^`\\n]+`)',                    // 1: `코드`
    '(\\*\\*[^*\\n]+\\*\\*)',          // 2: **굵게**
    '(__[^_\\n]+__)',                  // 3: __굵게__
    '(~~[^~\\n]+~~)',                  // 4: ~~취소선~~
    '(\\*[^*\\n]+\\*)',                // 5: *기울임*
    '(\\[[^\\]\\n]+\\]\\([^)\\s]+\\))', // 6: [링크](url)
  ].join('|'),
  'g',
)

function parseInline(text, keyPrefix) {
  const nodes = []
  let cursor = 0
  let match
  let index = 0

  INLINE_PATTERN.lastIndex = 0

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index))
    }

    const token = match[0]
    const key = `${keyPrefix}-i${index++}`

    if (token.startsWith('`')) {
      nodes.push(<code className="inline-code" key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('~~')) {
      nodes.push(<del key={key}>{token.slice(2, -2)}</del>)
    } else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']'))
      const href = token.slice(token.indexOf('](') + 2, -1)
      // 외부 링크는 새 탭 + rel로 opener 접근 차단
      nodes.push(
        <a href={href} target="_blank" rel="noopener noreferrer" key={key}>{label}</a>,
      )
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))

  return nodes.length > 0 ? nodes : [text]
}

// ── 블록 파싱 ──────────────────────────────────────────────
const HEADING = /^(#{1,6})\s+(.*)$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const DIVIDER = /^\s*([-*_])\s*(?:\1\s*){2,}$/

export function renderMarkdown(text, keyPrefix = 'md') {
  const lines = text.split('\n')
  const blocks = []
  let paragraph = []
  let index = 0

  // 지금까지 모은 일반 텍스트 줄을 한 문단으로 배출
  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const body = paragraph.join('\n')
    const key = `${keyPrefix}-p${index++}`
    if (body.trim()) {
      blocks.push(<p className="md-p" key={key}>{parseInline(body, key)}</p>)
    }
    paragraph = []
  }

  // 불릿/번호 목록은 연속된 줄을 묶어서 한 <ul>/<ol>로 만든다
  let lineNo = 0
  while (lineNo < lines.length) {
    const line = lines[lineNo]

    if (DIVIDER.test(line)) {
      flushParagraph()
      blocks.push(<hr className="md-hr" key={`${keyPrefix}-hr${index++}`} />)
      lineNo++
      continue
    }

    const heading = line.match(HEADING)
    if (heading) {
      flushParagraph()
      const level = Math.min(heading[1].length, 6)
      const Tag = `h${level}`
      const key = `${keyPrefix}-h${index++}`
      blocks.push(
        <Tag className={`md-h md-h${level}`} key={key}>{parseInline(heading[2], key)}</Tag>,
      )
      lineNo++
      continue
    }

    if (BULLET.test(line)) {
      flushParagraph()
      const items = []
      while (lineNo < lines.length && BULLET.test(lines[lineNo])) {
        items.push(lines[lineNo].match(BULLET)[1])
        lineNo++
      }
      const key = `${keyPrefix}-ul${index++}`
      blocks.push(
        <ul className="md-ul" key={key}>
          {items.map((item, i) => <li key={`${key}-${i}`}>{parseInline(item, `${key}-${i}`)}</li>)}
        </ul>,
      )
      continue
    }

    if (ORDERED.test(line)) {
      flushParagraph()
      const items = []
      const start = Number(lines[lineNo].match(ORDERED)[1])
      while (lineNo < lines.length && ORDERED.test(lines[lineNo])) {
        items.push(lines[lineNo].match(ORDERED)[2])
        lineNo++
      }
      const key = `${keyPrefix}-ol${index++}`
      blocks.push(
        <ol className="md-ol" start={start} key={key}>
          {items.map((item, i) => <li key={`${key}-${i}`}>{parseInline(item, `${key}-${i}`)}</li>)}
        </ol>,
      )
      continue
    }

    if (QUOTE.test(line)) {
      flushParagraph()
      const quoted = []
      while (lineNo < lines.length && QUOTE.test(lines[lineNo])) {
        quoted.push(lines[lineNo].match(QUOTE)[1])
        lineNo++
      }
      const key = `${keyPrefix}-bq${index++}`
      blocks.push(
        <blockquote className="md-quote" key={key}>{parseInline(quoted.join('\n'), key)}</blockquote>,
      )
      continue
    }

    // 빈 줄은 문단 구분자
    if (line.trim() === '') {
      flushParagraph()
      lineNo++
      continue
    }

    paragraph.push(line)
    lineNo++
  }

  flushParagraph()
  return blocks
}
