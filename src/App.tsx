import { useCallback, useState } from 'react'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenNavigator } from './components/ScreenNavigator'
import { DEFAULT_SCREEN, type ScreenId } from './data/screens'
import { AppHomeScreen } from './screens/AppHomeScreen'
import { IosHomeScreen } from './screens/IosHomeScreen'
import { SplashScreen } from './screens/SplashScreen'
import './App.css'

function App() {
  const [screen, setScreen] = useState<ScreenId>(DEFAULT_SCREEN)

  const openApp = useCallback(() => {
    setScreen('splash')
  }, [])

  const finishSplash = useCallback(() => {
    setScreen('app-home')
  }, [])

  return (
    <div className="studio">
      <header className="studio__brand">
        <p className="studio__eyebrow">TFM · Camila Palacio</p>
        <h1 className="studio__title">Waging App</h1>
      </header>

      <main className="studio__main">
        <div className="studio__phone-anchor">
          <PhoneFrame>
            {screen === 'ios-home' && <IosHomeScreen onOpenApp={openApp} />}
            {screen === 'splash' && <SplashScreen onDone={finishSplash} />}
            {screen === 'app-home' && <AppHomeScreen />}
          </PhoneFrame>

          <div className="studio__nav-slot">
            <ScreenNavigator active={screen} onSelect={setScreen} />
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
