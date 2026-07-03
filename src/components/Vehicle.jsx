import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Vehicle({ specs, color, preset }) {
  const {
    chassisLength,
    chassisWidth,
    chassisHeight,
    cabinLength,
    cabinWidth,
    cabinHeight,
    cabinOffset,
    wheelRadius,
    wheelWidth,
  } = specs;

  const vehicleRef = useRef();

  // Slow automatic chassis vibration/suspension micro-animation to make the car feel "alive"
  useFrame((state) => {
    if (vehicleRef.current) {
      const time = state.clock.getElapsedTime();
      vehicleRef.current.position.y = Math.sin(time * 2.5) * 0.012;
      vehicleRef.current.rotation.z = Math.sin(time * 1.5) * 0.003;
    }
  });

  // Calculate dynamic heights to keep the car grounded (Y = 0 is the floor)
  // Wheels touch the ground, so their center is at Y = wheelRadius
  const axleY = wheelRadius;
  const chassisY = axleY + chassisHeight / 2;
  const cabinY = axleY + chassisHeight + cabinHeight / 2;

  // Wheel offsets (X is front/back, Z is left/right)
  const wheelXOffset = chassisLength / 2 * 0.72;
  const wheelZOffset = chassisWidth / 2 + wheelWidth / 4;

  return (
    <group>
      {/* Floating/Vibrating Vehicle Body */}
      <group ref={vehicleRef}>
        
        {/* 1. MAIN CHASSIS */}
        <mesh castShadow receiveShadow position={[0, chassisY, 0]}>
          <boxGeometry args={[chassisLength, chassisHeight, chassisWidth]} />
          <meshPhysicalMaterial 
            color={color} 
            roughness={0.12} 
            metalness={0.8}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 2. PASSENGER CABIN */}
        <mesh castShadow receiveShadow position={[cabinOffset, cabinY, 0]}>
          <boxGeometry args={[cabinLength, cabinHeight, cabinWidth * 0.95]} />
          <meshPhysicalMaterial 
            color={color} 
            roughness={0.12} 
            metalness={0.8}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 3. CABIN WINDOWS (Front, Back, Sides) */}
        {/* Windshield */}
        <mesh position={[cabinOffset + cabinLength / 2 + 0.005, cabinY + 0.05, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.02, cabinHeight * 0.7, cabinWidth * 0.85]} />
          <meshStandardMaterial color="#111318" roughness={0.05} metalness={0.9} transparent opacity={0.9} />
        </mesh>
        
        {/* Rear Windshield */}
        <mesh position={[cabinOffset - cabinLength / 2 - 0.005, cabinY + 0.05, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.02, cabinHeight * 0.7, cabinWidth * 0.85]} />
          <meshStandardMaterial color="#111318" roughness={0.05} metalness={0.9} transparent opacity={0.9} />
        </mesh>

        {/* Side Windows (Left) */}
        <mesh position={[cabinOffset, cabinY + 0.05, cabinWidth * 0.475 + 0.005]}>
          <boxGeometry args={[cabinLength * 0.8, cabinHeight * 0.6, 0.01]} />
          <meshStandardMaterial color="#111318" roughness={0.05} metalness={0.9} transparent opacity={0.9} />
        </mesh>

        {/* Side Windows (Right) */}
        <mesh position={[cabinOffset, cabinY + 0.05, -cabinWidth * 0.475 - 0.005]}>
          <boxGeometry args={[cabinLength * 0.8, cabinHeight * 0.6, 0.01]} />
          <meshStandardMaterial color="#111318" roughness={0.05} metalness={0.9} transparent opacity={0.9} />
        </mesh>

        {/* 4. GLOWING HEADLIGHTS */}
        <mesh position={[chassisLength / 2 + 0.01, chassisY + chassisHeight * 0.15, chassisWidth * 0.35]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
        </mesh>
        <mesh position={[chassisLength / 2 + 0.01, chassisY + chassisHeight * 0.15, -chassisWidth * 0.35]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
        </mesh>

        {/* 5. TAILLIGHTS */}
        <mesh position={[-chassisLength / 2 - 0.01, chassisY + chassisHeight * 0.15, chassisWidth * 0.38]}>
          <boxGeometry args={[0.02, 0.08, 0.18]} />
          <meshStandardMaterial color="#ff002b" emissive="#ff002b" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[-chassisLength / 2 - 0.01, chassisY + chassisHeight * 0.15, -chassisWidth * 0.38]}>
          <boxGeometry args={[0.02, 0.08, 0.18]} />
          <meshStandardMaterial color="#ff002b" emissive="#ff002b" emissiveIntensity={2.0} />
        </mesh>

        {/* 6. PRESET SPECIFIC ADDONS */}
        
        {/* SPORTS CAR SPOILER */}
        {preset === 'sports' && (
          <group position={[-chassisLength / 2 + 0.15, chassisY + chassisHeight / 2 + 0.1, 0]}>
            {/* Struts */}
            <mesh castShadow position={[0, 0.1, chassisWidth * 0.3]}>
              <boxGeometry args={[0.06, 0.2, 0.04]} />
              <meshStandardMaterial color="#1f2025" roughness={0.5} />
            </mesh>
            <mesh castShadow position={[0, 0.1, -chassisWidth * 0.3]}>
              <boxGeometry args={[0.06, 0.2, 0.04]} />
              <meshStandardMaterial color="#1f2025" roughness={0.5} />
            </mesh>
            {/* Wing */}
            <mesh castShadow position={[0, 0.2, 0]}>
              <boxGeometry args={[0.22, 0.03, chassisWidth * 0.9]} />
              <meshPhysicalMaterial color={color} roughness={0.15} metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* PICKUP TRUCK BED */}
        {preset === 'truck' && (
          <group position={[(cabinOffset - cabinLength / 2) / 2 - chassisLength / 4, chassisY + chassisHeight / 2, 0]}>
            {/* Bed floor/liner */}
            <mesh castShadow receiveShadow position={[0, 0.01, 0]}>
              <boxGeometry args={[chassisLength / 2, 0.02, chassisWidth * 0.9]} />
              <meshStandardMaterial color="#1a1a1c" roughness={0.8} />
            </mesh>
            {/* Left Side bed wall */}
            <mesh castShadow position={[0, 0.2, chassisWidth * 0.45]}>
              <boxGeometry args={[chassisLength / 2, 0.4, 0.06]} />
              <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.8} />
            </mesh>
            {/* Right Side bed wall */}
            <mesh castShadow position={[0, 0.2, -chassisWidth * 0.45]}>
              <boxGeometry args={[chassisLength / 2, 0.4, 0.06]} />
              <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.8} />
            </mesh>
            {/* Tailgate */}
            <mesh castShadow position={[-chassisLength / 4 + 0.03, 0.2, 0]}>
              <boxGeometry args={[0.06, 0.4, chassisWidth * 0.9]} />
              <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* SUV ROOF RACK */}
        {preset === 'suv' && (
          <group position={[cabinOffset, cabinY + cabinHeight / 2 + 0.02, 0]}>
            {/* Left rail */}
            <mesh castShadow position={[0, 0.04, cabinWidth * 0.4]}>
              <boxGeometry args={[cabinLength * 0.8, 0.04, 0.04]} />
              <meshStandardMaterial color="#1f2025" roughness={0.6} />
            </mesh>
            {/* Right rail */}
            <mesh castShadow position={[0, 0.04, -cabinWidth * 0.4]}>
              <boxGeometry args={[cabinLength * 0.8, 0.04, 0.04]} />
              <meshStandardMaterial color="#1f2025" roughness={0.6} />
            </mesh>
            {/* Cross bars */}
            <mesh castShadow position={[cabinLength * 0.25, 0.05, 0]}>
              <boxGeometry args={[0.03, 0.02, cabinWidth * 0.8]} />
              <meshStandardMaterial color="#1f2025" roughness={0.6} />
            </mesh>
            <mesh castShadow position={[-cabinLength * 0.25, 0.05, 0]}>
              <boxGeometry args={[0.03, 0.02, cabinWidth * 0.8]} />
              <meshStandardMaterial color="#1f2025" roughness={0.6} />
            </mesh>
          </group>
        )}

      </group>

      {/* 7. WHEELS (Grounded, do not bounce with suspension to simulate tire contact) */}
      <group>
        {/* Front Left */}
        <group position={[wheelXOffset, axleY, wheelZOffset]}>
          <Wheel meshRadius={wheelRadius} meshWidth={wheelWidth} />
        </group>
        {/* Front Right */}
        <group position={[wheelXOffset, axleY, -wheelZOffset]}>
          <Wheel meshRadius={wheelRadius} meshWidth={wheelWidth} />
        </group>
        {/* Rear Left */}
        <group position={[-wheelXOffset, axleY, wheelZOffset]}>
          <Wheel meshRadius={wheelRadius} meshWidth={wheelWidth} />
        </group>
        {/* Rear Right */}
        <group position={[-wheelXOffset, axleY, -wheelZOffset]}>
          <Wheel meshRadius={wheelRadius} meshWidth={wheelWidth} />
        </group>
      </group>
    </group>
  )
}

// Subcomponent to render a premium wheel with tire rubber and metallic chrome rims
function Wheel({ meshRadius, meshWidth }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Outer Rubber Tire */}
      <mesh castShadow>
        <cylinderGeometry args={[meshRadius, meshRadius, meshWidth, 32]} />
        <meshStandardMaterial color="#1b1c20" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Inner Chrome Rim */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <cylinderGeometry args={[meshRadius * 0.65, meshRadius * 0.65, meshWidth + 0.01, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.12} metalness={0.9} />
      </mesh>

      {/* Center cap / hub styling details */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[meshRadius * 0.15, meshRadius * 0.15, meshWidth + 0.02, 8]} />
        <meshStandardMaterial color="#16171d" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}
