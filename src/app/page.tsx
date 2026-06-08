'use client'

import { useStore } from '@/store/useStore'
import Dashboard from '@/components/Dashboard'
import SimulationContainer from '@/components/SimulationContainer'

export default function Home() {
  const currentView = useStore((s) => s.currentView)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'simulation' && <SimulationContainer />}
    </div>
  )
}
