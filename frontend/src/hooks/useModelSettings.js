// ============================================================
// [Hook] useModelSettings
// 역할: SettingsPanel(모델 설정 패널)과 관련된 모든 상태/로직
// - 백엔드에서 사용 가능한 Ollama 모델 목록을 불러옴
// - 프리셋 선택/변경(대화 중 변경 시 확인 모달을 띄움) 처리
// - 시스템 프롬프트, temperature, top_p, num_predict 등 생성 파라미터 관리
// ============================================================
import { useEffect, useState } from 'react'
import { DEFAULT_PRESET, PRESETS } from '../presets'
import { fetchModels } from '../api/chatApi'

// 모델 준비 상태 → 설정 패널에 표시할 라벨
const STATUS_LABEL = {
  loading: '모델 불러오는 중…',
  ready: '준비 완료',
  empty: '설치된 모델 없음',
  error: '연결 확인 필요',
}

export function useModelSettings() {
  const [models, setModels] = useState([])
  const [model, setModel] = useState('')
  const [modelStatus, setModelStatus] = useState('loading')

  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PRESET.prompt)
  const [temperature, setTemperature] = useState(DEFAULT_PRESET.temperature)
  const [topP, setTopP] = useState(DEFAULT_PRESET.topP)
  const [numPredict, setNumPredict] = useState(DEFAULT_PRESET.numPredict)
  const [isPromptOpen, setIsPromptOpen] = useState(false)

  // 대화 중 프리셋을 바꾸면 즉시 적용하지 않고, 확인 모달을 띄우기 위한 대기 상태
  const [pendingPreset, setPendingPreset] = useState(null)

  const isModelReady = modelStatus === 'ready' && Boolean(model)
  const statusLabel = STATUS_LABEL[modelStatus]

  // 마운트 시 백엔드에서 설치된 모델 목록을 조회
  useEffect(() => {
    const loadModels = async () => {
      setModelStatus('loading')
      try {
        const list = await fetchModels()
        setModels(list)

        if (list.length === 0) {
          setModelStatus('empty')
          return
        }

        setModel(list[0])
        setModelStatus('ready')
      } catch {
        setModelStatus('error')
      }
    }

    loadModels()
  }, [])

  // 프리셋 값을 실제 상태에 반영 (대화 초기화 콜백은 useChat 쪽에서 처리하도록 인자로 받음)
  const applyPreset = (next, onApplied) => {
    setPresetId(next.id)
    setSystemPrompt(next.prompt)
    setTemperature(next.temperature)
    setTopP(next.topP)
    setNumPredict(next.numPredict)
    setPendingPreset(null)
    onApplied?.()
  }

  // 프리셋 select 변경 핸들러: 대화가 있으면 확인 모달, 없으면 즉시 적용
  const handlePresetChange = (event, hasMessages, onApplied) => {
    const next = PRESETS.find((preset) => preset.id === event.target.value)
    if (!next || next.id === presetId) return

    if (hasMessages) {
      setPendingPreset(next)
      return
    }

    applyPreset(next, onApplied)
  }

  const handleSystemPromptChange = (event) => {
    setSystemPrompt(event.target.value)
    setPresetId('custom')
  }

  const loadSettings = (settings) => {
    if (models.includes(settings.model)) setModel(settings.model)
    if (PRESETS.some((preset) => preset.id === settings.presetId)) setPresetId(settings.presetId)
    if (typeof settings.systemPrompt === 'string') setSystemPrompt(settings.systemPrompt)
    if (Number.isFinite(settings.temperature)) setTemperature(settings.temperature)
    if (Number.isFinite(settings.topP)) setTopP(settings.topP)
    if (Number.isFinite(settings.numPredict)) setNumPredict(settings.numPredict)
  }

  return {
    models,
    model,
    setModel,
    modelStatus,
    statusLabel,
    isModelReady,

    presetId,
    systemPrompt,
    temperature,
    setTemperature,
    topP,
    setTopP,
    numPredict,
    setNumPredict,
    isPromptOpen,
    setIsPromptOpen,
    handleSystemPromptChange,

    pendingPreset,
    setPendingPreset,
    applyPreset,
    handlePresetChange,

    loadSettings,
  }
}
