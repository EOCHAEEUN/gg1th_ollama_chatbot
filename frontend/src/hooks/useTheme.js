// ============================================================
// [Hook] useTheme
// 역할: 라이트/다크 테마 상태 관리
// - localStorage에 저장된 테마를 우선 사용하고, 없으면 OS 설정을 따름
// - 테마가 바뀌면 <html data-theme="..."> 속성과 localStorage를 동기화
// ============================================================
import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'capy-ai-theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // 테마 변경 시 <html> data-theme 속성 갱신 + localStorage 저장
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return { theme, toggleTheme }
}
