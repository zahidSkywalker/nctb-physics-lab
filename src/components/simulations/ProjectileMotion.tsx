'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useCallback } from 'react'
import * as THREE from 'three'

function Scene() {
  const { angle, velocity, gravity } = useControls({
    angle: { value: 45, min: 0, max: 90, step: 1, label: 'Launch Angle (°)' },
    velocity: { value: 20, min: 1, max: 50, step: 1, label: 'Initial Velocity (m/s)' },
    gravity: { value: 9.8, min: 1, max: 20, step: 0.5, label: 'Gravity (m/s²)' },
  })

  const ballRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points>(null)
  const trailGeomRef = useRef<THREE.BufferGeometry | null>(null)
  const timeRef = useRef(0)
  const trailCountRef = useRef(0)
  const firingRef = useRef(false)
  const initializedRef = useRef(false)

  const rad = (angle * Math.PI) / 180
  const totalTime = (2 * velocity * Math.sin(rad)) / gravity
  const range = (velocity * velocity * Math.sin(2 * rad)) / gravity
  const maxHeight = (velocity * velocity * Math.sin(rad) * Math.sin(rad)) / (2 * gravity)

  const handleLaunch = useCallback(() => {
    timeRef.current = 0
    trailCountRef.current = 0
    if (trailGeomRef.current) {
      const posAttr = trailGeomRef.current.getAttribute('position') as THREE.BufferAttribute
      if (posAttr) {
        posAttr.set(0)
        posAttr.needsUpdate = true
      }
      trailGeomRef.current.setDrawRange(0, 0)
    }
    firingRef.current = true
  }, [])

  useFrame((_, delta) => {
    // Initialize geometry on first frame
    if (!initializedRef.current) {
      initializedRef.current = true
      const buf = new Float32Array(3000)
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(buf, 3))
      geom.setDrawRange(0, 0)
      trailGeomRef.current = geom
    }

    if (!firingRef.current || !ballRef.current || !trailRef.current) return

    timeRef.current += delta * 1.5

    const t = timeRef.current
    const x = velocity * Math.cos(rad) * t
    const y = velocity * Math.sin(rad) * t - 0.5 * gravity * t * t

    ballRef.current.position.x = x
    ballRef.current.position.y = Math.max(y, 0)

    const geom = trailGeomRef.current
    if (geom && y >= 0 && trailCountRef.current < 1000) {
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute
      const idx = trailCountRef.current * 3
      if (posAttr && posAttr.array) {
        posAttr.array[idx] = x
        posAttr.array[idx + 1] = Math.max(y, 0)
        posAttr.array[idx + 2] = 0
        posAttr.needsUpdate = true
      }
      trailCountRef.current++
      geom.setDrawRange(0, trailCountRef.current)
    }

    if (t > totalTime) {
      firingRef.current = false
      ballRef.current.position.x = 0
      ballRef.current.position.y = 0
    }
  })

  const cannonAngle = rad

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 20]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <gridHelper args={[50, 50, '#222', '#111']} position={[0, 0.01, 0]} />

      {/* Cannon */}
      <group position={[0, 0.5, 0]} rotation={[0, 0, cannonAngle]}>
        <mesh position={[1, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
          <meshStandardMaterial color="#444" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>

      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.3, 12]} />
        <meshStandardMaterial color="#333" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Ball */}
      <mesh ref={ballRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Trail */}
      <points ref={trailRef}>
        <bufferGeometry />
        <pointsMaterial size={0.08} color="#00d4ff" transparent opacity={0.6} />
      </points>

      {/* Landing marker */}
      <mesh position={[range, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.4, 16]} />
        <meshStandardMaterial color="#ff4444" transparent opacity={0.5} />
      </mesh>
      <Text position={[range, 0.3, 0]} fontSize={0.18} color="#ff4444">
        {`R = ${range.toFixed(1)} m`}
      </Text>

      {/* Max height marker */}
      <line position={[range / 2, 0.01, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, maxHeight, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff88" />
      </line>
      <Text position={[range / 2 - 1, maxHeight + 0.2, 0]} fontSize={0.15} color="#00ff88">
        {`H = ${maxHeight.toFixed(1)} m`}
      </Text>

      {/* Info Panel */}
      <Html position={[0, 5, -3]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Projectile Motion</p>
          <p className="text-xs text-white">Range: {range.toFixed(1)} m</p>
          <p className="text-xs text-white">Max Height: {maxHeight.toFixed(1)} m</p>
          <p className="text-xs text-white">Time of Flight: {totalTime.toFixed(2)} s</p>
          <p className="text-xs text-gray-400">Angle: {angle}° | v₀: {velocity} m/s</p>
          <button
            onClick={handleLaunch}
            className="mt-2 rounded bg-[#00d4ff] px-3 py-1 text-xs font-bold text-black hover:bg-[#00aadd]"
          >
            LAUNCH
          </button>
        </div>
      </Html>
    </>
  )
}

export default function ProjectileMotion() {
  return (
    <Canvas camera={{ position: [0, 8, 18], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Scene />
    </Canvas>
  )
}
