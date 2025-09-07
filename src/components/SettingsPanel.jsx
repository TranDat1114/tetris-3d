import { useState } from 'react'

export default function SettingsPanel({ settings, onChange, paused = false, onPauseChange, onReset }) {
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

    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, alignItems: 'center' }
    const section = (title) => <div style={{ fontWeight: 700, margin: '10px 0 4px', gridColumn: '1 / -1' }}>{title}</div>

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
                        <input type="range" min="10" max="60" step="1" value={settings.camera.distance} onChange={(e) => onChange('camera.distance', Number(e.target.value))} />
                        <label>Height</label>
                        <input type="range" min="6" max="40" step="1" value={settings.camera.height} onChange={(e) => onChange('camera.height', Number(e.target.value))} />
                        <label>Target Y</label>
                        <input type="range" min="-5" max="5" step="0.1" value={settings.camera.targetY} onChange={(e) => onChange('camera.targetY', Number(e.target.value))} />

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
                    </div>
                    <div style={{ marginTop: 10, opacity: 0.8 }}>
                        Controls: Left/Right move, Up rotate, Down soft drop, Space hard drop, Enter restart.
                    </div>
                </>
            )}
        </div>
    )
}
