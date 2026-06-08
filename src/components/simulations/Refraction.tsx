'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { Suspense, useState, useMemo } from 'react'
import * as THREE from 'three'

function ControlPanel({
  incidentAngle, setIncidentAngle, refractiveIndex, setRefractiveIndex,
}: {
  incidentAngle: number; setIncidentAngle: (v: number) => void
  refractiveIndex: number; setRefractiveIndex: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Incident Angle: {incidentAngle}°</span>
        <input type="range" min={0} max={89} step={1} value={incidentAngle}
          onChange={e => setIncidentAngle(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Refractive Index: {refractiveIndex}</span>
        <input type="range" min={1} max={2.5} step={0.1} value={refractiveIndex}
          onChange={e => setRefractiveIndex(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

function AngleArcHelper({
  angle,
  centerY,
  side,
  color,
}: {
  angle: number
  centerY: number
  side: 'upper' | 'lower'
  color: string
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const segments = 16
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * angle
      if (side === 'upper') {
        pts.push(new THREE.Vector3(-Math.sin(a) * 1, Math.cos(a) * 1 + centerY, 0))
      } else {
        pts.push(new THREE.Vector3(Math.sin(a) * 1, -Math.cos(a) * 1 + centerY, 0))
      }
    }
    return pts
  }, [angle, centerY, side])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </line>
  )
}

function Scene({ incidentAngle, refractiveIndex }: { incidentAngle: number; refractiveIndex: number }) {
  const theta1 = (incidentAngle * Math.PI) / 180
  const n1 = 1.0
  const n2 = refractiveIndex

  const sinTheta2 = (n1 * Math.sin(theta1)) / n2
  const isTotalInternal = sinTheta2 > 1
  const theta2 = isTotalInternal ? Math.PI / 2 : Math.asin(sinTheta2)

  const rayLen = 6
  const slabThickness = 3

  const incStart: [number, number, number] = [
    -rayLen * Math.sin(theta1),
    rayLen * Math.cos(theta1),
    0,
  ]
  const incEnd: [number, number, number] = [0, 0, 0]

  let refEnd: [number, number, number]
  if (!isTotalInternal) {
    refEnd = [
      rayLen * Math.sin(theta2),
      -rayLen * Math.cos(theta2),
      0,
    ]
  } else {
    refEnd = [0, 0, 0]
  }

  const theta2Deg = isTotalInternal ? 90 : (theta2 * 180) / Math.PI

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <OrbitControls makeDefault />

      {/* Upper medium (air) */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[12, 6, 3]} />
        <meshStandardMaterial color="#111122" transparent opacity={0.3} />
      </mesh>
      <Text position={[-5, 5, 0]} fontSize={0.2} color="#666">
        Air (n₁ = 1.0)
      </Text>

      {/* Lower medium (glass/water) */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[12, slabThickness, 3]} />
        <meshStandardMaterial color="#223366" transparent opacity={0.4} />
      </mesh>
      <Text position={[-5, -3.5, 0]} fontSize={0.2} color="#6688cc">
        {`Medium (n₂ = ${refractiveIndex})`}
      </Text>

      {/* Interface line */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[12, 0.04, 3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Normal line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -4, 0, 0, 4, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </line>
      <Text position={[0.2, 3.5, 0]} fontSize={0.13} color="#888">
        Normal
      </Text>

      {/* Incident ray */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([incStart[0], incStart[1], incStart[2], incEnd[0], incEnd[1], incEnd[2]])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffff00" linewidth={2} />
      </line>

      {/* Refracted ray */}
      {!isTotalInternal && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([refEnd[0], 0, 0, refEnd[0] * 0.8, refEnd[1] * 0.8, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00ff88" linewidth={2} />
        </line>
      )}

      {/* Angle arcs */}
      <AngleArcHelper angle={theta1} centerY={0} side="upper" color="#ffff00" />
      {!isTotalInternal && (
        <AngleArcHelper angle={theta2} centerY={0} side="lower" color="#00ff88" />
      )}

      {/* Angle labels */}
      <Text position={[-1.2, 1.2, 0]} fontSize={0.15} color="#ffff00">
        {`θ₁ = ${incidentAngle}°`}
      </Text>
      {!isTotalInternal && (
        <Text position={[1.2, -1.2, 0]} fontSize={0.15} color="#00ff88">
          {`θ₂ = ${theta2Deg.toFixed(1)}°`}
        </Text>
      )}

      {/* Total internal reflection indicator */}
      {isTotalInternal && (
        <mesh position={[0, 0, 1.6]}>
          <planeGeometry args={[3, 1]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Info Panel */}
      <Html position={[5, 3, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[220px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Refraction - Snell&apos;s Law</p>
          <p className="text-xs text-white">n₁ sin θ₁ = n₂ sin θ₂</p>
          <p className="text-xs text-white">{n1} × sin({incidentAngle}°) = {n2} × sin({theta2Deg.toFixed(1)}°)</p>
          <p className="text-xs text-white">{(n1 * Math.sin(theta1)).toFixed(3)} = {(n2 * sinTheta2).toFixed(3)}</p>
          {isTotalInternal ? (
            <p className="text-xs text-red-400 mt-1">⚠ Total Internal Reflection!</p>
          ) : (
            <>
              <p className="text-xs text-yellow-400">→ Yellow: Incident ray</p>
              <p className="text-xs text-green-400">→ Green: Refracted ray</p>
            </>
          )}
          <p className="mt-1 text-xs text-gray-400">Critical angle: {Math.asin(n1 / n2) * (180 / Math.PI) > 0 ? `${(Math.asin(n1 / n2) * (180 / Math.PI)).toFixed(1)}°` : 'N/A'}</p>
        </div>
      </Html>
    </>
  )
}

export default function Refraction() {
  const [incidentAngle, setIncidentAngle] = useState(30)
  const [refractiveIndex, setRefractiveIndex] = useState(1.5)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 2, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene incidentAngle={incidentAngle} refractiveIndex={refractiveIndex} />
        </Suspense>
      </Canvas>
      <ControlPanel incidentAngle={incidentAngle} setIncidentAngle={setIncidentAngle} refractiveIndex={refractiveIndex} setRefractiveIndex={setRefractiveIndex} />
    </div>
  )
}
