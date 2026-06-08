'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'

function Scene() {
  const { magnetSpeed, coilTurns, magnetStrength } = useControls({
    magnetSpeed: { value: 2, min: 0.5, max: 5, step: 0.5, label: 'Magnet Speed (m/s)' },
    coilTurns: { value: 50, min: 10, max: 200, step: 10, label: 'Coil Turns' },
    magnetStrength: { value: 0.8, min: 0.1, max: 2, step: 0.1, label: 'Magnet Strength (T)' },
  })

  const magnetRef = useRef<THREE.Group>(null)
  const needleRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const frameRef = useRef(0)

  const [emfDisplay, setEmfDisplay] = useState(0)

  const coilRadius = 1.5
  const travelDist = 8

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    const magnetPos = Math.sin(t * magnetSpeed * 0.5) * travelDist

    if (magnetRef.current) {
      magnetRef.current.position.x = magnetPos
    }

    const velocity = magnetSpeed * travelDist * Math.cos(t * magnetSpeed * 0.5) * 0.5
    const area = Math.PI * coilRadius * coilRadius
    const emf = coilTurns * magnetStrength * area * Math.abs(velocity) * 0.0001

    if (needleRef.current) {
      const maxAngle = Math.PI / 4
      const deflection = Math.max(-maxAngle, Math.min(maxAngle, velocity * 0.3))
      needleRef.current.rotation.z = -deflection
    }

    // Throttle display updates
    frameRef.current++
    if (frameRef.current % 5 === 0) {
      setEmfDisplay(emf)
    }
  })

  const numVisibleCoils = Math.min(Math.floor(coilTurns / 10), 6)

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[25, 10]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[25, 25, '#222', '#111']} />

      {/* Coil */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: numVisibleCoils }).map((_, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[i * 0.08 - numVisibleCoils * 0.04, 0, 0]}>
            <torusGeometry args={[coilRadius, 0.05, 8, 32]} />
            <meshStandardMaterial color="#cc8844" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        <Text position={[0, coilRadius + 0.5, 0]} fontSize={0.15} color="#cc8844">
          {`Coil (${coilTurns} turns)`}
        </Text>
      </group>

      {/* Magnet */}
      <group ref={magnetRef} position={[travelDist, 0, 0]}>
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.8]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.2} />
        </mesh>
        <Text position={[-0.6, 0.6, 0]} fontSize={0.2} color="#ff4444">
          N
        </Text>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.8]} />
          <meshStandardMaterial color="#4488ff" emissive="#0044ff" emissiveIntensity={0.2} />
        </mesh>
        <Text position={[0.6, 0.6, 0]} fontSize={0.2} color="#4488ff">
          S
        </Text>
      </group>

      {/* Wire connections */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([coilRadius, 0, 0, coilRadius + 2, 0, 0, coilRadius + 2, -3, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#cc8844" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={new Float32Array([coilRadius, -0.3, 0, coilRadius + 2.3, -0.3, 0, coilRadius + 2.3, -3, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#cc8844" />
      </line>

      {/* Galvanometer */}
      <group position={[coilRadius + 2, -3.5, 0]}>
        <mesh>
          <cylinderGeometry args={[1, 1, 0.3, 16]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
        <Text position={[0, 0.3, 0]} fontSize={0.18} color="#00d4ff">
          G
        </Text>
        <Text position={[0, -0.7, 0]} fontSize={0.1} color="#888">
          Galvanometer
        </Text>
        <group ref={needleRef}>
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.03, 0.8, 0.03]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
        </group>
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshBasicMaterial color="#666" />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshBasicMaterial color="#666" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshBasicMaterial color="#666" />
        </mesh>
      </group>

      {/* Info Panel */}
      <Html position={[-6, 4, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[200px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Electromagnetic Induction</p>
          <p className="text-xs text-white">EMF = -N × dΦ/dt</p>
          <p className="text-xs text-white">Φ = B × A</p>
          <p className="text-xs text-green-400">EMF ≈ {emfDisplay.toFixed(4)} V</p>
          <p className="text-xs text-gray-400">N = {coilTurns} turns</p>
          <p className="text-xs text-gray-400">B = {magnetStrength} T</p>
          <p className="text-xs text-gray-400">v = {magnetSpeed} m/s</p>
          <p className="mt-1 text-xs text-gray-400">Faraday&apos;s Law:</p>
          <p className="text-xs text-gray-400">Changing flux induces EMF</p>
        </div>
      </Html>
    </>
  )
}

export default function EMInduction() {
  return (
    <Canvas camera={{ position: [0, 5, 14], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
