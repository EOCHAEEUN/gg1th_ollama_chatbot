// ============================================================
// [Page] App
// 역할: 전체 화면 뼈대를 조립하는 최상위 컴포넌트
// - 실제 상태/로직은 useModelSettings, useChat, useTheme 훅에 위임
// - 여기서는 훅에서 받은 값을 하위 컴포넌트(WindowBar, SettingsPanel,
//   ChatHeader, ChatMessages, Composer, PresetConfirmModal)에
//   props로 전달하는 "배선" 역할만 담당
// ============================================================
import { useModelSettings } from './hooks/useModelSettings'
import { useChat } from './hooks/useChat'
import { useTheme } from './hooks/useTheme'
import SettingsPanel from './components/SettingsPanel'
import ChatMessages from './components/ChatMessages'
import Composer from './components/Composer'
import PresetConfirmModal from './components/PresetConfirmModal'
import WindowBar from './components/WindowBar'
import ChatHeader from './components/ChatHeader'
import './App.css'

function App() {
  const { theme, toggleTheme } = useTheme()
  const modelSettings = useModelSettings()
  const chat = useChat({
    model: modelSettings.model,
    systemPrompt: modelSettings.systemPrompt,
    temperature: modelSettings.temperature,
    topP: modelSettings.topP,
    numPredict: modelSettings.numPredict,
    isModelReady: modelSettings.isModelReady,
    modelStatus: modelSettings.modelStatus,
    loadSettings: modelSettings.loadSettings,
  })

  // 프리셋 변경(확인 모달 "변경하고 초기화") 시 대화도 함께 초기화
  const applyPendingPreset = () => {
    modelSettings.applyPreset(modelSettings.pendingPreset, chat.handleReset)
  }

  const handlePresetChange = (event) => {
    modelSettings.handlePresetChange(event, chat.messages.length > 0, chat.handleReset)
  }

  const settingsSnapshot = {
    model: modelSettings.model,
    presetId: modelSettings.presetId,
    systemPrompt: modelSettings.systemPrompt,
    temperature: modelSettings.temperature,
    topP: modelSettings.topP,
    numPredict: modelSettings.numPredict,
  }

  return (
    <div className="app">
      {/* 상단 타이틀바: 브랜드 로고 + 다크모드 토글 */}
      <WindowBar theme={theme} onToggleTheme={toggleTheme} />

      <div className="workspace">
        {/* 좌측 설정 패널: 모델 선택 / 프리셋 / 시스템 프롬프트 / 생성 파라미터 */}
        <SettingsPanel
          modelStatus={modelSettings.modelStatus}
          statusLabel={modelSettings.statusLabel}
          presetId={modelSettings.presetId}
          onPresetChange={handlePresetChange}
          models={modelSettings.models}
          model={modelSettings.model}
          onModelChange={(event) => modelSettings.setModel(event.target.value)}
          isModelReady={modelSettings.isModelReady}
          isPromptOpen={modelSettings.isPromptOpen}
          onTogglePrompt={() => modelSettings.setIsPromptOpen((open) => !open)}
          systemPrompt={modelSettings.systemPrompt}
          onSystemPromptChange={modelSettings.handleSystemPromptChange}
          temperature={modelSettings.temperature}
          onTemperatureChange={(event) => modelSettings.setTemperature(Number(event.target.value))}
          topP={modelSettings.topP}
          onTopPChange={(event) => modelSettings.setTopP(Number(event.target.value))}
          numPredict={modelSettings.numPredict}
          onNumPredictChange={(event) => modelSettings.setNumPredict(Number(event.target.value))}
        />

        <main className="chat">
          {/* 채팅 헤더: 대화 저장 / 불러오기 / 초기화 */}
          <ChatHeader
            hasMessages={chat.messages.length > 0}
            onSave={() => chat.handleSave(settingsSnapshot)}
            onLoadClick={() => chat.fileInputRef.current?.click()}
            onReset={chat.handleReset}
            fileInputRef={chat.fileInputRef}
            onFileChange={chat.handleLoad}
          />

          {/* 메시지 목록: 빈 상태 안내 / 대화 버블 / 로딩 인디케이터 */}
          <ChatMessages
            messages={chat.messages}
            isLoading={chat.isLoading}
            isModelReady={modelSettings.isModelReady}
            onQuickPrompt={chat.handleQuickPrompt}
            bottomRef={chat.bottomRef}
          />

          {chat.error && <p className="notice error-notice">{chat.error}</p>}
          {chat.elapsed !== null && !chat.error && (
            <p className="notice meta">마지막 응답 {chat.elapsed}초 · 대화 {chat.messages.length}개 메시지</p>
          )}

          {/* 하단 입력창: 메시지 입력 + 전송 버튼 */}
          <Composer
            inputRef={chat.inputRef}
            input={chat.input}
            onInputChange={(event) => chat.setInput(event.target.value)}
            onKeyDown={chat.handleKeyDown}
            onSubmit={chat.handleSend}
            placeholder={chat.inputPlaceholder}
            isLoading={chat.isLoading}
            isModelReady={modelSettings.isModelReady}
            modelStatus={modelSettings.modelStatus}
          />
        </main>
      </div>

      {/* 프리셋 변경 확인 모달: 대화 중 프리셋을 바꾸려 할 때만 표시 */}
      {modelSettings.pendingPreset && (
        <PresetConfirmModal
          preset={modelSettings.pendingPreset}
          onCancel={() => modelSettings.setPendingPreset(null)}
          onConfirm={applyPendingPreset}
        />
      )}
    </div>
  )
}

export default App
