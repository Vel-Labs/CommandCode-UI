import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { PopoverKey } from '../appTypes'

export function useDismissiblePopover(openPopover: PopoverKey, setOpenPopover: (value: PopoverKey) => void): RefObject<HTMLDivElement | null> {
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!openPopover) return

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (target instanceof Node && popoverRef.current?.contains(target)) return
      setOpenPopover(null)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpenPopover(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openPopover, setOpenPopover])

  return popoverRef
}
