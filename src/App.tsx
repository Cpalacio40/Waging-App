import { useCallback, useEffect, useRef, useState, type AnimationEvent, type TransitionEvent } from 'react'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { AppTabBar } from './components/AppTabBar'
import { IosNotification, type IosNotificationPhase } from './components/IosNotification'
import { IosStatusBar, type StatusBarTone } from './components/IosStatusBar'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenNavigator } from './components/ScreenNavigator'
import { DEFAULT_CAREGIVER_ID } from './data/caregivers'
import {
  ACTIVITY_WALK_BONUS,
  DEFAULT_ACTIVITY,
  DEMO_ACTIVITY_LOW,
  DEMO_ACTIVITY_OK,
  DEMO_ACTIVITY_WALK_DONE,
  HOME_SCENARIOS,
  clampActivity,
  isLowActivity,
  scenarioFromActivity,
} from './data/homeScenarios'
import {
  loadScheduledOuting,
  saveScheduledOuting,
  type ScheduledOutingState,
} from './data/scheduledOuting'
import { SCENARIO_HOLD_MS } from './hooks/useHeldScenario'
import { clearSavedAddress, loadSavedAddress, subscribeAddressChange } from './data/savedAddress'
import {
  DEFAULT_SCREEN,
  activeNavId,
  type BookingPhase,
  type NavItem,
  type ScreenId,
  type SearchPhase,
} from './data/screens'
import { AppHomeScreen } from './screens/AppHomeScreen'
import {
  BookingSuccessScreen,
  type BookingSuccessDetails,
} from './screens/BookingSuccessScreen'
import { CaregiverIntroScreen } from './screens/CaregiverIntroScreen'
import { CaregiverSearchScreen } from './screens/CaregiverSearchScreen'
import { IosHomeScreen } from './screens/IosHomeScreen'
import { SessionRecapScreen } from './screens/SessionRecapScreen'
import { RestDetailScreen } from './screens/RestDetailScreen'
import { ActivityDetailScreen } from './screens/ActivityDetailScreen'
import { SplashScreen } from './screens/SplashScreen'
import './App.css'
import './screens/screens.css'

const ALERT_BANNER_HOLD_MS = 4000

type LayerAnim = 'enter' | 'leave' | null
type AppViewId = 'app-home' | 'caregiver-intro' | 'caregiver-search'

const APP_VIEW_ORDER: Record<AppViewId, number> = {
  'app-home': 0,
  'caregiver-intro': 1,
  'caregiver-search': 2,
}

function isInApp(id: ScreenId) {
  return (
    id === 'splash' ||
    id === 'app-home' ||
    id === 'caregiver-intro' ||
    id === 'caregiver-search' ||
    id === 'caregiver-profile' ||
    id === 'caregiver-calendar' ||
    id === 'caregiver-pay' ||
    id === 'caregiver-success'
  )
}

/** White icons on SpringBoard / dark screens / Apple Pay overlay; black on light screens. */
function statusBarTone(
  id: ScreenId,
  opts: {
    hasBookingExit: boolean
    applePayActive: boolean
    restDetailOpen?: boolean
    activityDetailOpen?: boolean
  },
): StatusBarTone {
  if (opts.hasBookingExit) return 'light'
  if (opts.applePayActive || id === 'caregiver-pay') return 'dark'
  if (opts.restDetailOpen || opts.activityDetailOpen) return 'light'
  if (id === 'ios-home' || id === 'splash' || id === 'app-home') return 'dark'
  return 'light'
}

function appViewFromScreen(id: ScreenId): AppViewId {
  if (id === 'caregiver-intro') return 'caregiver-intro'
  if (
    id === 'caregiver-search' ||
    id === 'caregiver-profile' ||
    id === 'caregiver-calendar' ||
    id === 'caregiver-pay' ||
    id === 'caregiver-success'
  ) {
    return 'caregiver-search'
  }
  return 'app-home'
}

function searchOverlay(id: ScreenId) {
  if (id === 'caregiver-success') return 'success' as const
  if (id === 'caregiver-pay') return 'pay' as const
  if (id === 'caregiver-calendar') return 'calendar' as const
  if (id === 'caregiver-profile') return 'profile' as const
  return 'none' as const
}

function bookingPhaseFromScreen(id: ScreenId): BookingPhase {
  if (id === 'caregiver-pay') return 'apple-pay'
  if (id === 'caregiver-success') return 'success'
  return 'idle'
}

/** Canonical path from home so a back destination can sit under the leaving top. */
function pathToView(view: AppViewId, stack: AppViewId[] = []): AppViewId[] {
  if (view === 'app-home') return ['app-home']
  if (view === 'caregiver-intro') return ['app-home', 'caregiver-intro']
  if (stack.includes('caregiver-intro') || stack[stack.length - 1] === 'caregiver-intro') {
    return ['app-home', 'caregiver-intro', 'caregiver-search']
  }
  // Opened search from home (Cuidador tab) — skip intro in the path.
  if (stack.includes('caregiver-search') && !stack.includes('caregiver-intro')) {
    return ['app-home', 'caregiver-search']
  }
  return ['app-home', 'caregiver-intro', 'caregiver-search']
}

function stackLayerClass(
  view: AppViewId,
  stack: AppViewId[],
  leavingView: AppViewId | null,
  snapViews: AppViewId[],
) {
  const top = stack[stack.length - 1]
  const inStack = stack.includes(view)
  return [
    'app-screen-stack__layer',
    inStack ? 'is-in-stack' : '',
    view === top && leavingView !== view ? 'is-top' : '',
    leavingView === view ? 'is-leaving' : '',
    snapViews.includes(view) ? 'is-snap' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function App() {
  const [screen, setScreen] = useState<ScreenId>(DEFAULT_SCREEN)
  const [layerAnim, setLayerAnim] = useState<LayerAnim>(null)
  const [activity, setActivity] = useState(DEFAULT_ACTIVITY)
  const [widgetIndex, setWidgetIndex] = useState(0)
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('map')
  const [searchBackTo, setSearchBackTo] = useState<'app-home' | 'caregiver-intro'>('caregiver-intro')
  const [caregiverId, setCaregiverId] = useState(DEFAULT_CAREGIVER_ID)
  const [banner, setBanner] = useState<IosNotificationPhase | 'idle'>('idle')
  const [hasSavedAddress, setHasSavedAddress] = useState(() => Boolean(loadSavedAddress()))
  const [viewStack, setViewStack] = useState<AppViewId[]>(() =>
    pathToView(appViewFromScreen(DEFAULT_SCREEN)),
  )
  const [leavingView, setLeavingView] = useState<AppViewId | null>(null)
  const [snapViews, setSnapViews] = useState<AppViewId[]>([])
  const [bookingExit, setBookingExit] = useState<BookingSuccessDetails | null>(null)
  const [bookingExitVisible, setBookingExitVisible] = useState(false)
  const [bookingExitSnap, setBookingExitSnap] = useState(false)
  /** Apple Pay capture overlay (calendar) — white status icons while the dark scrim is up. */
  const [applePayActive, setApplePayActive] = useState(false)
  /** Low-activity alert minimized to the bell. */
  const [homeAlertDismissed, setHomeAlertDismissed] = useState(false)
  /** “Yo me ocupo” — alert gone for this low-activity episode (no bell). */
  const [homeAlertResolved, setHomeAlertResolved] = useState(false)
  /** Scheduled booking banner on home (after Accept). */
  const [homeBooking, setHomeBooking] = useState<BookingSuccessDetails | null>(
    () => loadScheduledOuting().booking,
  )
  /** Collapsed = compact strip (Figma 349:7465); expanded = full card (349:7708). Calendar badge stays while booking is active. */
  const [homeBookingCollapsed, setHomeBookingCollapsed] = useState(false)
  /** Caregiver name for the post-walk “Sesión terminada” card. */
  const [walkDoneCaregiver, setWalkDoneCaregiver] = useState<string | null>(
    () => loadScheduledOuting().sessionCaregiverName,
  )
  /** Home shows the orange “Sesión terminada” card (Figma 286:3231). */
  const [sessionDone, setSessionDone] = useState(() => {
    const saved = loadScheduledOuting()
    return saved.sessionDone && !saved.sessionCardDismissed
  })
  const [sessionCardDismissed, setSessionCardDismissed] = useState(
    () => loadScheduledOuting().sessionCardDismissed,
  )
  const [sessionRecapOpen, setSessionRecapOpen] = useState(false)
  const [restDetailOpen, setRestDetailOpen] = useState(false)
  const [activityDetailOpen, setActivityDetailOpen] = useState(false)
  const layerAnimRef = useRef<LayerAnim>(null)
  const bannerTimerRef = useRef<number | null>(null)
  const pendingStackRef = useRef<AppViewId[] | null>(null)
  layerAnimRef.current = layerAnim

  useEffect(() => subscribeAddressChange(() => setHasSavedAddress(Boolean(loadSavedAddress()))), [])

  useEffect(() => {
    const next: ScheduledOutingState = {
      booking: homeBooking,
      sessionDone: sessionDone || sessionCardDismissed,
      sessionCaregiverName: walkDoneCaregiver,
      sessionCardDismissed,
    }
    saveScheduledOuting(next)
  }, [homeBooking, sessionDone, sessionCardDismissed, walkDoneCaregiver])

  const scenario = scenarioFromActivity(activity)
  const appOpen = isInApp(screen)
  const showHome = screen === 'ios-home' || appOpen
  const canGoHome = appOpen && layerAnim !== 'leave'
  const needsAttention = isLowActivity(activity)
  const appView = appViewFromScreen(screen)
  const stackTop = viewStack[viewStack.length - 1] ?? 'app-home'
  const interactiveTop =
    leavingView && viewStack.length > 1
      ? (viewStack[viewStack.length - 2] ?? 'app-home')
      : stackTop
  const showAppTabBar =
    !restDetailOpen &&
    !activityDetailOpen &&
    !sessionRecapOpen &&
    (screen === 'app-home' ||
      (screen === 'caregiver-search' &&
        (searchPhase === 'results' || searchPhase === 'loading')))
  const tabBarActive = screen === 'app-home' ? 'hoy' : 'cuidador'

  useEffect(() => {
    if (leavingView) return
    const next = appView
    const top = viewStack[viewStack.length - 1] ?? 'app-home'
    if (next === top) return

    if (APP_VIEW_ORDER[next] > APP_VIEW_ORDER[top]) {
      if (next === 'caregiver-search' && top === 'app-home') {
        setViewStack(['app-home', 'caregiver-search'])
      } else {
        setViewStack((stack) => [...stack.filter((v) => v !== next), next])
      }
      return
    }

    const destinationPath = pathToView(next, viewStack)
    const injected = destinationPath.filter((v) => !viewStack.includes(v))
    const withTop =
      destinationPath[destinationPath.length - 1] === top
        ? destinationPath
        : [...destinationPath.filter((v) => v !== top), top]

    pendingStackRef.current = destinationPath
    if (injected.length > 0) {
      setSnapViews(injected)
      setViewStack(withTop)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSnapViews([])
          setLeavingView(top)
        })
      })
      return
    }

    setViewStack(withTop)
    setLeavingView(top)
  }, [appView, viewStack, leavingView])

  const onStackLayerTransitionEnd = useCallback(
    (view: AppViewId, e: TransitionEvent<HTMLDivElement>) => {
      if (view !== leavingView) return
      if (e.target !== e.currentTarget) return
      if (e.propertyName !== 'transform') return
      const pending = pendingStackRef.current ?? pathToView(appView, viewStack)
      pendingStackRef.current = null
      setViewStack(pending)
      setLeavingView(null)
    },
    [appView, leavingView, viewStack],
  )

  const openApp = useCallback(() => {
    if (appOpen && layerAnim !== 'leave') return
    setScreen('splash')
    setLayerAnim('enter')
  }, [appOpen, layerAnim])

  const closeApp = useCallback(() => {
    if (!appOpen || layerAnim === 'leave') return
    setLayerAnim('leave')
  }, [appOpen, layerAnim])

  const finishSplash = useCallback(() => {
    if (layerAnimRef.current === 'leave') return
    setScreen((current) => (current === 'splash' ? 'app-home' : current))
  }, [])

  const finishBookingToHome = useCallback((details: BookingSuccessDetails) => {
    // Cover stays on top while we snap the stack to home, then fades out (fuaaa).
    // Activity points stay as they were — booking does not reset the collar.
    // Scheduling a caregiver resolves the inactivity alert and shows a booking banner.
    setHomeAlertResolved(true)
    setHomeAlertDismissed(false)
    setHomeBooking(details)
    setHomeBookingCollapsed(false)
    setSessionDone(false)
    setSessionCardDismissed(false)
    setWalkDoneCaregiver(null)
    setSessionRecapOpen(false)
    setRestDetailOpen(false)
    setActivityDetailOpen(false)
    setBookingExit(details)
    setBookingExitSnap(true)
    setBookingExitVisible(true)
    pendingStackRef.current = null
    setLeavingView(null)
    setSnapViews([])
    setViewStack(['app-home'])
    setSearchPhase('results')
    setScreen('app-home')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBookingExitSnap(false)
        setBookingExitVisible(false)
      })
    })
  }, [])

  const onBookingExitFadeEnd = useCallback(() => {
    setBookingExit(null)
    setBookingExitSnap(false)
  }, [])

  const toggleHomeBooking = useCallback(() => {
    if (!homeBooking) return
    setHomeBookingCollapsed((collapsed) => !collapsed)
  }, [homeBooking])

  const expandHomeBooking = useCallback(() => {
    if (!homeBooking) return
    setHomeBookingCollapsed(false)
  }, [homeBooking])

  /** Demo control: finish outing → “Sesión terminada” home card + recap (Figma 3:16). */
  const completeActiveOuting = useCallback(() => {
    if (!homeBooking) return
    setWalkDoneCaregiver(homeBooking.caregiverName)
    setHomeBooking(null)
    setHomeBookingCollapsed(false)
    setHomeAlertResolved(true)
    setHomeAlertDismissed(false)
    setSessionCardDismissed(false)
    setSessionDone(true)
    setSessionRecapOpen(false)
    setRestDetailOpen(false)
    setActivityDetailOpen(false)
    setActivity((current) => clampActivity(current + ACTIVITY_WALK_BONUS))
    setScreen('app-home')
  }, [homeBooking])

  const dismissSessionDoneCard = useCallback(() => {
    setSessionDone(false)
    setSessionCardDismissed(true)
    setSessionRecapOpen(false)
  }, [])

  const openSessionRecap = useCallback(() => {
    setSessionRecapOpen(true)
    setRestDetailOpen(false)
    setActivityDetailOpen(false)
  }, [])

  const closeSessionRecap = useCallback(() => {
    setSessionRecapOpen(false)
    setSessionDone(false)
    setSessionCardDismissed(true)
  }, [])

  const openRestDetail = useCallback(() => {
    setRestDetailOpen(true)
    setActivityDetailOpen(false)
    setSessionRecapOpen(false)
  }, [])

  const closeRestDetail = useCallback(() => {
    setRestDetailOpen(false)
  }, [])

  const openActivityDetail = useCallback(() => {
    setActivityDetailOpen(true)
    setRestDetailOpen(false)
    setSessionRecapOpen(false)
  }, [])

  const closeActivityDetail = useCallback(() => {
    setActivityDetailOpen(false)
  }, [])

  const selectScreen = useCallback(
    (id: ScreenId) => {
      if (id === screen && layerAnim !== 'leave') return
      setRestDetailOpen(false)
      setActivityDetailOpen(false)

      if (id === 'ios-home') {
        if (appOpen) closeApp()
        else setScreen('ios-home')
        return
      }

      if (!appOpen || layerAnim === 'leave') {
        setScreen(id)
        setLayerAnim('enter')
        return
      }

      setScreen(id)
    },
    [appOpen, closeApp, layerAnim, screen],
  )

  const selectNav = useCallback(
    (item: NavItem) => {
      if (item.activity != null) {
        setActivity(item.activity)
        const walkDone = item.activity === DEMO_ACTIVITY_WALK_DONE
        setSessionDone(walkDone)
        setSessionCardDismissed(false)
        setHomeAlertDismissed(false)
        setHomeAlertResolved(walkDone)
        if (walkDone) {
          setHomeBooking(null)
          setWalkDoneCaregiver((current) => current ?? 'María Camila Rodríguez')
        }
      } else if (item.scenario) {
        setActivity(item.scenario === 'attention' ? DEMO_ACTIVITY_LOW : DEMO_ACTIVITY_OK)
        setSessionDone(false)
        setSessionCardDismissed(false)
        // Demo jump to ≤30 shows a fresh alert; jump to normal clears notification state.
        setHomeAlertDismissed(false)
        setHomeAlertResolved(false)
      }
      if (item.widgetIndex != null) setWidgetIndex(item.widgetIndex)
      if (item.searchPhase) setSearchPhase(item.searchPhase)
      if (item.caregiverId) setCaregiverId(item.caregiverId)
      selectScreen(item.screen)
      if (item.activityDetail) {
        setActivityDetailOpen(true)
        setRestDetailOpen(false)
        setSessionRecapOpen(false)
      } else if (item.restDetail) {
        setRestDetailOpen(true)
        setActivityDetailOpen(false)
        setSessionRecapOpen(false)
      } else {
        setActivityDetailOpen(false)
        setRestDetailOpen(false)
        setSessionRecapOpen(false)
      }
    },
    [selectScreen],
  )

  const onWidgetIndexChange = useCallback((index: number) => {
    setWidgetIndex((current) => (current === index ? current : index))
  }, [])

  const toggleActivityLevel = useCallback(() => {
    setActivity((current) => {
      const next = isLowActivity(current) ? DEMO_ACTIVITY_OK : DEMO_ACTIVITY_LOW
      setSessionDone(false)
      setHomeAlertDismissed(false)
      setHomeAlertResolved(false)
      return next
    })
  }, [])

  const minimizeHomeAlert = useCallback(() => {
    setHomeAlertDismissed(true)
  }, [])

  const resolveHomeAlert = useCallback(() => {
    setHomeAlertResolved(true)
    setHomeAlertDismissed(false)
  }, [])

  const restoreHomeAlert = useCallback(() => {
    if (homeAlertResolved) return
    setHomeAlertDismissed(false)
  }, [homeAlertResolved])

  const resetAddressCache = useCallback(() => {
    clearSavedAddress()
    setSearchPhase('map')
    setSearchBackTo('caregiver-intro')
    if (appOpen) setScreen('caregiver-intro')
  }, [appOpen])

  useEffect(() => {
    if (bannerTimerRef.current != null) {
      window.clearTimeout(bannerTimerRef.current)
      bannerTimerRef.current = null
    }

    if (scenario !== 'attention') {
      setBanner((phase) => (phase === 'idle' ? 'idle' : 'out'))
      return
    }

    const appear = () => {
      setBanner('in')
      bannerTimerRef.current = null
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      appear()
      return
    }

    bannerTimerRef.current = window.setTimeout(appear, SCENARIO_HOLD_MS)
  }, [scenario])

  useEffect(
    () => () => {
      if (bannerTimerRef.current != null) window.clearTimeout(bannerTimerRef.current)
    },
    [],
  )

  const onBannerAnimationEnd = useCallback((e: AnimationEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.animationName === 'ios-notification-in') {
      setBanner('hold')
      bannerTimerRef.current = window.setTimeout(() => {
        setBanner('out')
        bannerTimerRef.current = null
      }, ALERT_BANNER_HOLD_MS)
      return
    }
    if (e.animationName === 'ios-notification-out') {
      setBanner('idle')
    }
  }, [])

  const onLayerAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (layerAnim === 'enter') {
        setLayerAnim(null)
        return
      }
      if (layerAnim === 'leave') {
        setRestDetailOpen(false)
        setActivityDetailOpen(false)
        setSessionRecapOpen(false)
        setScreen('ios-home')
        setLayerAnim(null)
      }
    },
    [layerAnim],
  )

  const layerClass =
    layerAnim === 'enter' ? ' is-entering' : layerAnim === 'leave' ? ' is-leaving' : ''

  return (
    <div className="studio">
      <header className="studio__brand">
        <p className="studio__eyebrow">TFM · Camila Palacio</p>
        <h1 className="studio__title">Waging App</h1>
      </header>

      <main className="studio__main">
        <div className="studio__phone-anchor">
          <PhoneFrame canGoHome={canGoHome} onGoHome={closeApp}>
            {showHome ? (
              <IosHomeScreen
                onOpenApp={openApp}
                scenario={scenario}
                widgetIndex={widgetIndex}
                onWidgetIndexChange={onWidgetIndexChange}
              />
            ) : null}

            {appOpen ? (
              <div className={`app-layer${layerClass}`} onAnimationEnd={onLayerAnimationEnd}>
                <div
                  className="app-pane app-pane--home"
                  aria-hidden={screen === 'splash'}
                  inert={screen === 'splash' ? true : undefined}
                >
                  <div className="app-screen-stack">
                    <div
                      className={stackLayerClass('app-home', viewStack, leavingView, snapViews)}
                      aria-hidden={interactiveTop !== 'app-home'}
                      inert={interactiveTop !== 'app-home' ? true : undefined}
                      onTransitionEnd={(e) => onStackLayerTransitionEnd('app-home', e)}
                    >
                      <AppHomeScreen
                        scenario={scenario}
                        activity={activity}
                        sessionDone={sessionDone}
                        sessionCaregiverName={walkDoneCaregiver ?? undefined}
                        onOpenSessionRecap={openSessionRecap}
                        onDismissSessionDone={dismissSessionDoneCard}
                        onOpenRestDetail={openRestDetail}
                        onOpenActivityDetail={openActivityDetail}
                        alertDismissed={homeAlertDismissed}
                        alertResolved={homeAlertResolved}
                        onMinimizeAlert={minimizeHomeAlert}
                        onResolveAlert={resolveHomeAlert}
                        onRestoreAlert={restoreHomeAlert}
                        booking={homeBooking}
                        bookingCollapsed={homeBookingCollapsed}
                        onToggleBooking={toggleHomeBooking}
                        onExpandBooking={expandHomeBooking}
                        onAgendar={() => {
                          if (loadSavedAddress()) {
                            setSearchBackTo('app-home')
                            setSearchPhase('results')
                            setScreen('caregiver-search')
                            return
                          }
                          setScreen('caregiver-intro')
                        }}
                      />
                    </div>
                    <div
                      className={stackLayerClass('caregiver-intro', viewStack, leavingView, snapViews)}
                      aria-hidden={interactiveTop !== 'caregiver-intro'}
                      inert={interactiveTop !== 'caregiver-intro' ? true : undefined}
                      onTransitionEnd={(e) => onStackLayerTransitionEnd('caregiver-intro', e)}
                    >
                      <CaregiverIntroScreen
                        onBack={() => setScreen('app-home')}
                        onContinue={() => {
                          setSearchBackTo('caregiver-intro')
                          setSearchPhase(loadSavedAddress() ? 'results' : 'map')
                          setScreen('caregiver-search')
                        }}
                      />
                    </div>
                    <div
                      className={stackLayerClass('caregiver-search', viewStack, leavingView, snapViews)}
                      aria-hidden={interactiveTop !== 'caregiver-search'}
                      inert={interactiveTop !== 'caregiver-search' ? true : undefined}
                      onTransitionEnd={(e) => onStackLayerTransitionEnd('caregiver-search', e)}
                    >
                      <CaregiverSearchScreen
                        onBack={() =>
                          setScreen(loadSavedAddress() ? 'app-home' : searchBackTo)
                        }
                        phase={searchPhase}
                        overlay={searchOverlay(screen)}
                        bookingPhase={bookingPhaseFromScreen(screen)}
                        caregiverId={caregiverId}
                        onPhaseChange={setSearchPhase}
                        onOpenProfile={(id) => {
                          setCaregiverId(id)
                          setSearchPhase('results')
                          setScreen('caregiver-profile')
                        }}
                        onCloseProfile={() => setScreen('caregiver-search')}
                        onOpenCalendar={() => setScreen('caregiver-calendar')}
                        onCloseCalendar={() => setScreen('caregiver-profile')}
                        onBookingComplete={finishBookingToHome}
                        onApplePayChange={setApplePayActive}
                      />
                    </div>
                  </div>
                  {showAppTabBar ? (
                    <AppTabBar
                      active={tabBarActive}
                      onHoy={() => setScreen('app-home')}
                      onCuidador={() => {
                        if (loadSavedAddress()) {
                          setSearchBackTo('app-home')
                          setSearchPhase('results')
                          setScreen('caregiver-search')
                          return
                        }
                        setScreen('caregiver-intro')
                      }}
                    />
                  ) : null}
                  <SessionRecapScreen
                    open={sessionRecapOpen}
                    onClose={closeSessionRecap}
                    caregiverName={walkDoneCaregiver ?? undefined}
                  />
                  <RestDetailScreen
                    open={restDetailOpen}
                    restScore={HOME_SCENARIOS[scenario].rest}
                    onClose={closeRestDetail}
                  />
                  <ActivityDetailScreen
                    open={activityDetailOpen}
                    activityScore={activity}
                    onClose={closeActivityDetail}
                  />
                </div>
                <div
                  className={`app-pane app-pane--splash${screen === 'splash' ? ' is-visible' : ''}`}
                  aria-hidden={screen !== 'splash'}
                >
                  <SplashScreen onDone={screen === 'splash' ? finishSplash : undefined} />
                </div>
                {bookingExit ? (
                  <div
                    className="app-pane app-pane--booking-exit"
                    aria-hidden={!bookingExitVisible}
                  >
                    <BookingSuccessScreen
                      details={bookingExit}
                      visible={bookingExitVisible}
                      snap={bookingExitSnap}
                      onAccept={() => {}}
                      onFadeOutEnd={onBookingExitFadeEnd}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <IosStatusBar
              tone={statusBarTone(screen, {
                hasBookingExit: Boolean(bookingExit),
                applePayActive,
                restDetailOpen,
                activityDetailOpen,
              })}
            />

            {banner !== 'idle' ? (
              <IosNotification phase={banner} onAnimationEnd={onBannerAnimationEnd} />
            ) : null}
          </PhoneFrame>

          <div className="studio__nav-slot">
            <button
              type="button"
              className={`scenario-toggle${needsAttention ? ' is-active' : ''}`}
              aria-pressed={needsAttention}
              onClick={toggleActivityLevel}
            >
              <span className="scenario-toggle__label">
                {needsAttention ? `Actividad ${DEMO_ACTIVITY_LOW}` : `Actividad ${DEMO_ACTIVITY_OK}`}
              </span>
              <span className="scenario-toggle__hint">
                {needsAttention
                  ? `Cambiar a ${DEMO_ACTIVITY_OK} (día normal)`
                  : `Bajar a ${DEMO_ACTIVITY_LOW} (sale la alerta)`}
              </span>
            </button>
            <button
              type="button"
              className={`scenario-toggle scenario-toggle--with-icon${homeBooking ? ' is-active' : ''}`}
              disabled={!homeBooking}
              onClick={completeActiveOuting}
            >
              <span className="scenario-toggle__copy">
                <span className="scenario-toggle__label">Salida terminada</span>
                <span className="scenario-toggle__hint">
                  {homeBooking ? 'Sesión terminada · ver resumen' : 'Agenda una cita antes'}
                </span>
              </span>
              <CheckCircle2 className="scenario-toggle__icon" size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" className={`scenario-toggle scenario-toggle--with-icon${hasSavedAddress ? ' is-active' : ''}`} onClick={resetAddressCache}>
              <span className="scenario-toggle__copy">
                <span className="scenario-toggle__label">Repetir onboarding</span>
                <span className="scenario-toggle__hint">Empezar de nuevo</span>
              </span>
              <Trash2 className="scenario-toggle__icon" size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <ScreenNavigator
              activeId={activeNavId({
                screen,
                scenario,
                activity,
                searchPhase,
                caregiverId,
                activityDetailOpen,
                restDetailOpen,
              })}
              onSelect={selectNav}
            />
          </div>
        </div>
      </main>

      <footer className="studio__footer">
        <a href="https://cpalacio40.github.io/Waging/" target="_blank" rel="noreferrer">
          Landing
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/Cpalacio40/Waging-App" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <span>Prototipo académico / portfolio</span>
      </footer>
    </div>
  )
}

export default App
