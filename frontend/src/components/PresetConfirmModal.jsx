// ============================================================
// [Component] PresetConfirmModal
// 역할: 대화 중 프리셋을 변경하려 할 때 띄우는 확인 모달
// - "취소" → pendingPreset을 비움 (모달 닫힘)
// - "변경하고 초기화" → 프리셋 적용 + 현재 대화 초기화
// ============================================================
function PresetConfirmModal({ preset, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="preset-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="modal-icon" aria-hidden="true">!</span>
        <h2 id="preset-modal-title">프리셋을 변경할까요?</h2>
        <p><strong>{preset.label}</strong>(으)로 바꾸면 현재 대화가 초기화됩니다.</p>
        <div className="modal-actions">
          <button type="button" className="utility-btn" onClick={onCancel}>취소</button>
          <button type="button" className="danger-action" onClick={onConfirm}>변경하고 초기화</button>
        </div>
      </section>
    </div>
  )
}

export default PresetConfirmModal
