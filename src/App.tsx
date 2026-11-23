import type { ReactElement } from 'react'
import { HashRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { StoreProvider, useStore } from './data/store'
import Shell from './components/Shell'
import { EmptyState } from './components/ui'
import { Login, Forgot, Invite } from './pages/Auth'
import GettingStarted from './pages/GettingStarted'
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

/** A new caregiver (not started work yet) only has Getting started, My details and Settings. */
function Working({ children }: { children: ReactElement }) {
  const s = useStore()
  return s.caregiver(s.me.caregiverId)?.status === 'Applicant' ? <Navigate to="/" replace /> : children
}
function Home() {
  const s = useStore()
  return s.caregiver(s.me.caregiverId)?.status === 'Applicant' ? <GettingStarted /> : <Today />
}

function NotFound() {
  return <div className="card"><EmptyState icon={Compass} tone="info" title="We can’t find that page" text="The link may be old, or you may not have access to it." action={<Link className="btn btn-primary" to="/">Go to my home screen</Link>} /></div>
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/invite" element={<Invite />} />
          <Route element={<Guard><Shell /></Guard>}>
            <Route index element={<Home />} />
            <Route path="visits" element={<Working><Visits /></Working>} />
            <Route path="visits/:id" element={<Working><VisitDetail /></Working>} />
            <Route path="incidents" element={<Working><Incidents /></Working>} />
            <Route path="incidents/:id" element={<Working><IncidentDetail /></Working>} />
            <Route path="me" element={<Me />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
