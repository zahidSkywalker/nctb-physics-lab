'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

function MomentumInner() {
  const { mass1, mass2, velocity1, velocity2, elastic } = useControls({
    mass1: { value: 5, min: 1, max: 20, step: 0.5, label: 'Ball 1 Mass (kg)' },
    mass2: { value: 3, min: 1, max: 20, step: 0.5, label: 'Ball 2 Mass (kg)' },
    velocity1: { value: 8, min: -15, max: 15, step: 0.5, label: 'Ball 1 Velocity (m/s)' },
    velocity2: { value: -4, min: -15, max: 15, step: 0.5, label: 'Ball 2 Velocity (m/s)' },
    elastic: { value: 1, min: 0, max: 1, step: 1, label: '1=Elastic, 0=Inelastic' },
  })

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
      if (elastic === 1) {
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
          <p className="text-xs text-gray-400">{elastic === 1 ? 'Elastic' : 'Perfectly Inelastic'}</p>
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
  return (
    <Canvas camera={{ position: [0, 4, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <Environment preset="city" />
      <OrbitControls makeDefault />
      <MomentumInner />
    </Canvas>
  )
}
