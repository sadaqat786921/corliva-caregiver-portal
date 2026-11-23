import { useState } from 'react'
import { Upload, FileText, Ban, TriangleAlert, CheckCircle2, Phone, Mail, MapPin, HeartHandshake, CalendarOff, Info } from 'lucide-react'
import { useStore, fmtDate, stampNow } from '../data/store'
import { TODAY, addDays } from '../data/seed'
import { CgRequirement, Requirement, ShownStatus, forCaregiver, readiness, runsOutSoon, shown } from '../data/hr'
import { AlertBanner, Avatar, Button, CardHead, Chip, ChipTone, Field, Input, Modal, PageHead, Textarea } from '../components/ui'
import { useOnline } from '../components/CareActions'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const long = (d?: string) => d ? fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const tone = (s: ShownStatus): ChipTone => s === 'Checked' ? 'success' : s === 'Rejected' || s === 'Expired' ? 'danger' : s === 'Waiting for check' ? 'info' : s === 'Missing' ? 'warning' : 'neutral'
const readyTone = (s: string): ChipTone => s === 'Ready to work' ? 'success' : s === 'Ready, with reminders' ? 'warning' : s === 'Not ready' ? 'danger' : 'neutral'

export default function Me() {
  const s = useStore()
  const g = s.caregiver(s.me.caregiverId)!
  const hr = s.users.find(u => u.role === 'HR Officer' && u.status === 'Active')
  const r = readiness(g, s.cgReqs)
  const items = forCaregiver(g, s.cgReqs)
  const off = s.timeOff.filter(t => t.caregiverId === g.id && t.status === 'Booked').sort((a, b) => b.from.localeCompare(a.from))
  const [sending, setSending] = useState<Requirement | null>(null)
  return (
    <>
      <PageHead title="My details" crumb="My details" sub={`Your documents, working hours and contact details. ${hr ? `${hr.name} (HR) keeps these — call ${hr.phone} to change anything.` : ''}`} />
      <div className="card card-pad row wrap" style={{ gap: 14 }}>
        <Avatar name={g.name} size="lg" />
        <div className="grow"><div className="t-h3">{g.name}</div><div className="t-small t-muted">{g.type} · {s.branchName(g.branch)} · started {long(g.start)}</div><div className="t-small">Trained for: {g.skills.join(', ')}</div></div>
        <Chip tone={readyTone(r.state)}>{r.state}</Chip>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="Ready to work?" sub="Worked out by HR from your documents and checks." />
            <div className="card-body col" style={{ gap: 8 }}>
              {r.blocking.map(b => <div key={b} className="row t-small" style={{ gap: 8, color: 'var(--status-danger)' }}><Ban size={14} />{b} — you can’t be given visits until this is sorted</div>)}
              {r.warnings.map(w => <div key={w} className="row t-small" style={{ gap: 8, color: 'var(--status-warning)' }}><TriangleAlert size={14} />{w}</div>)}
              {r.state === 'Ready to work' && <div className="row t-small" style={{ gap: 8, color: 'var(--status-success)' }}><CheckCircle2 size={14} />Everything is checked and in date.</div>}
            </div>
          </div>
          <div className="card">
            <CardHead title="My documents and checks" sub="Send a new copy before one runs out. It counts once HR has checked it." />
            <div className="card-body col" style={{ gap: 8 }}>{items.map(({ def, rec }) => { const st = shown(rec); const soon = runsOutSoon(rec); return (
              <div key={def.id} className="task-row" style={{ alignItems: 'flex-start' }}>
                <FileText size={16} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div className="grow" style={{ minWidth: 180 }}>
                  <div className="t-small t-medium">{def.name} {def.blocking && <span className="t-caption t-muted">· needed for visits</span>}</div>
                  <div className="t-caption t-muted">{def.renewMonths === null ? 'Doesn’t run out' : rec?.expiry ? `Runs out ${long(rec.expiry)}` : 'No date yet'}{rec?.file ? ` · ${rec.file}` : ''}</div>
                  {rec?.reason && st === 'Rejected' && <div className="t-caption" style={{ color: 'var(--status-danger)' }}>HR: {rec.reason}</div>}
                  {rec?.asked && <div className="t-caption" style={{ color: 'var(--status-info)' }}>HR asked: {rec.asked}</div>}
                  {soon && <div className="t-caption" style={{ color: 'var(--status-warning)' }}>Runs out soon — please send the new one.</div>}
                </div>
                <Chip tone={tone(st)}>{st}</Chip>
                {def.checkedBy === 'HR Officer' && (['Missing', 'Rejected', 'Expired'].includes(st) || soon || !!rec?.asked) ? <Button size="sm" icon={Upload} onClick={() => setSending(def)}>Send {rec?.file ? 'a new copy' : 'it'}</Button>
                  : def.checkedBy === 'Care Supervisor' ? <span className="t-caption t-muted">Done with your supervisor</span> : null}
              </div>) })}</div>
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="When I usually work" />
            <div className="card-body col" style={{ gap: 10 }}>
              <div className="row wrap" style={{ gap: 6 }}>{[1, 2, 3, 4, 5, 6, 0].map(d => <Chip key={d} tone={g.days.includes(d) ? 'success' : 'neutral'}>{DAYS[d]}</Chip>)}</div>
              <div className="t-small">{g.from} – {g.to} · up to {g.maxHours} hours a week</div>
            </div>
          </div>
          <div className="card">
            <CardHead title="My time off" />
            <div className="card-body">{off.length === 0 ? <div className="t-small t-muted">None booked.</div> : off.map(t => (
              <div key={t.id} className="list-row"><CalendarOff size={15} color="var(--text-muted)" /><div className="grow"><div className="t-small t-medium">{long(t.from)}{t.to !== t.from ? ` – ${long(t.to)}` : ''}</div><div className="t-caption t-muted">{t.type}</div></div><Chip tone={t.to < TODAY ? 'neutral' : 'info'}>{t.to < TODAY ? 'Taken' : 'Booked'}</Chip></div>))}
              <div className="hint" style={{ marginTop: 8 }}>To book time off, call {hr?.name ?? 'HR'}{hr ? ` on ${hr.phone}` : ''}. Your visits on those days are moved by the office.</div></div>
          </div>
          <div className="card">
            <CardHead title="My contact details" />
            <div className="card-body"><dl className="kv" style={{ gridTemplateColumns: '90px 1fr' }}>
              <dt>Phone</dt><dd className="row" style={{ gap: 6 }}><Phone size={13} />{g.phone}</dd>
              <dt>Email</dt><dd className="row" style={{ gap: 6 }}><Mail size={13} />{g.email}</dd>
              <dt>Address</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><MapPin size={13} style={{ marginTop: 3 }} />{g.address}</dd>
              <dt>Emergency</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><HeartHandshake size={13} style={{ marginTop: 3 }} /><span>{g.emergency.name} ({g.emergency.relationship})<div className="t-caption t-muted">{g.emergency.phone}</div></span></dd>
            </dl><div className="row t-caption t-muted" style={{ gap: 6, marginTop: 10 }}><Info size={12} />Something wrong? Call HR to change it.</div></div>
          </div>
        </div>
      </div>
      {sending && <SendDocument def={sending} rec={s.cgReqs.find(x => x.caregiverId === g.id && x.reqId === sending.id)} onClose={() => setSending(null)} />}
    </>
  )
}

/** Send a document to HR. Same rule as the HR portal: it stays "Waiting for check" until HR checks it. The old file is kept. */
function SendDocument({ def, rec, onClose }: { def: Requirement; rec?: CgRequirement; onClose: () => void }) {
  const s = useStore()
  const online = useOnline()
  const [file, setFile] = useState<File | null>(null)
  const [expiry, setExpiry] = useState(def.renewMonths ? addDays(def.renewMonths * 30) : '')
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const errFile = !file ? 'Take a photo or choose a file.' : !/\.(pdf|jpe?g|png|heic|docx?)$/i.test(file.name) ? 'Use a photo, PDF or Word file.' : file.size > 10 * 1024 * 1024 ? 'The file is bigger than 10 MB.' : ''
  const errExp = def.renewMonths !== null && (!expiry || expiry <= TODAY) ? 'Choose the date on the document when it runs out.' : ''
  const save = () => {
    setTried(true); if (errFile || errExp || busy) return
    if (!online()) return
    setBusy(true)
    const g = s.caregiver(s.me.caregiverId)!
    const old = rec?.file ? [{ file: rec.file, uploaded: rec.uploaded ?? TODAY, expiry: rec.expiry, outcome: rec.status === 'Checked' ? 'Replaced' : rec.status }] : []
    const next: CgRequirement = { ...(rec ?? { id: 'cr' + Date.now(), caregiverId: g.id, reqId: def.id, previous: [], history: [] }),
      status: 'Waiting for check', file: file!.name, uploadedBy: `${g.name} (caregiver portal)`, uploaded: TODAY, expiry: expiry || undefined, checkedBy: undefined, checkedDate: undefined, reason: undefined, asked: undefined,
      previous: [...old, ...(rec?.previous ?? [])], history: [...(rec?.history ?? []), { by: g.name, at: stampNow(), text: `Sent ${file!.name}${note.trim() ? ` — ${note.trim()}` : ''}.` }] }
    s.setCgReqs(x => rec ? x.map(y => y.id === rec.id ? next : y) : [...x, next])
    s.log({ type: 'Document', action: `Sent ${def.name}`, record: g.name, after: 'Waiting for check' })
    s.toast(`${def.name} sent. HR will check it.`); onClose()
  }
  return (
    <Modal title={`Send ${def.name}`} sub="Take a clear photo of the whole document, or choose the file." onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Upload} disabled={busy} onClick={save}>{busy ? 'Sending…' : 'Send to HR'}</Button></>}>
      <Field label="Photo or file" required error={tried && errFile ? errFile : undefined} helper="Photo, PDF or Word. Up to 10 MB.">
        <input type="file" accept="image/*,.pdf,.doc,.docx" capture="environment" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      {def.renewMonths !== null && <Field label="Runs out on" required error={tried && errExp ? errExp : undefined} helper="The date printed on the document."><Input type="date" min={addDays(1)} value={expiry} onChange={e => setExpiry(e.target.value)} error={tried && !!errExp} /></Field>}
      <Field label="Note for HR" helper="Optional."><Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="For example: renewed early at the clinic" /></Field>
      <AlertBanner tone="info" title="HR checks it first">It shows as “Waiting for check” until HR has looked at it.{rec?.file ? (rec.status === 'Checked' && !runsOutSoon(rec) ? ' Your old copy is kept.' : rec.status === 'Checked' ? ' Your old copy still counts until then.' : ' Your old copy is kept.') : ''}</AlertBanner>
    </Modal>
  )
}
