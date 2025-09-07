import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

// Board size
const COLS = 10
const ROWS = 20
const CELL_SIZE = 1
const GAP = 0.05
const STEP = CELL_SIZE + GAP

const COLORS = {
    I: 0xF8BBD0,
    J: 0xA8E6CF,
    L: 0xFFF9C4,
    O: 0xE1BEE7,
    S: 0xB3E5FC,
    T: 0xFFDAB9,
    Z: 0xCFD8DC,
}

const TETROMINOES = {
    I: {
        rotations: [
            [[0, 1], [1, 1], [2, 1], [3, 1]],
            [[2, 0], [2, 1], [2, 2], [2, 3]],
        ],
    },
    J: {
        rotations: [
            [[0, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [2, 2]],
            [[1, 0], [1, 1], [0, 2], [1, 2]],
        ],
    },
    L: {
        rotations: [
            [[2, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [1, 2], [2, 2]],
            [[0, 1], [1, 1], [2, 1], [0, 2]],
            [[0, 0], [1, 0], [1, 1], [1, 2]],
        ],
    },
    O: {
        rotations: [
            [[1, 0], [2, 0], [1, 1], [2, 1]],
        ],
    },
    S: {
        rotations: [
            [[1, 1], [2, 1], [0, 2], [1, 2]],
            [[1, 0], [1, 1], [2, 1], [2, 2]],
        ],
    },
    T: {
        rotations: [
            [[1, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [1, 2]],
            [[1, 0], [0, 1], [1, 1], [1, 2]],
        ],
    },
    Z: {
        rotations: [
            [[0, 1], [1, 1], [1, 2], [2, 2]],
            [[2, 0], [1, 1], [2, 1], [1, 2]],
        ],
    },
}

export default function Tetris3D({ settings, onApi, onCameraChange }) {
    const mountRef = useRef(null)
    // UI overlays state (React-driven)
    const [gameOverUI, setGameOverUI] = useState(false)
    const settingsRef = useRef(settings)
    // const currentTypeRef = useRef(null)
    const cameraRef = useRef(null)
    const rendererRef = useRef(null)
    const controlsRef = useRef(null)
    const rebuildBoardMeshesRef = useRef(null)
    const buildBorderMeshesRef = useRef(null)
    const drawActiveRef = useRef(null)
    const ambRef = useRef(null)
    const dirLightRef = useRef(null)
    const celestialLightRef = useRef(null)
    const lastTimeRef = useRef(performance.now())
    const composerRef = useRef(null)
    const outlinePassRef = useRef(null)
    const fxaaPassRef = useRef(null)
    const worldGroupRef = useRef(null)
    const boardGroupRef = useRef(null)
    const activeGroupRef = useRef(null)
    const borderGroupRef = useRef(null)
    const edgesActiveGroupRef = useRef(null)
    const edgesBoardGroupRef = useRef(null)
    const edgesBorderGroupRef = useRef(null)
    const lastCamEmitRef = useRef({ distance: null, height: null, targetY: null, targetX: null, targetZ: null })
    const celestialBodyRef = useRef(null)
    const celestialAzimuthRef = useRef(0)
    const celestialAzimuthSettingRef = useRef(null)

    useEffect(() => {
        // Scene, camera, renderer
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x101012)

        const camera = new THREE.PerspectiveCamera(
            settings.camera.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        )
        camera.position.set(0, settings.camera.height, settings.camera.distance)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true
        renderer.domElement.style.position = 'fixed'
        renderer.domElement.style.top = '0'
        renderer.domElement.style.left = '0'
        renderer.domElement.style.zIndex = '0'
        mountRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.target.set(0, settings.camera.targetY, 0)
        controlsRef.current = controls

        // Emit camera changes back to parent settings when user interacts
        const emitCameraChange = () => {
            if (!onCameraChange) return
            const cam = cameraRef.current
            const ctr = controlsRef.current
            if (!cam || !ctr) return
            const tgt = ctr.target
            const dx = cam.position.x - tgt.x
            const dz = cam.position.z - tgt.z
            const distance = Math.sqrt(dx * dx + dz * dz)
            const height = cam.position.y
            const targetY = tgt.y
            const targetX = tgt.x
            const targetZ = tgt.z
            const prev = lastCamEmitRef.current
            const eps = 0.01
            const changed =
                (prev.distance === null || Math.abs(prev.distance - distance) > eps) ||
                (prev.height === null || Math.abs(prev.height - height) > eps) ||
                (prev.targetY === null || Math.abs(prev.targetY - targetY) > eps) ||
                (prev.targetX === null || Math.abs(prev.targetX - targetX) > eps) ||
                (prev.targetZ === null || Math.abs(prev.targetZ - targetZ) > eps)
            const differsFromSettings =
                Math.abs(settingsRef.current.camera.distance - distance) > eps ||
                Math.abs(settingsRef.current.camera.height - height) > eps ||
                Math.abs(settingsRef.current.camera.targetY - targetY) > eps ||
                Math.abs((settingsRef.current.camera.targetX ?? 0) - targetX) > eps ||
                Math.abs((settingsRef.current.camera.targetZ ?? 0) - targetZ) > eps
            if (changed && differsFromSettings) {
                lastCamEmitRef.current = { distance, height, targetY, targetX, targetZ }
                onCameraChange({ distance, height, targetY, targetX, targetZ })
            }
        }
        controls.addEventListener('change', emitCameraChange)

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, settings.lights.ambient)
        scene.add(amb)
        const dirLight = new THREE.DirectionalLight(0xffffff, settings.lights.directional)
        dirLight.position.set(settings.lights.dirX, settings.lights.dirY, settings.lights.dirZ)
        dirLight.castShadow = true
        scene.add(dirLight)
        ambRef.current = amb
        dirLightRef.current = dirLight

        // Celestial light (sun/moon)
        const celestial = new THREE.DirectionalLight(0xffffff, 0)
        celestial.castShadow = true
        scene.add(celestial)
        celestialLightRef.current = celestial
        // Visible celestial body (sphere)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x000000, roughness: 0.8, metalness: 0.0 })
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 16),
            bodyMat
        )
        body.visible = false
        celestialBodyRef.current = body

        // Root world group to allow rotating the entire playfield
        const worldGroup = new THREE.Group()
        scene.add(worldGroup)
        worldGroupRef.current = worldGroup
        // Attach celestial body once world group exists
        if (celestialBodyRef.current) worldGroup.add(celestialBodyRef.current)
        // Initialize celestial azimuth from settings
        if (settings.lights?.celestial) {
            const initialAz = settings.lights.celestial.azimuthDeg ?? 0
            celestialAzimuthRef.current = initialAz
            celestialAzimuthSettingRef.current = initialAz
        }

        // Grid helper for reference (under world group so it rotates with playfield)
        const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222)
        grid.position.y = -((ROWS / 2) + 1) * STEP
        worldGroup.add(grid)

        // Groups
        const boardGroup = new THREE.Group()
        const activeGroup = new THREE.Group()
        worldGroup.add(boardGroup)
        worldGroup.add(activeGroup)
        boardGroupRef.current = boardGroup
        activeGroupRef.current = activeGroup

        // Geometry reuse
        const cubeGeom = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE)

        // Optional outline/edges setup
        const composer = new EffectComposer(renderer)
        const renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass)
        const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
        outlinePass.edgeStrength = 3.0
        outlinePass.edgeGlow = 0.0
        outlinePass.edgeThickness = Math.max(0.001, settings.effects.outlineThickness)
        outlinePass.pulsePeriod = 0
        outlinePass.visibleEdgeColor.set(settings.effects.outlineColor)
        outlinePass.hiddenEdgeColor.set('#000000')
        outlinePass.enabled = !!settings.effects.outlineEnabled
        composer.addPass(outlinePass)

        const fxaaPass = new ShaderPass(FXAAShader)
        const pixelRatio = renderer.getPixelRatio()
        fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio))
        fxaaPass.enabled = !!settings.effects.outlineEnabled
        composer.addPass(fxaaPass)
        composerRef.current = composer
        outlinePassRef.current = outlinePass
        fxaaPassRef.current = fxaaPass

        // Edges toggle via EdgesGeometry overlays (separate groups)
        const edgesActiveGroup = new THREE.Group()
        const edgesBoardGroup = new THREE.Group()
        const edgesBorderGroup = new THREE.Group()
        worldGroup.add(edgesActiveGroup)
        worldGroup.add(edgesBoardGroup)
        worldGroup.add(edgesBorderGroup)
        edgesActiveGroupRef.current = edgesActiveGroup
        edgesBoardGroupRef.current = edgesBoardGroup
        edgesBorderGroupRef.current = edgesBorderGroup

        // Border made of cubes surrounding the playfield limits
        const borderGroup = new THREE.Group()
        worldGroup.add(borderGroup)
        borderGroupRef.current = borderGroup
        function buildBorderMeshes() {
            borderGroup.clear()
            const borderColor = settingsRef.current?.colors?.borderColor || '#606060'
            const borderMat = new THREE.MeshStandardMaterial({ color: borderColor, roughness: 0.85, metalness: 0.0 })
            const addCubeAt = (x, y) => {
                const mesh = new THREE.Mesh(cubeGeom, borderMat)
                mesh.position.copy(cellToWorld(x, y))
                mesh.castShadow = true
                mesh.receiveShadow = true
                borderGroup.add(mesh)
                if (settingsRef.current.effects.edgesEnabled) {
                    const edges = new THREE.LineSegments(
                        new THREE.EdgesGeometry(mesh.geometry),
                        new THREE.LineBasicMaterial({ color: settingsRef.current.effects.edgesColor }),
                    )
                    edges.position.copy(mesh.position)
                    edges.rotation.copy(mesh.rotation)
                    edges.scale.copy(mesh.scale)
                    edgesBorderGroup.add(edges)
                }
            }
            // Bottom and Top rows
            for (let x = -1; x <= COLS; x++) {
                addCubeAt(x, -1)
                addCubeAt(x, ROWS)
            }
            // Left and Right columns
            for (let y = 0; y < ROWS; y++) {
                addCubeAt(-1, y)
                addCubeAt(COLS, y)
            }
        }
        buildBorderMeshes()
        buildBorderMeshesRef.current = buildBorderMeshes

        // Board state
        let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
        let current = null
        let gravityMs = 800
        let lastStep = performance.now()
        let running = true
        let paused = false
        let rafId = 0
        let softDrop = false
        let gameOver = false

        function cellToWorld(x, y) {
            const wx = (x - COLS / 2 + 0.5) * STEP
            const wy = (y - ROWS / 2 + 0.5) * STEP
            return new THREE.Vector3(wx, wy, 0)
        }

        function eachCells(piece = current, callback) {
            const def = TETROMINOES[piece.type]
            const shape = def.rotations[piece.rotIndex % def.rotations.length]
            for (const [cx, cy] of shape) {
                const x = piece.pos.x + cx
                const y = piece.pos.y + cy
                callback(x, y)
            }
        }

        function canPlace(next) {
            let ok = true
            eachCells(next, (x, y) => {
                if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                    ok = false
                    return
                }
                if (board[y][x]) ok = false
            })
            return ok
        }

        function getTetrominoColor(type) {
            const cfg = settingsRef.current?.colors?.tetrominoes
            if (cfg && cfg[type]) return cfg[type]
            // fallback to static COLORS if defined
            if (COLORS && Object.prototype.hasOwnProperty.call(COLORS, type)) return COLORS[type]
            return '#ffffff'
        }

        function spawn() {
            const keys = Object.keys(TETROMINOES)
            const type = keys[Math.floor(Math.random() * keys.length)]
            const rotIndex = 0
            const shape = TETROMINOES[type].rotations[rotIndex]
            // Compute shape bounds to center horizontally and place top at top row
            let minCx = Infinity, maxCx = -Infinity, maxCy = -Infinity
            for (const [cx, cy] of shape) {
                if (cx < minCx) minCx = cx
                if (cx > maxCx) maxCx = cx
                if (cy > maxCy) maxCy = cy
            }
            const width = (maxCx - minCx + 1)
            const spawnX = Math.floor((COLS - width) / 2) - minCx
            const spawnY = (ROWS - 1) - maxCy
            current = { type, rotIndex, pos: { x: spawnX, y: spawnY } }
            console.log('[Spawn] type:', type, 'rotIndex:', rotIndex, 'spawn pos:', current.pos)

            if (!canPlace(current)) {
                // Cannot place a new piece: game over
                gameOver = true
                current = null
                // Diagnose which cells failed
                const cells = shape.map(([cx, cy]) => ({ x: spawnX + cx, y: spawnY + cy }))
                const reasons = cells.map(({ x, y }) => {
                    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return { x, y, reason: 'out-of-bounds' }
                    if (board[y][x]) return { x, y, reason: 'occupied' }
                    return { x, y, reason: 'ok' }
                })
                console.warn('[GameOver] Spawn blocked. Cells:', reasons)
                setGameOverUI(true)
                return
            }
            drawActive()
        }

        function makeCube(color, x, y) {
            const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
            const mesh = new THREE.Mesh(cubeGeom, material)
            mesh.position.copy(cellToWorld(x, y))
            mesh.castShadow = true
            mesh.receiveShadow = true
            return mesh
        }

        function addEdgesForActive(mesh, color = '#ffffff') {
            const edges = new THREE.LineSegments(
                new THREE.EdgesGeometry(mesh.geometry),
                new THREE.LineBasicMaterial({ color }),
            )
            edges.position.copy(mesh.position)
            edges.rotation.copy(mesh.rotation)
            edges.scale.copy(mesh.scale)
            edgesActiveGroup.add(edges)
            return edges
        }

        function drawActive() {
            activeGroup.clear()
            edgesActiveGroup.clear()
            // If no current piece (e.g., at game over or between spawns), clear outline and exit
            if (!current) {
                if (outlinePass) outlinePass.selectedObjects = []
                return
            }
            const color = getTetrominoColor(current.type)
            const selectedObjects = []
            eachCells(current, (x, y) => {
                const mesh = makeCube(color, x, y)
                activeGroup.add(mesh)
                selectedObjects.push(mesh)
                if (settingsRef.current.effects.edgesEnabled) addEdgesForActive(mesh, settingsRef.current.effects.edgesColor)
            })
            if (outlinePass) outlinePass.selectedObjects = selectedObjects
        }
        drawActiveRef.current = drawActive

        function rebuildBoardMeshes() {
            boardGroup.clear()
            edgesBoardGroup.clear()
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const cell = board[y][x]
                    if (!cell) continue
                    const color = cell.type ? getTetrominoColor(cell.type) : cell.color
                    const mesh = makeCube(color, x, y)
                    boardGroup.add(mesh)
                    if (settingsRef.current.effects.edgesEnabled) {
                        const edges = new THREE.LineSegments(
                            new THREE.EdgesGeometry(mesh.geometry),
                            new THREE.LineBasicMaterial({ color: settingsRef.current.effects.edgesColor }),
                        )
                        edges.position.copy(mesh.position)
                        edges.rotation.copy(mesh.rotation)
                        edges.scale.copy(mesh.scale)
                        edgesBoardGroup.add(edges)
                    }
                }
            }
        }
        rebuildBoardMeshesRef.current = rebuildBoardMeshes

        function lockPiece() {
            const color = getTetrominoColor(current.type)
            let overflow = false
            eachCells(current, (x, y) => {
                if (y >= ROWS) overflow = true
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y][x] = { color, type: current.type }
            })
            let cleared = 0
            for (let y = 0; y < ROWS; y++) {
                if (board[y].every((c) => c)) {
                    cleared++
                    for (let yy = y; yy < ROWS - 1; yy++) board[yy] = board[yy + 1]
                    board[ROWS - 1] = Array(COLS).fill(null)
                    y--
                }
            }
            rebuildBoardMeshes()
            if (overflow) {
                // Any part of the piece locked above the top: game over
                gameOver = true
                console.warn('[GameOver] Piece locked above top row. type:', current.type, 'pos:', current.pos)
                setGameOverUI(true)
            }
            return cleared
        }

        function tryMove(dx, dy) {
            const next = {
                type: current.type,
                rotIndex: current.rotIndex,
                pos: { x: current.pos.x + dx, y: current.pos.y + dy },
            }
            if (canPlace(next)) {
                current = next
                drawActive()
                return true
            }
            return false
        }

        function tryRotate() {
            const next = {
                type: current.type,
                rotIndex: (current.rotIndex + 1) % TETROMINOES[current.type].rotations.length,
                pos: { ...current.pos },
            }
            const kicks = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 },
            ]
            for (const k of kicks) {
                const alt = { ...next, pos: { x: next.pos.x + k.x, y: next.pos.y + k.y } }
                if (canPlace(alt)) {
                    current = alt
                    drawActive()
                    return true
                }
            }
            return false
        }

        function hardDrop() {
            if (!current) return 0
            let moved
            do {
                moved = tryMove(0, -1)
            } while (moved)
            const cleared = lockPiece()
            if (!gameOver) spawn()
            return cleared
        }

        function resetGame() {
            // Clear board state and rebuild meshes; keep paused as-is
            board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
            rebuildBoardMeshes()
            gameOver = false
            setGameOverUI(false)
            current = null
            spawn()
            lastStep = performance.now()
        }

        // Input handlers
        function onKeyDown(e) {
            // Global hotkeys
            if (e.code === 'KeyP') {
                // P should always toggle pause regardless of game state
                paused = !paused
                api?.onPausedChange?.(paused)
                return
            }
            if (e.code === 'KeyR') {
                // R should reset game regardless of game state; keep paused as-is
                resetGame()
                return
            }
            if (!current || !running || paused) return
            if (gameOver) {
                // Use KeyR (handled above) to reset game; ignore other keys
                return
            }
            switch (e.code) {
                case 'ArrowLeft':
                    tryMove(-1, 0)
                    break
                case 'ArrowRight':
                    tryMove(1, 0)
                    break
                case 'ArrowUp':
                    tryRotate()
                    break
                case 'ArrowDown':
                    softDrop = true
                    break
                case 'Space':
                case 'Spacebar':
                    hardDrop()
                    break
            }
        }
        function onKeyUp(e) {
            if (e.code === 'ArrowDown') softDrop = false
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)

        // Resize
        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
            composer.setSize(window.innerWidth, window.innerHeight)
            if (fxaaPass) {
                const pixelRatio = renderer.getPixelRatio()
                fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio))
            }
        }
        window.addEventListener('resize', onResize)

        // Game loop
        function animate(now) {
            rafId = requestAnimationFrame(animate)
            controls.update()
            // Auto-orbit celestial
            const lt = lastTimeRef.current
            const dtSec = Math.min(0.1, Math.max(0, (now - lt) / 1000))
            lastTimeRef.current = now
            const cset = settingsRef.current?.lights?.celestial
            const cel = celestialLightRef.current
            const body = celestialBodyRef.current
            const worldGroup = worldGroupRef.current
            if (cset && cel) {
                if (cset.autoOrbit) {
                    celestialAzimuthRef.current = (celestialAzimuthRef.current + (cset.orbitSpeedDeg || 0) * dtSec) % 360
                }
                const az = (celestialAzimuthRef.current)
                const elev = (cset.elevationDeg || 0) * Math.PI / 180
                const r = cset.radius || 60
                const y = Math.sin(elev) * r
                const horiz = Math.cos(elev) * r
                const x = Math.sin(az * Math.PI / 180) * horiz
                const z = Math.cos(az * Math.PI / 180) * horiz
                cel.color.set(cset.color || '#ffffff')
                cel.intensity = cset.enabled ? cset.intensity : 0
                cel.castShadow = !!cset.castShadow
                cel.position.set(x, y, z)
                if (cel.target) {
                    cel.target.position.set(0, 0, 0)
                    if (!cel.target.parent && worldGroup) worldGroup.add(cel.target)
                }
                if (body) {
                    const show = !!(cset.enabled && cset.showBody)
                    body.visible = show
                    const size = Math.max(0.1, cset.bodySize || 6)
                    body.scale.setScalar(size)
                    body.position.set(x, y, z)
                    const isSun = (cset.kind || 'sun') === 'sun'
                    const col = new THREE.Color(cset.color || '#ffffff')
                    const mat = body.material
                    mat.color.set(isSun ? '#fff4c1' : '#d0d6ff')
                    mat.emissive.set(isSun ? col : new THREE.Color('#333950'))
                    mat.needsUpdate = true
                }
            }
            const interval = softDrop ? 60 : gravityMs
            if (!paused && !gameOver && now - lastStep > interval) {
                lastStep = now
                if (!tryMove(0, -1)) {
                    lockPiece()
                    if (!gameOver) spawn()
                }
            }
            if (outlinePass.enabled) composer.render()
            else renderer.render(scene, camera)
        }

        // Init
        spawn()
        lastStep = performance.now()
        rafId = requestAnimationFrame(animate)

        // Expose minimal API
        const api = {
            setPaused: (v) => { paused = !!v },
            isPaused: () => paused,
            onPausedChange: null,
            resetGame,
        }
        onApi?.(api)

        // Cleanup
        return () => {
            running = false
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            controls.removeEventListener('change', emitCameraChange)
            controls.dispose()
            composer.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
            scene.traverse((obj) => {
                if (obj.isMesh) {
                    obj.geometry?.dispose?.()
                    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.())
                    else obj.material?.dispose?.()
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // React to settings updates without recreating the scene
    useEffect(() => {
        settingsRef.current = settings
        const cam = cameraRef.current
        const controls = controlsRef.current
        const amb = ambRef.current
        const dir = dirLightRef.current
        // const cel = celestialLightRef.current
        // const body = celestialBodyRef.current
        const outlinePass = outlinePassRef.current
        const fxaaPass = fxaaPassRef.current
        const renderer = rendererRef.current
        const edgesBoard = edgesBoardGroupRef.current
        const edgesBorder = edgesBorderGroupRef.current
        const boardGroup = boardGroupRef.current
        const borderGroup = borderGroupRef.current
        const worldGroup = worldGroupRef.current
        if (!cam || !controls || !amb || !dir || !outlinePass || !renderer) return

        // Camera
        cam.fov = settings.camera.fov
        cam.near = settings.camera.near ?? cam.near
        cam.far = settings.camera.far ?? cam.far
        cam.updateProjectionMatrix()
        // Apply target first
        const tX = settings.camera.targetX ?? 0
        const tY = settings.camera.targetY
        const tZ = settings.camera.targetZ ?? 0
        controls.target.set(tX, tY, tZ)
        // Maintain current azimuth and apply planar distance + height
        const curDx = cam.position.x - tX
        const curDz = cam.position.z - tZ
        const theta = (Math.abs(curDx) > 1e-6 || Math.abs(curDz) > 1e-6) ? Math.atan2(curDx, curDz) : 0
        const radius = settings.camera.distance
        cam.position.set(
            tX + Math.sin(theta) * radius,
            settings.camera.height,
            tZ + Math.cos(theta) * radius,
        )
        controls.update()

        // Rotate entire playfield
        if (worldGroup) {
            worldGroup.rotation.x = settings.camera.rotX ?? 0
            worldGroup.rotation.z = settings.camera.rotZ ?? 0
        }

        // OrbitControls settings
        if (controls && settings.controls) {
            const c = settings.controls
            controls.enableRotate = c.enableRotate
            controls.enableZoom = c.enableZoom
            controls.enablePan = c.enablePan
            controls.enableDamping = c.enableDamping
            controls.dampingFactor = c.dampingFactor
            controls.rotateSpeed = c.rotateSpeed
            controls.zoomSpeed = c.zoomSpeed
            controls.panSpeed = c.panSpeed
            controls.autoRotate = c.autoRotate
            controls.autoRotateSpeed = c.autoRotateSpeed
            controls.minDistance = c.minDistance
            controls.maxDistance = c.maxDistance
            controls.minPolarAngle = c.minPolarAngle
            controls.maxPolarAngle = c.maxPolarAngle
            controls.minAzimuthAngle = c.minAzimuthAngle
            controls.maxAzimuthAngle = c.maxAzimuthAngle
            if ('zoomToCursor' in controls && typeof controls.zoomToCursor !== 'undefined') {
                // keep default; add later as setting if needed
            }
        }

        // Lights
        amb.intensity = settings.lights.ambient
        dir.intensity = settings.lights.directional
        dir.position.set(settings.lights.dirX, settings.lights.dirY, settings.lights.dirZ)
        // Celestial: only sync azimuth from settings if user changed it (avoid resets on other settings updates)
        if (settings.lights.celestial) {
            const azSet = settings.lights.celestial.azimuthDeg
            if (azSet !== celestialAzimuthSettingRef.current) {
                celestialAzimuthRef.current = azSet ?? celestialAzimuthRef.current
                celestialAzimuthSettingRef.current = azSet
            }
        }

        // Outline
        outlinePass.enabled = !!settings.effects.outlineEnabled
        outlinePass.edgeThickness = Math.max(0.001, settings.effects.outlineThickness)
        outlinePass.visibleEdgeColor.set(settings.effects.outlineColor)
        if (fxaaPass) fxaaPass.enabled = !!settings.effects.outlineEnabled
        if (fxaaPass) {
            const pixelRatio = renderer.getPixelRatio()
            fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio))
        }

        // Edges toggle/color updates for static meshes
        if (edgesBoard && boardGroup) {
            edgesBoard.clear()
            for (const mesh of boardGroup.children) {
                if (!settings.effects.edgesEnabled) continue
                const edges = new THREE.LineSegments(
                    new THREE.EdgesGeometry(mesh.geometry),
                    new THREE.LineBasicMaterial({ color: settings.effects.edgesColor }),
                )
                edges.position.copy(mesh.position)
                edges.rotation.copy(mesh.rotation)
                edges.scale.copy(mesh.scale)
                edgesBoard.add(edges)
            }
        }
        if (edgesBorder && borderGroup) {
            edgesBorder.clear()
            for (const mesh of borderGroup.children) {
                if (!settings.effects.edgesEnabled) continue
                const edges = new THREE.LineSegments(
                    new THREE.EdgesGeometry(mesh.geometry),
                    new THREE.LineBasicMaterial({ color: settings.effects.edgesColor }),
                )
                edges.position.copy(mesh.position)
                edges.rotation.copy(mesh.rotation)
                edges.scale.copy(mesh.scale)
                edgesBorder.add(edges)
            }
        }

        // Colors: if colors object exists, rebuild border meshes with new color and refresh board/active colors
        if (settings.colors) {
            // Border recolor: rebuild border meshes to apply new material color
            buildBorderMeshesRef.current?.()
            // Board recolor: rebuild board meshes to apply per-type colors
            rebuildBoardMeshesRef.current?.()
            // Active piece recolor
            drawActiveRef.current?.()
        }
    }, [settings])

    return (
        <div ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {gameOverUI && (
                <div
                    style={{
                        position: 'fixed', left: 0, top: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', pointerEvents: 'none',
                        textShadow: '0 2px 12px rgba(0,0,0,0.8)', zIndex: 999,
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 800 }}>Game Over</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>Press R to Restart</div>
                    </div>
                </div>
            )}
        </div>
    )
}
