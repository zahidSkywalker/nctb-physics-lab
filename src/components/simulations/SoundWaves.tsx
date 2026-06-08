'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  frequency, setFrequency, amplitude, setAmplitude,
}: {
  frequency: number; setFrequency: (v: number) => void
  amplitude: number; setAmplitude: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Frequency: {frequency} Hz</span>
        <input type="range" min={0.5} max={5} step={0.1} value={frequency}
          onChange={e => setFrequency(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Amplitude: {amplitude}</span>
        <input type="range" min={0.1} max={2} step={0.1} value={amplitude}
          onChange={e => setAmplitude(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

function Scene({ frequency, amplitude }: { frequency: number; amplitude: number }) {
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

        const displacement = amplitude * 0.3 * Math.sin(2 * Math.PI * (baseX * 0.5 - frequency * t))
        const x = baseX + displacement

        const pressure = -amplitude * 0.3 * 2 * Math.PI * 0.5 * Math.cos(2 * Math.PI * (baseX * 0.5 - frequency * t))
        const density = 1 + pressure * 0.5

        dummy.position.set(x, 0, baseZ)
        const s = Math.max(0.3, density * 0.3)
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        particlesRef.current.setMatrixAt(i, dummy.matrix)

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
  const [frequency, setFrequency] = useState(2)
  const [amplitude, setAmplitude] = useState(1)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 6, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene frequency={frequency} amplitude={amplitude} />
        </Suspense>
      </Canvas>
      <ControlPanel frequency={frequency} setFrequency={setFrequency} amplitude={amplitude} setAmplitude={setAmplitude} />
    </div>
  )
}
