// ============================================================
// [Component] SettingsPanel
// 역할: 좌측 모델 설정 패널 (순수 UI, 상태는 useModelSettings가 소유)
// - 모델 연결 상태 표시
// - 프리셋 / 모델 선택 드롭다운
// - 시스템 프롬프트 열고 닫기 + 편집
// - temperature / top_p / num_predict 슬라이더·입력
// ============================================================
import { PRESETS } from '../presets'

function SettingsPanel({
  modelStatus,
  statusLabel,
  presetId,
  onPresetChange,
  models,
  model,
  onModelChange,
  isModelReady,
  isPromptOpen,
  onTogglePrompt,
  systemPrompt,
  onSystemPromptChange,
  temperature,
  onTemperatureChange,
  topP,
  onTopPChange,
  numPredict,
  onNumPredictChange,
}) {
  return (
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
        <div className={`model-status ${modelStatus}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>
        <div className="retro-divider" />

        <label className="field">
          <span className="field-label"><span className="label-icon">☷</span> 프리셋</span>
          <select value={presetId} onChange={onPresetChange}>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
          <small className="hint">대화 중 변경하면 확인 후 초기화됩니다.</small>
        </label>

        <label className="field">
          <span className="field-label"><span className="label-icon cube-icon">◇</span> 모델</span>
          <select value={model} onChange={onModelChange} disabled={!isModelReady}>
            {models.length === 0 && <option value="">{statusLabel}</option>}
            {models.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>

        <section className="field prompt-field">
          <button
            type="button"
            className="prompt-toggle"
            onClick={onTogglePrompt}
            aria-expanded={isPromptOpen}
          >
            <span><span className="label-icon">▤</span> 시스템 프롬프트</span>
            <span aria-hidden="true">{isPromptOpen ? '−' : '+'}</span>
          </button>
          {isPromptOpen && (
            <textarea
              rows={10}
              value={systemPrompt}
              aria-label="시스템 프롬프트"
              onChange={onSystemPromptChange}
            />
          )}
        </section>

        <label className="field range-field">
          <span className="field-label range-label">
            <span><span className="label-icon">✿</span> Temperature</span>
            <output>{temperature.toFixed(2)}</output>
          </span>
          <input
            type="range"
            min="0" max="2" step="0.05"
            value={temperature}
            style={{ '--range-progress': `${(temperature / 2) * 100}%` }}
            onChange={onTemperatureChange}
          />
          <small className="hint">낮을수록 일관되고, 높을수록 창의적</small>
        </label>

        <label className="field range-field">
          <span className="field-label range-label">
            <span><span className="label-icon">✿</span> Top P</span>
            <output>{topP.toFixed(2)}</output>
          </span>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={topP}
            style={{ '--range-progress': `${topP * 100}%` }}
            onChange={onTopPChange}
          />
        </label>

        <label className="field number-field">
          <span className="field-label"><span className="label-icon">▤</span> Num Predict</span>
          <input
            type="number"
            min="1" max="2048"
            value={numPredict}
            onChange={onNumPredictChange}
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
  )
}

export default SettingsPanel
