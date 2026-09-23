// ============================================================
// [Hook] useChat
// 역할: 채팅 메시지 목록과 입력창, 전송/저장/불러오기 로직 전체
// - 메시지 전송(submitQuestion) 시 api/chatApi.js의 postChat 호출
// - 대화 저장(JSON 다운로드) / 불러오기(JSON 업로드) 처리
// - Enter 전송, Shift+Enter 줄바꿈, 추천 질문 클릭 등 입력 UX
// - 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { createMessage } from '../utils/chat'
import { postChat } from '../api/chatApi'

export function useChat({ model, systemPrompt, temperature, topP, numPredict, isModelReady, modelStatus, loadSettings }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // 모델 상태(로딩 실패/설치된 모델 없음 등)를 채팅 영역 안내 문구로도 노출
  useEffect(() => {
    if (modelStatus === 'empty') {
      setError('사용 가능한 모델이 없습니다. Ollama에 모델을 먼저 설치해 주세요.')
    } else if (modelStatus === 'error') {
      setError('백엔드에 연결하지 못했습니다. 서버를 실행한 뒤 새로고침해 주세요.')
    }
  }, [modelStatus])

  // 새 메시지가 추가되거나 로딩 상태가 바뀔 때마다 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleReset = () => {
    setMessages([])
    setError('')
    setElapsed(null)
  }

  // 질문 전송: 사용자 메시지를 먼저 추가하고, 응답 실패 시 롤백
  const submitQuestion = async (questionText) => {
    const question = questionText.trim()
    if (!question || isLoading || !isModelReady) return

    setError('')
    setIsLoading(true)

    const historyToSend = messages.map(({ role, content }) => ({ role, content }))
    setMessages((previous) => [...previous, createMessage('user', question)])
    setInput('')

    try {
      const data = await postChat({
        message: question,
        history: historyToSend,
        model,
        systemPrompt,
        temperature,
        topP,
        numPredict,
      })
      setMessages((previous) => [...previous, createMessage('assistant', data.message)])
      setElapsed(data.elapsed_time)
    } catch (requestError) {
      setError(requestError.message)
      setMessages((previous) => previous.slice(0, -1))
      setInput(question)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = (event) => {
    event.preventDefault()
    submitQuestion(input)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitQuestion(input)
    }
  }

  const handleQuickPrompt = (prompt) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  // 현재 대화 + 설정을 JSON 파일로 다운로드
  const handleSave = (settingsSnapshot) => {
    const conversation = {
      version: 1,
      savedAt: new Date().toISOString(),
      messages,
      settings: settingsSnapshot,
    }
    const file = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `capy-ai-chat-${date}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  // JSON 파일을 읽어 대화 + 설정 복원
  const handleLoad = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const saved = JSON.parse(await file.text())
      if (!Array.isArray(saved.messages)) throw new Error('대화 형식이 올바르지 않습니다.')

      const loadedMessages = saved.messages
        .filter((message) => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
        .map((message) => ({
          ...createMessage(message.role, message.content),
          id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: message.createdAt || new Date().toISOString(),
        }))

      const settings = saved.settings ?? {}
      setMessages(loadedMessages)
      loadSettings(settings)
      setElapsed(null)
      setError('')
    } catch (loadError) {
      setError(loadError.message || '대화 파일을 불러오지 못했습니다.')
    }
  }

  const inputPlaceholder = isModelReady
    ? '메시지를 입력하세요 (Enter 전송 / Shift+Enter 줄바꿈)'
    : modelStatus === 'loading'
      ? '모델을 불러오는 중입니다…'
      : '모델 연결을 확인해 주세요'

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    elapsed,

    bottomRef,
    inputRef,
    fileInputRef,

    inputPlaceholder,
    handleReset,
    handleSend,
    handleKeyDown,
    handleQuickPrompt,
    handleSave,
    handleLoad,
  }
}
