import type { CSSProperties, ReactNode } from 'react'
import { usePagedSwipe } from '../hooks/usePagedSwipe'
import './PagedSwipe.css'

export type PagedSwipeRenderState = {
  index: number
  backdropIndex: number
  dragging: boolean
  canPrev: boolean
  canNext: boolean
  goPrev: () => void
  goNext: () => void
  goTo: (next: number) => void
}

type PagedSwipeProps = {
  pageCount: number
  /** Elements matching this selector won’t start a drag (fixed controls). */
  ignoreSelector?: string
  initialIndex?: number
  className?: string
  style?: CSSProperties | ((state: PagedSwipeRenderState) => CSSProperties)
  /** Fixed overlay (nav buttons, etc.) — does not slide with pages. */
  overlay?: ReactNode | ((state: PagedSwipeRenderState) => ReactNode)
  children: ReactNode
}

/**
 * Reusable linear page strip with pointer drag / swipe, rubber-band edges,
 * and one-page-per-gesture commits with a smooth settle animation.
 */
export function PagedSwipe({
  pageCount,
  ignoreSelector,
  initialIndex,
  className = '',
  style,
  overlay,
  children,
}: PagedSwipeProps) {
  const pager = usePagedSwipe({ pageCount, ignoreSelector, initialIndex })

  const state: PagedSwipeRenderState = {
    index: pager.index,
    backdropIndex: pager.backdropIndex,
    dragging: pager.dragging,
    canPrev: pager.canPrev,
    canNext: pager.canNext,
    goPrev: pager.goPrev,
    goNext: pager.goNext,
    goTo: pager.goTo,
  }

  const resolvedStyle = typeof style === 'function' ? style(state) : style
  const resolvedOverlay = typeof overlay === 'function' ? overlay(state) : overlay
  const dragClass = pager.viewportProps.className

  return (
    <div
      ref={pager.viewportProps.ref}
      className={['paged-swipe', className, dragClass].filter(Boolean).join(' ')}
      style={resolvedStyle}
      onPointerDown={pager.viewportProps.onPointerDown}
      onPointerMove={pager.viewportProps.onPointerMove}
      onPointerUp={pager.viewportProps.onPointerUp}
      onPointerCancel={pager.viewportProps.onPointerCancel}
    >
      <div
        className="paged-swipe__track"
        style={pager.trackProps.style}
        onTransitionEnd={pager.trackProps.onTransitionEnd}
      >
        {children}
      </div>
      {resolvedOverlay}
    </div>
  )
}

type PagedSwipePageProps = {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** One full-width page inside a PagedSwipe track. */
export function PagedSwipePage({ className = '', style, children }: PagedSwipePageProps) {
  return (
    <div className={['paged-swipe__page', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}
