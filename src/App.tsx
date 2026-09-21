import { useCallback, useEffect, useRef, useState, type AnimationEvent } from 'react'
import { IosNotification, type IosNotificationPhase } from './components/IosNotification'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenNavigator } from './components/ScreenNavigator'
import { DEFAULT_CAREGIVER_ID } from './data/caregivers'
import { DEFAULT_SCENARIO, type HomeScenarioId } from './data/homeScenarios'
import { SCENARIO_HOLD_MS, useHeldValue } from './hooks/useHeldScenario'
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

function App() {
  const [screen, setScreen] = useState<ScreenId>(DEFAULT_SCREEN)
  const [layerAnim, setLayerAnim] = useState<LayerAnim>(null)
  const [scenario, setScenario] = useState<HomeScenarioId>(DEFAULT_SCENARIO)
  const [widgetIndex, setWidgetIndex] = useState(0)
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle')
  const [searchBackTo, setSearchBackTo] = useState<'app-home' | 'caregiver-intro'>('caregiver-intro')
  const [caregiverId, setCaregiverId] = useState(DEFAULT_CAREGIVER_ID)
  const [banner, setBanner] = useState<IosNotificationPhase | 'idle'>('idle')
  const layerAnimRef = useRef<LayerAnim>(null)
  const bannerTimerRef = useRef<number | null>(null)
  layerAnimRef.current = layerAnim

  const appOpen = isInApp(screen)
  const showHome = screen === 'ios-home' || appOpen
  const canGoHome = appOpen && layerAnim !== 'leave'
  const needsAttention = scenario === 'attention'
  const appView = appViewFromScreen(screen)
  const shownView = useHeldValue(appView)

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
                      className={`app-screen-stack__layer${shownView === 'app-home' ? ' is-visible' : ''}`}
                      aria-hidden={shownView !== 'app-home'}
                      inert={shownView !== 'app-home' ? true : undefined}
                    >
                      <AppHomeScreen
                        scenario={scenario}
                        onAgendar={() => setScreen('caregiver-intro')}
                        onCuidador={() => {
                          setSearchBackTo('app-home')
                          setSearchPhase('idle')
                          setScreen('caregiver-search')
                        }}
                      />
                    </div>
                    <div
                      className={`app-screen-stack__layer${shownView === 'caregiver-intro' ? ' is-visible' : ''}`}
                      aria-hidden={shownView !== 'caregiver-intro'}
                      inert={shownView !== 'caregiver-intro' ? true : undefined}
                    >
                      <CaregiverIntroScreen
                        onBack={() => setScreen('app-home')}
                        onContinue={() => {
                          setSearchBackTo('caregiver-intro')
                          setSearchPhase('idle')
                          setScreen('caregiver-search')
                        }}
                      />
                    </div>
                    <div
                      className={`app-screen-stack__layer${shownView === 'caregiver-search' ? ' is-visible' : ''}`}
                      aria-hidden={shownView !== 'caregiver-search'}
                      inert={shownView !== 'caregiver-search' ? true : undefined}
                    >
                      <CaregiverSearchScreen
                        onBack={() => setScreen(searchBackTo)}
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
