'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

function ElasticityInner() {
  const { springConstant, mass, displacement } = useControls({
    springConstant: { value: 30, min: 5, max: 100, step: 5, label: 'Spring Constant (N/m)' },
    mass: { value: 3, min: 0.5, max: 10, step: 0.5, label: 'Hanging Mass (kg)' },
    displacement: { value: 1.5, min: 0.1, max: 3, step: 0.1, label: 'Initial Displacement (m)' },
  })

  const massRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  const omega = Math.sqrt(springConstant / mass)
  const period = (2 * Math.PI) / omega
  const hookeForce = springConstant * displacement
  const anchorY = 2

  useFrame((_, delta) => {
    timeRef.current += delta
    if (massRef.current) {
      const y = displacement * Math.cos(omega * timeRef.current)
      massRef.current.position.y = -5 - y
    }
  })

  return (
    <>
      {/* Background wall */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[10, 15]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Anchor point */}
      <mesh position={[0, anchorY, 0]}>
        <boxGeometry args={[1, 0.2, 0.5]} />
        <meshStandardMaterial color="#444" metalness={0.6} />
      </mesh>
      <Text position={[0, anchorY + 0.4, 0]} fontSize={0.15} color="#888">
        Anchor
      </Text>

      {/* Spring */}
      <SpringVisual anchorY={anchorY} displacement={displacement} omega={omega} timeRef={timeRef} />

      {/* Mass */}
      <mesh ref={massRef} position={[0, -5 - displacement, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.2} />
      </mesh>

      {/* Mass label */}
      <MassLabel mass={mass} omega={omega} displacement={displacement} timeRef={timeRef} />

      {/* Equilibrium line */}
      <mesh position={[0, -5, 0]}>
        <boxGeometry args={[2, 0.02, 0.01]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <Text position={[1.3, -5, 0]} fontSize={0.12} color="#ff4444">
        Equilibrium
      </Text>

      {/* Info Panel */}
      <Html position={[4, -2, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[200px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Elasticity - Hooke&apos;s Law</p>
          <p className="text-xs text-white">F = -kx = {hookeForce.toFixed(1)} N</p>
          <p className="text-xs text-white">k = {springConstant} N/m</p>
          <p className="text-xs text-white">ω = √(k/m) = {omega.toFixed(2)} rad/s</p>
          <p className="text-xs text-white">T = 2π/ω = {period.toFixed(2)} s</p>
          <p className="mt-1 text-xs text-gray-400">F = -kx (restoring force)</p>
          <p className="text-xs text-gray-400">x = A·cos(ωt)</p>
        </div>
      </Html>
    </>
  )
}

export default function Elasticity() {
  return (
    <Canvas camera={{ position: [0, -2, 8], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Environment preset="city" />
      <OrbitControls makeDefault />
      <Suspense fallback={null}>
        <ElasticityInner />
      </Suspense>
    </Canvas>
  )
}

function SpringVisual({
  anchorY,
  displacement,
  omega,
  timeRef,
}: {
  anchorY: number
  displacement: number
  omega: number
  timeRef: React.RefObject<number>
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const coils = 10

  useFrame(() => {
    const t = timeRef.current ?? 0
    const y = displacement * Math.cos(omega * t)
    const massY = -5 - y

    const points: THREE.Vector3[] = []
    const segs = coils * 10
    const springTop = anchorY - 0.1
    const springBottom = massY + 0.4
    const springLength = springTop - springBottom

    for (let i = 0; i <= segs; i++) {
      const frac = i / segs
      const py = springTop - frac * springLength
      const phase = frac * coils * Math.PI * 2
      const r = 0.3
      points.push(new THREE.Vector3(Math.cos(phase) * r, py, Math.sin(phase) * r))
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

  const initialSegs = coils * 10 + 1
  const initialPos = new Float32Array(initialSegs * 3)

  return (
    <group>
      <line>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attach="attributes-position"
            count={initialSegs}
            array={initialPos}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#aaa" />
      </line>
    </group>
  )
}

function MassLabel({
  mass,
  timeRef,
  omega,
  displacement,
}: {
  mass: number
  timeRef: React.RefObject<number>
  omega: number
  displacement: number
}) {
  const textRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = timeRef.current ?? 0
    const y = displacement * Math.cos(omega * t)
    if (textRef.current) {
      textRef.current.position.y = -5 - y + 0.8
    }
  })

  return (
    <group ref={textRef} position={[0, 0, 0]}>
      <Text fontSize={0.18} color="#00d4ff">
        {`${mass} kg`}
      </Text>
    </group>
  )
}
