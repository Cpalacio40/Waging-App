import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TransitionEvent,
} from 'react'

/** Distance to commit one page change (one page per gesture). */
const SWIPE_THRESHOLD_PX = 44
/** Max free drag toward the next/prev page (keeps content on-screen). */
const MAX_PAGE_DRAG_PX = 52
/** Hard cap for edge rubber-band stretch (both edges). */
const MAX_RUBBER_PX = 12
const RUBBER_BAND = 0.28

export type PagedSwipeOptions = {
  pageCount: number
  /** CSS selector for elements that should not start a drag (e.g. fixed nav). */
  ignoreSelector?: string
  initialIndex?: number
}

export type PagedSwipeApi = {
  index: number
  /** Index used for backdrop while a page transition settles. */
  backdropIndex: number
  dragging: boolean
  canPrev: boolean
  canNext: boolean
  goPrev: () => void
  goNext: () => void
  goTo: (next: number) => void
  viewportProps: {
    ref: RefObject<HTMLDivElement | null>
    className: string
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerCancel: () => void
  }
  trackProps: {
    style: CSSProperties
    onTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void
  }
}

function rubberBand(overflow: number, dimension: number) {
  const abs = Math.abs(overflow)
  const resisted = (abs * RUBBER_BAND * dimension) / (dimension + abs * RUBBER_BAND)
  const signed = overflow < 0 ? -resisted : resisted
  return Math.max(-MAX_RUBBER_PX, Math.min(MAX_RUBBER_PX, signed))
}

function clampPageDrag(delta: number) {
  return Math.max(-MAX_PAGE_DRAG_PX, Math.min(MAX_PAGE_DRAG_PX, delta))
}

/**
 * Linear horizontal pager: one page per gesture, live drag, capped rubber-band at edges,
 * and smooth settle (no teleport) when the commit threshold is crossed.
 */
export function usePagedSwipe({
  pageCount,
  ignoreSelector,
  initialIndex = 0,
}: PagedSwipeOptions): PagedSwipeApi {
  const [index, setIndex] = useState(initialIndex)
  const [backdropIndex, setBackdropIndex] = useState(initialIndex)
  const [dragPx, setDragPx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const pointerId = useRef<number | null>(null)
  const committedRef = useRef(false)
  const settlingRef = useRef(false)
  const needsRubberBaseRef = useRef(false)
  const indexRef = useRef(index)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const goTo = useCallback(
    (next: number) => {
      setIndex((current) => {
        const clamped = Math.max(0, Math.min(pageCount - 1, next))
        if (clamped === current) return current
        setBackdropIndex(current)
        return clamped
      })
      setDragPx(0)
    },
    [pageCount],
  )

  const goPrev = useCallback(() => {
    goTo(indexRef.current - 1)
  }, [goTo])

  const goNext = useCallback(() => {
    goTo(indexRef.current + 1)
  }, [goTo])

  const commitPageWithTransition = (direction: 'next' | 'prev', currentDrag: number) => {
    const width = viewportRef.current?.offsetWidth ?? 152
    const from = indexRef.current
    const to = direction === 'next' ? from + 1 : from - 1
    if (to < 0 || to >= pageCount) return

    committedRef.current = true
    settlingRef.current = true
    needsRubberBaseRef.current = true
    setBackdropIndex(from)
    setIndex(to)
    setDragPx(direction === 'next' ? currentDrag + width : currentDrag - width)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDragging(false)
        setDragPx(0)
      })
    })
  }

  const finishDrag = () => {
    if (pointerId.current == null) return
    pointerId.current = null
    setDragging(false)
    setDragPx(0)
    committedRef.current = false
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (ignoreSelector && (e.target as HTMLElement).closest(ignoreSelector)) return
    if (settlingRef.current) return

    pointerId.current = e.pointerId
    startX.current = e.clientX
    committedRef.current = false
    needsRubberBaseRef.current = false
    setDragging(true)
    setDragPx(0)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return

    const width = viewportRef.current?.offsetWidth ?? 152
    const raw = e.clientX - startX.current
    const i = indexRef.current
    const atStart = i === 0
    const atEnd = i === pageCount - 1

    if (committedRef.current) {
      if (settlingRef.current) return
      if (needsRubberBaseRef.current) {
        needsRubberBaseRef.current = false
        startX.current = e.clientX
        setDragPx(0)
        return
      }
      setDragging(true)
      setDragPx(rubberBand(raw, width))
      return
    }

    if ((atStart && raw > 0) || (atEnd && raw < 0)) {
      setDragPx(rubberBand(raw, width))
      return
    }

    const capped = clampPageDrag(raw)
    setDragPx(capped)

    if (Math.abs(raw) >= SWIPE_THRESHOLD_PX) {
      startX.current = e.clientX
      commitPageWithTransition(raw < 0 ? 'next' : 'prev', capped)
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    finishDrag()
  }

  const onPointerCancel = () => {
    pointerId.current = null
    committedRef.current = false
    setDragging(false)
    setDragPx(0)
  }

  const onTrackTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    settlingRef.current = false
    setBackdropIndex(index)
  }

  return {
    index,
    backdropIndex,
    dragging,
    canPrev: index > 0,
    canNext: index < pageCount - 1,
    goPrev,
    goNext,
    goTo,
    viewportProps: {
      ref: viewportRef,
      className: dragging ? 'is-dragging' : '',
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    trackProps: {
      style: {
        transform: `translate3d(calc(-${index * 100}% + ${dragPx}px), 0, 0)`,
        transition: dragging ? 'none' : undefined,
      },
      onTransitionEnd: onTrackTransitionEnd,
    },
  }
}
