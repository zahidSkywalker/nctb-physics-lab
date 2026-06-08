'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Scene() {
  const { frequency, amplitude } = useControls({
    frequency: { value: 2, min: 0.5, max: 5, step: 0.1, label: 'Frequency (Hz)' },
    amplitude: { value: 1, min: 0.1, max: 2, step: 0.1, label: 'Amplitude' },
  })

  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const timeRef = useRef(0)
  const numParticles = 300
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorRef = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (particlesRef.current) {
      for (let i = 0; i < numParticles; i++) {
        const row = Math.floor(i / 20)
        const col = i % 20
        const baseX = col * 0.5 - 4.5
        const baseZ = row * 0.5 - 3.5

        // Longitudinal displacement
        const displacement = amplitude * 0.3 * Math.sin(2 * Math.PI * (baseX * 0.5 - frequency * t))
        const x = baseX + displacement

        // Density visualization (compression/rarefaction)
        const pressure = -amplitude * 0.3 * 2 * Math.PI * 0.5 * Math.cos(2 * Math.PI * (baseX * 0.5 - frequency * t))
        const density = 1 + pressure * 0.5

        dummy.position.set(x, 0, baseZ)
        const s = Math.max(0.3, density * 0.3)
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        particlesRef.current.setMatrixAt(i, dummy.matrix)

        // Color based on pressure
        const p = pressure * 0.5
        if (p > 0) {
          colorRef.setRGB(p, 0.2, 0.8 - p * 0.6)
        } else {
          colorRef.setRGB(0.2 - p * 0.1, 0.6 + p * 0.2, 1)
        }
        particlesRef.current.setColorAt(i, colorRef)
      }
      particlesRef.current.instanceMatrix.needsUpdate = true
      if (particlesRef.current.instanceColor) {
        particlesRef.current.instanceColor.needsUpdate = true
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[20, 20, '#222', '#111']} position={[0, -0.49, 0]} />

      {/* Speaker */}
      <group position={[-6, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 1.2, 1.5]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0, 0.76]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <Text position={[0, 1.0, 0]} fontSize={0.2} color="#00d4ff">
          Speaker
        </Text>
      </group>

      {/* Particles (air molecules) */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, numParticles]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial />
      </instancedMesh>

      {/* Labels */}
      <Text position={[-2, 2, 0]} fontSize={0.18} color="#ff4444">
        Compression
      </Text>
      <Text position={[2, 2, 0]} fontSize={0.18} color="#4488ff">
        Rarefaction
      </Text>

      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-5, -0.3, 0), 2, 0xffff00]} />
      <Text position={[-5, -0.6, 0]} fontSize={0.15} color="#ffff00">
        Propagation
      </Text>

      {/* Info Panel */}
      <Html position={[5, 4, -2]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Sound Waves (Longitudinal)</p>
          <p className="text-xs text-white">f = {frequency} Hz</p>
          <p className="text-xs text-white">λ = v/f</p>
          <p className="text-xs text-white">v = 343 m/s (in air)</p>
          <p className="text-xs text-gray-400 mt-1">Red particles: Compression (high P)</p>
          <p className="text-xs text-gray-400">Blue particles: Rarefaction (low P)</p>
          <p className="text-xs text-gray-400 mt-1">Particles oscillate parallel</p>
          <p className="text-xs text-gray-400">to the direction of propagation</p>
        </div>
      </Html>
    </>
  )
}

export default function SoundWaves() {
  return (
    <Canvas camera={{ position: [0, 6, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Scene />
    </Canvas>
  )
}
