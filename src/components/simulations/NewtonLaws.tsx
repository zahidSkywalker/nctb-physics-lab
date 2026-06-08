'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

function Block({
  position,
  mass,
  color,
  displacement,
}: {
  position: [number, number, number]
  mass: number
  color: string
  displacement: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const size = 0.4 + mass * 0.05

  return (
    <group position={[position[0] + displacement, position[1], position[2]]}>
      <mesh ref={ref}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <Text
        position={[0, size / 2 + 0.2, 0]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {`${mass} kg`}
      </Text>
    </group>
  )
}

function ForceArrow({ from, direction, magnitude, color, label }: { from: [number, number, number]; direction: 'right' | 'left'; magnitude: number; color: string; label: string }) {
  const len = Math.min(magnitude * 0.08, 3)
  const sign = direction === 'right' ? 1 : -1

  return (
    <group position={from}>
      <mesh position={[sign * len / 2, 0, 0]} rotation={[0, 0, direction === 'left' ? Math.PI / 2 : -Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.12, len, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[sign * (len / 2 + 0.5), 0.2, 0]} fontSize={0.15} color={color}>
        {label}
      </Text>
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
      <planeGeometry args={[20, 10]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
    </mesh>
  )
}

function Scene() {
  const { mass, force, friction } = useControls({
    mass: { value: 5, min: 1, max: 20, step: 0.5, label: 'Mass (kg)' },
    force: { value: 25, min: 0, max: 100, step: 1, label: 'Applied Force (N)' },
    friction: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Friction Coefficient' },
  })

  const groupRef = useRef<THREE.Group>(null)
  const posRef = useRef(0)
  const velRef = useRef(0)
  const timeRef = useRef(0)
  const arrowRef = useRef<THREE.Group>(null)

  const acceleration = (force - friction * mass * 9.8) / mass
  const netForce = force - friction * mass * 9.8
  const frictionForce = friction * mass * 9.8

  useFrame((_, delta) => {
    timeRef.current += delta
    if (acceleration > 0) {
      velRef.current += acceleration * delta
      posRef.current += velRef.current * delta
    }
    // Wrap around
    if (posRef.current > 8) {
      posRef.current = -8
      velRef.current = 0
    }
    if (groupRef.current) {
      groupRef.current.position.x = posRef.current
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      <Ground />
      <gridHelper args={[20, 20, '#222', '#111']} position={[0, -0.29, 0]} />

      <group ref={groupRef}>
        <Block position={[-2, 0, 0]} mass={mass} color="#00d4ff" displacement={0} />
        {force > 0 && (
          <ForceArrow from={[-2 - 0.3 - mass * 0.025, 0.2, 0]} direction="right" magnitude={force} color="#00ff88" label={`F = ${force.toFixed(1)} N`} />
        )}
        {frictionForce > 0 && (
          <ForceArrow from={[-2 + 0.3 + mass * 0.025, 0.2, 0]} direction="left" magnitude={frictionForce} color="#ff4444" label={`f = ${frictionForce.toFixed(1)} N`} />
        )}
      </group>

      <group ref={arrowRef} />

      {/* Info Display */}
      <Html position={[0, 3.5, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="text-xs text-[#00d4ff] font-mono">F = ma</p>
          <p className="text-xs text-white">a = {(acceleration).toFixed(2)} m/s²</p>
          <p className="text-xs text-gray-400">Net Force = {netForce.toFixed(1)} N</p>
          <p className="text-xs text-gray-400">Friction = {frictionForce.toFixed(1)} N</p>
        </div>
      </Html>

      <Text position={[-2, -0.1, 2]} fontSize={0.15} color="#555">
        {'F = ma  |  Newton\'s 2nd Law'}
      </Text>
    </>
  )
}

export default function NewtonLaws() {
  return (
    <Canvas camera={{ position: [0, 6, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Scene />
    </Canvas>
  )
}
