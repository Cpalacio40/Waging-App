import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

const DRAG_THRESHOLD_PX = 6

type UseHorizontalDragScrollOptions = {
  enabled?: boolean
}

/**
 * Mouse/touch drag scrolling for a native overflow-x container.
 * Prefers horizontal when the gesture is mostly sideways (axis lock).
 */
export function useHorizontalDragScroll({ enabled = true }: UseHorizontalDragScrollOptions = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const pointerId = useRef<number | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startScroll = useRef(0)
  const moved = useRef(false)
  const active = useRef(false)
  const suppressClickRef = useRef(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const clear = useCallback((el: HTMLElement | null, id: number, captured: boolean) => {
    suppressClickRef.current = moved.current
    pointerId.current = null
    active.current = false
    moved.current = false
    setDragging(false)
    if (!el || !captured) return
    try {
      el.releasePointerCapture(id)
    } catch {
      /* already released */
    }
  }, [])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!enabledRef.current || e.button !== 0) return
    const target = e.target
    // Keep form fields / links exclusive; play + video can still start a sideways drag.
    if (target instanceof Element && target.closest('a, input, textarea, select')) return
    const el = ref.current
    if (!el) return

    pointerId.current = e.pointerId
    active.current = true
    moved.current = false
    suppressClickRef.current = false
    startX.current = e.clientX
    startY.current = e.clientY
    startScroll.current = el.scrollLeft
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!active.current || e.pointerId !== pointerId.current) return
    const el = ref.current
    if (!el) return

    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    if (!moved.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return
      // On this strip, any clear drag becomes horizontal (vertical is handled elsewhere).
      moved.current = true
      setDragging(true)
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    // Prefer sideways movement; fall back to vertical delta so a "scroll" gesture still pans.
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy
    el.scrollLeft = startScroll.current - delta
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId, moved.current)
    },
    [clear],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId, moved.current)
    },
    [clear],
  )

  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (enabled) return
    clear(ref.current, pointerId.current ?? -1, false)
  }, [enabled, clear])

  // Map wheel / trackpad gestures to horizontal scroll while hovered.
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const onWheel = (e: WheelEvent) => {
      const dominant =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (dominant === 0) return

      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return

      const next = Math.min(max, Math.max(0, el.scrollLeft + dominant))
      if (next === el.scrollLeft) return

      e.preventDefault()
      e.stopPropagation()
      el.scrollLeft = next
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [enabled])

  return {
    ref: ref as RefObject<HTMLUListElement>,
    dragging,
    scrollerProps: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel,
          onClickCapture,
        }
      : {},
  }
}
