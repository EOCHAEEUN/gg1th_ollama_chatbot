// ============================================================
// [Util] chat
// 역할: 채팅 메시지 관련 순수 함수 모음 (컴포넌트/훅 어디서든 재사용)
// - createMessage: role/content로 새 메시지 객체 생성 (id, 생성시각 포함)
// - formatTime: ISO 날짜 문자열을 "HH:mm" 형식으로 표시
// ============================================================
export const createMessage = (role, content) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
})

export const formatTime = (dateString) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
