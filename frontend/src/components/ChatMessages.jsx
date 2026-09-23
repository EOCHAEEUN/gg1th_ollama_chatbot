// ============================================================
// [Component] ChatMessages
// 역할: 채팅 메시지 목록 영역
// - 대화가 없을 때: 빈 상태 안내 + 추천 질문 버튼(QUICK_PROMPTS)
// - 대화가 있을 때: 메시지 버블 목록 (MessageContent로 본문 렌더링)
// - 응답 대기 중일 때: 로딩(타이핑) 인디케이터
// - bottomRef: 새 메시지 추가 시 자동 스크롤 대상
// ============================================================
import MessageContent from './MessageContent'
import CopyButton from './CopyButton'
import { formatTime } from '../utils/chat'

const QUICK_PROMPTS = [
  '파이썬 기초 알려줘',
  '이 코드 리뷰해줘',
  '쉬운 비유로 설명해줘',
  '오늘 배울 개념을 추천해줘',
]

function ChatMessages({ messages, isLoading, isModelReady, onQuickPrompt, bottomRef }) {
  return (
    <div className="messages">
      {messages.length === 0 && !isLoading && (
        <div className="empty-state">
          <div className="capy-scene">
            <div className="speech-bubble">무엇이든<br />물어보세요!</div>
            <img
              src="/assets/pixel/capy-coding.png"
              className="capy-coding-image pixel-asset"
              alt="오래된 컴퓨터 앞에서 타이핑하는 카피바라"
            />
          </div>
          <p className="empty-title">어떤 도움이 필요하세요?</p>
          <p className="empty-subtitle">추천 질문을 누르거나 직접 입력해 보세요.</p>
          <div className="quick-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button type="button" key={prompt} onClick={() => onQuickPrompt(prompt)} disabled={!isModelReady}>
                {prompt}<span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <article key={message.id} className={`bubble ${message.role}`}>
          <div className="bubble-meta">
            <span className="role">{message.role === 'user' ? 'YOU' : 'CAPY AI'}</span>
            <span className="bubble-meta-right">
              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
              {message.role === 'assistant' && <CopyButton text={message.content} />}
            </span>
          </div>
          <MessageContent content={message.content} markdown={message.role === 'assistant'} />
        </article>
      ))}

      {isLoading && (
        <div className="loading-row" aria-live="polite">
          <span className="thinking-capy-frame" aria-hidden="true">
            <img src="/assets/pixel/capy-head.png" className="thinking-capy pixel-asset" alt="" />
          </span>
          <div className="bubble assistant typing-bubble">
            <span className="role">CAPY AI</span>
            <div className="typing-status">
              <span>답변 작성 중</span>
              <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default ChatMessages
