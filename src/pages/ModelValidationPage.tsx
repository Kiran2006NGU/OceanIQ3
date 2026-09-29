/**
 * ModelValidationPage.tsx — Model vs Observation Validation Workstation
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Routes: /compare and /validation
 * Integrates multi-dataset ingestion (NetCDF, CSV, TSV, TXT, JSON),
 * spatiotemporal point matching, residual calculations, accuracy classification,
 * profile/residual charts, and synchronized 3D observation inspector.
 * Also includes the competitive multi-model comparison dashboard.
 */

import { useState } from 'react'
import { ModelObservationWorkspace } from '@/components/comparison/ModelObservationWorkspace'
import { ModelComparisonDashboard } from '@/components/comparison/ModelComparisonDashboard'

export function ModelValidationPage() {
  const [activeTab, setActiveTab] = useState<'validation' | 'models'>('validation')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab switcher */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#090f1c]/90 px-4 py-2 flex gap-2">
        <button
          onClick={() => setActiveTab('validation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
            activeTab === 'validation'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          ⚖️ Model vs Observation
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
            activeTab === 'models'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          🏆 Competitive Model View
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'validation' ? (
          <ModelObservationWorkspace />
        ) : (
          <div className="h-full overflow-y-auto p-4 bg-[#080f1b]">
            <ModelComparisonDashboard />
          </div>
        )}
      </div>
    </div>
  )
}
