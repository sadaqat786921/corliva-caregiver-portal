import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TriangleAlert, Plus, ChevronRight, ArrowLeft, Search, CheckCircle2, Clock, Send, Lock, ListChecks } from 'lucide-react'
import { useStore, fmtDate, stampNow } from '../data/store'
import { IncidentStatus } from '../data/seed'
import { AlertBanner, Avatar, Button, CardHead, Chip, ChipTone, EmptyState, PageHead, Tabs, Textarea } from '../components/ui'
import { ReportIncident, useOnline } from '../components/CareActions'

export const stTone = (s: IncidentStatus): ChipTone => s === 'Closed' || s === 'Resolved' ? 'success' : s === 'Action required' ? 'warning' : s === 'Reported' ? 'danger' : 'info'
const STEPS: IncidentStatus[] = ['Reported', 'Under review', 'Action required', 'Resolved', 'Closed']

export default function Incidents() {
  const s = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'done' ? 'done' : 'open'
  const [reporting, setReporting] = useState(false)
  const mine = s.incidents.filter(i => i.reportedBy === s.me.name)
  const open = (i: typeof mine[number]) => !['Resolved', 'Closed'].includes(i.status)
  const list = mine.filter(i => tab === 'open' ? open(i) : !open(i)).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <PageHead title="Incidents" crumb="Incidents" sub="Problems you reported, like a fall or missing medicine. Your Care Supervisor deals with each one — you can see what’s happening and add more information." actions={<Button icon={Plus} onClick={() => setReporting(true)}>Report a problem</Button>} />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={t => setParams(t === 'done' ? { tab: t } : {}, { replace: true })} tabs={[{ id: 'open', label: 'Being dealt with', count: mine.filter(open).length }, { id: 'done', label: 'Sorted', count: mine.filter(i => !open(i)).length }]} /></div>
        <div className="card-body col" style={{ gap: 8 }}>
          {list.length === 0 ? <EmptyState icon={CheckCircle2} title="Nothing here" text={tab === 'open' ? 'You have no open reports.' : 'Nothing sorted yet.'} /> : list.map(i => (
            <button key={i.id} className="visit-card" onClick={() => nav(`/incidents/${i.id}`)}>
              <TriangleAlert size={18} color="var(--text-muted)" />
              <span className="grow" style={{ minWidth: 0 }}><span className="t-medium" style={{ display: 'block' }}>{i.title}</span><span className="t-caption t-muted">{i.id} · {i.client} · {fmtDate(i.date)} · {i.category}</span></span>
              <Chip tone={stTone(i.status)}>{i.status}</Chip><ChevronRight size={16} color="var(--text-muted)" />
            </button>))}
        </div>
      </div>
      <div className="hint">If someone is in danger, call 911 first, then the office.</div>
      {reporting && <ReportIncident onClose={() => setReporting(false)} onDone={id => nav(`/incidents/${id}`)} />}
    </>
  )
}

export function IncidentDetail() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const online = useOnline()
  const [params] = useSearchParams()
  const from = params.get('from') ?? '/incidents'
  const [t, setT] = useState('')
  const i = s.incidents.find(x => x.id === id && x.reportedBy === s.me.name)
  if (!i) return <div className="card"><EmptyState icon={Search} tone="neutral" title="We can’t show this report" text="You can only see problems you reported." action={<Button onClick={() => nav('/incidents')}>My reports</Button>} /></div>
  const at = STEPS.indexOf(i.status)
  const closed = i.status === 'Closed'
  const [first, ...rest] = i.notes
  const mineToDo = i.actions.filter(a => a.who === s.me.name)
  const add = () => {
    if (t.trim().length < 3 || !online()) return
    s.setIncidents(x => x.map(y => y.id === i.id ? { ...y, notes: [...y.notes, { by: s.me.name, at: stampNow(), text: t.trim() }] } : y))
    s.toast(`Added. ${i.owner} can see it.`); setT('')
  }
  return (
    <>
      <div className="page-head">
        <div>
          <Link to={from} className="row t-small t-medium" style={{ gap: 6, marginBottom: 8 }}><ArrowLeft size={15} />{from.startsWith('/visits/') ? 'Visit' : from === '/' ? 'Today' : 'Incidents'}</Link>
          <div className="row wrap" style={{ gap: 10 }}><h1 className="t-h1">{i.title}</h1><Chip tone={stTone(i.status)}>{i.status}</Chip>{i.sensitive && <Chip tone="neutral"><Lock size={11} style={{ verticalAlign: -1 }} /> Private</Chip>}</div>
          <div className="t-small t-muted" style={{ marginTop: 4 }}>{i.id} · {i.category} · {i.client} · {fmtDate(i.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="crumbs"><Link to="/">Home</Link><span>/</span><Link to="/incidents">Incidents</Link><span>/</span><span>{i.id}</span></div>
        </div>
      </div>
      {i.status === 'Reported' && <AlertBanner tone="info" title="Sent to your Care Supervisor">{i.owner} has your report and will look at it.</AlertBanner>}
      {i.sensitive && <AlertBanner tone="info" title="Private report">Only you and the people dealing with it can see this.</AlertBanner>}

      <div className="card card-pad">
        <div className="stepper">{STEPS.map((x, k) => { const state = k < at || closed ? 'done' : k === at ? 'current' : 'todo'; return (
          <div key={x} className={`stp ${state}`} style={{ cursor: 'default' }}><span className="stp-dot">{state === 'done' ? <CheckCircle2 size={15} /> : k + 1}</span><span className="stp-txt"><span className="stp-name">{x}</span></span></div>) })}</div>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="What you reported" sub={first ? `${first.at}` : undefined} />
            <div className="card-body">{first ? <div style={{ fontSize: 15 }}>{first.text}</div> : null}</div>
          </div>
          {mineToDo.length > 0 && <div className="card">
            <CardHead title="Asked of you" sub="Your supervisor ticks these off when they’re done." />
            <div className="card-body">{mineToDo.map(a => <div key={a.id} className="list-row"><ListChecks size={16} color="var(--status-info)" /><div className="grow"><div className="t-small t-medium">{a.text}</div><div className="t-caption t-muted">By {fmtDate(a.due)}</div></div><Chip tone={a.done ? 'success' : 'warning'}>{a.done ? 'Done' : 'To do'}</Chip></div>)}</div>
          </div>}
          {i.resolution && <div className="card"><CardHead title="How it was sorted" /><div className="card-body t-small">{i.resolution}</div></div>}
          <div className="card">
            <CardHead title="Updates" sub="From you and the people dealing with it." />
            <div className="card-body col" style={{ gap: 14 }}>
              {rest.length === 0 ? <div className="t-small t-muted">No updates yet.</div> : <div className="timeline">{rest.map((n, k) => (
                <div key={k} className="timeline-item"><Avatar name={n.by} size="sm" /><div><div className="t-small">{n.text}</div><div className="t-caption t-muted row" style={{ gap: 4 }}><Clock size={11} />{n.by} · {n.at}</div></div></div>))}</div>}
              {!closed && <>
                <div className="divider" />
                <Textarea value={t} onChange={e => setT(e.target.value)} placeholder="Add anything else you remember or have noticed since" />
                <div className="row" style={{ justifyContent: 'flex-end' }}><Button icon={Send} disabled={t.trim().length < 3} onClick={add}>Add information</Button></div>
              </>}
            </div>
          </div>
        </div>
        <div className="card">
          <CardHead title="Who is dealing with it" />
          <div className="card-body"><div className="row" style={{ gap: 10 }}><Avatar name={i.owner} /><div><div className="t-medium">{i.owner}</div><div className="t-caption t-muted">Care Supervisor</div></div></div></div>
        </div>
      </div>
    </>
  )
}
