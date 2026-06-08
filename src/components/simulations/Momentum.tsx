'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  mass1, setMass1, mass2, setMass2, velocity1, setVelocity1, velocity2, setVelocity2, elastic, setElastic, onReset,
}: {
  mass1: number; setMass1: (v: number) => void
  mass2: number; setMass2: (v: number) => void
  velocity1: number; setVelocity1: (v: number) => void
  velocity2: number; setVelocity2: (v: number) => void
  elastic: boolean; setElastic: (v: boolean) => void
  onReset: () => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Mass 1: {mass1} kg</span>
        <input type="range" min={1} max={20} step={0.5} value={mass1}
          onChange={e => setMass1(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Mass 2: {mass2} kg</span>
        <input type="range" min={1} max={20} step={0.5} value={mass2}
          onChange={e => setMass2(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Velocity 1: {velocity1} m/s</span>
        <input type="range" min={1} max={10} step={0.5} value={velocity1}
          onChange={e => setVelocity1(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Velocity 2: {velocity2} m/s</span>
        <input type="range" min={-10} max={0} step={0.5} value={velocity2}
          onChange={e => setVelocity2(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={elastic} onChange={e => setElastic(e.target.checked)}
          className="accent-[#00d4ff]" />
        <span className="text-xs text-gray-400">Elastic</span>
      </label>
      <button
        onClick={onReset}
        className="w-full rounded bg-[#00d4ff] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#00aadd] transition-colors"
      >
        RESET
      </button>
    </div>
  )
}

function Scene({
  mass1, mass2, velocity1, velocity2, elastic, resetKey,
}: {
  mass1: number; mass2: number; velocity1: number; velocity2: number; elastic: boolean; resetKey: number
}) {
  const [displayState, setDisplayState] = useState({ collided: false, afterV1: 0, afterV2: 0 })

  const ball1Ref = useRef<THREE.Mesh>(null)
  const ball2Ref = useRef<THREE.Mesh>(null)
  const pos1Ref = useRef(-5)
  const pos2Ref = useRef(5)
  const vel1Ref = useRef(velocity1)
  const vel2Ref = useRef(velocity2)
  const collidedRef = useRef(false)

  const r1 = 0.3 + mass1 * 0.03
  const r2 = 0.3 + mass2 * 0.03
  const pBefore = mass1 * velocity1 + mass2 * velocity2

  useFrame((_, delta) => {
    pos1Ref.current += vel1Ref.current * delta * 0.5
    pos2Ref.current += vel2Ref.current * delta * 0.5

    if (!collidedRef.current && pos1Ref.current + r1 >= pos2Ref.current - r2) {
      collidedRef.current = true
      const m1 = mass1, m2 = mass2, u1 = vel1Ref.current, u2 = vel2Ref.current
      let v1: number, v2: number
      if (elastic) {
        v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2)
        v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2)
      } else {
        const vf = (m1 * u1 + m2 * u2) / (m1 + m2)
        v1 = vf
        v2 = vf
      }
      vel1Ref.current = v1
      vel2Ref.current = v2
      setDisplayState({ collided: true, afterV1: v1, afterV2: v2 })
    }

    if (ball1Ref.current) ball1Ref.current.position.x = pos1Ref.current
    if (ball2Ref.current) ball2Ref.current.position.x = pos2Ref.current
  })

  const pAfter = displayState.collided ? mass1 * displayState.afterV1 + mass2 * displayState.afterV2 : pBefore

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <gridHelper args={[30, 30, '#222', '#111']} />

      {/* Ball 1 */}
      <mesh ref={ball1Ref} position={[-5, r1, 0]}>
        <sphereGeometry args={[r1, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.2} />
      </mesh>
      <Text position={[-5, r1 * 2 + 0.4, 0]} fontSize={0.2} color="#00d4ff">
        {`${mass1} kg`}
      </Text>

      {/* Ball 2 */}
      <mesh ref={ball2Ref} position={[5, r2, 0]}>
        <sphereGeometry args={[r2, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.2} />
      </mesh>
      <Text position={[5, r2 * 2 + 0.4, 0]} fontSize={0.2} color="#ff6b6b">
        {`${mass2} kg`}
      </Text>

      {/* Velocity arrows */}
      <arrowHelper
        args={[
          new THREE.Vector3(velocity1 > 0 ? 1 : -1, 0, 0),
          new THREE.Vector3(-5, r1, 0),
          Math.abs(velocity1) * 0.15,
          0x00d4ff,
        ]}
      />
      <arrowHelper
        args={[
          new THREE.Vector3(velocity2 > 0 ? 1 : -1, 0, 0),
          new THREE.Vector3(5, r2, 0),
          Math.abs(velocity2) * 0.15,
          0xff6b6b,
        ]}
      />

      {/* Info Panel */}
      <Html position={[0, 4, -3]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[220px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Linear Momentum & Collision</p>
          <p className="text-xs text-gray-400">{elastic ? 'Elastic' : 'Perfectly Inelastic'}</p>
          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="text-xs text-gray-400">BEFORE:</p>
            <p className="text-xs text-white">p = {pBefore.toFixed(1)} kg·m/s</p>
            <p className="text-xs text-gray-400">v₁ = {velocity1} m/s, v₂ = {velocity2} m/s</p>
          </div>
          {displayState.collided && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="text-xs text-gray-400">AFTER:</p>
              <p className="text-xs text-white">p = {pAfter.toFixed(1)} kg·m/s</p>
              <p className="text-xs text-cyan-400">v₁ = {displayState.afterV1.toFixed(2)} m/s</p>
              <p className="text-xs text-red-400">v₂ = {displayState.afterV2.toFixed(2)} m/s</p>
              <p className="mt-1 text-xs text-green-400">✓ Momentum Conserved: {Math.abs(pBefore - pAfter) < 0.1 ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </Html>
    </>
  )
}

export default function Momentum() {
  const [mass1, setMass1] = useState(5)
  const [mass2, setMass2] = useState(3)
  const [velocity1, setVelocity1] = useState(5)
  const [velocity2, setVelocity2] = useState(-3)
  const [elastic, setElastic] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  const handleReset = () => setResetKey(k => k + 1)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <OrbitControls makeDefault />
        <Suspense fallback={null}>
          <Scene key={resetKey} mass1={mass1} mass2={mass2} velocity1={velocity1} velocity2={velocity2} elastic={elastic} resetKey={resetKey} />
        </Suspense>
      </Canvas>
      <ControlPanel mass1={mass1} setMass1={setMass1} mass2={mass2} setMass2={setMass2} velocity1={velocity1} setVelocity1={setVelocity1} velocity2={velocity2} setVelocity2={setVelocity2} elastic={elastic} setElastic={setElastic} onReset={handleReset} />
    </div>
  )
}
