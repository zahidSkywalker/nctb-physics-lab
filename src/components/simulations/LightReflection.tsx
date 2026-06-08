'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

export default function LightReflection() {
  const { incidentAngle, rayCount } = useControls({
    incidentAngle: { value: 45, min: 0, max: 85, step: 1, label: 'Angle of Incidence (°)' },
    rayCount: { value: 3, min: 1, max: 5, step: 1, label: 'Number of Rays' },
  })

  const rad = (incidentAngle * Math.PI) / 180
  const rayLength = 8

  // Mirror is vertical (YZ plane), rays come from the left
  // Incident ray comes from left, hits mirror, reflects to upper left
  const mirrorPos: [number, number, number] = [0, 0, 0]

  const rays = []
  for (let i = 0; i < rayCount; i++) {
    const offsetY = (i - (rayCount - 1) / 2) * 1.5

    // Incident ray: from left, angled toward mirror
    const incStart: [number, number, number] = [
      -rayLength * Math.cos(rad),
      offsetY + rayLength * Math.sin(rad),
      0,
    ]
    const incEnd: [number, number, number] = [0, offsetY, 0]

    // Reflected ray: same angle on other side
    const refStart: [number, number, number] = [0, offsetY, 0]
    const refEnd: [number, number, number] = [
      -rayLength * Math.cos(rad),
      offsetY + rayLength * Math.sin(rad),
      0,
    ]

    rays.push({ incStart, incEnd, refStart, refEnd, offsetY })
  }

  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[20, 20, '#222', '#111']} position={[0, -2.99, 0]} />

      {/* Mirror */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.15, 8, 2]} />
        <meshStandardMaterial color="#aaccff" metalness={0.9} roughness={0.1} />
      </mesh>
      <Text position={[0, 4.3, 0]} fontSize={0.2} color="#aaccff">
        Mirror
      </Text>

      {/* Rays */}
      {rays.map((ray, i) => (
        <group key={i}>
          {/* Incident ray */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  ray.incStart[0], ray.incStart[1], ray.incStart[2],
                  ray.incEnd[0], ray.incEnd[1], ray.incEnd[2],
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffff00" linewidth={2} />
          </line>

          {/* Arrow head for incident ray */}
          <mesh
            position={[
              ray.incStart[0] * 0.6,
              ray.incStart[1] * 0.6 + ray.offsetY * 0.4,
              0,
            ]}
            rotation={[0, 0, -rad + Math.PI / 2]}
          >
            <coneGeometry args={[0.08, 0.25, 6]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.3} />
          </mesh>

          {/* Reflected ray */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  ray.refStart[0], ray.refStart[1], ray.refStart[2],
                  ray.refEnd[0], ray.refEnd[1], ray.refEnd[2],
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00ff88" linewidth={2} />
          </line>

          {/* Normal line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, ray.offsetY - 2, 0, 0, ray.offsetY + 2, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" linewidth={1} transparent opacity={0.4} />
          </line>

          {/* Angle arc for incidence */}
          <AngleArc angle={rad} offsetY={ray.offsetY} side="left" />

          {/* Angle arc for reflection */}
          <AngleArc angle={rad} offsetY={ray.offsetY} side="right" />
        </group>
      ))}

      {/* Info Panel */}
      <Html position={[-5, 3, 0]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Law of Reflection</p>
          <p className="text-xs text-white">θᵢ = θᵣ = {incidentAngle}°</p>
          <p className="text-xs text-gray-400">Angle of incidence = Angle of reflection</p>
          <p className="text-xs text-gray-400">Both measured from normal</p>
          <p className="text-xs text-yellow-400">→ Yellow: Incident rays</p>
          <p className="text-xs text-green-400">→ Green: Reflected rays</p>
          <p className="text-xs text-gray-300">| White: Normal line</p>
        </div>
      </Html>
    </Canvas>
  )
}

function AngleArc({
  angle,
  offsetY,
  side,
}: {
  angle: number
  offsetY: number
  side: 'left' | 'right'
}) {
  const ref = useRef<THREE.Line>(null)
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const segments = 16
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * angle
      if (side === 'left') {
        pts.push(new THREE.Vector3(-Math.cos(Math.PI - a) * 0.8, offsetY + Math.sin(a) * 0.8, 0))
      } else {
        pts.push(new THREE.Vector3(-Math.cos(Math.PI + a) * 0.8, offsetY + Math.sin(a) * 0.8, 0))
      }
    }
    return pts
  }, [angle, offsetY, side])

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <line ref={ref as React.RefObject<THREE.Line>}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={side === 'left' ? '#ffff00' : '#00ff88'} transparent opacity={0.6} />
    </line>
  )
}
