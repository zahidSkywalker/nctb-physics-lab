'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function WavelengthMarker({
  wavelength,
  amplitude,
  frequency,
  timeRef,
}: {
  wavelength: number
  amplitude: number
  frequency: number
  timeRef: React.RefObject<number>
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (ref.current) {
      const t = timeRef.current ?? 0
      // Track a peak position
      const phaseShift = frequency * t
      const peakX = ((phaseShift % 1) + 0.25) * wavelength
      ref.current.position.x = peakX - 3
    }
  })

  return (
    <group ref={ref} position={[0, -amplitude - 0.5, 0]}>
      <mesh>
        <boxGeometry args={[wavelength, 0.03, 0.03]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[-wavelength / 2, 0, 0]}>
        <boxGeometry args={[0.03, 0.3, 0.03]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[wavelength / 2, 0, 0]}>
        <boxGeometry args={[0.03, 0.3, 0.03]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <Text position={[0, -0.25, 0]} fontSize={0.15} color="#ffaa00">
        {`λ = ${wavelength}m`}
      </Text>
    </group>
  )
}

function Scene() {
  const { amplitude, wavelength, frequency } = useControls({
    amplitude: { value: 1.5, min: 0.1, max: 3, step: 0.1, label: 'Amplitude (m)' },
    wavelength: { value: 3, min: 1, max: 8, step: 0.5, label: 'Wavelength (m)' },
    frequency: { value: 0.8, min: 0.1, max: 3, step: 0.1, label: 'Frequency (Hz)' },
  })

  const waveRef = useRef<THREE.InstancedMesh>(null)
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const timeRef = useRef(0)

  const numWavePoints = 200
  const numParticles = 20
  const waveLength = wavelength
  const speed = frequency * wavelength

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particleDummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // Update wave mesh
    if (waveRef.current) {
      for (let i = 0; i < numWavePoints; i++) {
        const x = (i / numWavePoints) * 16 - 8
        const y = amplitude * Math.sin(2 * Math.PI * (x / waveLength - frequency * t))
        dummy.position.set(x, y, 0)
        dummy.scale.set(0.05, 0.05, 0.05)
        dummy.updateMatrix()
        waveRef.current.setMatrixAt(i, dummy.matrix)
      }
      waveRef.current.instanceMatrix.needsUpdate = true
    }

    // Update particles (show transverse oscillation)
    if (particlesRef.current) {
      for (let i = 0; i < numParticles; i++) {
        const baseX = (i / numParticles) * 12 - 6
        const y = amplitude * Math.sin(2 * Math.PI * (baseX / waveLength - frequency * t))
        particleDummy.position.set(baseX, y, 0.5)
        particleDummy.scale.set(0.15, 0.15, 0.15)
        particleDummy.updateMatrix()
        particlesRef.current.setMatrixAt(i, particleDummy.matrix)
      }
      particlesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <Environment preset="city" />
      <OrbitControls makeDefault />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <gridHelper args={[30, 30, '#222', '#111']} position={[0, -2.99, 0]} />

      {/* Axis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[16, 0.02, 0.02]} />
        <meshBasicMaterial color="#444" />
      </mesh>

      {/* Wave points */}
      <instancedMesh ref={waveRef} args={[undefined, undefined, numWavePoints]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} />
      </instancedMesh>

      {/* Particles showing oscillation direction */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, numParticles]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
      </instancedMesh>

      {/* Amplitude marker */}
      <mesh position={[-8.5, amplitude / 2, 0]}>
        <boxGeometry args={[0.02, amplitude, 0.02]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <Text position={[-9.3, amplitude / 2, 0]} fontSize={0.18} color="#00ff88">
        A = {amplitude}m
      </Text>

      {/* Wavelength marker */}
      <WavelengthMarker wavelength={waveLength} amplitude={amplitude} frequency={frequency} timeRef={timeRef} />

      {/* Propagation direction arrow */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-7, -1.5, 0), 2, 0xffff00]} />
      <Text position={[-7, -1.8, 0]} fontSize={0.15} color="#ffff00">
        Propagation
      </Text>

      {/* Info Panel */}
      <Html position={[5, 4, -2]} center>
        <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/90 p-3 backdrop-blur-sm">
          <p className="mb-1 text-xs font-bold text-[#00d4ff]">Transverse Wave</p>
          <p className="text-xs text-white">λ = {wavelength} m</p>
          <p className="text-xs text-white">f = {frequency} Hz</p>
          <p className="text-xs text-white">v = fλ = {speed.toFixed(2)} m/s</p>
          <p className="text-xs text-white">T = {(1 / frequency).toFixed(2)} s</p>
          <p className="mt-1 text-xs text-gray-400">y = A·sin(2π(x/λ - ft))</p>
          <p className="text-xs text-cyan-400">● Wave particles</p>
          <p className="text-xs text-red-400">● Transverse motion</p>
        </div>
      </Html>
    </>
  )
}

export default function Waves() {
  return (
    <Canvas camera={{ position: [0, 4, 12], fov: 50 }} style={{ background: '#0a0a0f' }}>
      <Scene />
    </Canvas>
  )
}
