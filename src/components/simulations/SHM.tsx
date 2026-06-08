'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

export default function SHM() {
  const { amplitude, mass, springConstant } = useControls({
    amplitude: { value: 1.5, min: 0.2, max: 3, step: 0.1, label: 'Amplitude (m)' },
    mass: { value: 2, min: 0.5, max: 10, step: 0.5, label: 'Mass (kg)' },
    springConstant: { value: 20, min: 5, max: 80, step: 5, label: 'Spring Constant (N/m)' },
  })

  const omega = Math.sqrt(springConstant / mass)
  const period = (2 * Math.PI) / omega
  const frequency = 1 / period

  const massRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    const displacement = amplitude * Math.cos(omega * t)

    if (massRef.current) {
      massRef.current.position.x = displacement
    }
  })

  return (
    <Canvas camera={{ position: [0, 5, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[20, 20, '#222', '#111']} />

      {/* Wall */}
      <mesh position={[-4, 1, 0]}>
        <boxGeometry args={[0.3, 2, 2]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>

      {/* Spring */}
      <SHMSpring amplitude={amplitude} omega={omega} timeRef={timeRef} />

      {/* Mass */}
      <mesh ref={massRef} position={[amplitude, 1, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Equilibrium marker */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.02, 1.4, 0.02]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.5} />
      </mesh>
      <Text position={[0, -0.3, 0]} fontSize={0.12} color="#ff4444">
        Equilibrium (x=0)
      </Text>

      {/* Amplitude markers */}
      <mesh position={[-amplitude, 0.3, 0]}>
        <boxGeometry args={[0.02, 1.2, 0.02]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
      </mesh>
      <mesh position={[amplitude, 0.3, 0]}>
        <boxGeometry args={[0.02, 1.2, 0.02]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
      </mesh>
      <Text position={[-amplitude, -0.3, 0]} fontSize={0.12} color="#00ff88">
        -A
      </Text>
      <Text position={[amplitude, -0.3, 0]} fontSize={0.12} color="#00ff88">
        +A
      </Text>

      {/* Graph axes */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[10, 0.02, 0.02]} />
        <meshBasicMaterial color="#555" />
      </mesh>
      <Text position={[5, 4.2, 0]} fontSize={0.12} color="#888">
        t
      </Text>
      <Text position={[-5.5, 4, 0]} fontSize={0.12} color="#888">
        x(t)
      </Text>

      {/* Graph line (drawn in useFrame) */}
      <SHMGraphLine amplitude={amplitude} omega={omega} timeRef={timeRef} />

      {/* Info Panel */}
      <Html position={[0, 7, -4]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[220px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Simple Harmonic Motion</p>
          <p className="text-xs text-white">x(t) = A·cos(ωt)</p>
          <p className="text-xs text-white">T = 2π√(m/k) = {period.toFixed(3)} s</p>
          <p className="text-xs text-white">f = 1/T = {frequency.toFixed(3)} Hz</p>
          <p className="text-xs text-white">ω = √(k/m) = {omega.toFixed(3)} rad/s</p>
          <p className="text-xs text-gray-400 mt-1">A = {amplitude} m</p>
          <p className="text-xs text-gray-400">m = {mass} kg</p>
          <p className="text-xs text-gray-400">k = {springConstant} N/m</p>
        </div>
      </Html>
    </Canvas>
  )
}

function SHMGraphLine({
  amplitude,
  omega,
  timeRef,
}: {
  amplitude: number
  omega: number
  timeRef: React.RefObject<number>
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const lineRef = useRef<THREE.Line>(null)
  const initializedRef = useRef(false)
  const maxPoints = 200

  useFrame(() => {
    const t = timeRef.current ?? 0

    if (!geomRef.current) {
      const buf = new Float32Array(maxPoints * 3)
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(buf, 3))
      geom.setDrawRange(0, 0)
      geomRef.current = geom
      if (lineRef.current) {
        lineRef.current.geometry = geom
      }
    }

    const points: [number, number, number][] = []
    for (let i = 0; i < maxPoints; i++) {
      const gt = t - (maxPoints - i) * 0.05
      if (gt < 0) continue
      const gx = (i - maxPoints / 2) * 0.05
      const gy = amplitude * Math.cos(omega * gt) * 0.8 + 4
      points.push([gx, gy, 0])
    }

    if (geomRef.current && points.length > 1) {
      const arr = new Float32Array(points.length * 3)
      points.forEach((p, idx) => {
        arr[idx * 3] = p[0]
        arr[idx * 3 + 1] = p[1]
        arr[idx * 3 + 2] = p[2]
      })
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      geomRef.current.setDrawRange(0, points.length)
      geomRef.current.computeBoundingSphere()
    }
  })

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#00d4ff" linewidth={1} />
    </line>
  )
}

function SHMSpring({
  amplitude,
  omega,
  timeRef,
}: {
  amplitude: number
  omega: number
  timeRef: React.RefObject<number>
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const coils = 14

  useFrame(() => {
    const t = timeRef.current ?? 0
    const displacement = amplitude * Math.cos(omega * t)

    const wallX = -4
    const massX = displacement
    const springStart = wallX + 0.15
    const springEnd = massX - 0.3
    const springLength = springEnd - springStart

    const points: THREE.Vector3[] = []
    const segs = coils * 10
    for (let i = 0; i <= segs; i++) {
      const frac = i / segs
      const x = springStart + frac * springLength
      const phase = frac * coils * Math.PI * 2
      const r = 0.25
      points.push(new THREE.Vector3(x, 1 + Math.cos(phase) * r, Math.sin(phase) * r))
    }

    if (geomRef.current) {
      const posArr = new Float32Array(points.length * 3)
      points.forEach((p, i) => {
        posArr[i * 3] = p.x
        posArr[i * 3 + 1] = p.y
        posArr[i * 3 + 2] = p.z
      })
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
      geomRef.current.computeBoundingSphere()
    }
  })

  const initialCount = coils * 10 + 1
  const initialPos = new Float32Array(initialCount * 3)

  return (
    <line>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={initialCount}
          array={initialPos}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#aaa" />
    </line>
  )
}
