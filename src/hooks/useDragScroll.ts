import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

const DRAG_THRESHOLD_PX = 8

type UseDragScrollOptions = {
  enabled: boolean
  /** Skip starting a drag when the event target matches (buttons, links, …). */
  ignoreSelector?: string
  /** Fires whenever the clamped scroll offset changes (including reset). */
  onOffsetChange?: (offset: number) => void
}

/**
 * Vertical scroll without a native scrollbar: wheel + pointer drag update a translateY offset.
 * Transform is written directly to the content node (no scrollbar, smooth drag).
 */
export function useDragScroll({ enabled, ignoreSelector, onOffsetChange }: UseDragScrollOptions) {
  const ref = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const pointerId = useRef<number | null>(null)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const moved = useRef(false)
  const active = useRef(false)
  const offsetRef = useRef(0)
  const scrolledRef = useRef(false)
  const suppressClickRef = useRef(false)
  const enabledRef = useRef(enabled)
  const onOffsetChangeRef = useRef(onOffsetChange)
  enabledRef.current = enabled
  onOffsetChangeRef.current = onOffsetChange

  const paint = useCallback((value: number) => {
    const content = contentRef.current
    if (!content) return
    if (value === 0) {
      content.style.transform = ''
      return
    }
    content.style.transform = `translate3d(0, ${-value}px, 0)`
  }, [])

  const syncScrolled = useCallback((offset: number) => {
    const next = offset > 0.5
    if (next === scrolledRef.current) return
    scrolledRef.current = next
    setScrolled(next)
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
      syncScrolled(next)
      onOffsetChangeRef.current?.(next)
      return next
    },
    [clampOffset, paint, syncScrolled],
  )

  const resetScroll = useCallback(() => {
    offsetRef.current = 0
    paint(0)
    syncScrolled(0)
    onOffsetChangeRef.current?.(0)
  }, [paint, syncScrolled])

  /**
   * Scroll so `el` (inside the content) is in view.
   * - start: pin element top to the top of the viewport (minus inset)
   * - end: pin element bottom to the bottom of the viewport
   * - nearest: only move if it's clipped
   */
  const scrollToElement = useCallback(
    (
      el: HTMLElement,
      align: 'start' | 'end' | 'nearest' = 'nearest',
      inset = 0,
    ) => {
      const viewport = ref.current
      const content = contentRef.current
      if (!viewport || !content) return

      // offsetTop chain is stable under translate transforms on `content`.
      let elTop = 0
      let node: HTMLElement | null = el
      while (node && node !== content) {
        elTop += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      // Fallback if offsetParent chain left the content (e.g. unexpected CSS).
      if (!node) {
        elTop =
          el.getBoundingClientRect().top -
          content.getBoundingClientRect().top +
          offsetRef.current
      }

      const elBottom = elTop + el.offsetHeight
      const viewH = viewport.clientHeight
      const visibleTop = offsetRef.current
      const visibleBottom = offsetRef.current + viewH
      const topInset = Math.max(0, inset)

      let target = offsetRef.current
      if (align === 'start') {
        target = elTop - topInset
      } else if (align === 'end') {
        target = elBottom - viewH
      } else if (elTop < visibleTop + topInset) {
        target = elTop - topInset
      } else if (elBottom > visibleBottom) {
        target = elBottom - viewH
      } else {
        return
      }

      applyOffset(target)
    },
    [applyOffset],
  )

  const clear = useCallback((el: HTMLDivElement | null, id: number, captured: boolean) => {
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

  /** Call from click handlers: true if the gesture was a drag (skip the click). */
  const consumeClickSuppression = useCallback(() => {
    const blocked = suppressClickRef.current
    suppressClickRef.current = false
    return blocked
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || e.button !== 0) return
      if (ignoreSelector && (e.target as Element).closest?.(ignoreSelector)) return

      pointerId.current = e.pointerId
      active.current = true
      moved.current = false
      startY.current = e.clientY
      startOffset.current = offsetRef.current
      // Don't capture yet — capturing on pointerdown steals clicks from buttons/cards.
    },
    [enabled, ignoreSelector],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!active.current || e.pointerId !== pointerId.current) return

      const dy = e.clientY - startY.current
      if (!moved.current && Math.abs(dy) < DRAG_THRESHOLD_PX) return

      const el = ref.current
      if (!moved.current) {
        moved.current = true
        setDragging(true)
        // Capture only once the gesture is clearly a drag.
        try {
          el?.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }

      applyOffset(startOffset.current - dy)
      e.preventDefault()
    },
    [applyOffset],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId, moved.current)
    },
    [clear],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerId.current) return
      clear(ref.current, e.pointerId, moved.current)
    },
    [clear],
  )

  // Non-passive wheel listener so preventDefault works.
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const onWheel = (e: WheelEvent) => {
      const target = e.target
      if (
        ignoreSelector &&
        target instanceof Element &&
        target.closest(ignoreSelector)
      ) {
        return
      }
      e.preventDefault()
      applyOffset(offsetRef.current + e.deltaY)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyOffset, enabled, ignoreSelector])

  // Freeze scroll position while disabled (e.g. calendar covering the profile).
  // Call resetScroll() explicitly when the view should jump back to top.
  useEffect(() => {
    if (!enabled) {
      if (pointerId.current != null) clear(ref.current, pointerId.current, true)
      return
    }
    applyOffset(offsetRef.current)
  }, [applyOffset, clear, enabled])

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
    /** True once the content has scrolled past the top (for sticky chrome). */
    scrolled,
    consumeClickSuppression,
    resetScroll,
    scrollToElement,
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
