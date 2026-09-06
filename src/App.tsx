/**
 * App.tsx — Central Router Configuration for Ocean Intelligence Platform
 * OceanIQ — Indian Ocean 3D Intelligence Platform | INCOIS / MoES
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/context/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage } from '@/pages/LoginPage'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ObservationsPage } from '@/pages/ObservationsPage'
import { ModelValidationPage } from '@/pages/ModelValidationPage'
import { DataExplorerPage } from '@/pages/DataExplorerPage'
import { AnalysisLabPage } from '@/pages/AnalysisLabPage'
import { OperationsPage } from '@/pages/OperationsPage'
import { ProvidersPage } from '@/pages/ProvidersPage'
import { SciencePage } from '@/pages/SciencePage'
import { AiIntelligencePage } from '@/pages/AiIntelligencePage'
import { Globe3DPage } from '@/pages/Globe3DPage'
import { DepthVolumetricPage } from '@/pages/DepthVolumetricPage'
import { AboutPage } from '@/pages/AboutPage'
import { AquaVisPage } from '@/pages/AquaVisPage'
import { UserManualPage } from '@/pages/UserManualPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected: all platform pages */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              {/* Page 1: Mission Control */}
              <Route index element={<LandingPage />} />

              {/* Page 2: 3D Ocean Explorer ⭐ (Primary Workstation) */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="explorer" element={<DashboardPage />} />

              {/* Page 3: In-Situ Observation Explorer (Argo/Glider/CTD/BGC) */}
              <Route path="observations" element={<ObservationsPage />} />

              {/* Page 4: Model vs Observation Validation */}
              <Route path="compare" element={<ModelValidationPage />} />
              <Route path="validation" element={<ModelValidationPage />} />

              {/* Page 5: Data Hub & Multi-Format Ingestion */}
              <Route path="data" element={<DataExplorerPage />} />

              {/* Page 6: Scientific Diagnostics Lab & Transects */}
              <Route path="analysis" element={<AnalysisLabPage />} />

              {/* Page 7: Operational Intelligence & Hazard Decision Support */}
              <Route path="operations" element={<OperationsPage />} />

              {/* AI / ML Ocean Intelligence */}
              <Route path="ai" element={<AiIntelligencePage />} />

              {/* Page 8: Data Providers & Extensible Sensor Plugin Architecture */}
              <Route path="providers" element={<ProvidersPage />} />

              {/* Page 9: Science Communication & Public Outreach */}
              <Route path="science" element={<SciencePage />} />

              {/* Dedicated Viewports & Volumetric Tools */}
              <Route path="depth-view" element={<DepthVolumetricPage />} />
              <Route path="depth-inspector" element={<DepthVolumetricPage />} />
              <Route path="globe" element={<Globe3DPage />} />
              <Route path="manual" element={<UserManualPage />} />
              <Route path="guide" element={<UserManualPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="aqua-vis" element={<AquaVisPage />} />

              {/* Catch-all — redirect to Mission Control */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
