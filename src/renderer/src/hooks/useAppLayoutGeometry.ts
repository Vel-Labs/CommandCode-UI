import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  DEFAULT_INSPECTOR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  INSPECTOR_COLLAPSE_WIDTH,
  INSPECTOR_MAX_WIDTH,
  INSPECTOR_MIN_WIDTH,
  INSPECTOR_WIDTH_KEY,
  SIDEBAR_COLLAPSE_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_KEY,
  loadNumberPreference
} from '../services/appStorage'

export function useAppLayoutGeometry({ onInspectorCollapse }: { onInspectorCollapse: () => void }) {
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => loadNumberPreference(SIDEBAR_WIDTH_KEY, DEFAULT_SIDEBAR_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
  const [rightInspectorWidth, setRightInspectorWidth] = useState(() => loadNumberPreference(INSPECTOR_WIDTH_KEY, DEFAULT_INSPECTOR_WIDTH, INSPECTOR_MIN_WIDTH, INSPECTOR_MAX_WIDTH))

  const startSidebarResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = sidebarWidth

    const onMove = (moveEvent: PointerEvent): void => {
      const rawWidth = startWidth + moveEvent.clientX - startX
      if (rawWidth <= SIDEBAR_COLLAPSE_WIDTH) {
        setRailCollapsed(true)
        return
      }
      const nextWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, rawWidth))
      setRailCollapsed(false)
      setSidebarWidth(nextWidth)
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(nextWidth))
    }

    const onUp = (): void => {
      document.body.classList.remove('is-resizing-panel')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    document.body.classList.add('is-resizing-panel')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const startInspectorResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = rightInspectorWidth

    const onMove = (moveEvent: PointerEvent): void => {
      const rawWidth = startWidth - (moveEvent.clientX - startX)
      if (rawWidth <= INSPECTOR_COLLAPSE_WIDTH) {
        onInspectorCollapse()
        return
      }
      const nextWidth = Math.min(INSPECTOR_MAX_WIDTH, Math.max(INSPECTOR_MIN_WIDTH, rawWidth))
      setRightInspectorWidth(nextWidth)
      localStorage.setItem(INSPECTOR_WIDTH_KEY, String(nextWidth))
    }

    const onUp = (): void => {
      document.body.classList.remove('is-resizing-panel')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    document.body.classList.add('is-resizing-panel')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  return {
    railCollapsed,
    setRailCollapsed,
    sidebarWidth,
    setSidebarWidth,
    rightInspectorWidth,
    setRightInspectorWidth,
    startSidebarResize,
    startInspectorResize
  }
}
