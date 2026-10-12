import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * The app uses hash routing (works on any static host), so in-page anchors
 * like "#about" can't be plain hrefs. This scrolls to a homepage section,
 * navigating home first when needed.
 */
export function useSectionNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(
    (id: string) => {
      if (pathname === '/') {
        if (id === 'top') window.scrollTo({ top: 0 })
        else document.getElementById(id)?.scrollIntoView({ block: 'start' })
      } else {
        navigate('/', { state: { scrollTo: id } })
      }
    },
    [navigate, pathname],
  )
}
