import { useState, useEffect, useRef } from 'react'
import Scene from './components/Scene'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const COLOR_PALETTE = [
  { name: 'Liquid Silver', hex: '#cbd5e1' },
  { name: 'Teal Neon', hex: '#00e5ff' },
  { name: 'Sunset Orange', hex: '#ff5722' },
  { name: 'Acid Green', hex: '#39ff14' },
  { name: 'Hyper Purple', hex: '#bd00ff' },
  { name: 'Formula Red', hex: '#e63946' },
  { name: 'Carbon Black', hex: '#16171d' },
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
    name: 'Sports',
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
  const [colorIndex, setColorIndex] = useState(0); // Default to Liquid Silver
  const [cameraAngle, setCameraAngle] = useState(Math.PI / 4); // Yaw rotation angle
  const [cameraPitch, setCameraPitch] = useState(Math.PI / 6); // Pitch rotation angle
  const [cameraDistance, setCameraDistance] = useState(7);
  const [toast, setToast] = useState('');
  const [toastId, setToastId] = useState(null);

  // Importer state
  const [importedScene, setImportedScene] = useState(null);
  const [importedFile, setImportedFile] = useState(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [meshCount, setMeshCount] = useState(0);
  const fileInputRef = useRef(null);

  // Trigger brief alert text in HUD when actions happen
  const showToast = (message) => {
    setToast(message);
    if (toastId) clearTimeout(toastId);
    const id = setTimeout(() => setToast(''), 1800);
    setToastId(id);
  };

  // Preset changer
  const applyPreset = (key) => {
    setActivePreset(key);
    setSpecs(PRESETS[key]);
    showToast(`Preset: ${PRESETS[key].name}`);
  };

  // Slider change helper
  const handleSliderChange = (key, val) => {
    setSpecs(prev => ({
      ...prev,
      [key]: Number(Number(val).toFixed(2))
    }));
  };

  // Actions
  const randomizeModel = () => {
    setSpecs({
      chassisLength: Number((2.0 + Math.random() * 3.0).toFixed(2)),
      chassisWidth: Number((1.2 + Math.random() * 1.3).toFixed(2)),
      chassisHeight: Number((0.2 + Math.random() * 0.8).toFixed(2)),
      cabinLength: Number((1.0 + Math.random() * 2.0).toFixed(2)),
      cabinWidth: Number((1.0 + Math.random() * 1.0).toFixed(2)),
      cabinHeight: Number((0.4 + Math.random() * 1.1).toFixed(2)),
      cabinOffset: Number((-0.8 + Math.random() * 1.4).toFixed(2)),
      wheelRadius: Number((0.3 + Math.random() * 0.5).toFixed(2)),
      wheelWidth: Number((0.15 + Math.random() * 0.23).toFixed(2)),
    });
    showToast("Model Specs Randomized");
  };

  const resetModel = () => {
    if (activePreset === 'imported') {
      setWireframeMode(false);
      showToast("Inspector Options Reset");
    } else {
      setSpecs(PRESETS[activePreset]);
      showToast("Reset to default specs");
    }
  };

  const saveModel = () => {
    if (activePreset === 'imported') {
      showToast("Save option only available for procedural models");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ preset: activePreset, color: COLOR_PALETTE[colorIndex].name, specs }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `3d_vehicle_${activePreset}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Vehicle JSON Exported");
  };

  const cycleColor = () => {
    if (activePreset === 'imported') {
      showToast("Color cycle only applies to procedural vehicles");
      return;
    }
    setColorIndex(prev => {
      const nextIdx = (prev + 1) % COLOR_PALETTE.length;
      showToast(`Paint: ${COLOR_PALETTE[nextIdx].name}`);
      return nextIdx;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      showToast("Fullscreen Enabled");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        showToast("Fullscreen Disabled");
      }
    }
  };

  // Model parser / loader
  const parseGLBFile = (file) => {
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      showToast("Error: Upload a valid .glb or .gltf model");
      return;
    }

    showToast("Loading 3D model...");
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const contents = e.target.result;
      const loader = new GLTFLoader();
      
      loader.parse(
        contents,
        '',
        (gltf) => {
          // Count meshes in the loaded scene
          let count = 0;
          gltf.scene.traverse((child) => {
            if (child.isMesh) count++;
          });

          setMeshCount(count);
          setImportedScene(gltf.scene);
          setImportedFile({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
          });
          setWireframeMode(false);
          setActivePreset('imported');
          showToast("Import Successful!");
        },
        (error) => {
          showToast("Failed to parse 3D file!");
          console.error(error);
        }
      );
    };

    reader.readAsArrayBuffer(file);
  };

  // File drop/drag event listeners
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) parseGLBFile(file);
  };

  // Wireframe toggler
  useEffect(() => {
    if (importedScene) {
      importedScene.traverse((child) => {
        if (child.isMesh) {
          child.material.wireframe = wireframeMode;
        }
      });
    }
  }, [importedScene, wireframeMode]);

  // Keyboard controls listener (continues keyboard workflow seamlessly)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '+', '-'].includes(e.key)) {
        e.preventDefault();
      }

      // Safe step modifier helper
      const stepSpec = (key, delta, min, max, name) => {
        setSpecs(prev => {
          const newVal = Math.min(max, Math.max(min, Number((prev[key] + delta).toFixed(2))));
          if (newVal !== prev[key]) {
            showToast(`${name}: ${newVal.toFixed(2)}m`);
          }
          return { ...prev, [key]: newVal };
        });
      };

      switch (e.key) {
        case '1': applyPreset('sedan'); break;
        case '2': applyPreset('suv'); break;
        case '3': applyPreset('truck'); break;
        case '4': applyPreset('sports'); break;

        case 'c':
        case 'C':
          cycleColor();
          break;

        case 'L': stepSpec('chassisLength', 0.1, 2.0, 5.0, 'Chassis Length'); break;
        case 'l': stepSpec('chassisLength', -0.1, 2.0, 5.0, 'Chassis Length'); break;
        case 'W': stepSpec('chassisWidth', 0.05, 1.2, 2.5, 'Chassis Width'); break;
        case 'w': stepSpec('chassisWidth', -0.05, 1.2, 2.5, 'Chassis Width'); break;
        case 'H': stepSpec('chassisHeight', 0.05, 0.2, 1.0, 'Chassis Height'); break;
        case 'h': stepSpec('chassisHeight', -0.05, 0.2, 1.0, 'Chassis Height'); break;
        case 'K': stepSpec('cabinLength', 0.1, 1.0, 3.0, 'Cabin Length'); break;
        case 'k': stepSpec('cabinLength', -0.1, 1.0, 3.0, 'Cabin Length'); break;
        case 'U': stepSpec('cabinHeight', 0.05, 0.4, 1.5, 'Cabin Height'); break;
        case 'u': stepSpec('cabinHeight', -0.05, 0.4, 1.5, 'Cabin Height'); break;
        case 'R': stepSpec('wheelRadius', 0.02, 0.3, 0.8, 'Wheel Radius'); break;
        case 'r': stepSpec('wheelRadius', -0.02, 0.3, 0.8, 'Wheel Radius'); break;

        case 'ArrowLeft': setCameraAngle(prev => prev - 0.08); break;
        case 'ArrowRight': setCameraAngle(prev => prev + 0.08); break;
        case 'ArrowUp': setCameraPitch(prev => Math.min(Math.PI / 2.2, Math.max(0.05, prev - 0.05))); break;
        case 'ArrowDown': setCameraPitch(prev => Math.min(Math.PI / 2.2, Math.max(0.05, prev + 0.05))); break;
        case '+': case '=': setCameraDistance(prev => Math.max(3.5, prev - 0.25)); break;
        case '-': case '_': setCameraDistance(prev => Math.min(12, prev + 0.25)); break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [specs, toastId, colorIndex, activePreset]);

  // Drag and drop events for the main area
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseGLBFile(file);
  };

  return (
    <div className="app-container" onDragOver={handleDragOver} onDrop={handleDrop}>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".glb,.gltf" 
        onChange={handleFileChange}
      />

      {/* 1. PROFESSIONAL TOP HEADER BAR */}
      <header className="app-header">
        <div className="brand-group">
          <h1 className="header-title">3D Vehicle builder by <span>HeLLL3D</span></h1>
        </div>
        <div className="header-actions">
          <button 
            className={`icon-btn tooltip ${activePreset === 'imported' ? 'disabled' : ''}`} 
            onClick={cycleColor} 
            data-tooltip="Cycle Paint Color"
            disabled={activePreset === 'imported'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34298 19.4844 5.58519 19.7266 5.67931 20.0242C5.77342 20.3218 5.71966 20.6756 5.61214 21.3831L5.53939 21.8604C5.47463 22.2852 5.06014 22.5644 4.63935 22.4633C4.30053 22.3819 4 22.0933 4 21.75V20.5H5.5C5.77614 20.5 6 20.2761 6 20V18.5C6 18.2239 5.77614 18 5.5 18H3.5C3.22386 18 3 17.7761 3 17.5V16C3 15.7239 3.22386 15.5 3.5 15.5H5C5.27614 15.5 5.5 15.2761 5.5 15V13.5C5.5 13.2239 5.27614 13 5 13H4C3.72386 13 3.5 12.7761 3.5 12.5V11C3.5 10.7239 3.72386 10.5 4 10.5H6.5C6.77614 10.5 7 10.2761 7 10V8.5C7 8.22386 6.77614 8 6.5 8H5.5C5.22386 8 5 7.77614 5 7.5V6C5 5.72386 5.22386 5.5 5.5 5.5H8.5C8.77614 5.5 9 5.27614 9 5V3.5C9 3.22386 8.77614 3 8.5 3H7.5C7.22386 3 7 2.77614 7 2.5V2.1C8.5 2.03 10.2 2 12 2C17.5 2 22 6.5 22 12C22 17.5 17.5 22 12 22Z"/></svg>
          </button>
          <button className="action-btn text-btn" onClick={resetModel}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset
          </button>
          <button 
            className={`action-btn primary-btn ${activePreset === 'imported' ? 'disabled' : ''}`}
            onClick={saveModel}
            disabled={activePreset === 'imported'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
        </div>
      </header>

      <div className="main-content">
        
        {/* 2. DOCK-ALIGNED LEFT SIDEBAR */}
        <aside className="app-sidebar">
          
          {/* Preset Segmented Tabs + Import Segment */}
          <div className="tabs-container" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {Object.keys(PRESETS).map(key => (
              <button 
                key={key} 
                className={`tab-item ${activePreset === key ? 'active' : ''}`}
                onClick={() => applyPreset(key)}
              >
                {PRESETS[key].name}
              </button>
            ))}
            <button 
              className={`tab-item ${activePreset === 'imported' ? 'active' : ''}`}
              onClick={() => setActivePreset('imported')}
            >
              Import
            </button>
          </div>

          {/* Conditional Sidebar Content: Procedural Controls or Custom Importer Inspector */}
          {activePreset === 'imported' ? (
            <div className="sidebar-section">
              <h3 className="section-title">Model Checker</h3>
              
              {importedScene ? (
                <div className="imported-inspector-panel">
                  {/* File Info */}
                  <div className="model-info-card">
                    <p className="info-title">File Details</p>
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value text-truncate" title={importedFile.name}>{importedFile.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Size</span>
                      <span className="info-value">{importedFile.size}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Meshes</span>
                      <span className="info-value">{meshCount} nodes</span>
                    </div>
                  </div>

                  {/* Visualizer Checks */}
                  <div className="inspector-controls" style={{ marginTop: 20 }}>
                    <p className="info-title">Inspector Toggles</p>
                    
                    <div className="check-row">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={wireframeMode}
                          onChange={(e) => setWireframeMode(e.target.checked)}
                        />
                        <span className="slider-switch"></span>
                      </label>
                      <span className="check-label">Wireframe Mesh</span>
                    </div>
                  </div>

                  {/* Load another button */}
                  <button className="import-action-btn" onClick={triggerFileSelect} style={{ marginTop: 25 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Load New Model
                  </button>
                </div>
              ) : (
                <div className="dropzone-panel" onClick={triggerFileSelect}>
                  <div className="dropzone-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="dropzone-main-text">Import 3D Model</p>
                    <p className="dropzone-sub-text">Click to browse or drag & drop a .glb / .gltf file here</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="sidebar-section">
              <h3 className="section-title">Vehicle Specifications</h3>
              
              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Chassis Length</span>
                  <span className="spec-value-badge">{specs.chassisLength.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="2.0" 
                  max="5.0" 
                  step="0.05"
                  value={specs.chassisLength} 
                  onChange={(e) => handleSliderChange('chassisLength', e.target.value)} 
                />
              </div>

              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Chassis Width</span>
                  <span className="spec-value-badge">{specs.chassisWidth.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="1.2" 
                  max="2.5" 
                  step="0.05"
                  value={specs.chassisWidth} 
                  onChange={(e) => handleSliderChange('chassisWidth', e.target.value)} 
                />
              </div>

              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Chassis Height</span>
                  <span className="spec-value-badge">{specs.chassisHeight.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="1.0" 
                  step="0.02"
                  value={specs.chassisHeight} 
                  onChange={(e) => handleSliderChange('chassisHeight', e.target.value)} 
                />
              </div>

              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Cabin Length</span>
                  <span className="spec-value-badge">{specs.cabinLength.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="1.0" 
                  max="3.0" 
                  step="0.05"
                  value={specs.cabinLength} 
                  onChange={(e) => handleSliderChange('cabinLength', e.target.value)} 
                />
              </div>

              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Cabin Height</span>
                  <span className="spec-value-badge">{specs.cabinHeight.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="0.4" 
                  max="1.5" 
                  step="0.05"
                  value={specs.cabinHeight} 
                  onChange={(e) => handleSliderChange('cabinHeight', e.target.value)} 
                />
              </div>

              <div className="spec-item">
                <div className="spec-header">
                  <span className="spec-label">Wheel Radius</span>
                  <span className="spec-value-badge">{specs.wheelRadius.toFixed(2)} m</span>
                </div>
                <input 
                  type="range" 
                  min="0.3" 
                  max="0.8" 
                  step="0.02"
                  value={specs.wheelRadius} 
                  onChange={(e) => handleSliderChange('wheelRadius', e.target.value)} 
                />
              </div>
            </div>
          )}

          {/* Action Cards Group */}
          <div className="sidebar-section action-section" style={{ marginTop: 'auto' }}>
            <h3 className="section-title">Actions</h3>
            <div className="actions-grid">
              <button 
                className={`card-action-btn ${activePreset === 'imported' ? 'disabled' : ''}`}
                onClick={randomizeModel}
                disabled={activePreset === 'imported'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V21H16"/><path d="M4 12V4H12"/><path d="M21 3H16V8"/><path d="M4 20h8"/><path d="M21 21L12 12"/><path d="M21 3L3 21"/></svg>
                <span>Randomize</span>
              </button>
              <button className="card-action-btn" onClick={resetModel}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>{activePreset === 'imported' ? 'Clear' : 'Reset'}</span>
              </button>
              <button 
                className={`card-action-btn ${activePreset === 'imported' ? 'disabled' : ''}`}
                onClick={saveModel}
                disabled={activePreset === 'imported'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>Save</span>
              </button>
            </div>
          </div>
        </aside>

        {/* 3. VIEWPORT CONTAINER (With floating HUD details) */}
        <main className="viewport-area">
          {/* Drag & Drop Canvas Overlay (only active when dragging files) */}
          <div className="drag-overlay-message">
            <div className="overlay-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p>Drop file here to import model</p>
            </div>
          </div>

          {/* Floating Orbit Instructions */}
          <div className="viewport-hud-card floating-instructions">
            <div className="instructions-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></svg>
            </div>
            <div className="instructions-text">
              <p>Drag to rotate</p>
              <p>Scroll to zoom</p>
              <p>Right click to pan</p>
              <p className="kbd-note">Or use keyboard: arrow keys, +/- keys</p>
            </div>
          </div>

          {/* Floating Bottom Toolbar */}
          <div className="viewport-hud-card floating-bottom-toolbar">
            <button className="toolbar-icon-btn active" title="Orbit Control Mode">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></svg>
            </button>
            <button className="toolbar-icon-btn" title="Pan Control Mode">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9"/><path d="M6 14v1a5 5 0 0 0 5 5h3a6 6 0 0 0 6-6V10a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/></svg>
            </button>
            <button className="toolbar-icon-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            </button>
          </div>

          {/* R3F Canvas */}
          <div className="canvas-container-full">
            <Scene 
              specs={specs} 
              color={COLOR_PALETTE[colorIndex].hex} 
              preset={activePreset}
              cameraAngle={cameraAngle}
              cameraPitch={cameraPitch}
              cameraDistance={cameraDistance}
              importedScene={activePreset === 'imported' ? importedScene : null}
            />
          </div>

          {/* Live paint color name indicator */}
          {activePreset !== 'imported' && (
            <div className="paint-indicator">
              <span>Paint: {COLOR_PALETTE[colorIndex].name}</span>
              <div className="paint-dot" style={{ backgroundColor: COLOR_PALETTE[colorIndex].hex }} />
            </div>
          )}
        </main>
      </div>

      {/* Toast Alert popup */}
      {toast && <div className="toast-msg">{toast}</div>}
    </div>
  )
}
