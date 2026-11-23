import type { ReactElement } from 'react'
import { HashRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { StoreProvider, useStore } from './data/store'
import Shell from './components/Shell'
import { EmptyState } from './components/ui'
import { Login, Forgot } from './pages/Auth'
import Today from './pages/Today'
import Visits from './pages/Visits'
import VisitDetail from './pages/VisitDetail'
import Incidents, { IncidentDetail } from './pages/Incidents'
import Me from './pages/Me'
import Settings from './pages/Settings'

function Guard({ children }: { children: ReactElement }) {
  const s = useStore()
  if (!s.signedIn) return <Navigate to="/login" replace />
  return children
}

function NotFound() {
  return <div className="card"><EmptyState icon={Compass} tone="info" title="We can’t find that page" text="The link may be old, or you may not have access to it." action={<Link className="btn btn-primary" to="/">Go to Today</Link>} /></div>
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route element={<Guard><Shell /></Guard>}>
            <Route index element={<Today />} />
            <Route path="visits" element={<Visits />} />
            <Route path="visits/:id" element={<VisitDetail />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="me" element={<Me />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
