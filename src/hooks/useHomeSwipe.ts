import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const COMMIT_PX = 80
const COMMIT_VELOCITY = 0.55

type UseHomeSwipeOptions = {
  enabled: boolean
  onCommit: () => void
}

/**
 * Swipe-up (or tap) on the home indicator to dismiss the in-app layer.
 * Does not move the window — close animation is handled by CSS fade.
 */
export function useHomeSwipe({ enabled, onCommit }: UseHomeSwipeOptions) {
  const pointerId = useRef<number | null>(null)
  const startY = useRef(0)
  const startT = useRef(0)
  const lastY = useRef(0)
  const lastT = useRef(0)
  const dragging = useRef(false)

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!enabled || e.button !== 0) return
      pointerId.current = e.pointerId
      dragging.current = true
      startY.current = e.clientY
      lastY.current = e.clientY
      startT.current = performance.now()
      lastT.current = startT.current
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [enabled],
  )

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging.current || e.pointerId !== pointerId.current) return
    lastY.current = e.clientY
    lastT.current = performance.now()
  }, [])

  const endPointer = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragging.current || e.pointerId !== pointerId.current) return
      const lift = Math.max(0, startY.current - e.clientY)
      const dt = Math.max(1, lastT.current - startT.current)
      const velocity = (startY.current - lastY.current) / dt
      const isTap = lift < 10
      const shouldCommit = isTap || lift >= COMMIT_PX || velocity >= COMMIT_VELOCITY

      if (shouldCommit) onCommit()

      pointerId.current = null
      dragging.current = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    },
    [onCommit],
  )

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerId !== pointerId.current) return
    pointerId.current = null
    dragging.current = false
  }, [])

  return {
    homeIndicatorProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel,
    },
  }
}
