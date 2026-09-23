// ============================================================
// [Util] clipboard
// 역할: 환경에 상관없이 텍스트를 클립보드에 복사
//
// navigator.clipboard는 보안 컨텍스트(HTTPS 또는 localhost)에서만 존재한다.
// http://192.168.x.x 처럼 IP로 접속하면 undefined이므로,
// 구형 execCommand('copy') 방식으로 폴백한다.
//
// 반환값: 성공 여부(boolean) — 호출한 쪽에서 실패를 사용자에게 알릴 수 있다.
// ============================================================
export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 권한 거부 등 — 아래 폴백으로 진행
    }
  }

  // 폴백: 화면 밖 textarea에 넣고 execCommand로 복사
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
