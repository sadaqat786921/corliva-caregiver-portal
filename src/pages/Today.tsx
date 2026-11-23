import { useNavigate } from 'react-router-dom'
import { LogIn, Send, CheckCircle2, CalendarDays, TriangleAlert, ShieldCheck, ChevronRight, Clock, MapPin, Undo2 } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { TODAY, Visit, addDays } from '../data/seed'
import { cgState, lateText, minutesLate, stateTone } from '../data/care'
import { readiness } from '../data/hr'
import { AlertBanner, Button, CardHead, Chip, ChipTone, PageHead } from '../components/ui'

/** A visit as a tappable card — used on Today and My visits. */
export function VisitCard({ v, from }: { v: Visit; from: string }) {
  const s = useStore()
  const nav = useNavigate()
  const c = s.client(v.clientId)
  const st = cgState(v)
  const late = minutesLate(v)
  return (
    <button className="visit-card" onClick={() => nav(`/visits/${v.id}?from=${encodeURIComponent(from)}`)}>
      <span className="visit-time"><b>{v.start}</b><span className="t-caption t-muted">{v.end}</span></span>
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="t-medium" style={{ display: 'block' }}>{c?.name}</span>
        <span className="t-caption t-muted" style={{ display: 'block' }}>{v.date === TODAY ? 'Today' : fmtDate(v.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {v.service}</span>
        <span className="t-caption t-muted row" style={{ gap: 4 }}><MapPin size={11} />{c?.address}</span>
        {st === 'Sent back to fix' && <span className="t-caption" style={{ color: 'var(--status-danger)', display: 'block' }}>{v.returned?.reason}</span>}
        {st === 'Coming up' && late > 0 && <span className="t-caption" style={{ color: 'var(--status-warning)', display: 'block' }}>{lateText(late)} past the start</span>}
      </span>
      <Chip tone={stateTone(st) as ChipTone}>{st}</Chip>
      <ChevronRight size={16} color="var(--text-muted)" />
    </button>
  )
}

export default function Today() {
  const s = useStore()
  const nav = useNavigate()
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const mine = s.visits.filter(v => v.caregiverId === s.me.caregiverId)
  const today = mine.filter(v => v.date === TODAY).sort((a, b) => a.start.localeCompare(b.start))
  const current = today.find(v => cgState(v) === 'Checked in') ?? today.find(v => cgState(v) === 'Coming up')
  const toFinish = mine.filter(v => ['Not sent yet', 'Sent back to fix'].includes(cgState(v)) && v.date <= TODAY).sort((a, b) => a.date.localeCompare(b.date))
  const next = mine.filter(v => v.date > TODAY && v.date <= addDays(7) && v.status !== 'Cancelled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const me = s.caregiver(s.me.caregiverId)!
  const r = readiness(me, s.cgReqs)
  const myOpen = s.incidents.filter(i => i.reportedBy === s.me.name && !['Resolved', 'Closed'].includes(i.status))
  const myActions = s.incidents.flatMap(i => i.actions.filter(a => a.who === s.me.name && !a.done).map(a => ({ i, a })))
  const offToday = s.timeOff.find(t => t.caregiverId === me.id && t.status === 'Booked' && t.from <= TODAY && t.to >= TODAY)

  return (
    <>
      <PageHead title="Today" crumb="Today" />
      <section className="hero">
        <div className="t-display" style={{ fontSize: 24 }}>{greet}, {s.me.name.split(' ')[0]}</div>
        <div style={{ opacity: .92, marginTop: 4 }}>{fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' })} · {today.filter(v => v.status !== 'Cancelled').length} visit{today.length === 1 ? '' : 's'} today</div>
        {current ? <button className="hero-note" onClick={() => nav(`/visits/${current.id}?from=/`)}><Clock size={15} />{cgState(current) === 'Checked in' ? `You’re at ${s.client(current.clientId)?.name}’s — check out when you leave.` : `Next: ${s.client(current.clientId)?.name} at ${current.start}.`}</button>
          : <span className="hero-note"><CheckCircle2 size={15} />No more visits today.</span>}
        <img src="./images/corliva-symbol-light.svg" alt="" aria-hidden />
      </section>

      {offToday && <AlertBanner tone="info" title="You’re on time off today">{offToday.type}. Enjoy your day.</AlertBanner>}
      {r.state === 'Not ready' && <AlertBanner tone="danger" title="You can’t be given visits right now" action={<Button size="sm" onClick={() => nav('/me')}>See why</Button>}>{r.blocking[0]}. Send what’s needed from My details.</AlertBanner>}
      {r.state === 'Ready, with reminders' && <AlertBanner tone="warning" title="A reminder about your documents" action={<Button size="sm" variant="secondary" onClick={() => nav('/me')}>My details</Button>}>{r.warnings[0]}.</AlertBanner>}

      {current && <div className="card">
        <CardHead title={cgState(current) === 'Checked in' ? 'You are on this visit' : 'Your next visit'} />
        <div className="card-body col" style={{ gap: 12 }}>
          <VisitCard v={current} from="/" />
          <Button className="big-btn" icon={cgState(current) === 'Checked in' ? Clock : LogIn} onClick={() => nav(`/visits/${current.id}?from=/`)}>{cgState(current) === 'Checked in' ? 'Open visit' : 'Open and check in'}</Button>
        </div>
      </div>}

      {toFinish.length > 0 && <div className="card">
        <CardHead title="To finish" sub="Records you still need to send or fix." />
        <div className="card-body col" style={{ gap: 8 }}>{toFinish.map(v => <div key={v.id} className="col" style={{ gap: 6 }}><VisitCard v={v} from="/" /></div>)}
          <div className="row t-caption t-muted" style={{ gap: 6 }}>{toFinish.some(v => cgState(v) === 'Sent back to fix') ? <Undo2 size={12} /> : <Send size={12} />}Open each one, finish it and press Send.</div></div>
      </div>}

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="card">
          <CardHead title="Today’s visits" action={<button className="link-btn" onClick={() => nav('/visits')}>All my visits</button>} />
          <div className="card-body col" style={{ gap: 8 }}>{today.length === 0 ? <div className="t-small t-muted">No visits today.</div> : today.map(v => <VisitCard key={v.id} v={v} from="/" />)}</div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="Next 7 days" action={<button className="link-btn" onClick={() => nav('/visits')}>See all</button>} />
            <div className="card-body">{next.length === 0 ? <div className="t-small t-muted">Nothing booked.</div> : next.slice(0, 6).map(v => (
              <button key={v.id} className="list-row clickable-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav(`/visits/${v.id}?from=/`)}>
                <CalendarDays size={15} color="var(--text-muted)" /><div className="grow"><div className="t-small t-medium">{fmtDate(v.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {v.start}–{v.end}</div><div className="t-caption t-muted">{s.client(v.clientId)?.name}</div></div><ChevronRight size={15} color="var(--text-muted)" />
              </button>))}{next.length > 6 && <div className="t-caption t-muted" style={{ marginTop: 6 }}>and {next.length - 6} more</div>}</div>
          </div>
          <div className="card">
            <CardHead title="Your reports" action={<button className="link-btn" onClick={() => nav('/incidents')}>Incidents</button>} />
            <div className="card-body">
              {myOpen.length === 0 && myActions.length === 0 ? <div className="t-small t-muted">No open reports.</div> : <>
                {myOpen.map(i => <button key={i.id} className="list-row clickable-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav(`/incidents/${i.id}?from=/`)}><TriangleAlert size={15} color="var(--text-muted)" /><div className="grow"><div className="t-small t-medium">{i.title}</div><div className="t-caption t-muted">{i.client}</div></div><Chip tone="warning">{i.status}</Chip></button>)}
                {myActions.map(({ i, a }) => <div key={a.id} className="list-row"><ShieldCheck size={15} color="var(--status-info)" /><div className="grow"><div className="t-small t-medium">Asked of you: {a.text}</div><div className="t-caption t-muted">{i.id} · by {fmtDate(a.due)}</div></div></div>)}
              </>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
