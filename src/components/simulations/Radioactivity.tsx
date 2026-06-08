'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  decayRate, setDecayRate, showAlpha, setShowAlpha, showBeta, setShowBeta, showGamma, setShowGamma,
}: {
  decayRate: number; setDecayRate: (v: number) => void
  showAlpha: boolean; setShowAlpha: (v: boolean) => void
  showBeta: boolean; setShowBeta: (v: boolean) => void
  showGamma: boolean; setShowGamma: (v: boolean) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Decay Rate: {decayRate}</span>
        <input type="range" min={0.1} max={2} step={0.1} value={decayRate}
          onChange={e => setDecayRate(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={showAlpha} onChange={e => setShowAlpha(e.target.checked)}
          className="accent-[#ff4444]" />
        <span className="text-xs text-gray-400">Alpha (α)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={showBeta} onChange={e => setShowBeta(e.target.checked)}
          className="accent-[#00d4ff]" />
        <span className="text-xs text-gray-400">Beta (β)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={showGamma} onChange={e => setShowGamma(e.target.checked)}
          className="accent-[#ffaa00]" />
        <span className="text-xs text-gray-400">Gamma (γ)</span>
      </label>
    </div>
  )
}

const MAX_PARTICLES = 100

function Scene({
  decayRate, showAlpha, showBeta, showGamma,
}: {
  decayRate: number; showAlpha: boolean; showBeta: boolean; showGamma: boolean
}) {
  const sourceRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  const lastEmitRef = useRef(0)
  const decayCountRef = useRef(0)

  const particleRefs = useRef<(THREE.Mesh | null)[]>(Array.from({ length: MAX_PARTICLES }, () => null))
  const particleData = useRef(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      type: 'alpha' as 'alpha' | 'beta' | 'gamma',
      position: [0, 0, 0] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number],
      age: 0,
    }))
  )

  const halfLife = Math.LN2 / decayRate
  const lambda = Math.LN2 / halfLife

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (t - lastEmitRef.current > 0.3) {
      lastEmitRef.current = t
      const types: ('alpha' | 'beta' | 'gamma')[] = []
      if (showAlpha) types.push('alpha')
      if (showBeta) types.push('beta')
      if (showGamma) types.push('gamma')

      if (types.length > 0) {
        for (let k = 0; k < 2; k++) {
          for (let i = 0; i < MAX_PARTICLES; i++) {
            if (!particleData.current[i].active) {
              const type = types[i % types.length]
              const angle1 = ((i * 137 + k * 89) % 360) * (Math.PI / 180)
              const angle2 = ((i * 73 + k * 47) % 360) * (Math.PI / 180)
              const speed = type === 'alpha' ? 2 : type === 'beta' ? 5 : 8

              particleData.current[i] = {
                active: true,
                type,
                position: [0, 1, 0],
                velocity: [
                  Math.cos(angle1) * Math.sin(angle2) * speed,
                  Math.cos(angle2) * speed * 0.5 + 1,
                  Math.sin(angle1) * Math.sin(angle2) * speed,
                ],
                age: 0,
              }
              decayCountRef.current++
              break
            }
          }
        }
      }
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particleData.current[i]
      if (!p.active) continue

      p.age += delta
      p.position[0] += p.velocity[0] * delta
      p.position[1] += p.velocity[1] * delta
      p.position[2] += p.velocity[2] * delta

      if (p.age > 3) {
        p.active = false
      }

      const mesh = particleRefs.current[i]
      if (mesh) {
        if (p.active) {
          mesh.visible = true
          mesh.position.set(p.position[0], p.position[1], p.position[2])
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.opacity = Math.max(0, 1 - p.age * 0.3)
          }
        } else {
          mesh.visible = false
        }
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[20, 20, '#222', '#111']} />

      {/* Radioactive source */}
      <mesh ref={sourceRef} position={[0, 1, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 1, 16]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0, 2, 0]} fontSize={0.2} color="#ffaa00">
        Radioactive Source
      </Text>
      <mesh position={[0, 1.7, 0]}>
        <torusGeometry args={[0.15, 0.02, 8, 16]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>

      {/* Shielding container */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 2]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Particles */}
      {Array.from({ length: MAX_PARTICLES }).map((_, i) => {
        const color = '#00d4ff'
        return (
          <mesh
            key={i}
            ref={(el) => { particleRefs.current[i] = el }}
            position={[0, -10, 0]}
            visible={false}
          >
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent />
          </mesh>
        )
      })}

      {/* Legend */}
      <Html position={[-5, 5, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Radioactive Decay</p>
          <p className="text-xs text-red-400">● Alpha (α) - Heavy, +2 charge</p>
          <p className="text-xs text-cyan-400">● Beta (β) - Light, -1 charge</p>
          <p className="text-xs text-yellow-400">● Gamma (γ) - EM radiation</p>
        </div>
      </Html>

      {/* Decay info */}
      <Html position={[5, 5, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="text-xs text-white">Half-life: {halfLife.toFixed(2)} s</p>
          <p className="text-xs text-white">λ = ln(2)/t½ = {lambda.toFixed(4)} s⁻¹</p>
          <p className="text-xs text-gray-400">N(t) = N₀·e^(-λt)</p>
        </div>
      </Html>
    </>
  )
}

export default function Radioactivity() {
  const [decayRate, setDecayRate] = useState(0.5)
  const [showAlpha, setShowAlpha] = useState(true)
  const [showBeta, setShowBeta] = useState(true)
  const [showGamma, setShowGamma] = useState(true)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene decayRate={decayRate} showAlpha={showAlpha} showBeta={showBeta} showGamma={showGamma} />
        </Suspense>
      </Canvas>
      <ControlPanel decayRate={decayRate} setDecayRate={setDecayRate} showAlpha={showAlpha} setShowAlpha={setShowAlpha} showBeta={showBeta} setShowBeta={setShowBeta} showGamma={showGamma} setShowGamma={setShowGamma} />
    </div>
  )
}
