'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

function StarField() {
  const ref = useRef<THREE.Points>(null)
  const positions = new Float32Array(600)
  for (let i = 0; i < 200; i++) {
    positions[i * 3] = (i * 0.5 - 50) % 40 - 20
    positions[i * 3 + 1] = ((i * 7) % 30) + 3
    positions[i * 3 + 2] = ((i * 13) % 30) - 15
  }

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={200} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} />
    </points>
  )
}

function Scene() {
  const { mass1, mass2, distance } = useControls({
    mass1: { value: 20, min: 1, max: 50, step: 1, label: 'Body 1 Mass (×10¹² kg)' },
    mass2: { value: 10, min: 1, max: 50, step: 1, label: 'Body 2 Mass (×10¹² kg)' },
    distance: { value: 8, min: 2, max: 15, step: 0.5, label: 'Distance (m)' },
  })

  const G = 6.674e-11
  const m1 = mass1 * 1e12
  const m2 = mass2 * 1e12
  const r = distance
  const F = G * m1 * m2 / (r * r)

  const body1Ref = useRef<THREE.Mesh>(null)
  const body2Ref = useRef<THREE.Mesh>(null)
  const arrow1Ref = useRef<THREE.ArrowHelper>(null)
  const arrow2Ref = useRef<THREE.ArrowHelper>(null)

  const halfDist = distance / 2
  const r1 = Math.max(0.3, 0.3 + mass1 * 0.02)
  const r2 = Math.max(0.3, 0.3 + mass2 * 0.02)

  const arrowLen = Math.min(F * 1e8, 3)

  useFrame(() => {
    if (body1Ref.current) body1Ref.current.position.x = -halfDist
    if (body2Ref.current) body2Ref.current.position.x = halfDist

    if (arrow1Ref.current) {
      arrow1Ref.current.position.set(-halfDist + r1 + 0.1, 0, 0)
      arrow1Ref.current.setDirection(new THREE.Vector3(1, 0, 0))
      arrow1Ref.current.setLength(arrowLen, arrowLen * 0.2, arrowLen * 0.1)
    }
    if (arrow2Ref.current) {
      arrow2Ref.current.position.set(halfDist - r2 - 0.1, 0, 0)
      arrow2Ref.current.setDirection(new THREE.Vector3(-1, 0, 0))
      arrow2Ref.current.setLength(arrowLen, arrowLen * 0.2, arrowLen * 0.1)
    }
  })

  // Field lines between bodies
  const fieldLineCount = 6

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Space background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0a14" />
      </mesh>
      <gridHelper args={[40, 40, '#111', '#0a0a14']} />

      {/* Stars */}
      <StarField />

      {/* Body 1 */}
      <mesh ref={body1Ref} position={[-halfDist, 0, 0]}>
        <sphereGeometry args={[r1, 32, 32]} />
        <meshStandardMaterial color="#4488ff" emissive="#2244aa" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[-halfDist, r1 + 0.4, 0]} fontSize={0.18} color="#4488ff">
        {`M₁ = ${mass1}×10¹² kg`}
      </Text>

      {/* Body 2 */}
      <mesh ref={body2Ref} position={[halfDist, 0, 0]}>
        <sphereGeometry args={[r2, 32, 32]} />
        <meshStandardMaterial color="#ff8844" emissive="#aa4422" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[halfDist, r2 + 0.4, 0]} fontSize={0.18} color="#ff8844">
        {`M₂ = ${mass2}×10¹² kg`}
      </Text>

      {/* Force arrows */}
      <arrowHelper ref={arrow1Ref} args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-halfDist + 1, 0, 0), 1, 0x00ff88]} />
      <arrowHelper ref={arrow2Ref} args={[new THREE.Vector3(-1, 0, 0), new THREE.Vector3(halfDist - 1, 0, 0), 1, 0x00ff88]} />

      {/* Field lines */}
      {Array.from({ length: fieldLineCount }).map((_, i) => {
        const y = (i - (fieldLineCount - 1) / 2) * 0.4
        return (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[0.01, 0.01, distance - r1 - r2, 4]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
          </mesh>
        )
      })}

      {/* Distance label */}
      <Text position={[0, -0.8, 0]} fontSize={0.15} color="#888">
        {`r = ${distance} m`}
      </Text>

      {/* Info Panel */}
      <Html position={[0, 4, -4]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Gravitational Force</p>
          <p className="text-xs text-white">F = Gm₁m₂/r²</p>
          <p className="text-xs text-green-400">F = {F.toExponential(3)} N</p>
          <p className="text-xs text-gray-400">G = 6.674 × 10⁻¹¹ N·m²/kg²</p>
          <p className="text-xs text-gray-400">Both bodies attract each other</p>
          <p className="text-xs text-gray-400">→ Green arrows: Gravitational force</p>
        </div>
      </Html>
    </>
  )
}

export default function Gravitation() {
  return (
    <Canvas camera={{ position: [0, 5, 14], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Scene />
    </Canvas>
  )
}
