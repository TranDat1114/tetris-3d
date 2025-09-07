import { useState } from 'react'

export default function SettingsPanel({ settings, onChange, paused = false, onPauseChange, onReset, onResetGame }) {
    const [collapsed, setCollapsed] = useState(false)

    const boxStyle = {
        position: 'fixed',
        top: 12,
        right: 12,
        width: collapsed ? 48 : 280,
        maxHeight: '80vh',
        overflow: collapsed ? 'visible' : 'auto',
        padding: collapsed ? 8 : 12,
        background: 'rgba(20,20,24,0.85)',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: 8,
        fontSize: 12,
        zIndex: 10,
        backdropFilter: 'blur(4px)',
    }

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: collapsed ? 0 : 6,
        gap: 8,
    }

    const toggleStyle = {
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid #444',
        background: '#1a1a1a',
        color: '#fff',
        cursor: 'pointer',
    }

    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, alignItems: 'center' }
    const section = (title) => <div style={{ fontWeight: 700, margin: '10px 0 4px', gridColumn: '1 / -1' }}>{title}</div>
    const deg = (rad) => Math.round((rad * 180 / Math.PI) * 100) / 100
    const rad = (degVal) => (degVal * Math.PI) / 180

    return (
        <div style={boxStyle}>
            <div style={headerStyle}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {collapsed ? '' : 'Settings'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {!collapsed && (
                        <button
                            style={toggleStyle}
                            onClick={() => onPauseChange?.(!paused)}
                            title={paused ? 'Resume (Unpause)' : 'Pause game'}
                            aria-label="Pause/Resume"
                        >
                            {paused ? '▶' : '⏸'}
                        </button>
                    )}
                    {!collapsed && (
                        <button
                            style={toggleStyle}
                            onClick={() => {
                                const ok = confirm('Reset game? Current configuration will be applied after reset.')
                                if (ok) onResetGame?.()
                            }}
                            title="Reset current game"
                            aria-label="Reset game"
                        >
                            ⟲
                        </button>
                    )}
                    {!collapsed && (
                        <button
                            style={toggleStyle}
                            onClick={() => onReset?.()}
                            title="Reset to default settings"
                            aria-label="Reset settings"
                        >
                            ↺
                        </button>
                    )}
                    <button
                        style={toggleStyle}
                        onClick={() => setCollapsed((v) => !v)}
                        title={collapsed ? 'Expand settings' : 'Collapse settings'}
                        aria-label="Toggle settings panel"
                    >
                        {collapsed ? '⚙' : '–'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <>
                    <div style={gridStyle}>
                        {section('Camera')}
                        <label>FOV</label>
                        <input type="range" min="30" max="100" step="1" value={settings.camera.fov} onChange={(e) => onChange('camera.fov', Number(e.target.value))} />
                        <label>Distance</label>
                        <input type="range" min="5" max="100" step="1" value={settings.camera.distance} onChange={(e) => onChange('camera.distance', Number(e.target.value))} />
                        <label>Height</label>
                        <input type="range" min="0" max="60" step="1" value={settings.camera.height} onChange={(e) => onChange('camera.height', Number(e.target.value))} />
                        <label>Target X</label>
                        <input type="range" min="-10" max="10" step="0.1" value={settings.camera.targetX ?? 0} onChange={(e) => onChange('camera.targetX', Number(e.target.value))} />
                        <label>Target Y</label>
                        <input type="range" min="-5" max="15" step="0.1" value={settings.camera.targetY} onChange={(e) => onChange('camera.targetY', Number(e.target.value))} />
                        <label>Target Z</label>
                        <input type="range" min="-10" max="10" step="0.1" value={settings.camera.targetZ ?? 0} onChange={(e) => onChange('camera.targetZ', Number(e.target.value))} />
                        <label>Rotate X</label>
                        <input type="range" min="-3.14" max="3.14" step="0.01" value={settings.camera.rotX ?? 0} onChange={(e) => onChange('camera.rotX', Number(e.target.value))} />
                        <label>Rotate Z</label>
                        <input type="range" min="-3.14" max="3.14" step="0.01" value={settings.camera.rotZ ?? 0} onChange={(e) => onChange('camera.rotZ', Number(e.target.value))} />
                        <label>Near</label>
                        <input type="range" min="0.01" max="5" step="0.01" value={settings.camera.near ?? 0.1} onChange={(e) => onChange('camera.near', Number(e.target.value))} />
                        <label>Far</label>
                        <input type="range" min="100" max="2000" step="10" value={settings.camera.far ?? 1000} onChange={(e) => onChange('camera.far', Number(e.target.value))} />

                        {section('Controls (Orbit)')}
                        <label>Enable Rotate</label>
                        <input type="checkbox" checked={settings.controls?.enableRotate ?? true} onChange={(e) => onChange('controls.enableRotate', e.target.checked)} />
                        <label>Enable Zoom</label>
                        <input type="checkbox" checked={settings.controls?.enableZoom ?? true} onChange={(e) => onChange('controls.enableZoom', e.target.checked)} />
                        <label>Enable Pan</label>
                        <input type="checkbox" checked={settings.controls?.enablePan ?? false} onChange={(e) => onChange('controls.enablePan', e.target.checked)} />
                        <label>Enable Damping</label>
                        <input type="checkbox" checked={settings.controls?.enableDamping ?? true} onChange={(e) => onChange('controls.enableDamping', e.target.checked)} />
                        <label>Damping Factor</label>
                        <input type="range" min="0" max="0.2" step="0.005" value={settings.controls?.dampingFactor ?? 0.08} onChange={(e) => onChange('controls.dampingFactor', Number(e.target.value))} />
                        <label>Rotate Speed</label>
                        <input type="range" min="0.1" max="5" step="0.1" value={settings.controls?.rotateSpeed ?? 1} onChange={(e) => onChange('controls.rotateSpeed', Number(e.target.value))} />
                        <label>Zoom Speed</label>
                        <input type="range" min="0.1" max="5" step="0.1" value={settings.controls?.zoomSpeed ?? 1} onChange={(e) => onChange('controls.zoomSpeed', Number(e.target.value))} />
                        <label>Pan Speed</label>
                        <input type="range" min="0.1" max="5" step="0.1" value={settings.controls?.panSpeed ?? 1} onChange={(e) => onChange('controls.panSpeed', Number(e.target.value))} />
                        <label>Auto Rotate</label>
                        <input type="checkbox" checked={settings.controls?.autoRotate ?? false} onChange={(e) => onChange('controls.autoRotate', e.target.checked)} />
                        <label>Auto Rotate Speed</label>
                        <input type="range" min="-10" max="10" step="0.1" value={settings.controls?.autoRotateSpeed ?? 2} onChange={(e) => onChange('controls.autoRotateSpeed', Number(e.target.value))} />
                        <label>Min Distance</label>
                        <input type="range" min="1" max="200" step="1" value={settings.controls?.minDistance ?? 5} onChange={(e) => onChange('controls.minDistance', Number(e.target.value))} />
                        <label>Max Distance</label>
                        <input type="range" min="5" max="400" step="1" value={settings.controls?.maxDistance ?? 80} onChange={(e) => onChange('controls.maxDistance', Number(e.target.value))} />
                        <label>Min Polar (deg)</label>
                        <input type="range" min="0" max="179" step="1" value={deg(settings.controls?.minPolarAngle ?? 0.1)} onChange={(e) => onChange('controls.minPolarAngle', rad(Number(e.target.value)))} />
                        <label>Max Polar (deg)</label>
                        <input type="range" min="1" max="180" step="1" value={deg(settings.controls?.maxPolarAngle ?? 3.04)} onChange={(e) => onChange('controls.maxPolarAngle', rad(Number(e.target.value)))} />
                        <label>Min Azimuth (deg)</label>
                        <input type="range" min="-180" max="0" step="1" value={deg(settings.controls?.minAzimuthAngle ?? -Math.PI)} onChange={(e) => onChange('controls.minAzimuthAngle', rad(Number(e.target.value)))} />
                        <label>Max Azimuth (deg)</label>
                        <input type="range" min="0" max="180" step="1" value={deg(settings.controls?.maxAzimuthAngle ?? Math.PI)} onChange={(e) => onChange('controls.maxAzimuthAngle', rad(Number(e.target.value)))} />

                        {section('Lights')}
                        <label>Ambient</label>
                        <input type="range" min="0" max="2" step="0.05" value={settings.lights.ambient} onChange={(e) => onChange('lights.ambient', Number(e.target.value))} />
                        <label>Directional</label>
                        <input type="range" min="0" max="3" step="0.05" value={settings.lights.directional} onChange={(e) => onChange('lights.directional', Number(e.target.value))} />
                        <label>Dir X</label>
                        <input type="range" min="-40" max="40" step="1" value={settings.lights.dirX} onChange={(e) => onChange('lights.dirX', Number(e.target.value))} />
                        <label>Dir Y</label>
                        <input type="range" min="0" max="60" step="1" value={settings.lights.dirY} onChange={(e) => onChange('lights.dirY', Number(e.target.value))} />
                        <label>Dir Z</label>
                        <input type="range" min="-40" max="40" step="1" value={settings.lights.dirZ} onChange={(e) => onChange('lights.dirZ', Number(e.target.value))} />

                        {section('Sun/Moon (Orbit)')}
                        <label>Enabled</label>
                        <input type="checkbox" checked={settings.lights?.celestial?.enabled ?? false} onChange={(e) => onChange('lights.celestial.enabled', e.target.checked)} />
                        <label>Kind</label>
                        <select value={settings.lights?.celestial?.kind ?? 'sun'} onChange={(e) => onChange('lights.celestial.kind', e.target.value)}>
                            <option value="sun">Sun</option>
                            <option value="moon">Moon</option>
                        </select>
                        <label>Color</label>
                        <input type="color" value={settings.lights?.celestial?.color ?? '#fff4c1'} onChange={(e) => onChange('lights.celestial.color', e.target.value)} />
                        <label>Intensity</label>
                        <input type="range" min="0" max="3" step="0.05" value={settings.lights?.celestial?.intensity ?? 1.2} onChange={(e) => onChange('lights.celestial.intensity', Number(e.target.value))} />
                        <label>Radius</label>
                        <input type="range" min="10" max="200" step="1" value={settings.lights?.celestial?.radius ?? 60} onChange={(e) => onChange('lights.celestial.radius', Number(e.target.value))} />
                        <label>Elevation (deg)</label>
                        <input type="range" min="-10" max="89" step="1" value={settings.lights?.celestial?.elevationDeg ?? 35} onChange={(e) => onChange('lights.celestial.elevationDeg', Number(e.target.value))} />
                        <label>Azimuth (deg)</label>
                        <input type="range" min="-180" max="180" step="1" value={settings.lights?.celestial?.azimuthDeg ?? 45} onChange={(e) => onChange('lights.celestial.azimuthDeg', Number(e.target.value))} />
                        <label>Auto Orbit</label>
                        <input type="checkbox" checked={settings.lights?.celestial?.autoOrbit ?? false} onChange={(e) => onChange('lights.celestial.autoOrbit', e.target.checked)} />
                        <label>Orbit Speed (deg/s)</label>
                        <input type="range" min="-90" max="90" step="1" value={settings.lights?.celestial?.orbitSpeedDeg ?? 10} onChange={(e) => onChange('lights.celestial.orbitSpeedDeg', Number(e.target.value))} />
                        <label>Cast Shadow</label>
                        <input type="checkbox" checked={settings.lights?.celestial?.castShadow ?? true} onChange={(e) => onChange('lights.celestial.castShadow', e.target.checked)} />
                        <label>Show Body</label>
                        <input type="checkbox" checked={settings.lights?.celestial?.showBody ?? true} onChange={(e) => onChange('lights.celestial.showBody', e.target.checked)} />
                        <label>Body Size</label>
                        <input type="range" min="0.5" max="20" step="0.5" value={settings.lights?.celestial?.bodySize ?? 6} onChange={(e) => onChange('lights.celestial.bodySize', Number(e.target.value))} />

                        {section('Effects')}
                        <label>Outline</label>
                        <input type="checkbox" checked={settings.effects.outlineEnabled} onChange={(e) => onChange('effects.outlineEnabled', e.target.checked)} />
                        <label>Outline Color</label>
                        <input type="color" value={settings.effects.outlineColor} onChange={(e) => onChange('effects.outlineColor', e.target.value)} />
                        <label>Thickness</label>
                        <input type="range" min="0.001" max="0.02" step="0.001" value={settings.effects.outlineThickness} onChange={(e) => onChange('effects.outlineThickness', Number(e.target.value))} />
                        <label>Edges</label>
                        <input type="checkbox" checked={settings.effects.edgesEnabled} onChange={(e) => onChange('effects.edgesEnabled', e.target.checked)} />
                        <label>Edges Color</label>
                        <input type="color" value={settings.effects.edgesColor} onChange={(e) => onChange('effects.edgesColor', e.target.value)} />
                        {section('Colors')}
                        <label>Border</label>
                        <input type="color" value={settings.colors?.borderColor ?? '#606060'} onChange={(e) => onChange('colors.borderColor', e.target.value)} />
                        <label>I</label>
                        <input type="color" value={settings.colors?.tetrominoes?.I ?? '#F8BBD0'} onChange={(e) => onChange('colors.tetrominoes.I', e.target.value)} />
                        <label>J</label>
                        <input type="color" value={settings.colors?.tetrominoes?.J ?? '#A8E6CF'} onChange={(e) => onChange('colors.tetrominoes.J', e.target.value)} />
                        <label>L</label>
                        <input type="color" value={settings.colors?.tetrominoes?.L ?? '#FFF9C4'} onChange={(e) => onChange('colors.tetrominoes.L', e.target.value)} />
                        <label>O</label>
                        <input type="color" value={settings.colors?.tetrominoes?.O ?? '#E1BEE7'} onChange={(e) => onChange('colors.tetrominoes.O', e.target.value)} />
                        <label>S</label>
                        <input type="color" value={settings.colors?.tetrominoes?.S ?? '#B3E5FC'} onChange={(e) => onChange('colors.tetrominoes.S', e.target.value)} />
                        <label>T</label>
                        <input type="color" value={settings.colors?.tetrominoes?.T ?? '#FFDAB9'} onChange={(e) => onChange('colors.tetrominoes.T', e.target.value)} />
                        <label>Z</label>
                        <input type="color" value={settings.colors?.tetrominoes?.Z ?? '#CFD8DC'} onChange={(e) => onChange('colors.tetrominoes.Z', e.target.value)} />
                    </div>
                    <div style={{ marginTop: 10, opacity: 0.8 }}>
                        Controls: Left/Right move, Up rotate, Down soft drop, Space hard drop, R restart, P pause.
                    </div>
                </>
            )}
        </div>
    )
}
