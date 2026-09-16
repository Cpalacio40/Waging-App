import { useCallback, useRef, useState, type AnimationEvent } from 'react'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenNavigator } from './components/ScreenNavigator'
import { DEFAULT_SCENARIO, type HomeScenarioId } from './data/homeScenarios'
import { DEFAULT_SCREEN, type ScreenId } from './data/screens'
import { AppHomeScreen } from './screens/AppHomeScreen'
import { IosHomeScreen } from './screens/IosHomeScreen'
import { SplashScreen } from './screens/SplashScreen'
import './App.css'

type LayerAnim = 'enter' | 'leave' | null

function isInApp(id: ScreenId) {
  return id === 'splash' || id === 'app-home'
}

function App() {
  const [screen, setScreen] = useState<ScreenId>(DEFAULT_SCREEN)
  const [layerAnim, setLayerAnim] = useState<LayerAnim>(null)
  const [scenario, setScenario] = useState<HomeScenarioId>(DEFAULT_SCENARIO)
  const layerAnimRef = useRef<LayerAnim>(null)
  layerAnimRef.current = layerAnim

  const appOpen = isInApp(screen)
  const showHome = screen === 'ios-home' || appOpen
  const canGoHome = appOpen && layerAnim !== 'leave'
  const needsAttention = scenario === 'attention'

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

  const toggleAttention = useCallback(() => {
    setScenario((current) => (current === 'attention' ? 'ok' : 'attention'))
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
            {showHome ? <IosHomeScreen onOpenApp={openApp} scenario={scenario} /> : null}

            {appOpen ? (
              <div className={`app-layer${layerClass}`} onAnimationEnd={onLayerAnimationEnd}>
                {screen === 'splash' ? <SplashScreen onDone={finishSplash} /> : null}
                {screen === 'app-home' ? <AppHomeScreen scenario={scenario} /> : null}
              </div>
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
            <ScreenNavigator active={screen} onSelect={selectScreen} />
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
