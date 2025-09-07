import { useEffect, useRef } from 'react'
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
    I: 0x00ffff,
    J: 0x0000ff,
    L: 0xffa500,
    O: 0xffff00,
    S: 0x00ff00,
    T: 0xffc13c,
    Z: 0xff0000,
}

const TETROMINOES = {
    I: {
        rotations: [
            [[0, 1], [1, 1], [2, 1], [3, 1]],
            [[2, 0], [2, 1], [2, 2], [2, 3]],
        ],
        color: COLORS.I,
    },
    J: {
        rotations: [
            [[0, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [2, 2]],
            [[1, 0], [1, 1], [0, 2], [1, 2]],
        ],
        color: COLORS.J,
    },
    L: {
        rotations: [
            [[2, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [1, 2], [2, 2]],
            [[0, 1], [1, 1], [2, 1], [0, 2]],
            [[0, 0], [1, 0], [1, 1], [1, 2]],
        ],
        color: COLORS.L,
    },
    O: {
        rotations: [
            [[1, 0], [2, 0], [1, 1], [2, 1]],
        ],
        color: COLORS.O,
    },
    S: {
        rotations: [
            [[1, 1], [2, 1], [0, 2], [1, 2]],
            [[1, 0], [1, 1], [2, 1], [2, 2]],
        ],
        color: COLORS.S,
    },
    T: {
        rotations: [
            [[1, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [1, 2]],
            [[1, 0], [0, 1], [1, 1], [1, 2]],
        ],
        color: COLORS.T,
    },
    Z: {
        rotations: [
            [[0, 1], [1, 1], [1, 2], [2, 2]],
            [[2, 0], [1, 1], [2, 1], [1, 2]],
        ],
        color: COLORS.Z,
    },
}

export default function Tetris3D({ settings, onApi }) {
    const mountRef = useRef(null)

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

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true
        renderer.domElement.style.position = 'fixed'
        renderer.domElement.style.top = '0'
        renderer.domElement.style.left = '0'
        mountRef.current.appendChild(renderer.domElement)

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.target.set(0, settings.camera.targetY, 0)

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, settings.lights.ambient)
        scene.add(amb)
        const dirLight = new THREE.DirectionalLight(0xffffff, settings.lights.directional)
        dirLight.position.set(settings.lights.dirX, settings.lights.dirY, settings.lights.dirZ)
        dirLight.castShadow = true
        scene.add(dirLight)

        // Grid helper for reference
        const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222)
        grid.position.y = -((ROWS / 2) + 1) * STEP
        scene.add(grid)

        // Groups
        const boardGroup = new THREE.Group()
        const activeGroup = new THREE.Group()
        scene.add(boardGroup)
        scene.add(activeGroup)

        // Geometry reuse
        const cubeGeom = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE)

        // Optional outline/edges setup
        const composer = new EffectComposer(renderer)
        const renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass)

        let outlinePass = null
        let fxaaPass = null
        if (settings.effects.outlineEnabled) {
            outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
            outlinePass.edgeStrength = 3.0
            outlinePass.edgeGlow = 0.0
            outlinePass.edgeThickness = Math.max(0.001, settings.effects.outlineThickness)
            outlinePass.pulsePeriod = 0
            outlinePass.visibleEdgeColor.set(settings.effects.outlineColor)
            outlinePass.hiddenEdgeColor.set('#000000')
            composer.addPass(outlinePass)

            fxaaPass = new ShaderPass(FXAAShader)
            const pixelRatio = renderer.getPixelRatio()
            fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio))
            composer.addPass(fxaaPass)
        }

        // Edges toggle via EdgesGeometry overlays
        const edgesGroup = new THREE.Group()
        scene.add(edgesGroup)

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

        function spawn() {
            const keys = Object.keys(TETROMINOES)
            const type = keys[Math.floor(Math.random() * keys.length)]
            const rotIndex = 0
            const pieceWidth = 4
            const pos = { x: Math.floor((COLS - pieceWidth) / 2), y: ROWS - 4 }
            current = { type, rotIndex, pos }

            if (!canPlace(current)) {
                gameOver = true
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

        function addEdgesFor(mesh, color = '#ffffff') {
            const edges = new THREE.LineSegments(
                new THREE.EdgesGeometry(mesh.geometry),
                new THREE.LineBasicMaterial({ color }),
            )
            edges.position.copy(mesh.position)
            edges.rotation.copy(mesh.rotation)
            edges.scale.copy(mesh.scale)
            edgesGroup.add(edges)
            return edges
        }

        function drawActive() {
            activeGroup.clear()
            edgesGroup.clear()
            const color = TETROMINOES[current.type].color
            const selectedObjects = []
            eachCells(current, (x, y) => {
                const mesh = makeCube(color, x, y)
                activeGroup.add(mesh)
                selectedObjects.push(mesh)
                if (settings.effects.edgesEnabled) addEdgesFor(mesh, settings.effects.edgesColor)
            })
            if (outlinePass) {
                outlinePass.selectedObjects = selectedObjects
            }
        }

        function rebuildBoardMeshes() {
            boardGroup.clear()
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const cell = board[y][x]
                    if (!cell) continue
                    const mesh = makeCube(cell.color, x, y)
                    boardGroup.add(mesh)
                    if (settings.effects.edgesEnabled) addEdgesFor(mesh, settings.effects.edgesColor)
                }
            }
        }

        function lockPiece() {
            const color = TETROMINOES[current.type].color
            eachCells(current, (x, y) => {
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y][x] = { color }
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
            while (tryMove(0, -1)) { }
            const cleared = lockPiece()
            spawn()
            return cleared
        }

        // Input handlers
        function onKeyDown(e) {
            // P should always toggle pause regardless of game state
            if (e.code === 'KeyP') {
                paused = !paused
                api?.onPausedChange?.(paused)
                return
            }
            if (!current || !running || paused) return
            if (gameOver) {
                if (e.code === 'Enter') {
                    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
                    rebuildBoardMeshes()
                    gameOver = false
                    spawn()
                }
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
            const interval = softDrop ? 60 : gravityMs
            if (!paused && !gameOver && now - lastStep > interval) {
                lastStep = now
                if (!tryMove(0, -1)) {
                    lockPiece()
                    spawn()
                }
            }
            if (outlinePass) composer.render()
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
        }
        onApi?.(api)

        // Cleanup
        return () => {
            running = false
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
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
    }, [settings])

    return <div ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
}
