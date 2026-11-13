import { useEffect, useRef } from 'react'
import { AppShell } from './components/AppShell'
import { Modals } from './components/Modals'

function App() {
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const mathfield = (window as any).MathfieldElement
    if (mathfield && 'soundsDirectory' in mathfield) {
      mathfield.soundsDirectory = null
    }

    void import('./legacy/js/app.js')
  }, [])

  return (
    <div id="legacy-root">
      <AppShell />
      <Modals />
    </div>
  )
}

export default App
