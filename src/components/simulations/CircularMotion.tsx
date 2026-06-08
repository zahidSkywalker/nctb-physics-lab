'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

export default function CircularMotion() {
  const { radius, angularVelocity, mass } = useControls({
    radius: { value: 4, min: 1, max: 10, step: 0.5, label: 'Radius (m)' },
    angularVelocity: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Angular Velocity (rad/s)' },
    mass: { value: 2, min: 0.5, max: 10, step: 0.5, label: 'Mass (kg)' },
  })

  const ballRef = useRef<THREE.Mesh>(null)
  const velArrowRef = useRef<THREE.ArrowHelper>(null)
  const forceArrowRef = useRef<THREE.ArrowHelper>(null)
  const stringRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(0)

  const centripetalForce = mass * angularVelocity * angularVelocity * radius
  const linearVelocity = angularVelocity * radius
  const period = (2 * Math.PI) / angularVelocity
  const frequency = 1 / period

  useFrame((_, delta) => {
    angleRef.current += angularVelocity * delta
    const a = angleRef.current

    if (ballRef.current) {
      const x = radius * Math.cos(a)
      const z = radius * Math.sin(a)
      ballRef.current.position.set(x, 0.5, z)

      // String
      if (stringRef.current) {
        const midX = x / 2
        const midZ = z / 2
        stringRef.current.position.set(midX, 0.5, midZ)
        stringRef.current.scale.set(1, 1, radius)
        stringRef.current.lookAt(new THREE.Vector3(0, 0.5, 0))
      }

      // Velocity arrow (tangential)
      if (velArrowRef.current) {
        velArrowRef.current.position.set(x, 0.5, z)
        const vLen = Math.min(linearVelocity * 0.08, 2)
        const vDir = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize()
        velArrowRef.current.setDirection(vDir)
        velArrowRef.current.setLength(vLen, vLen * 0.2, vLen * 0.1)
      }

      // Force arrow (centripetal - toward center)
      if (forceArrowRef.current) {
        forceArrowRef.current.position.set(x, 0.5, z)
        const fLen = Math.min(centripetalForce * 0.004, 2)
        const fDir = new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a)).normalize()
        forceArrowRef.current.setDirection(fDir)
        forceArrowRef.current.setLength(fLen, fLen * 0.2, fLen * 0.1)
      }
    }
  })

  return (
    <Canvas camera={{ position: [0, 8, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[30, 30, '#222', '#111']} />

      {/* Orbit path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Center */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <Text position={[0, 0.6, 0]} fontSize={0.15} color="#888">
        Center
      </Text>

      {/* String */}
      <mesh ref={stringRef} position={[2, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
        <meshStandardMaterial color="#aaa" />
      </mesh>

      {/* Ball */}
      <mesh ref={ballRef} position={[radius, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Velocity Arrow */}
      <arrowHelper ref={velArrowRef} args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(radius, 0.5, 0), 1, 0x00ff88]} />

      {/* Force Arrow */}
      <arrowHelper ref={forceArrowRef} args={[new THREE.Vector3(-1, 0, 0), new THREE.Vector3(radius, 0.5, 0), 1, 0xff4444]} />

      {/* Legend */}
      <Html position={[-6, 4, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Circular Motion</p>
          <p className="text-xs text-green-400">→ Green: Velocity (tangential)</p>
          <p className="text-xs text-red-400">→ Red: Centripetal Force</p>
        </div>
      </Html>

      {/* Info Panel */}
      <Html position={[5, 4, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="text-xs text-white">Period: {period.toFixed(2)} s</p>
          <p className="text-xs text-white">Frequency: {frequency.toFixed(2)} Hz</p>
          <p className="text-xs text-white">v = {linearVelocity.toFixed(2)} m/s</p>
          <p className="text-xs text-green-400">Fc = mv²/r = {centripetalForce.toFixed(1)} N</p>
          <p className="mt-1 text-xs text-gray-400">Fc = mω²r</p>
        </div>
      </Html>
    </Canvas>
  )
}
