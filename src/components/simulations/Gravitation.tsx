'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  mass1, setMass1, mass2, setMass2, distance, setDistance,
}: {
  mass1: number; setMass1: (v: number) => void
  mass2: number; setMass2: (v: number) => void
  distance: number; setDistance: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Mass 1: {mass1} (×10¹² kg)</span>
        <input type="range" min={1} max={50} step={1} value={mass1}
          onChange={e => setMass1(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Mass 2: {mass2} (×10¹² kg)</span>
        <input type="range" min={1} max={50} step={1} value={mass2}
          onChange={e => setMass2(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Distance: {distance} m</span>
        <input type="range" min={2} max={15} step={0.5} value={distance}
          onChange={e => setDistance(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

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

function Scene({ mass1, mass2, distance }: { mass1: number; mass2: number; distance: number }) {
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

  const fieldLineCount = 6

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
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
  const [mass1, setMass1] = useState(20)
  const [mass2, setMass2] = useState(15)
  const [distance, setDistance] = useState(8)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 5, 14], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene mass1={mass1} mass2={mass2} distance={distance} />
        </Suspense>
      </Canvas>
      <ControlPanel mass1={mass1} setMass1={setMass1} mass2={mass2} setMass2={setMass2} distance={distance} setDistance={setDistance} />
    </div>
  )
}
