'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { Suspense, useState, useMemo, useRef } from 'react'
import * as THREE from 'three'

function ControlPanel({
  charge1, setCharge1, charge2, setCharge2, distance, setDistance,
}: {
  charge1: number; setCharge1: (v: number) => void
  charge2: number; setCharge2: (v: number) => void
  distance: number; setDistance: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Charge 1: {charge1 > 0 ? '+' : ''}{charge1} μC</span>
        <input type="range" min={-10} max={10} step={0.5} value={charge1}
          onChange={e => setCharge1(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Charge 2: {charge2 > 0 ? '+' : ''}{charge2} μC</span>
        <input type="range" min={-10} max={10} step={0.5} value={charge2}
          onChange={e => setCharge2(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Distance: {distance} m</span>
        <input type="range" min={1} max={10} step={0.5} value={distance}
          onChange={e => setDistance(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

function FieldLines({ charge1, charge2, halfDist }: { charge1: number; charge2: number; halfDist: number }) {
  const linesRef = useRef<THREE.Group>(null)
  const numLines = 12

  const lineData = useMemo(() => {
    const data: { points: number[][]; color: string }[] = []

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2
      const points: number[][] = []
      let x = -halfDist + 0.5 * Math.cos(angle)
      let z = 0.5 * Math.sin(angle)

      for (let step = 0; step < 100; step++) {
        points.push([x, 0.3, z])

        const dx1 = x - (-halfDist)
        const dz1 = z - 0
        const r1 = Math.sqrt(dx1 * dx1 + dz1 * dz1)
        const E1x = charge1 * dx1 / Math.pow(r1, 3)
        const E1z = charge1 * dz1 / Math.pow(r1, 3)

        const dx2 = x - halfDist
        const dz2 = z - 0
        const r2 = Math.sqrt(dx2 * dx2 + dz2 * dz2)
        const E2x = charge2 * dx2 / Math.pow(r2, 3)
        const E2z = charge2 * dz2 / Math.pow(r2, 3)

        const Ex = E1x + E2x
        const Ez = E1z + E2z
        const Em = Math.sqrt(Ex * Ex + Ez * Ez)

        if (Em < 0.001) break

        const stepSize = 0.15
        x += (Ex / Em) * stepSize
        z += (Ez / Em) * stepSize

        if (Math.abs(x) > 10 || Math.abs(z) > 5) break
        if (Math.sqrt((x - halfDist) ** 2 + z ** 2) < 0.3) break
      }

      data.push({
        points,
        color: '#ffaa00',
      })
    }
    return data
  }, [charge1, charge2, halfDist])

  return (
    <group ref={linesRef}>
      {lineData.map((line, i) => {
        if (line.points.length < 2) return null
        const flatPoints = line.points.flat()
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={line.points.length}
                array={new Float32Array(flatPoints)}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffaa00" transparent opacity={0.25} />
          </line>
        )
      })}
    </group>
  )
}

function Scene({ charge1, charge2, distance }: { charge1: number; charge2: number; distance: number }) {
  const k = 8.99e9
  const q1 = charge1 * 1e-6
  const q2 = charge2 * 1e-6
  const r = distance
  const F = k * Math.abs(q1 * q2) / (r * r)
  const isAttractive = charge1 * charge2 < 0

  const halfDist = distance / 2

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

      {/* Field lines */}
      <FieldLines charge1={charge1} charge2={charge2} halfDist={halfDist} />

      {/* Charge 1 */}
      <mesh position={[-halfDist, 0.5, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={charge1 >= 0 ? '#ff4444' : '#4488ff'}
          emissive={charge1 >= 0 ? '#ff0000' : '#0044ff'}
          emissiveIntensity={0.4}
        />
      </mesh>
      <Text position={[-halfDist, 1.2, 0]} fontSize={0.18} color={charge1 >= 0 ? '#ff4444' : '#4488ff'}>
        {`q₁ = ${charge1 > 0 ? '+' : ''}${charge1} μC`}
      </Text>

      {/* Charge 2 */}
      <mesh position={[halfDist, 0.5, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={charge2 >= 0 ? '#ff4444' : '#4488ff'}
          emissive={charge2 >= 0 ? '#ff0000' : '#0044ff'}
          emissiveIntensity={0.4}
        />
      </mesh>
      <Text position={[halfDist, 1.2, 0]} fontSize={0.18} color={charge2 >= 0 ? '#ff4444' : '#4488ff'}>
        {`q₂ = ${charge2 > 0 ? '+' : ''}${charge2} μC`}
      </Text>

      {/* Force arrows */}
      {charge1 !== 0 && charge2 !== 0 && (
        <>
          <arrowHelper
            args={[
              new THREE.Vector3(isAttractive ? 1 : -1, 0, 0),
              new THREE.Vector3(-halfDist + 0.5, 0.5, 0),
              Math.min(F * 1e-6 * 2, 2),
              0x00ff88,
            ]}
          />
          <arrowHelper
            args={[
              new THREE.Vector3(isAttractive ? -1 : 1, 0, 0),
              new THREE.Vector3(halfDist - 0.5, 0.5, 0),
              Math.min(F * 1e-6 * 2, 2),
              0x00ff88,
            ]}
          />
        </>
      )}

      {/* Distance label */}
      <Text position={[0, -0.5, 0]} fontSize={0.15} color="#888">
        {`r = ${distance} m`}
      </Text>

      {/* Info Panel */}
      <Html position={[0, 5, -4]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Electrostatics - Coulomb&apos;s Law</p>
          <p className="text-xs text-white">F = kq₁q₂/r²</p>
          <p className="text-xs text-green-400">F = {F.toExponential(3)} N</p>
          <p className="text-xs text-white">k = 8.99 × 10⁹ N·m²/C²</p>
          <p className="text-xs text-gray-400">→ Green: Force direction</p>
          <p className="text-xs text-gray-400">{isAttractive ? 'Charges attract (opposite signs)' : 'Charges repel (same signs)'}</p>
          <p className="text-xs text-red-400">● Positive charge</p>
          <p className="text-xs text-blue-400">● Negative charge</p>
        </div>
      </Html>
    </>
  )
}

export default function Electrostatics() {
  const [charge1, setCharge1] = useState(5)
  const [charge2, setCharge2] = useState(-3)
  const [distance, setDistance] = useState(5)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 5, 14], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene charge1={charge1} charge2={charge2} distance={distance} />
        </Suspense>
      </Canvas>
      <ControlPanel charge1={charge1} setCharge1={setCharge1} charge2={charge2} setCharge2={setCharge2} distance={distance} setDistance={setDistance} />
    </div>
  )
}
