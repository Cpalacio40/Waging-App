import { useCallback, useEffect, useRef, useState, type AnimationEvent, type TransitionEvent } from 'react'
import { IosNotification, type IosNotificationPhase } from './components/IosNotification'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenNavigator } from './components/ScreenNavigator'
import { DEFAULT_CAREGIVER_ID } from './data/caregivers'
import { DEFAULT_SCENARIO, type HomeScenarioId } from './data/homeScenarios'
import { SCENARIO_HOLD_MS } from './hooks/useHeldScenario'
import { clearSavedAddress, loadSavedAddress, subscribeAddressChange } from './data/savedAddress'
import {
  DEFAULT_SCREEN,
  activeNavId,
  type NavItem,
  type ScreenId,
  type SearchPhase,
} from './data/screens'
import { AppHomeScreen } from './screens/AppHomeScreen'
import { CaregiverIntroScreen } from './screens/CaregiverIntroScreen'
import { CaregiverSearchScreen } from './screens/CaregiverSearchScreen'
import { IosHomeScreen } from './screens/IosHomeScreen'
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
    id === 'caregiver-calendar'
  )
}

function appViewFromScreen(id: ScreenId): AppViewId {
  if (id === 'caregiver-intro') return 'caregiver-intro'
  if (id === 'caregiver-search' || id === 'caregiver-profile' || id === 'caregiver-calendar') {
    return 'caregiver-search'
  }
  return 'app-home'
}

function searchOverlay(id: ScreenId) {
  if (id === 'caregiver-calendar') return 'calendar' as const
  if (id === 'caregiver-profile') return 'profile' as const
  return 'none' as const
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
  const [scenario, setScenario] = useState<HomeScenarioId>(DEFAULT_SCENARIO)
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
  const layerAnimRef = useRef<LayerAnim>(null)
  const bannerTimerRef = useRef<number | null>(null)
  const pendingStackRef = useRef<AppViewId[] | null>(null)
  layerAnimRef.current = layerAnim

  useEffect(() => subscribeAddressChange(() => setHasSavedAddress(Boolean(loadSavedAddress()))), [])

  const appOpen = isInApp(screen)
  const showHome = screen === 'ios-home' || appOpen
  const canGoHome = appOpen && layerAnim !== 'leave'
  const needsAttention = scenario === 'attention'
  const appView = appViewFromScreen(screen)
  const stackTop = viewStack[viewStack.length - 1] ?? 'app-home'
  const interactiveTop =
    leavingView && viewStack.length > 1
      ? (viewStack[viewStack.length - 2] ?? 'app-home')
      : stackTop

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

  const selectScreen = useCallback(
    (id: ScreenId) => {
      if (id === screen && layerAnim !== 'leave') return

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
      if (item.scenario) setScenario(item.scenario)
      if (item.widgetIndex != null) setWidgetIndex(item.widgetIndex)
      if (item.searchPhase) setSearchPhase(item.searchPhase)
      if (item.caregiverId) setCaregiverId(item.caregiverId)
      selectScreen(item.screen)
    },
    [selectScreen],
  )

  const onWidgetIndexChange = useCallback((index: number) => {
    setWidgetIndex((current) => (current === index ? current : index))
  }, [])

  const toggleAttention = useCallback(() => {
    setScenario((current) => (current === 'attention' ? 'ok' : 'attention'))
  }, [])

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
                        onAgendar={() => {
                          if (loadSavedAddress()) {
                            setSearchBackTo('app-home')
                            setSearchPhase('results')
                            setScreen('caregiver-search')
                            return
                          }
                          setScreen('caregiver-intro')
                        }}
                        onCuidador={() => {
                          setSearchBackTo('app-home')
                          setSearchPhase(loadSavedAddress() ? 'results' : 'map')
                          setScreen('caregiver-search')
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
                      />
                    </div>
                  </div>
                </div>
                <div
                  className={`app-pane app-pane--splash${screen === 'splash' ? ' is-visible' : ''}`}
                  aria-hidden={screen !== 'splash'}
                >
                  <SplashScreen onDone={screen === 'splash' ? finishSplash : undefined} />
                </div>
              </div>
            ) : null}

            {banner !== 'idle' ? (
              <IosNotification phase={banner} onAnimationEnd={onBannerAnimationEnd} />
            ) : null}
          </PhoneFrame>

          <div className="studio__nav-slot">
            <button
              type="button"
              className={`scenario-toggle${needsAttention ? ' is-active' : ''}`}
              aria-pressed={needsAttention}
              onClick={toggleAttention}
            >
              <span className="scenario-toggle__label">
                {needsAttention ? 'Alerta activa' : 'Activar alerta'}
              </span>
              <span className="scenario-toggle__hint">
                {needsAttention ? 'Actividad ≤ 30' : 'Simular inactividad'}
              </span>
            </button>
            <button type="button" className={`scenario-toggle${hasSavedAddress ? ' is-active' : ''}`} onClick={resetAddressCache}>
              <span className="scenario-toggle__label">Reset dirección</span>
              <span className="scenario-toggle__hint">
                {hasSavedAddress
                  ? 'Borrar caché y repetir el onboarding'
                  : 'Sin dirección · volver al intro'}
              </span>
            </button>
            <ScreenNavigator
              activeId={activeNavId({
                screen,
                scenario,
                searchPhase,
                caregiverId,
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
