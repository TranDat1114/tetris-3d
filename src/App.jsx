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
      near: 0.1,
      far: 1000,
      distance: 28,
      height: 12,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      rotX: 0,
      rotZ: 0,
    },
    controls: {
      enableRotate: true,
      enableZoom: true,
      enablePan: false,
      enableDamping: true,
      dampingFactor: 0.08,
      rotateSpeed: 1.0,
      zoomSpeed: 1.0,
      panSpeed: 1.0,
      autoRotate: false,
      autoRotateSpeed: 2.0,
      minDistance: 5,
      maxDistance: 80,
      minPolarAngle: 0.1,
      maxPolarAngle: 3.04,
      minAzimuthAngle: -3.14,
      maxAzimuthAngle: 3.14,
    },
    lights: {
      ambient: 0.5,
      directional: 0.8,
      dirX: 10,
      dirY: 20,
      dirZ: 10,
      celestial: {
        enabled: false,
        kind: 'sun', // 'sun' | 'moon'
        color: '#fff4c1',
        intensity: 1.2,
        radius: 60,
        elevationDeg: 35,
        azimuthDeg: 45,
        autoOrbit: false,
        orbitSpeedDeg: 10, // deg/sec
        castShadow: true,
        showBody: true,
        bodySize: 6,
      },
    },
    effects: {
      outlineEnabled: false,
      outlineColor: '#666666',
      outlineThickness: 0.003,
      edgesEnabled: false,
      edgesColor: '#ffffff',
    },
    colors: {
      tetrominoes: {
        I: '#F8BBD0',
        J: '#A8E6CF',
        L: '#FFF9C4',
        O: '#E1BEE7',
        S: '#B3E5FC',
        T: '#FFDAB9',
        Z: '#CFD8DC',
      },
      borderColor: '#606060',
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

  const onResetGame = () => {
    gameApiRef.current?.resetGame?.()
  }

  const onCameraChange = ({ distance, height, targetY, targetX = 0, targetZ = 0 }) => {
    setSettings((prev) => {
      const eps = 0.01
      const same =
        Math.abs(prev.camera.distance - distance) < eps &&
        Math.abs(prev.camera.height - height) < eps &&
        Math.abs(prev.camera.targetY - targetY) < eps &&
        Math.abs((prev.camera.targetX ?? 0) - targetX) < eps &&
        Math.abs((prev.camera.targetZ ?? 0) - targetZ) < eps
      if (same) return prev
      return {
        ...prev,
        camera: { ...prev.camera, distance, height, targetY, targetX, targetZ },
      }
    })
  }

  return (

    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Tetris3D settings={memoSettings} onApi={onApi} onCameraChange={onCameraChange} />
      <SettingsPanel
        settings={settings}
        onChange={onChange}
        paused={paused}
        onPauseChange={setPaused}
        onReset={onResetSettings}
        onResetGame={onResetGame}
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
