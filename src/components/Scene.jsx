import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import Vehicle from './Vehicle'

// Smoothly interpolates the camera to the target coordinates calculated from the keyboard state
function CameraController({ angle, pitch, distance }) {
  const { camera } = useThree();

  useFrame(() => {
    const targetX = distance * Math.cos(pitch) * Math.sin(angle);
    const targetY = distance * Math.sin(pitch);
    const targetZ = distance * Math.cos(pitch) * Math.cos(angle);

    // Lerp position for micro-animation smoothing
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
    camera.lookAt(0, 0.2, 0); // Focus camera at the center of the vehicle
  });

  return null;
}

export default function Scene({ 
  specs, 
  color, 
  preset, 
  cameraAngle, 
  cameraPitch, 
  cameraDistance 
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 3, 5], fov: 45 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#0a0b0d']} />

      <Suspense fallback={null}>
        {/* Procedural Vehicle */}
        <Vehicle specs={specs} color={color} preset={preset} />

        {/* Ambient & soft environment lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        
        {/* Secondary styling rim light */}
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.5} 
          color="#00e5ff"
        />

        {/* Premium city lighting backdrop */}
        <Environment preset="city" />

        {/* Dynamic smooth floor shadows */}
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.8} 
          scale={15} 
          blur={1.8} 
          far={3} 
        />
      </Suspense>

      {/* Control the camera smoothly using keyboard orbit coordinates */}
      <CameraController 
        angle={cameraAngle} 
        pitch={cameraPitch} 
        distance={cameraDistance} 
      />
    </Canvas>
  )
}
