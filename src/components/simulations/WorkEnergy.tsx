'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function WorkEnergyInner() {
  const [display, setDisplay] = useState({ pos: 0, vel: 0, ke: 0, pe: 0, work: 0 })

  const { angle, force, mass } = useControls({
    angle: { value: 30, min: 10, max: 60, step: 1, label: 'Incline Angle (°)' },
    force: { value: 40, min: 0, max: 100, step: 1, label: 'Applied Force (N)' },
    mass: { value: 5, min: 1, max: 20, step: 0.5, label: 'Mass (kg)' },
  })

  const rad = (angle * Math.PI) / 180
  const inclineLength = 10
  const inclineHeight = inclineLength * Math.sin(rad)

  const blockRef = useRef<THREE.Mesh>(null)
  const posRef = useRef(0)
  const velRef = useRef(0)
  const keRef = useRef(0)
  const peRef = useRef(0)
  const workRef = useRef(0)
  const frameRef = useRef(0)

  const weight = mass * 9.8
  const componentAlongSlope = weight * Math.sin(rad)
  const normalForce = weight * Math.cos(rad)
  const frictionCoef = 0.15
  const frictionForce = frictionCoef * normalForce
  const netForce = force - componentAlongSlope - frictionForce
  const acceleration = netForce / mass

  useFrame((_, delta) => {
    if (acceleration > 0 && posRef.current < inclineLength - 1) {
      velRef.current += acceleration * delta
      posRef.current += velRef.current * delta

      if (posRef.current > inclineLength - 1) {
        posRef.current = inclineLength - 1
      }

      const height = posRef.current * Math.sin(rad)
      keRef.current = 0.5 * mass * velRef.current * velRef.current
      peRef.current = mass * 9.8 * height
      workRef.current = force * posRef.current
    }

    frameRef.current++
    if (frameRef.current % 5 === 0) {
      setDisplay({
        pos: posRef.current,
        vel: velRef.current,
        ke: keRef.current,
        pe: peRef.current,
        work: workRef.current,
      })
    }

    if (blockRef.current) {
      const d = posRef.current
      blockRef.current.position.set(
        d * Math.cos(rad),
        d * Math.sin(rad) + 0.35,
        0
      )
      blockRef.current.rotation.z = -rad
    }
  })

  const maxEnergy = Math.max(display.work, 1)

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <gridHelper args={[30, 30, '#222', '#111']} />

      {/* Inclined plane */}
      <mesh rotation={[0, 0, -rad]} position={[inclineLength * Math.cos(rad) / 2, inclineHeight / 2, 0]}>
        <boxGeometry args={[inclineLength, 0.2, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Block */}
      <mesh ref={blockRef} position={[1, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#00d4ff" roughness={0.3} />
      </mesh>

      {/* Labels */}
      <Text position={[inclineLength * Math.cos(rad) / 2, inclineHeight / 2 + 0.5, 0]} fontSize={0.15} color="#888">
        {`θ = ${angle}°`}
      </Text>

      {/* Info Panel */}
      <Html position={[-4, 4, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[200px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Work, Energy & Power</p>
          <p className="text-xs text-white">Distance: {display.pos.toFixed(1)} m</p>
          <p className="text-xs text-white">Velocity: {display.vel.toFixed(2)} m/s</p>
          <p className="text-xs text-gray-400">Net Force: {netForce.toFixed(1)} N</p>
          <p className="text-xs text-gray-400">Friction: {frictionForce.toFixed(1)} N</p>
          <p className="text-xs text-gray-400">Weight component: {componentAlongSlope.toFixed(1)} N</p>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded bg-[#00d4ff]" style={{ width: `${Math.min((display.work / Math.max(maxEnergy, 1)) * 100, 100)}%` }} />
              <span className="text-xs text-cyan-400">Work: {display.work.toFixed(0)} J</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 rounded bg-green-500" style={{ width: `${Math.min((display.ke / Math.max(maxEnergy, 1)) * 100, 100)}%` }} />
              <span className="text-xs text-green-400">KE: {display.ke.toFixed(0)} J</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 rounded bg-yellow-500" style={{ width: `${Math.min((display.pe / Math.max(maxEnergy, 1)) * 100, 100)}%` }} />
              <span className="text-xs text-yellow-400">PE: {display.pe.toFixed(0)} J</span>
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">W = F × d × cos θ</p>
          <p className="text-xs text-gray-400">KE = ½mv² | PE = mgh</p>
        </div>
      </Html>
    </>
  )
}

export default function WorkEnergy() {
  return (
    <Canvas camera={{ position: [8, 6, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <Environment preset="city" />
      <OrbitControls makeDefault />
      <WorkEnergyInner />
    </Canvas>
  )
}
