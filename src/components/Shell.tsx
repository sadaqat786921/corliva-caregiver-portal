import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, ListChecks, CalendarDays, TriangleAlert, UserRound, SlidersHorizontal, LogOut, ChevronDown, Calendar, Bell, RotateCcw } from 'lucide-react'
import { useStore, fmtDate, resetDemoData } from '../data/store'
import { TODAY } from '../data/seed'
import { cgState } from '../data/care'
import { forCaregiver, shown } from '../data/hr'
import { AlertBanner, ConfirmDialog, Toasts, useClickOutside } from './ui'

const NEW_NAV = [
  { to: '/', label: 'Getting started', icon: ListChecks, end: true, badge: 'start' },
  { to: '/me', label: 'My details', icon: UserRound, badge: '' },
]
const NAV = [
  { to: '/', label: 'Today', icon: Home, end: true, badge: '' },
  { to: '/visits', label: 'My visits', icon: CalendarDays, badge: 'visits' },
  { to: '/incidents', label: 'Incidents', icon: TriangleAlert, badge: '' },
  { to: '/me', label: 'My details', icon: UserRound, badge: 'me' },
]

export default function Shell() {
  const s = useStore()
  const nav = useNavigate()
  const [confirmOut, setConfirmOut] = useState(false)
  const mine = s.visits.filter(v => v.caregiverId === s.me.caregiverId)
  const g = s.caregiver(s.me.caregiverId)
  const isNew = g?.status === 'Applicant'
  const menu = isNew ? NEW_NAV : NAV
  const badges: Record<string, number> = {
    visits: mine.filter(v => ['Not sent yet', 'Sent back to fix'].includes(cgState(v))).length,
    me: 0,
    start: g ? forCaregiver(g, s.cgReqs).filter(i => i.def.checkedBy !== 'Care Supervisor' && ['Missing', 'Rejected', 'Expired'].includes(shown(i.rec))).length : 0,
  }
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main menu">
        <div className="sidebar-logo"><img src="./images/corliva-logo-white.svg" alt="CORLIVA" /></div>
        <div className="agency-switch" style={{ cursor: 'default' }}>
          <span className="agency-avatar">RH</span>
          <span className="grow">
            <span style={{ display: 'block', fontWeight: 500, fontSize: 13 }}>{s.agency.name}</span>
            <span style={{ display: 'block', fontSize: 11, opacity: .85 }}>{s.branchName(s.me.branch)}</span>
          </span>
        </div>
        <nav>
          <div className="nav-section">{isNew ? 'Joining' : 'My work'}</div>
          {menu.map(it => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <it.icon />{it.label}{it.badge && badges[it.badge] > 0 && <span className="nav-badge">{badges[it.badge]}</span>}
            </NavLink>))}
          <div className="nav-section">Account</div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><SlidersHorizontal />Settings</NavLink>
          <button className="nav-item" onClick={() => setConfirmOut(true)}><LogOut />Log Out</button>
        </nav>
      </aside>
      <main className="main">
        <Header />
        {s.offline && <AlertBanner tone="danger" title="No internet connection">You can look at your visits, but nothing can be saved until you’re back online.</AlertBanner>}
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Main menu">
        {menu.map(it => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
            <span className="bn-icon"><it.icon size={20} />{it.badge && badges[it.badge] > 0 && <span className="bn-badge">{badges[it.badge]}</span>}</span>{it.label}
          </NavLink>))}
      </nav>
      <Toasts />
      {confirmOut && <ConfirmDialog title="Log out of CORLIVA?" text="You will need your email, password and security code to sign back in." confirm="Log out" onClose={() => setConfirmOut(false)} onConfirm={() => { s.signOut(); nav('/login') }} />}
    </div>
  )
}

function Header() {
  const s = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState<null | 'bell' | 'me'>(null)
  const close = useCallback(() => setOpen(null), [])
  const ref = useClickOutside<HTMLDivElement>(open !== null, close)
  const [resetting, setResetting] = useState(false)
  useEffect(() => { setOpen(null) }, [loc.pathname, loc.search])
  const unread = s.inbox.filter(n => !n.read).length
  const go = (to: string) => { setOpen(null); nav(to) }

  return (
    <header className="header" ref={ref}>
      <img className="header-logo" src="./images/corliva-logo.svg" alt="CORLIVA" />
      <div className="header-chip hide-phone" title={`Agency time zone: ${s.agency.timezone}`}><Calendar size={16} />{fmtDate(TODAY, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div className="header-spacer" />

      <div style={{ position: 'relative' }}>
        <button className="icon-btn" aria-label={`Alerts, ${unread} unread`} onClick={() => setOpen(open === 'bell' ? null : 'bell')}><Bell size={18} />{unread > 0 && <span className="dot" />}</button>
        {open === 'bell' && (
          <div className="popover popover-alerts">
            <div className="row between" style={{ padding: '6px 10px 8px' }}><span className="t-strong">Alerts</span><button className="link-btn" disabled={!unread} onClick={() => s.setInbox(i => i.map(n => ({ ...n, read: true })))}>Mark all as read</button></div>
            {s.inbox.map(n => (
              <button key={n.id} className="menu-item" style={{ alignItems: 'flex-start' }} onClick={() => { s.setInbox(i => i.map(x => x.id === n.id ? { ...x, read: true } : x)); go(n.link) }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0, background: n.read ? 'transparent' : `var(--status-${n.tone})` }} />
                <span><span style={{ display: 'block', fontWeight: n.read ? 400 : 600 }}>{n.title}</span><span className="t-caption t-muted">{n.body} · {n.at}</span></span>
              </button>))}
            <div className="t-caption t-muted" style={{ padding: '8px 10px 4px' }}>Reading an alert doesn’t fix the problem — it stays on your list until it’s sorted.</div>
          </div>)}
      </div>

      <div style={{ position: 'relative' }}>
        <button className="profile-btn" onClick={() => setOpen(open === 'me' ? null : 'me')} aria-expanded={open === 'me'}>
          <span className="avatar">{s.me.initials}</span>
          <span className="hide-phone"><span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{s.me.name}</span><span className="t-caption t-muted">Caregiver</span></span>
          <ChevronDown size={14} />
        </button>
        {open === 'me' && (
          <div className="popover">
            <button className="menu-item" onClick={() => go('/me')}><UserRound />My details</button>
            <button className="menu-item" onClick={() => go('/settings')}><SlidersHorizontal />Settings</button>
            <button className="menu-item" onClick={() => { setOpen(null); setResetting(true) }}><RotateCcw />Reset demo data</button>
            <div className="menu-sep" />
            <button className="menu-item danger" onClick={() => { s.signOut(); go('/login') }}><LogOut />Log out</button>
          </div>)}
      </div>
      {resetting && <ConfirmDialog title="Reset demo data?" text="All changes you made in this preview will be removed and the original sample data comes back. You stay signed in." confirm="Reset demo data" danger onClose={() => setResetting(false)} onConfirm={resetDemoData} />}
    </header>
  )
}
