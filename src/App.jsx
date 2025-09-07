import { useMemo, useState } from 'react'
import { useEffect, useRef } from 'react'
import './App.css'
import Tetris3D from './components/Tetris3D.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'

function App() {
  // Shared settings state for camera, lights, and effects
  const getDefaultSettings = () => ({
    camera: {
      fov: 60,
      distance: 28,
      height: 12,
      targetY: 0,
    },
    lights: {
      ambient: 0.5,
      directional: 0.8,
      dirX: 10,
      dirY: 20,
      dirZ: 10,
    },
    effects: {
      outlineEnabled: false,
      outlineColor: '#666',
      outlineThickness: 0.003,
      edgesEnabled: false,
      edgesColor: '#ffffff',
    },
  })

  const [settings, setSettings] = useState(getDefaultSettings)

  const onChange = (path, value) => {
    setSettings((prev) => {
      const copy = structuredClone(prev)
      const parts = path.split('.')
      let obj = copy
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]]
      obj[parts[parts.length - 1]] = value
      return copy
    })
  }

  const memoSettings = useMemo(() => settings, [settings])
  const [paused, setPaused] = useState(false)
  const gameApiRef = useRef(null)

  const onApi = (api) => {
    gameApiRef.current = api
    api?.setPaused?.(paused)
    if (api) {
      api.onPausedChange = (next) => {
        setPaused((prev) => (prev === next ? prev : next))
      }
    }
  }

  useEffect(() => {
    if (gameApiRef.current) {
      gameApiRef.current.setPaused?.(paused)
    }
  }, [paused])

  const onResetSettings = () => {
    setSettings(getDefaultSettings())
  }

  return (

    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Tetris3D settings={memoSettings} onApi={onApi} />
      <SettingsPanel
        settings={settings}
        onChange={onChange}
        paused={paused}
        onPauseChange={setPaused}
        onReset={onResetSettings}
      />
      {paused && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 32, fontWeight: 800, pointerEvents: 'none',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)'
        }}>
          Paused
        </div>
      )}
    </div>
  )
}

export default App
