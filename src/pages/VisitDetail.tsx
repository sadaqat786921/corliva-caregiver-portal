import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Search, MapPin, KeyRound, Phone, Heart, Languages, LogIn, LogOut, Send, CheckCircle2, TriangleAlert, Clock, Navigation, PenLine,
  StickyNote, Repeat, History, Loader2, Info,
} from 'lucide-react'
import { useStore, fmtDate, stampNow } from '../data/store'
import { TODAY, Visit, nowHM } from '../data/seed'
import { captureLocation, cgState, checkInBlock, lateText, locationOk, minutesLate, missingBeforeSend, stateTone } from '../data/care'
import { AlertBanner, Avatar, Button, CardHead, Chip, ChipTone, EmptyState, Field, Input, Modal, Textarea } from '../components/ui'
import { ReportIncident, useOnline } from '../components/CareActions'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function VisitDetail() {
  const { id } = useParams()
  const s = useStore()
  const nav = useNavigate()
  const online = useOnline()
  const [params] = useSearchParams()
  const from = params.get('from') ?? '/visits'
  const backLabel = from === '/' ? 'Today' : from.startsWith('/incidents') ? 'Incident' : 'My visits'
  const [locating, setLocating] = useState<null | 'in' | 'out'>(null)
  const [sending, setSending] = useState(false)
  const [act, setAct] = useState<null | 'send' | 'fix' | 'report' | 'reason'>(null)
  const [reasonFor, setReasonFor] = useState('')
  const v = s.visits.find(x => x.id === id && x.caregiverId === s.me.caregiverId)
  const [note, setNote] = useState(v?.cgNote ?? '')
  if (!v) return <div className="card"><EmptyState icon={Search} tone="neutral" title="We can’t find this visit" text="It may have been moved to another caregiver. Your visits are in My visits." action={<Button onClick={() => nav('/visits')}>My visits</Button>} /></div>

  const c = s.client(v.clientId)!
  const plan = s.carePlans.find(p => p.clientId === v.clientId && p.status === 'Approved')
  const coordinator = s.users.find(u => u.name === c.coordinator)
  const st = cgState(v)
  const editable = st === 'Checked in' || st === 'Not sent yet' || st === 'Sent back to fix'
  const block = checkInBlock(v)
  const late = minutesLate(v)
  const missing = missingBeforeSend(v, plan)
  const emergency = c.people.find(p => p.emergency)
  const record = `Visit #${v.id.slice(1)}`
  const save = (patch: Partial<Visit>) => s.setVisits(x => x.map(y => y.id === v.id ? { ...y, ...patch } : y))

  const checkIn = async () => {
    if (!online()) return
    setLocating('in')
    const loc = await captureLocation()
    setLocating(null)
    if (!online()) return
    const t = nowHM()
    save({ checkIn: t, status: 'In progress', place: loc.text })
    s.log({ type: 'Visit', action: 'Checked in', record, after: `${t} · ${loc.text}` })
    s.toast(loc.ok ? `Checked in at ${t}.` : `Checked in at ${t}. ${loc.text} — this is noted for your supervisor.`, loc.ok ? 'success' : 'warning')
  }
  const checkOut = async () => {
    if (!online()) return
    setLocating('out')
    const loc = await captureLocation()
    setLocating(null)
    if (!online()) return
    const t = nowHM()
    save({ checkOut: t, outPlace: loc.text, cgNote: note.trim() || v.cgNote })
    s.log({ type: 'Visit', action: 'Checked out', record, after: `${t} · ${loc.text}` })
    s.toast(`Checked out at ${t}. Now send your record.`, loc.ok ? 'success' : 'warning')
  }
  const setTask = (t: string, done: boolean, reason?: string) => {
    if (!online()) return
    const tasksDone = (v.tasksDone ?? []).filter(x => x !== t).concat(done ? [t] : [])
    const taskReasons = { ...(v.taskReasons ?? {}) }
    if (done) delete taskReasons[t]; else taskReasons[t] = reason ?? ''
    save({ tasksDone, taskReasons, tasksNote: Object.entries(taskReasons).map(([k, r]) => `${k}: ${r}`).join('; ') || undefined })
  }
  const saveNote = () => { if (!online()) return; save({ cgNote: note.trim() || undefined }); s.toast('Note saved.') }
  const send = () => {
    if (sending || missing.length) return
    if (!online()) return
    setSending(true)
    const again = st === 'Sent back to fix'
    save({ approval: 'To review', status: 'Completed', sentAt: stampNow(), cgNote: note.trim() || v.cgNote, returned: again ? v.returned : undefined })
    s.log({ type: 'Visit', action: again ? 'Sent the visit record again' : 'Sent the visit record', record })
    s.toast(again ? 'Sent again. Your supervisor will check it.' : 'Record sent. Your supervisor will check it.')
    setAct(null); setTimeout(() => setSending(false), 600)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to={from} className="row t-small t-medium" style={{ gap: 6, marginBottom: 8 }}><ArrowLeft size={15} />{backLabel}</Link>
          <div className="row wrap" style={{ gap: 10 }}><h1 className="t-h1">{c.name}</h1><Chip tone={stateTone(st) as ChipTone}>{st}</Chip></div>
          <div className="t-small t-muted" style={{ marginTop: 4 }}>{v.date === TODAY ? 'Today' : fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {v.start}–{v.end} · {v.service}</div>
          <div className="crumbs"><Link to="/">Home</Link><span>/</span><Link to="/visits">My visits</Link><span>/</span><span>{c.name}</span></div>
        </div>
        <div className="actions">
          {v.status !== 'Cancelled' && <Button variant="secondary" icon={TriangleAlert} onClick={() => setAct('report')}>Report a problem</Button>}
        </div>
      </div>

      {st === 'Sent back to fix' && v.returned && <AlertBanner tone="danger" title="Sent back to fix" action={<Button size="sm" onClick={() => setAct('fix')}>Correct times</Button>}>{v.returned.by}: “{v.returned.reason}” Correct it below, then send it again.</AlertBanner>}
      {st === 'Sent' && <AlertBanner tone="info" title="Sent — waiting for your supervisor">Sent {v.sentAt}. You can’t change it now. If something is wrong, call the office.</AlertBanner>}
      {st === 'Approved' && <AlertBanner tone="success" title="Approved">Checked by {v.approvedBy} on {v.approvedAt}. Nothing more to do.</AlertBanner>}
      {st === 'Cancelled' && <AlertBanner tone="info" title="This visit was cancelled">{v.cancelReason ? `${v.cancelReason}.` : ''} Don’t go to this visit.</AlertBanner>}
      {st === 'Coming up' && v.date === TODAY && late > 0 && <AlertBanner tone="warning" title={`You are ${lateText(late)} past the start time`}>Check in as soon as you arrive. If you can’t make it, call the office now{coordinator ? ` on ${coordinator.phone}` : ''}.</AlertBanner>}
      {v.review && v.status === 'Scheduled' && <AlertBanner tone="warning" title="The office is looking at this visit">It may move to another caregiver. They will tell you.</AlertBanner>}

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          {v.status !== 'Cancelled' && <div className="card">
            <CardHead title="Your visit" sub="Do these in order. Each step saves straight away." />
            <div className="card-body" style={{ paddingTop: 0 }}>
              <div className="vstep">
                <span className={`step-dot ${v.checkIn ? 'done' : 'now'}`}>{v.checkIn ? <CheckCircle2 size={16} /> : 1}</span>
                <div className="grow col" style={{ gap: 8 }}>
                  <div className="t-medium">Check in when you arrive</div>
                  {v.checkIn ? <div className="col" style={{ gap: 2 }}>
                    <span className="row t-small" style={{ gap: 6 }}><Clock size={14} />Checked in at {v.checkIn}{v.original?.checkIn && v.original.checkIn !== v.checkIn ? ` (was ${v.original.checkIn})` : ''}</span>
                    <span className="row t-caption" style={{ gap: 6, color: locationOk(v.place) ? 'var(--text-muted)' : 'var(--status-warning)' }}><Navigation size={12} />{v.place}</span>
                  </div> : <>
                    <Button className="big-btn" icon={locating === 'in' ? Loader2 : LogIn} disabled={!!block || locating !== null} onClick={checkIn}>{locating === 'in' ? 'Getting your location…' : 'Check in now'}</Button>
                    {block ? <span className="t-caption t-muted">{block}</span> : <span className="t-caption t-muted">Your phone will ask to share your location. If you say no, you can still check in — it is noted for your supervisor.</span>}
                  </>}
                </div>
              </div>

              <div className="vstep">
                <span className={`step-dot ${v.checkIn && !missing.some(m => m.startsWith('Say')) ? 'done' : v.checkIn ? 'now' : ''}`}>{v.checkIn && !missing.some(m => m.startsWith('Say')) ? <CheckCircle2 size={16} /> : 2}</span>
                <div className="grow col" style={{ gap: 8 }}>
                  <div className="t-medium">Tasks from the care plan</div>
                  {!plan ? <div className="t-small t-muted">No care plan tasks.</div> : plan.tasks.map(t => {
                    const done = (v.tasksDone ?? []).includes(t); const why = v.taskReasons?.[t]; const answered = done || why !== undefined
                    return (
                      <div key={t} className="task-row">
                        <span className="grow t-small t-medium" style={{ minWidth: 160 }}>{t}{why && <span className="t-caption" style={{ display: 'block', color: 'var(--status-warning)', fontWeight: 400 }}>Not done: {why}</span>}</span>
                        <div className="choice" role="group" aria-label={t}>
                          <button className={answered && done ? 'on-yes' : ''} disabled={!editable || !v.checkIn} onClick={() => setTask(t, true)}>Done</button>
                          <button className={answered && !done ? 'on-no' : ''} disabled={!editable || !v.checkIn} onClick={() => { setReasonFor(t); setAct('reason') }}>Not done</button>
                        </div>
                      </div>)
                  })}
                  {!v.checkIn && <span className="t-caption t-muted">Check in first.</span>}
                </div>
              </div>

              <div className="vstep">
                <span className={`step-dot ${v.cgNote ? 'done' : ''}`}>{v.cgNote ? <CheckCircle2 size={16} /> : 3}</span>
                <div className="grow col" style={{ gap: 8 }}>
                  <div className="t-medium">Notes <span className="t-caption t-muted">(optional)</span></div>
                  {editable && v.checkIn ? <>
                    <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="How was the visit? Anything the office or next caregiver should know?" />
                    <div><Button size="sm" variant="secondary" icon={StickyNote} disabled={note.trim() === (v.cgNote ?? '')} onClick={saveNote}>Save note</Button></div>
                    <span className="t-caption t-muted">Something went wrong, like a fall or missing medicine? Use “Report a problem” instead.</span>
                  </> : <div className="t-small">{v.cgNote ? `“${v.cgNote}”` : <span className="t-muted">{v.checkIn ? 'No note.' : 'Check in first.'}</span>}</div>}
                </div>
              </div>

              <div className="vstep">
                <span className={`step-dot ${v.checkOut ? 'done' : v.checkIn ? 'now' : ''}`}>{v.checkOut ? <CheckCircle2 size={16} /> : 4}</span>
                <div className="grow col" style={{ gap: 8 }}>
                  <div className="t-medium">Check out when you leave</div>
                  {v.checkOut ? <div className="col" style={{ gap: 2 }}>
                    <span className="row t-small" style={{ gap: 6 }}><Clock size={14} />Checked out at {v.checkOut}{v.original?.checkOut && v.original.checkOut !== v.checkOut ? ` (was ${v.original.checkOut})` : ''}</span>
                    {v.outPlace && <span className="row t-caption" style={{ gap: 6, color: locationOk(v.outPlace) ? 'var(--text-muted)' : 'var(--status-warning)' }}><Navigation size={12} />{v.outPlace}</span>}
                  </div> : v.checkIn ? <Button className="big-btn" variant="secondary" icon={locating === 'out' ? Loader2 : LogOut} disabled={locating !== null} onClick={checkOut}>{locating === 'out' ? 'Getting your location…' : 'Check out now'}</Button>
                    : <span className="t-caption t-muted">Check in first.</span>}
                </div>
              </div>

              {editable && <div style={{ paddingTop: 16 }}>
                {missing.length > 0 && v.checkIn && <div className="hint" style={{ marginBottom: 8 }}>Before you can send: {missing.join(' · ')}.</div>}
                <Button className="big-btn" icon={Send} disabled={missing.length > 0 || sending} onClick={() => setAct('send')}>{st === 'Sent back to fix' ? 'Send again' : 'Send record'}</Button>
              </div>}
            </div>
          </div>}

          <div className="card">
            <CardHead title="Care plan instructions" sub={plan ? `Version ${plan.version}, approved by ${plan.approvedBy}.` : undefined} />
            <div className="card-body">{plan?.instructions ? <div className="t-small" style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>{plan.instructions}</div> : <div className="t-small t-muted">No special instructions.</div>}</div>
          </div>

          {(v.corrections?.length ?? 0) > 0 && <div className="card">
            <CardHead title="Your corrections" sub="The times you first recorded are kept." />
            <div className="card-body timeline">{v.corrections!.map((h, i) => <div key={i} className="timeline-item"><div className="stat-icon tone-neutral"><History /></div><div><div className="t-small">{h.why}</div><div className="t-caption t-muted">{h.by} · {h.at}</div></div></div>)}</div>
          </div>}
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="Client" />
            <div className="card-body">
              <div className="row" style={{ gap: 10, marginBottom: 12 }}><Avatar name={c.name} /><div><div className="t-medium">{c.name}</div><div className="t-caption t-muted">{c.services}</div></div></div>
              <dl className="kv" style={{ gridTemplateColumns: '100px 1fr' }}>
                <dt>Address</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><MapPin size={13} style={{ marginTop: 3 }} />{c.address}</dd>
                <dt>Getting in</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><KeyRound size={13} style={{ marginTop: 3 }} />{c.access || '—'}</dd>
                <dt>Phone</dt><dd className="row" style={{ gap: 6 }}><Phone size={13} /><a href={`tel:${c.phone}`}>{c.phone}</a></dd>
                <dt>Language</dt><dd className="row" style={{ gap: 6 }}><Languages size={13} />{c.language}</dd>
                {c.preferences && <><dt>Likes, needs</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><Heart size={13} style={{ marginTop: 3 }} />{c.preferences}</dd></>}
                <dt>Emergency</dt><dd>{emergency ? <>{emergency.name} ({emergency.relationship})<div className="t-caption"><a href={`tel:${emergency.phone}`}>{emergency.phone}</a></div></> : '—'}</dd>
              </dl>
            </div>
          </div>
          <div className="card">
            <CardHead title="Visit details" />
            <div className="card-body"><dl className="kv" style={{ gridTemplateColumns: '100px 1fr' }}>
              <dt>Date</dt><dd>{fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
              <dt>Time</dt><dd>{v.start} – {v.end}</dd>
              <dt>Service</dt><dd>{v.service}</dd>
              <dt>Repeats</dt><dd className="row" style={{ gap: 6 }}><Repeat size={13} />{v.series ? `Every ${Array.from(new Set(s.visits.filter(x => x.series === v.series).map(x => new Date(x.date + 'T00:00').getDay()))).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => DAYS[d]).join(', ')}` : 'One-off'}</dd>
              <dt>Office</dt><dd>{c.coordinator} (Care Coordinator){coordinator && <div className="t-caption"><a href={`tel:${coordinator.phone}`}>{coordinator.phone}</a></div>}</dd>
            </dl></div>
          </div>
          <div className="row t-caption t-muted" style={{ gap: 6 }}><Info size={12} />You only see what you need for this visit.</div>
        </div>
      </div>

      {act === 'reason' && <NotDoneModal task={reasonFor} current={v.taskReasons?.[reasonFor]} onClose={() => setAct(null)} onSave={r => { setTask(reasonFor, false, r); setAct(null) }} />}
      {act === 'send' && <Modal title={st === 'Sent back to fix' ? 'Send it again?' : 'Send your record?'} sub="Your supervisor checks it. After you send it you can’t change it unless it’s sent back." onClose={() => setAct(null)}
        footer={<><Button variant="secondary" onClick={() => setAct(null)}>Not yet</Button><Button icon={Send} disabled={sending} onClick={send}>{sending ? 'Sending…' : 'Send'}</Button></>}>
        <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
          <dt>Times</dt><dd>{v.checkIn} – {v.checkOut} <span className="t-muted">(planned {v.start}–{v.end})</span></dd>
          <dt>Tasks done</dt><dd>{(v.tasksDone ?? []).length} of {plan?.tasks.length ?? 0}{Object.keys(v.taskReasons ?? {}).length > 0 && <div className="t-caption" style={{ color: 'var(--status-warning)' }}>Not done: {Object.entries(v.taskReasons!).map(([k, r]) => `${k} (${r})`).join(', ')}</div>}</dd>
          <dt>Location</dt><dd>{v.place}</dd>
          <dt>Note</dt><dd>{(note.trim() || v.cgNote) ? `“${note.trim() || v.cgNote}”` : 'None'}</dd>
        </dl>
      </Modal>}
      {act === 'fix' && <FixTimes v={v} onClose={() => setAct(null)} />}
      {act === 'report' && <ReportIncident visit={v} onClose={() => setAct(null)} onDone={iid => nav(`/incidents/${iid}?from=${encodeURIComponent(`/visits/${v.id}`)}`)} />}
    </>
  )
}

function NotDoneModal({ task, current, onClose, onSave }: { task: string; current?: string; onClose: () => void; onSave: (r: string) => void }) {
  const [r, setR] = useState(current ?? '')
  const [tried, setTried] = useState(false)
  const bad = r.trim().length < 5
  return (
    <Modal title={`Not done: ${task}`} sub="Say why, so your supervisor understands." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setTried(true); if (!bad) onSave(r.trim()) }}>Save</Button></>}>
      <Field label="Why wasn’t it done?" required error={tried && bad ? 'Please write a short reason (at least 5 letters).' : undefined}><Textarea autoFocus value={r} onChange={e => setR(e.target.value)} error={tried && bad} placeholder="For example: he had already eaten / she said no today" /></Field>
    </Modal>
  )
}

/** After a record is sent back, the caregiver corrects the times. The first times are kept (BRD APP-04). */
function FixTimes({ v, onClose }: { v: Visit; onClose: () => void }) {
  const s = useStore()
  const online = useOnline()
  const [inAt, setIn] = useState(v.checkIn ?? v.start)
  const [outAt, setOut] = useState(v.checkOut ?? v.end)
  const [why, setWhy] = useState('')
  const [tried, setTried] = useState(false)
  const badTime = !inAt || !outAt || outAt <= inAt
  const badWhy = why.trim().length < 5
  const same = inAt === v.checkIn && outAt === v.checkOut
  const save = () => {
    setTried(true); if (badTime || badWhy || same) return
    if (!online()) return
    const line = `Changed times from ${v.checkIn}–${v.checkOut} to ${inAt}–${outAt}: ${why.trim()}`
    s.setVisits(x => x.map(y => y.id === v.id ? { ...y, checkIn: inAt, checkOut: outAt, original: y.original ?? { checkIn: y.checkIn, checkOut: y.checkOut }, corrections: [...(y.corrections ?? []), { by: s.me.name, at: stampNow(), why: line }] } : y))
    s.log({ type: 'Visit', action: 'Corrected visit times', record: `Visit #${v.id.slice(1)}`, before: `${v.checkIn}–${v.checkOut}`, after: `${inAt}–${outAt}`, reason: why.trim() })
    s.toast('Times corrected. Now send it again.'); onClose()
  }
  return (
    <Modal title="Correct the times" sub="The times you first recorded are kept and shown to your supervisor." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={PenLine} onClick={save}>Save correction</Button></>}>
      <div className="grid g-2">
        <Field label="I arrived at" required><Input type="time" value={inAt} onChange={e => setIn(e.target.value)} error={tried && badTime} /></Field>
        <Field label="I left at" required error={tried && badTime ? 'Leaving must be after arriving.' : undefined}><Input type="time" value={outAt} onChange={e => setOut(e.target.value)} error={tried && badTime} /></Field>
      </div>
      <div className="hint">Planned {v.start}–{v.end}. You recorded {v.checkIn}–{v.checkOut}.</div>
      {tried && same && <AlertBanner tone="warning" title="Nothing changed">Change at least one time.</AlertBanner>}
      <Field label="What happened?" required error={tried && badWhy ? 'Please explain (at least 5 letters).' : undefined}><Textarea value={why} onChange={e => setWhy(e.target.value)} error={tried && badWhy} placeholder="For example: I forgot to check out when I left at 16:00" /></Field>
    </Modal>
  )
}
