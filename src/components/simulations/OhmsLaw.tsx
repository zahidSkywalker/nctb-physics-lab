'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  voltage, setVoltage, resistance, setResistance,
}: {
  voltage: number; setVoltage: (v: number) => void
  resistance: number; setResistance: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Voltage: {voltage} V</span>
        <input type="range" min={1} max={24} step={0.5} value={voltage}
          onChange={e => setVoltage(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Resistance: {resistance} Ω</span>
        <input type="range" min={1} max={100} step={1} value={resistance}
          onChange={e => setResistance(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

function CurrentParticles({
  current,
  circuitWidth,
  circuitHeight,
}: {
  current: number
  circuitWidth: number
  circuitHeight: number
}) {
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const timeRef = useRef(0)
  const numParticles = 20
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const perimeter = 2 * (circuitWidth + circuitHeight)
  const speed = Math.min(current * 0.5, 5)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = (timeRef.current * speed * 0.3) % 1

    if (particlesRef.current) {
      for (let i = 0; i < numParticles; i++) {
        const frac = ((t + i / numParticles) % 1)
        const dist = frac * perimeter
        let x: number, y: number

        if (dist < circuitWidth) {
          x = -circuitWidth / 2 + dist
          y = 0
        } else if (dist < circuitWidth + circuitHeight) {
          x = circuitWidth / 2
          y = dist - circuitWidth
        } else if (dist < 2 * circuitWidth + circuitHeight) {
          x = circuitWidth / 2 - (dist - circuitWidth - circuitHeight)
          y = circuitHeight
        } else {
          x = -circuitWidth / 2
          y = circuitHeight - (dist - 2 * circuitWidth - circuitHeight)
        }

        dummy.position.set(x, y, 0.1)
        dummy.scale.set(0.08, 0.08, 0.08)
        dummy.updateMatrix()
        particlesRef.current.setMatrixAt(i, dummy.matrix)
      }
      particlesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, numParticles]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} />
    </instancedMesh>
  )
}

function Scene({ voltage, resistance }: { voltage: number; resistance: number }) {
  const current = voltage / resistance
  const power = voltage * current

  const circuitWidth = 6
  const circuitHeight = 4

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[20, 20, '#222', '#111']} />

      {/* Circuit wires */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[circuitWidth, 0.05, 0.05]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-circuitWidth / 2, circuitHeight / 2, 0]}>
          <boxGeometry args={[0.05, circuitHeight, 0.05]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, circuitHeight, 0]}>
          <boxGeometry args={[circuitWidth, 0.05, 0.05]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[circuitWidth / 2, circuitHeight / 2, 0]}>
          <boxGeometry args={[0.05, circuitHeight, 0.05]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Battery (left side) */}
      <group position={[-circuitWidth / 2, circuitHeight / 2, 0.2]}>
        <mesh>
          <boxGeometry args={[0.6, 1.2, 0.4]} />
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.3]} fontSize={0.18} color="#00d4ff">
          {`${voltage}V`}
        </Text>
        <Text position={[0, -1, 0.3]} fontSize={0.12} color="#888">
          Battery
        </Text>
        <Text position={[0.2, 0.6, 0.3]} fontSize={0.15} color="#ff4444">
          +
        </Text>
        <Text position={[0.2, -0.6, 0.3]} fontSize={0.15} color="#4488ff">
          −
        </Text>
      </group>

      {/* Resistor (top) */}
      <group position={[0, circuitHeight, 0.2]}>
        <mesh>
          <boxGeometry args={[1.2, 0.3, 0.3]} />
          <meshStandardMaterial color="#886644" roughness={0.8} />
        </mesh>
        <mesh position={[-0.3, 0, 0.16]}>
          <boxGeometry args={[0.08, 0.32, 0.01]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[0.08, 0.32, 0.01]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        <Text position={[0, -0.4, 0]} fontSize={0.15} color="#ffaa00">
          {`${resistance}Ω`}
        </Text>
        <Text position={[0, -0.7, 0]} fontSize={0.12} color="#888">
          Resistor
        </Text>
      </group>

      {/* Ammeter (right side) */}
      <group position={[circuitWidth / 2, circuitHeight / 2, 0.2]}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <Text position={[0, 0, 0.55]} fontSize={0.18} color="#00ff88">
          A
        </Text>
        <Text position={[0, -0.8, 0.3]} fontSize={0.12} color="#888">
          Ammeter
        </Text>
      </group>

      {/* Current flow particles */}
      <CurrentParticles current={current} circuitWidth={circuitWidth} circuitHeight={circuitHeight} />

      {/* Current direction arrows */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, circuitHeight, 0.3), 0.8, 0x00ff88]} />
      <arrowHelper args={[new THREE.Vector3(0, -1, 0), new THREE.Vector3(circuitWidth / 2, circuitHeight - 0.5, 0.3), 0.8, 0x00ff88]} />
      <arrowHelper args={[new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0.3), 0.8, 0x00ff88]} />
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(-circuitWidth / 2, 0.5, 0.3), 0.8, 0x00ff88]} />

      {/* Info Panel */}
      <Html position={[5, 4, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[220px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Ohm&apos;s Law</p>
          <p className="text-xs text-white">V = I × R</p>
          <p className="text-xs text-white">I = V/R = {current.toFixed(3)} A</p>
          <p className="text-xs text-white">P = VI = {power.toFixed(2)} W</p>
          <p className="mt-2 text-xs text-gray-400">V = {voltage} V</p>
          <p className="text-xs text-gray-400">R = {resistance} Ω</p>
          <p className="text-xs text-gray-400">I = {current.toFixed(3)} A</p>
          <p className="text-xs text-green-400 mt-1">● Green: Current flow direction</p>
        </div>
      </Html>
    </>
  )
}

export default function OhmsLaw() {
  const [voltage, setVoltage] = useState(12)
  const [resistance, setResistance] = useState(20)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 5, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene voltage={voltage} resistance={resistance} />
        </Suspense>
      </Canvas>
      <ControlPanel voltage={voltage} setVoltage={setVoltage} resistance={resistance} setResistance={setResistance} />
    </div>
  )
}
