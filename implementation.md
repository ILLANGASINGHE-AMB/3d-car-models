# 3D Car Showcase Viewer — Implementation Guide

## 1. Overview

A web app that displays interactive 3D car models: orbit/zoom camera, realistic lighting, color customization, and multiple car selection. Built with React Three Fiber (Three.js wrapper for React).

**Goal:** viewer only — no modeling/editing tools, no CAD.

---

## 2. Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Framework | React (Vite) | App shell, fast dev server |
| 3D Engine | Three.js | WebGL rendering |
| React glue | @react-three/fiber | Write Three.js scenes as React components |
| Helpers | @react-three/drei | OrbitControls, Environment, model loaders, loading UI |
| Models | .glb / .gltf | Standard compressed 3D model format |
| Hosting | Vercel / Netlify | Static deploy, handles large asset caching well |

---

## 3. Project Setup

```bash
npm create vite@latest car-viewer -- --template react
cd car-viewer
npm install three @react-three/fiber @react-three/drei
npm run dev
```

### Folder structure
```
car-viewer/
├── public/
│   └── models/
│       ├── sedan.glb
│       ├── suv.glb
│       └── sports.glb
├── src/
│   ├── components/
│   │   ├── Scene.jsx
│   │   ├── CarModel.jsx
│   │   ├── Lighting.jsx
│   │   ├── Loader.jsx
│   │   └── UI/
│   │       ├── CarSelector.jsx
│   │       ├── ColorPicker.jsx
│   │       └── EnvironmentSelector.jsx
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

## 4. Getting a Car Model

You need `.glb` files. Options:

1. **Free sources:** Sketchfab (filter by "downloadable" + CC license), Poly Haven, CGTrader free section.
2. **Convert existing formats:** if you have `.obj`/`.fbx`, convert to `.glb` using [Blender](https://www.blender.org/) (free) — File > Export > glTF 2.0.
3. **Compress for web:** run models through [gltf-transform](https://gltf-transform.dev/) or [gltfjsx](https://github.com/pmndrs/gltfjsx) to reduce file size (car models can be 50MB+ uncompressed; aim for under 5–10MB).

```bash
npx gltfjsx public/models/sedan.glb -o src/components/Sedan.jsx -T
```
This generates a typed React component from your model automatically, with each mesh/material exposed as props — very useful for the color-swap feature later.

---

## 5. Core Implementation

### `src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### `src/App.jsx`
```jsx
import { useState } from 'react'
import Scene from './components/Scene'
import CarSelector from './components/UI/CarSelector'
import ColorPicker from './components/UI/ColorPicker'

const CARS = [
  { id: 'sedan', name: 'Sedan', path: '/models/sedan.glb' },
  { id: 'suv', name: 'SUV', path: '/models/suv.glb' },
  { id: 'sports', name: 'Sports Car', path: '/models/sports.glb' },
]

export default function App() {
  const [activeCar, setActiveCar] = useState(CARS[0])
  const [color, setColor] = useState('#c0392b')

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene carPath={activeCar.path} color={color} />
      <CarSelector cars={CARS} active={activeCar} onSelect={setActiveCar} />
      <ColorPicker color={color} onChange={setColor} />
    </div>
  )
}
```

### `src/components/Scene.jsx`
```jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import CarModel from './CarModel'
import Loader from './Loader'

export default function Scene({ carPath, color }) {
  return (
    <Canvas
      shadows
      camera={{ position: [4, 1.5, 5], fov: 40 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={<Loader />}>
        <CarModel path={carPath} color={color} />
        <Environment preset="city" />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.6} blur={2} far={5} />
      </Suspense>

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  )
}
```

### `src/components/CarModel.jsx`
```jsx
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'

export default function CarModel({ path, color }) {
  const { scene } = useGLTF(path)
  const bodyMeshRef = useRef()

  useEffect(() => {
    // Find the "paint" mesh by name (rename in Blender before export,
    // e.g. call it "Body_Paint") and swap its color live.
    scene.traverse((child) => {
      if (child.isMesh && child.name === 'Body_Paint') {
        bodyMeshRef.current = child
        child.material.color.set(color)
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene, color])

  return <primitive object={scene} scale={1} position={[0, 0, 0]} />
}

useGLTF.preload('/models/sedan.glb')
```

### `src/components/Loader.jsx`
```jsx
import { Html, useProgress } from '@react-three/drei'

export default function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{ color: 'white', fontSize: 14 }}>
        Loading {progress.toFixed(0)}%
      </div>
    </Html>
  )
}
```

### `src/components/UI/CarSelector.jsx`
```jsx
export default function CarSelector({ cars, active, onSelect }) {
  return (
    <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
      {cars.map((car) => (
        <button
          key={car.id}
          onClick={() => onSelect(car)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: car.id === active.id ? '#111' : '#eee',
            color: car.id === active.id ? '#fff' : '#111',
            cursor: 'pointer',
          }}
        >
          {car.name}
        </button>
      ))}
    </div>
  )
}
```

### `src/components/UI/ColorPicker.jsx`
```jsx
const COLORS = ['#c0392b', '#2c3e50', '#ecf0f1', '#f1c40f', '#27ae60']

export default function ColorPicker({ color, onChange }) {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 8 }}>
      {COLORS.map((c) => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: c,
            cursor: 'pointer',
            border: color === c ? '2px solid #000' : '2px solid transparent',
          }}
        />
      ))}
    </div>
  )
}
```

---

## 6. Build Order (recommended sequence)

1. **Scaffold** — Vite + React running, blank Canvas rendering.
2. **Primitive test** — render a spinning `<mesh><boxGeometry/></mesh>` to confirm the pipeline works before touching real assets.
3. **Load real model** — swap in one `.glb`, add `OrbitControls`.
4. **Lighting/environment** — add `<Environment preset="city">` and shadows; this alone makes it look "real."
5. **Multi-car switching** — wire up `CarSelector`.
6. **Color customization** — name your paint mesh in Blender, wire up `ColorPicker`.
7. **Polish** — auto-rotate toggle, environment presets (studio/sunset/night), mobile touch controls (drei's OrbitControls supports touch out of the box), loading screen.
8. **Performance pass** — compress models, enable `<Suspense>` fallback, consider `dpr={[1, 2]}` cap on Canvas for high-DPI screens.

---

## 7. Performance Tips

- Keep each model under ~10MB; use [Draco compression](https://github.com/google/draco) via gltf-transform for geometry-heavy cars.
- Use `useGLTF.preload()` for the next-likely car to avoid pop-in when switching.
- Cap pixel ratio: `<Canvas dpr={[1, 2]}>` avoids overkill rendering on 4K/Retina screens.
- Use `React.memo` around static UI pieces so re-renders don't thrash the Canvas.
- Lazy-load car models only when selected rather than bundling all up front.

---

## 8. Deployment

```bash
npm run build
```
Deploy the `dist/` folder to Vercel or Netlify. Both handle large static asset caching well — set long cache headers on `/models/*.glb` since they don't change often.

---

## 9. Stretch Features (optional, once base viewer works)

- Auto-rotate camera (drei's `OrbitControls autoRotate`)
- Interior/exterior camera toggle (two preset camera positions)
- Wheel/rim swapping (separate mesh, same technique as paint color)
- Screenshot/share button (`canvas.toDataURL()`)
- AR view on mobile (`<ARButton>` via `@react-three/xr`)
