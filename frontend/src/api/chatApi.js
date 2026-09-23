// ============================================================
// [API] chatApi
// 역할: 백엔드(/api/*)와 통신하는 fetch 호출을 모아둔 곳
// - 훅(useModelSettings, useChat)은 이 함수들만 호출하고,
//   실제 요청 URL/헤더/에러 파싱 방식은 여기서만 신경 쓴다
// - fetchModels: 설치된 Ollama 모델 목록 조회
// - postChat: 메시지 전송 + 답변 수신
// ============================================================
const API_BASE = '/api'

// GET /api/models → { models: string[] }
export async function fetchModels() {
  const response = await fetch(`${API_BASE}/models`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  return data.models ?? []
}

// POST /api/chat → { message: string, elapsed_time: number }
export async function postChat({ message, history, model, systemPrompt, temperature, topP, numPredict }) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      model,
      system_prompt: systemPrompt,
      temperature,
      top_p: topP,
      num_predict: numPredict,
    }),
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `서버 오류 (HTTP ${response.status})`)
  }

  return response.json()
}
