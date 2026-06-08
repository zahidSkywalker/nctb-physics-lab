'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import { Suspense, useState, useMemo } from 'react'
import * as THREE from 'three'

function ControlPanel({
  objectDistance, setObjectDistance, focalLength, setFocalLength,
}: {
  objectDistance: number; setObjectDistance: (v: number) => void
  focalLength: number; setFocalLength: (v: number) => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-xl border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-xs font-bold text-[#00d4ff]">Controls</h3>
      <label className="block">
        <span className="text-xs text-gray-400">Object Distance: {objectDistance} cm</span>
        <input type="range" min={3} max={20} step={0.5} value={objectDistance}
          onChange={e => setObjectDistance(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-400">Focal Length: {focalLength} cm</span>
        <input type="range" min={1} max={8} step={0.5} value={focalLength}
          onChange={e => setFocalLength(Number(e.target.value))}
          className="w-full accent-[#00d4ff]" />
      </label>
    </div>
  )
}

function LensShape() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
        <meshStandardMaterial color="#88bbff" transparent opacity={0.3} metalness={0.1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#88bbff" transparent opacity={0.2} />
      </mesh>
      <mesh position={[0, -2.4, 0]} rotation={[0, 0, Math.PI]}>
        <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#88bbff" transparent opacity={0.2} />
      </mesh>
      <Text position={[0.4, 2.8, 0]} fontSize={0.15} color="#88bbff">
        Lens
      </Text>
    </group>
  )
}

function Ray1({ objectX, objectHeight, focalLength }: { objectX: number; objectHeight: number; focalLength: number }) {
  const endX = Math.min(focalLength * 2, 10)
  const slope = objectHeight / focalLength
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([objectX, objectHeight, 0, 0, objectHeight, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffff00" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, objectHeight, 0, endX, objectHeight - slope * endX, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffff00" />
      </line>
    </group>
  )
}

function Ray2({ objectX, objectHeight }: { objectX: number; objectHeight: number }) {
  const slope = objectHeight / objectX
  const endX = 10
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([objectX, objectHeight, 0, endX, objectHeight + slope * (endX - objectX), 0])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00ff88" />
    </line>
  )
}

function Ray3({ objectX, objectHeight, focalLength }: { objectX: number; objectHeight: number; focalLength: number }) {
  const slopeToCenter = objectHeight / (objectX + focalLength)
  const yAtLens = slopeToCenter * (-focalLength - objectX) + objectHeight
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([objectX, objectHeight, 0, 0, yAtLens, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff88ff" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, yAtLens, 0, 10, yAtLens, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff88ff" />
      </line>
    </group>
  )
}

function Scene({ objectDistance, focalLength }: { objectDistance: number; focalLength: number }) {
  const u = objectDistance
  const f = focalLength

  const invV = 1 / f - 1 / u
  const isReal = invV > 0
  const v = 1 / invV
  const magnification = -v / u
  const imageHeight = magnification * 2

  const lensX = 0
  const objectX = -u
  const imageX = v

  const objectHeight = 2

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <OrbitControls makeDefault />

      {/* Principal axis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[24, 0.02, 0.02]} />
        <meshBasicMaterial color="#555" />
      </mesh>

      {/* Lens */}
      <LensShape />

      {/* Focal points */}
      <mesh position={[-f, 0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <Text position={[-f, -0.4, 0]} fontSize={0.15} color="#ff4444">
        F
      </Text>
      <mesh position={[f, 0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <Text position={[f, -0.4, 0]} fontSize={0.15} color="#ff4444">
        F&apos;
      </Text>

      {/* 2F points */}
      <mesh position={[-2 * f, 0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ff8844" />
      </mesh>
      <Text position={[-2 * f, -0.4, 0]} fontSize={0.12} color="#ff8844">
        2F
      </Text>
      <mesh position={[2 * f, 0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ff8844" />
      </mesh>
      <Text position={[2 * f, -0.4, 0]} fontSize={0.12} color="#ff8844">
        2F&apos;
      </Text>

      {/* Object (arrow) */}
      <group position={[objectX, 0, 0]}>
        <mesh position={[0, objectHeight / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, objectHeight, 8]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        <mesh position={[0, objectHeight + 0.15, 0]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        <Text position={[0, objectHeight + 0.5, 0]} fontSize={0.15} color="#00d4ff">
          Object
        </Text>
      </group>

      {/* Ray 1: Parallel to axis, refracts through F' */}
      <Ray1 objectX={objectX} objectHeight={objectHeight} focalLength={f} />

      {/* Ray 2: Through center (undeviated) */}
      <Ray2 objectX={objectX} objectHeight={objectHeight} />

      {/* Ray 3: Through F, refracts parallel */}
      <Ray3 objectX={objectX} objectHeight={objectHeight} focalLength={f} />

      {/* Image */}
      {isReal && (
        <group position={[imageX, 0, 0]}>
          <mesh position={[0, imageHeight / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, Math.abs(imageHeight), 8]} />
            <meshBasicMaterial color="#00ff88" />
          </mesh>
          {imageHeight > 0 ? (
            <mesh position={[0, Math.abs(imageHeight) + 0.15, 0]}>
              <coneGeometry args={[0.15, 0.3, 8]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
          ) : (
            <mesh position={[0, -Math.abs(imageHeight) - 0.15, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.15, 0.3, 8]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
          )}
          <Text position={[0, imageHeight > 0 ? Math.abs(imageHeight) + 0.5 : -Math.abs(imageHeight) - 0.5, 0]} fontSize={0.15} color="#00ff88">
            Image (Real)
          </Text>
        </group>
      )}

      {!isReal && (
        <group position={[imageX, 0, 0]}>
          <mesh position={[0, imageHeight / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, Math.abs(imageHeight), 8]} />
            <meshBasicMaterial color="#ff88ff" transparent opacity={0.5} />
          </mesh>
          <Text position={[0, Math.abs(imageHeight) + 0.5, 0]} fontSize={0.15} color="#ff88ff">
            Image (Virtual)
          </Text>
        </group>
      )}

      {/* Info Panel */}
      <Html position={[0, 5, -3]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm min-w-[220px]">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Convex Lens - Ray Diagram</p>
          <p className="text-xs text-white">1/f = 1/v - 1/u</p>
          <p className="text-xs text-white">f = {focalLength} cm</p>
          <p className="text-xs text-white">u = {u} cm (object distance)</p>
          <p className="text-xs text-white">v = {v.toFixed(2)} cm (image distance)</p>
          <p className="text-xs text-white">m = -v/u = {magnification.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Image: {isReal ? 'Real, Inverted' : 'Virtual, Upright'}</p>
          <p className="text-xs text-gray-400">| {Math.abs(magnification) > 1 ? 'Magnified' : 'Diminished'}</p>
        </div>
      </Html>
    </>
  )
}

export default function OpticalInstruments() {
  const [objectDistance, setObjectDistance] = useState(8)
  const [focalLength, setFocalLength] = useState(4)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 3, 14], fov: 50 }} style={{ background: '#0a0a0f' }}>
        <Suspense fallback={null}>
          <Scene objectDistance={objectDistance} focalLength={focalLength} />
        </Suspense>
      </Canvas>
      <ControlPanel objectDistance={objectDistance} setObjectDistance={setObjectDistance} focalLength={focalLength} setFocalLength={setFocalLength} />
    </div>
  )
}
