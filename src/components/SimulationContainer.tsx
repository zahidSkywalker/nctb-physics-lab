'use client'

import { Suspense, lazy, useMemo, useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getTopicById } from '@/lib/topics'

// Lazy load all simulations (code splitting)
const simulationMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'newton-laws': lazy(() => import('./simulations/NewtonLaws')),
  'projectile-motion': lazy(() => import('./simulations/ProjectileMotion')),
  'circular-motion': lazy(() => import('./simulations/CircularMotion')),
  'work-energy': lazy(() => import('./simulations/WorkEnergy')),
  'momentum': lazy(() => import('./simulations/Momentum')),
  'gravitation': lazy(() => import('./simulations/Gravitation')),
  'elasticity': lazy(() => import('./simulations/Elasticity')),
  'waves': lazy(() => import('./simulations/Waves')),
  'sound-waves': lazy(() => import('./simulations/SoundWaves')),
  'light-reflection': lazy(() => import('./simulations/LightReflection')),
  'refraction': lazy(() => import('./simulations/Refraction')),
  'optical-instruments': lazy(() => import('./simulations/OpticalInstruments')),
  'electrostatics': lazy(() => import('./simulations/Electrostatics')),
  'ohms-law': lazy(() => import('./simulations/OhmsLaw')),
  'em-induction': lazy(() => import('./simulations/EMInduction')),
  'radioactivity': lazy(() => import('./simulations/Radioactivity')),
  'shm': lazy(() => import('./simulations/SHM')),
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

// Ensures children are only rendered on the client (after mount).
// This is critical for React Three Fiber — Canvas and all R3F hooks
// (useFrame, useThree, etc.) require a browser environment.
function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) {
    return fallback ?? <SimulationLoader />
  }
  return <>{children}</>
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

      {/* 3D Canvas Area — wrapped in ClientOnly to prevent SSR */}
      <div className="relative flex-1">
        <ClientOnly fallback={<SimulationLoader />}>
          <Suspense fallback={<SimulationLoader />}>
            {SimulationComponent ? (
              <SimulationComponent />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-400">Simulation not found.</p>
              </div>
            )}
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  )
}
