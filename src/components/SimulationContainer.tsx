'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getTopicById } from '@/lib/topics'

// Dynamic import with ssr: false is REQUIRED for React Three Fiber Canvas
const simulationMap: Record<string, React.ComponentType> = {
  'newton-laws': dynamic(() => import('./simulations/NewtonLaws'), { ssr: false }),
  'projectile-motion': dynamic(() => import('./simulations/ProjectileMotion'), { ssr: false }),
  'circular-motion': dynamic(() => import('./simulations/CircularMotion'), { ssr: false }),
  'work-energy': dynamic(() => import('./simulations/WorkEnergy'), { ssr: false }),
  'momentum': dynamic(() => import('./simulations/Momentum'), { ssr: false }),
  'gravitation': dynamic(() => import('./simulations/Gravitation'), { ssr: false }),
  'elasticity': dynamic(() => import('./simulations/Elasticity'), { ssr: false }),
  'waves': dynamic(() => import('./simulations/Waves'), { ssr: false }),
  'sound-waves': dynamic(() => import('./simulations/SoundWaves'), { ssr: false }),
  'light-reflection': dynamic(() => import('./simulations/LightReflection'), { ssr: false }),
  'refraction': dynamic(() => import('./simulations/Refraction'), { ssr: false }),
  'optical-instruments': dynamic(() => import('./simulations/OpticalInstruments'), { ssr: false }),
  'electrostatics': dynamic(() => import('./simulations/Electrostatics'), { ssr: false }),
  'ohms-law': dynamic(() => import('./simulations/OhmsLaw'), { ssr: false }),
  'em-induction': dynamic(() => import('./simulations/EMInduction'), { ssr: false }),
  'radioactivity': dynamic(() => import('./simulations/Radioactivity'), { ssr: false }),
  'shm': dynamic(() => import('./simulations/SHM'), { ssr: false }),
}

function SimulationLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
        <p className="text-sm text-gray-400">Loading simulation...</p>
      </div>
    </div>
  )
}

export default function SimulationContainer() {
  const currentTopic = useStore((s) => s.currentTopic)
  const setView = useStore((s) => s.setView)
  const setTopic = useStore((s) => s.setTopic)

  const topic = useMemo(() => (currentTopic ? getTopicById(currentTopic) : null), [currentTopic])

  if (!currentTopic || !topic) return null

  const SimulationComponent = simulationMap[currentTopic]

  const handleBack = () => {
    setView('dashboard')
    setTopic(null)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a0f]">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 border-b border-white/10 bg-[#0a0a0f]/90 px-4 py-3 backdrop-blur-md"
      >
        <button
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white sm:text-base">{topic.title}</h2>
          <p className="truncate text-xs text-[#00d4ff]/70">{topic.titlebn}</p>
        </div>
        <span className="hidden rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400 sm:block">
          Ch. {topic.chapter}
        </span>
      </motion.div>

      {/* 3D Canvas Area */}
      <div className="relative flex-1">
        {SimulationComponent ? (
          <SimulationComponent />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-400">Simulation not found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
