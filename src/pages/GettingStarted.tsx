import { useState } from 'react'
import { Upload, FileText, CheckCircle2, Phone, Camera, CalendarCheck, Info } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { Requirement, ShownStatus, forCaregiver, shown } from '../data/hr'
import { Button, CardHead, Chip, ChipTone, PageHead } from '../components/ui'
import { SendDocument } from './Me'

const tone = (s: ShownStatus): ChipTone => s === 'Checked' ? 'success' : s === 'Rejected' || s === 'Expired' ? 'danger' : s === 'Waiting for check' ? 'info' : s === 'Missing' ? 'warning' : 'neutral'
const word = (s: ShownStatus) => s === 'Missing' ? 'Not sent yet' : s

/** What a new caregiver (applicant) sees until HR starts their work: the documents to send and what happens next. */
export default function GettingStarted() {
  const s = useStore()
  const g = s.caregiver(s.me.caregiverId)!
  const hr = s.users.find(u => u.role === 'HR Officer' && u.status === 'Active')
  const items = forCaregiver(g, s.cgReqs)
  const [sending, setSending] = useState<Requirement | null>(null)
  const forHr = items.filter(i => i.def.checkedBy !== 'Care Supervisor')
  const sent = forHr.filter(i => shown(i.rec) !== 'Missing').length
  const checked = forHr.filter(i => ['Checked', 'Not needed'].includes(shown(i.rec))).length
  const toSend = forHr.filter(i => ['Missing', 'Rejected', 'Expired'].includes(shown(i.rec)))
  const steps = [
    { title: 'Set up your account', text: 'Done.', done: true },
    { title: 'Send your documents', text: `${sent} of ${forHr.length} sent`, done: sent === forHr.length },
    { title: 'HR checks them', text: `${checked} of ${forHr.length} checked`, done: checked === forHr.length },
    { title: 'HR starts your work', text: 'HR sets your first day.', done: false },
    { title: 'You get your first visits', text: 'They show on your Today screen.', done: false },
  ]
  const now = steps.findIndex(x => !x.done)
  return (
    <>
      <PageHead title="Getting started" crumb="Getting started" sub={`Before you can be given visits, ${s.agency.name} needs to check your documents.`} />
      <div className="hero">
        <div className="t-display" style={{ fontSize: 24 }}>Welcome, {g.name.split(' ')[0]}</div>
        <div style={{ opacity: .9, marginTop: 4 }}>{g.type} · {s.branchName(g.branch)}</div>
        <div className="hero-note"><Info size={14} />{toSend.length ? `${toSend.length} document${toSend.length > 1 ? 's' : ''} still to send` : checked === forHr.length ? 'Everything is checked — HR will set your first day' : 'Everything is sent — waiting for HR to check'}</div>
        <img src="./images/corliva-symbol-light.svg" alt="" aria-hidden />
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="Your documents" sub="Take a clear photo of each one, or choose the file. HR checks every document before it counts." />
            <div className="card-body col" style={{ gap: 8 }}>{items.map(({ def, rec }) => { const st = shown(rec); const sup = def.checkedBy === 'Care Supervisor'; return (
              <div key={def.id} className="task-row" style={{ alignItems: 'flex-start' }}>
                <FileText size={16} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div className="grow" style={{ minWidth: 180 }}>
                  <div className="t-small t-medium">{def.name}</div>
                  <div className="t-caption t-muted">{sup ? 'Your supervisor does this with you after you start.' : rec?.file ? `${rec.file} · sent ${rec.uploaded ? fmtDate(rec.uploaded) : ''}` : def.blocking ? 'Needed before you can be given visits.' : 'Needed soon.'}</div>
                  {rec?.asked && st !== 'Checked' && <div className="t-caption" style={{ color: 'var(--status-info)' }}>HR asked: {rec.asked}</div>}
                  {st === 'Rejected' && rec?.reason && <div className="t-caption" style={{ color: 'var(--status-danger)' }}>HR: {rec.reason}</div>}
                </div>
                {sup && st === 'Missing' ? <Chip tone="neutral">After you start</Chip> : <Chip tone={tone(st)}>{word(st)}</Chip>}
                {!sup && ['Missing', 'Rejected', 'Expired'].includes(st) && <Button size="sm" icon={Upload} onClick={() => setSending(def)}>{st === 'Missing' ? 'Send it' : 'Send again'}</Button>}
              </div>) })}</div>
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <CardHead title="What happens next" />
            <div className="card-body" style={{ paddingTop: 0 }}>{steps.map((x, k) => (
              <div key={x.title} className="vstep" style={{ padding: '12px 0' }}>
                <span className={`step-dot ${x.done ? 'done' : k === now ? 'now' : ''}`}>{x.done ? <CheckCircle2 size={16} /> : k + 1}</span>
                <div><div className="t-small t-medium">{x.title}</div><div className="t-caption t-muted">{x.text}</div></div>
              </div>))}</div>
          </div>
          <div className="card">
            <CardHead title="Tips for good photos" />
            <div className="card-body col" style={{ gap: 8 }}>
              <div className="row t-small" style={{ gap: 8, alignItems: 'flex-start' }}><Camera size={14} style={{ marginTop: 3 }} />Lay it flat in good light, and get all four corners in.</div>
              <div className="row t-small" style={{ gap: 8, alignItems: 'flex-start' }}><CalendarCheck size={14} style={{ marginTop: 3 }} />Enter the date it runs out, as printed on it.</div>
            </div>
          </div>
          <div className="card card-pad">
            <div className="t-small t-medium">Questions?</div>
            <div className="t-small t-muted" style={{ marginTop: 4 }}>Call {hr?.name ?? 'HR'}, HR Officer.</div>
            {hr && <a className="row t-small t-medium" style={{ gap: 6, marginTop: 8 }} href={`tel:${hr.phone.replace(/\D/g, '')}`}><Phone size={14} />{hr.phone}</a>}
          </div>
        </div>
      </div>
      {sending && <SendDocument def={sending} rec={s.cgReqs.find(x => x.caregiverId === g.id && x.reqId === sending.id)} onClose={() => setSending(null)} />}
    </>
  )
}
