import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PRESET, PRESETS } from './presets'
import './App.css'

// 백엔드 주소. main.py에서 127.0.0.1:8000으로 띄웠으므로 그에 맞춥니다.
// 이렇게 상수로 빼두면 나중에 배포 주소로 바꿀 때 한 줄만 고치면 됩니다.
const API_BASE = 'http://127.0.0.1:8000'

function App() {
  // ───────────────────────────────────────────────────────────
  // 1) 대화 관련 state
  // ───────────────────────────────────────────────────────────

  // ★ 멀티턴의 심장. 지금까지의 대화 전체를 담는 배열입니다.
  //   형태: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }, ...]
  //   백엔드 schema.py의 ChatMessage와 똑같은 모양으로 맞춰놨기 때문에
  //   이 배열을 그대로 history로 보낼 수 있습니다.
  //
  //   LLM에는 기억이 없습니다. 이 배열을 매 요청마다 다시 보내주는 것이
  //   곧 "AI가 앞 대화를 기억하는 것처럼 보이는" 원리의 전부입니다.
  const [messages, setMessages] = useState([])

  // 입력창에 타이핑 중인 내용
  const [input, setInput] = useState('')

  // 응답 대기 중인지 여부. true면 버튼을 잠가서 중복 전송을 막습니다.
  const [isLoading, setIsLoading] = useState(false)

  // 에러 메시지 (서버가 꺼져 있거나 500이 났을 때 화면에 보여줌)
  const [error, setError] = useState('')

  // 마지막 응답이 몇 초 걸렸는지 (백엔드가 elapsed_time으로 돌려줌)
  const [elapsed, setElapsed] = useState(null)

  // ───────────────────────────────────────────────────────────
  // 2) 모델 설정 관련 state (설계도의 왼쪽 사이드바)
  // ───────────────────────────────────────────────────────────

  const [models, setModels] = useState([])          // /models로 받아온 목록
  const [model, setModel] = useState('')            // 현재 선택된 모델

  // 프리셋으로 고른 값들. 초기값은 presets.js의 기본 프리셋에서 가져옵니다.
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PRESET.prompt)
  const [temperature, setTemperature] = useState(DEFAULT_PRESET.temperature)
  const [topP, setTopP] = useState(DEFAULT_PRESET.topP)
  const [numPredict, setNumPredict] = useState(DEFAULT_PRESET.numPredict)

  // 새 메시지가 추가될 때 맨 아래로 스크롤하기 위한 참조점
  const bottomRef = useRef(null)

  // ───────────────────────────────────────────────────────────
  // 3) 앱이 처음 켜질 때 모델 목록 불러오기
  //    useEffect의 두 번째 인자가 빈 배열 [] = "최초 1회만 실행"
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/models`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.models ?? []
        setModels(list)
        // 목록의 첫 번째 모델을 기본 선택값으로
        if (list.length > 0) setModel(list[0])
      })
      .catch(() => {
        // 여기서 실패하면 십중팔구 백엔드가 안 떠 있는 것입니다.
        setError('모델 목록을 불러오지 못했습니다. 백엔드(uv run main.py)가 실행 중인지 확인하세요.')
      })
  }, [])

  // 메시지가 바뀔 때마다 대화창 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ───────────────────────────────────────────────────────────
  // 4) 프리셋을 바꿨을 때
  // ───────────────────────────────────────────────────────────
  const handlePresetChange = (event) => {
    const next = PRESETS.find((p) => p.id === event.target.value)
    if (!next) return

    setPresetId(next.id)
    // 프리셋에 저장된 값들로 설정칸을 한 번에 채웁니다.
    setSystemPrompt(next.prompt)
    setTemperature(next.temperature)
    setTopP(next.topP)
    setNumPredict(next.numPredict)

    // ★ 중요: 프리셋을 바꾸면 대화도 초기화합니다.
    //   왜? '초보자 강사'와 나눈 대화 기록을 그대로 '코드 리뷰어'에게
    //   history로 넘기면, 모델이 "나는 방금까지 강사였는데 지금은 리뷰어인가?"
    //   하고 혼란스러워하며 역할이 섞인 답을 냅니다.
    //   역할이 바뀌면 대화도 새로 시작하는 게 깔끔합니다.
    setMessages([])
    setError('')
    setElapsed(null)
  }

  // ───────────────────────────────────────────────────────────
  // 5) 대화 초기화 버튼
  // ───────────────────────────────────────────────────────────
  const handleReset = () => {
    // messages를 비우면 다음 요청의 history가 []가 되므로
    // 모델은 앞 대화를 전혀 모르는 상태로 돌아갑니다.
    setMessages([])
    setError('')
    setElapsed(null)
  }

  // ───────────────────────────────────────────────────────────
  // 6) ★★ 메시지 전송 — 이 함수가 멀티턴의 핵심입니다 ★★
  // ───────────────────────────────────────────────────────────
  const handleSend = async (event) => {
    event.preventDefault()   // form의 기본 동작(새로고침)을 막음

    const question = input.trim()
    // 빈 입력이거나 이미 응답 대기 중이면 무시
    if (!question || isLoading) return

    setError('')
    setIsLoading(true)

    // (1) 보낼 시점의 대화 기록을 따로 붙잡아 둡니다.
    //     이게 곧 백엔드로 보낼 history입니다.
    //     주의: 이번에 입력한 question은 여기 포함시키지 않습니다.
    //     백엔드가 message 필드를 맨 뒤에 따로 붙여주기 때문입니다.
    //       [system] + history + [이번 question]  ← ollama_chat.py 참고
    //     여기에도 question을 넣으면 같은 질문이 두 번 들어갑니다.
    const historyToSend = messages

    // (2) 내 질문을 화면에 먼저 띄웁니다.
    //     응답을 기다리는 동안에도 내가 뭘 물었는지 보이게 하려는 것입니다.
    //     setMessages에 함수를 넘기는 형태(prev => ...)를 쓰는 이유:
    //     React의 state 업데이트는 즉시 반영되지 않기 때문에,
    //     "가장 최신 값(prev)에 이어붙여라"라고 지시하는 게 안전합니다.
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')   // 입력창 비우기

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // (3) 백엔드 schema.py의 ChatRequest와 필드명이 정확히 일치해야 합니다.
        //     하나라도 이름이 다르면 422 Unprocessable Entity가 납니다.
        body: JSON.stringify({
          message: question,          // 이번 질문
          history: historyToSend,     // ★ 과거 대화 (이것이 멀티턴의 전부)
          model: model,
          system_prompt: systemPrompt,
          temperature: temperature,
          top_p: topP,
          num_predict: numPredict,
        }),
      })

      if (!res.ok) {
        // 백엔드가 HTTPException을 던지면 detail 필드에 이유가 담겨 옵니다.
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.detail ?? `서버 오류 (HTTP ${res.status})`)
      }

      const data = await res.json()   // { model, message, elapsed_time }

      // (4) AI 답변을 대화 기록에 쌓습니다.
      //     ★ 이 줄이 없으면 다음 질문 때 history에 AI 답변이 빠지고,
      //       모델은 "내가 무슨 말을 했는지" 모르게 됩니다.
      //       멀티턴이 안 될 때 가장 흔한 실수 지점입니다.
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      setElapsed(data.elapsed_time)
    } catch (err) {
      setError(err.message)
      // 실패했으면 방금 화면에 띄운 내 질문을 도로 걷어냅니다.
      // 그대로 두면 답변 없는 질문만 남아서, 다음 요청의 history가
      // user, user, ... 처럼 짝이 안 맞는 이상한 모양이 됩니다.
      setMessages((prev) => prev.slice(0, -1))
      setInput(question)   // 다시 보낼 수 있게 입력창에 복원
    } finally {
      // 성공이든 실패든 로딩 상태는 반드시 해제
      setIsLoading(false)
    }
  }

  // Enter로 전송, Shift+Enter로 줄바꿈 (채팅앱의 일반적인 동작)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend(event)
    }
  }

  return (
    <div className="app">
      <header className="window-bar">
        <div className="window-brand">
          <span className="brand-paw-frame" aria-hidden="true">
            <img src="/assets/pixel/paw.png" className="brand-paw pixel-asset" alt="" />
          </span>
          <span>CAPY AI</span>
        </div>
        <div className="window-actions">
          <span className="window-motto">SMALL STEPS, BIG THINGS</span>
          <div className="window-buttons" aria-hidden="true">
            <span>_</span>
            <span>□</span>
            <span>×</span>
          </div>
        </div>
      </header>

      <div className="workspace">
        {/* ─────────── 왼쪽: 모델 설정 사이드바 ─────────── */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <div className="sidebar-heading">
              <span className="sidebar-capy-frame" aria-hidden="true">
                <img src="/assets/pixel/capy-head.png" className="sidebar-capy pixel-asset" alt="" />
              </span>
              <div>
                <h2>모델 설정</h2>
                <p>나만의 AI와 대화를 시작해요</p>
              </div>
            </div>
            <div className="retro-divider" />

            <label className="field">
              <span className="field-label"><span className="label-icon">☷</span> 프리셋</span>
              <select value={presetId} onChange={handlePresetChange}>
                {PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <small className="hint">프리셋 변경 시 대화가 초기화됩니다.</small>
            </label>

            <label className="field">
              <span className="field-label"><span className="label-icon cube-icon">◇</span> 모델</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {models.length === 0 && <option value="">불러오는 중…</option>}
                {models.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <label className="field prompt-field">
              <span className="field-label"><span className="label-icon">▤</span> 시스템 프롬프트</span>
              <textarea
                rows={14}
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value)
                  setPresetId('custom')
                }}
              />
            </label>

            <label className="field range-field">
              <span className="field-label"><span className="label-icon">✿</span> Temperature: {temperature}</span>
              <input
                type="range"
                min="0" max="2" step="0.05"
                value={temperature}
                style={{ '--range-progress': `${(temperature / 2) * 100}%` }}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
              <small className="hint">낮을수록 일관되고, 높을수록 창의적</small>
            </label>

            <label className="field range-field">
              <span className="field-label"><span className="label-icon">✿</span> Top P: {topP}</span>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={topP}
                style={{ '--range-progress': `${topP * 100}%` }}
                onChange={(e) => setTopP(Number(e.target.value))}
              />
            </label>

            <label className="field number-field">
              <span className="field-label"><span className="label-icon">▤</span> Num Predict</span>
              <input
                type="number"
                min="1" max="2048"
                value={numPredict}
                onChange={(e) => setNumPredict(Number(e.target.value))}
              />
              <small className="hint">응답 최대 토큰 수 (길수록 느려짐)</small>
            </label>
          </div>

          <div className="sidebar-footer" aria-hidden="true">
            <span className="sleeping-capy-frame">
              <img src="/assets/pixel/capy-sleep.png" className="sleeping-capy pixel-asset" alt="" />
            </span>
            <p>GOOD CODE<br />BRIGHTER DAYS</p>
          </div>
        </aside>

        {/* ─────────── 오른쪽: 채팅 영역 ─────────── */}
        <main className="chat">
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
            <button type="button" className="reset-btn" onClick={handleReset}>
              <span aria-hidden="true">↶</span> 대화 초기화
            </button>
          </header>

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
                <p className="empty-title">질문을 입력해 대화를 시작하세요.</p>
                <p className="empty-subtitle">AI와 함께, 조금 더 나은 하루</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`bubble ${msg.role}`}>
                <span className="role">{msg.role === 'user' ? 'YOU' : 'CAPY AI'}</span>
                <p className="content">{msg.content}</p>
              </div>
            ))}

            {isLoading && (
              <div className="bubble assistant">
                <span className="role">CAPY AI</span>
                <p className="content typing">응답 생성 중…</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="error">⚠ {error}</p>}
          {elapsed !== null && !error && (
            <p className="meta">마지막 응답 {elapsed}초 · 대화 {messages.length}개 메시지</p>
          )}

          <form className="composer" onSubmit={handleSend}>
            <div className="composer-input-wrap">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요 (Enter 전송 / Shift+Enter 줄바꿈)"
                aria-label="메시지 입력"
                disabled={isLoading}
              />
              <span className="composer-paw-frame" aria-hidden="true">
                <img src="/assets/pixel/paw.png" className="composer-paw pixel-asset" alt="" />
              </span>
            </div>
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? '생성 중…' : '전송'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}

export default App
