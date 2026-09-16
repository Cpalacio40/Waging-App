import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

const DRAG_THRESHOLD_PX = 4

type UseDragScrollOptions = {
  enabled: boolean
  /** Skip starting a drag when the event target matches (buttons, links, …). */
  ignoreSelector?: string
}

/**
 * Vertical scroll without a native scrollbar: wheel + pointer drag update a translateY offset.
 * Transform is written directly to the content node (no scrollbar, smooth drag).
 */
export function useDragScroll({ enabled, ignoreSelector }: UseDragScrollOptions) {
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const pointerId = useRef<number | null>(null)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const moved = useRef(false)
  const active = useRef(false)
  const offsetRef = useRef(0)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const paint = useCallback((value: number) => {
    const content = contentRef.current
    if (!content) return
    if (!enabledRef.current || value === 0) {
      content.style.transform = ''
      return
    }
    content.style.transform = `translate3d(0, ${-value}px, 0)`
  }, [])

  const clampOffset = useCallback((value: number) => {
    const viewport = ref.current
    const content = contentRef.current
    if (!viewport || !content) return Math.max(0, value)
    const max = Math.max(0, content.scrollHeight - viewport.clientHeight)
    return Math.min(max, Math.max(0, value))
  }, [])

  const applyOffset = useCallback(
    (value: number) => {
      const next = clampOffset(value)
      offsetRef.current = next
      paint(next)
      return next
    },
    [clampOffset, paint],
  )

  const clear = useCallback((el: HTMLDivElement | null, id: number) => {
    pointerId.current = null
    active.current = false
    moved.current = false
    setDragging(false)
    if (!el) return
    try {
      el.releasePointerCapture(id)
    } catch {
      /* already released */
    }
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || e.button !== 0) return
      if (ignoreSelector && (e.target as Element).closest?.(ignoreSelector)) return

      const el = ref.current
      if (!el) return

      pointerId.current = e.pointerId
      active.current = true
      moved.current = false
      startY.current = e.clientY
      startOffset.current = offsetRef.current
      el.setPointerCapture(e.pointerId)
    },
    [enabled, ignoreSelector],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!active.current || e.pointerId !== pointerId.current) return

      const dy = e.clientY - startY.current
      if (!moved.current && Math.abs(dy) < DRAG_THRESHOLD_PX) return

      if (!moved.current) {
        moved.current = true
        setDragging(true)
      }

      applyOffset(startOffset.current - dy)
      e.preventDefault()
    },
    [applyOffset],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId)
    },
    [clear],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId)
    },
    [clear],
  )

  // Non-passive wheel listener so preventDefault works.
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyOffset(offsetRef.current + e.deltaY)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyOffset, enabled])

  // Reset / reclamp when enabling or content size changes.
  useEffect(() => {
    if (!enabled) {
      offsetRef.current = 0
      paint(0)
      if (pointerId.current != null) clear(ref.current, pointerId.current)
      return
    }
    applyOffset(offsetRef.current)
  }, [applyOffset, clear, enabled, paint])

  useEffect(() => {
    if (!enabled) return
    const viewport = ref.current
    const content = contentRef.current
    if (!viewport || !content || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(() => {
      applyOffset(offsetRef.current)
    })
    ro.observe(viewport)
    ro.observe(content)
    return () => ro.disconnect()
  }, [applyOffset, enabled])

  return {
    ref: ref as RefObject<HTMLDivElement>,
    contentRef: contentRef as RefObject<HTMLDivElement>,
    dragging,
    scrollerProps: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel,
        }
      : {},
  }
}
