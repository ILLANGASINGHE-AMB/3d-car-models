import { useState, useEffect } from 'react'
import Scene from './components/Scene'

const COLOR_PALETTE = [
  { name: 'Carbon Black', hex: '#16171d' },
  { name: 'Teal Neon', hex: '#00e5ff' },
  { name: 'Sunset Orange', hex: '#ff5722' },
  { name: 'Acid Green', hex: '#39ff14' },
  { name: 'Hyper Purple', hex: '#bd00ff' },
  { name: 'Formula Red', hex: '#e63946' },
  { name: 'Liquid Silver', hex: '#cbd5e1' },
];

const PRESETS = {
  sedan: {
    name: 'Sedan',
    chassisLength: 3.4,
    chassisWidth: 1.6,
    chassisHeight: 0.4,
    cabinLength: 2.0,
    cabinWidth: 1.4,
    cabinHeight: 0.8,
    cabinOffset: 0.1,
    wheelRadius: 0.40,
    wheelWidth: 0.25,
  },
  suv: {
    name: 'SUV',
    chassisLength: 3.8,
    chassisWidth: 1.8,
    chassisHeight: 0.5,
    cabinLength: 2.4,
    cabinWidth: 1.6,
    cabinHeight: 1.1,
    cabinOffset: 0.0,
    wheelRadius: 0.52,
    wheelWidth: 0.32,
  },
  truck: {
    name: 'Truck',
    chassisLength: 4.4,
    chassisWidth: 1.9,
    chassisHeight: 0.6,
    cabinLength: 1.6,
    cabinWidth: 1.6,
    cabinHeight: 1.1,
    cabinOffset: -0.6,
    wheelRadius: 0.58,
    wheelWidth: 0.35,
  },
  sports: {
    name: 'Sports Car',
    chassisLength: 3.6,
    chassisWidth: 2.0,
    chassisHeight: 0.3,
    cabinLength: 1.6,
    cabinWidth: 1.7,
    cabinHeight: 0.6,
    cabinOffset: 0.2,
    wheelRadius: 0.46,
    wheelWidth: 0.38,
  }
};

export default function App() {
  const [activePreset, setActivePreset] = useState('sedan');
  const [specs, setSpecs] = useState(PRESETS.sedan);
  const [colorIndex, setColorIndex] = useState(1); // Default to Teal Neon
  const [cameraAngle, setCameraAngle] = useState(Math.PI / 4); // Yaw rotation angle
  const [cameraPitch, setCameraPitch] = useState(Math.PI / 6); // Pitch rotation angle
  const [cameraDistance, setCameraDistance] = useState(7);
  const [toast, setToast] = useState('');
  const [toastId, setToastId] = useState(null);

  // Trigger brief alert text in HUD when key actions happen
  const showToast = (message) => {
    setToast(message);
    if (toastId) clearTimeout(toastId);
    const id = setTimeout(() => setToast(''), 1500);
    setToastId(id);
  };

  // Helper to safely step numerical values
  const adjustSpec = (key, delta, min, max, name) => {
    setSpecs(prev => {
      const newVal = Math.min(max, Math.max(min, Number((prev[key] + delta).toFixed(2))));
      if (newVal !== prev[key]) {
        showToast(`${name}: ${newVal.toFixed(2)}m`);
      }
      return { ...prev, [key]: newVal };
    });
  };

  // Preset changer
  const applyPreset = (key) => {
    setActivePreset(key);
    setSpecs(PRESETS[key]);
    showToast(`Loaded Preset: ${PRESETS[key].name}`);
  };

  // Handle global keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent browser default scroll for arrows and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '+', '-'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        // Preset selectors
        case '1': applyPreset('sedan'); break;
        case '2': applyPreset('suv'); break;
        case '3': applyPreset('truck'); break;
        case '4': applyPreset('sports'); break;

        // Color cycling
        case 'c':
        case 'C':
          setColorIndex(prev => {
            const nextIdx = (prev + 1) % COLOR_PALETTE.length;
            showToast(`Paint Color: ${COLOR_PALETTE[nextIdx].name}`);
            return nextIdx;
          });
          break;

        // Chassis Length: L (Shift+L) / l
        case 'L':
          adjustSpec('chassisLength', 0.1, 2.0, 5.0, 'Chassis Length');
          break;
        case 'l':
          adjustSpec('chassisLength', -0.1, 2.0, 5.0, 'Chassis Length');
          break;

        // Chassis Width: W (Shift+W) / w
        case 'W':
          adjustSpec('chassisWidth', 0.05, 1.2, 2.5, 'Chassis Width');
          break;
        case 'w':
          adjustSpec('chassisWidth', -0.05, 1.2, 2.5, 'Chassis Width');
          break;

        // Chassis Height: H (Shift+H) / h
        case 'H':
          adjustSpec('chassisHeight', 0.05, 0.2, 1.0, 'Chassis Height');
          break;
        case 'h':
          adjustSpec('chassisHeight', -0.05, 0.2, 1.0, 'Chassis Height');
          break;

        // Cabin Length: K (Shift+K) / k
        case 'K':
          adjustSpec('cabinLength', 0.1, 1.0, 3.0, 'Cabin Length');
          break;
        case 'k':
          adjustSpec('cabinLength', -0.1, 1.0, 3.0, 'Cabin Length');
          break;

        // Cabin Height: U (Shift+U) / u
        case 'U':
          adjustSpec('cabinHeight', 0.05, 0.4, 1.5, 'Cabin Height');
          break;
        case 'u':
          adjustSpec('cabinHeight', -0.05, 0.4, 1.5, 'Cabin Height');
          break;

        // Wheel Radius: R (Shift+R) / r
        case 'R':
          adjustSpec('wheelRadius', 0.02, 0.3, 0.8, 'Wheel Radius');
          break;
        case 'r':
          adjustSpec('wheelRadius', -0.02, 0.3, 0.8, 'Wheel Radius');
          break;

        // Camera Orbit (Yaw)
        case 'ArrowLeft':
          setCameraAngle(prev => prev - 0.08);
          break;
        case 'ArrowRight':
          setCameraAngle(prev => prev + 0.08);
          break;

        // Camera Orbit (Pitch)
        case 'ArrowUp':
          setCameraPitch(prev => Math.min(Math.PI / 2.2, Math.max(0.05, prev - 0.05)));
          break;
        case 'ArrowDown':
          setCameraPitch(prev => Math.min(Math.PI / 2.2, Math.max(0.05, prev + 0.05)));
          break;

        // Camera Distance (Zoom)
        case '+':
        case '=':
          setCameraDistance(prev => Math.max(3.5, prev - 0.25));
          break;
        case '-':
        case '_':
          setCameraDistance(prev => Math.min(12, prev + 0.25));
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [specs, toastId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      {/* Unified Sidebar (Title, Presets, Specs, Keybinds) */}
      <div className="hud-panel sidebar">
        
        {/* Header / Brand */}
        <div className="hud-brand">
          <h1 className="hud-title">3D Vehicle builder<br />by <span>HeLLL3D</span></h1>
          <p className="hud-subtitle">Procedural Modeling Console</p>
        </div>

        {/* Base Templates */}
        <div style={{ marginTop: 20 }}>
          <h3>Base Templates</h3>
          <div className="presets-grid">
            {Object.keys(PRESETS).map(key => (
              <div 
                key={key} 
                className={`preset-card ${activePreset === key ? 'active' : ''}`}
              >
                {PRESETS[key].name}
              </div>
            ))}
          </div>
        </div>

        {/* Specs Visualizer */}
        <div style={{ marginTop: 20 }}>
          <h3>Vehicle Specifications</h3>
          
          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Chassis Length</span>
              <span className="spec-val">{specs.chassisLength.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.chassisLength - 2.0) / 3.0) * 100}%` }}
              />
            </div>
          </div>

          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Chassis Width</span>
              <span className="spec-val">{specs.chassisWidth.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.chassisWidth - 1.2) / 1.3) * 100}%` }}
              />
            </div>
          </div>

          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Chassis Height</span>
              <span className="spec-val">{specs.chassisHeight.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.chassisHeight - 0.2) / 0.8) * 100}%` }}
              />
            </div>
          </div>

          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Cabin Length</span>
              <span className="spec-val">{specs.cabinLength.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.cabinLength - 1.0) / 2.0) * 100}%` }}
              />
            </div>
          </div>

          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Cabin Height</span>
              <span className="spec-val">{specs.cabinHeight.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.cabinHeight - 0.4) / 1.1) * 100}%` }}
              />
            </div>
          </div>

          <div className="spec-row">
            <div className="spec-info">
              <span className="spec-name">Wheel Radius</span>
              <span className="spec-val">{specs.wheelRadius.toFixed(2)}m</span>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((specs.wheelRadius - 0.3) / 0.5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Control Matrix */}
        <div style={{ marginTop: 25 }}>
          <h3>Control Matrix</h3>
          
          <div className="key-item">
            <span className="key-label">Chassis Length (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">L</kbd>
              <kbd className="key-cap">l</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Chassis Width (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">W</kbd>
              <kbd className="key-cap">w</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Chassis Height (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">H</kbd>
              <kbd className="key-cap">h</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Cabin Length (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">K</kbd>
              <kbd className="key-cap">k</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Cabin Height (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">U</kbd>
              <kbd className="key-cap">u</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Wheel Size (inc/dec)</span>
            <div className="key-group">
              <kbd className="key-cap">R</kbd>
              <kbd className="key-cap">r</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Cycle Paint Color</span>
            <kbd className="key-cap">C</kbd>
          </div>

          <div className="key-item" style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
            <span className="key-label">Base Presets</span>
            <div className="key-group">
              <kbd className="key-cap">1</kbd>
              <kbd className="key-cap">2</kbd>
              <kbd className="key-cap">3</kbd>
              <kbd className="key-cap">4</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Orbit Camera</span>
            <div className="key-group">
              <kbd className="key-cap">←</kbd>
              <kbd className="key-cap">→</kbd>
              <kbd className="key-cap">↑</kbd>
              <kbd className="key-cap">↓</kbd>
            </div>
          </div>

          <div className="key-item">
            <span className="key-label">Zoom In / Out</span>
            <div className="key-group">
              <kbd className="key-cap">+</kbd>
              <kbd className="key-cap">-</kbd>
            </div>
          </div>
        </div>

      </div>

      {/* 3D Canvas Viewport */}
      <div className="canvas-container">
        <Scene 
          specs={specs} 
          color={COLOR_PALETTE[colorIndex].hex} 
          preset={activePreset}
          cameraAngle={cameraAngle}
          cameraPitch={cameraPitch}
          cameraDistance={cameraDistance}
        />
      </div>

      {/* Toast HUD Overlay */}
      {toast && <div className="toast-msg">{toast}</div>}

      {/* Footer Info */}
      <div className="hud-footer">
        <div className="footer-item">
          <span className="status-dot"></span>
          <span>Engine Status: Online</span>
        </div>
        <div>
          <span>Model: {PRESETS[activePreset].name} | Paint: {COLOR_PALETTE[colorIndex].name}</span>
        </div>
      </div>
    </div>
  )
}
