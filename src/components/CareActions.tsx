import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useStore, stampNow } from '../data/store'
import { Incident, TODAY, Visit, lists } from '../data/seed'
import { AlertBanner, Button, Field, Input, Modal, Select, Textarea } from './ui'

/** Nothing can be saved without a connection (BRD VIS-11). Returns false and says so clearly. */
export function useOnline() {
  const s = useStore()
  return () => {
    if (s.offline || !navigator.onLine) { s.toast('Not saved — no internet connection. Try again when you have signal.', 'danger'); return false }
    return true
  }
}

/** Report an incident. From a visit it is linked to that visit and client (BRD VIS-07, INC-01). It goes to the Care Supervisor. */
export function ReportIncident({ visit, onClose, onDone }: { visit?: Visit; onClose: () => void; onDone: (id: string) => void }) {
  const s = useStore()
  const online = useOnline()
  const mine = Array.from(new Set(s.visits.filter(v => v.caregiverId === s.me.caregiverId).map(v => v.clientId))).map(id => s.client(id)!).filter(Boolean)
  const [f, setF] = useState({ clientId: visit?.clientId ?? mine[0]?.id ?? '', category: '', severity: 'Medium' as Incident['severity'], date: visit?.date ?? TODAY, text: '', hurt: 'No' })
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const e = { category: !f.category ? 'Choose what kind of problem it was.' : '', text: f.text.trim().length < 10 ? 'Please say what happened (at least 10 letters).' : '', date: f.date > TODAY ? 'It can’t be in the future.' : '' }
  const client = s.client(f.clientId)
  const supervisor = s.users.find(u => u.role === 'Care Supervisor' && u.status === 'Active' && (u.branch === client?.branch || u.branch === 'all'))?.name ?? 'the Care Supervisor'
  const save = () => {
    setTried(true); if (e.category || e.text || e.date || busy) return
    if (!online()) return
    setBusy(true)
    const id = 'INC-' + (300 + s.incidents.length)
    const text = `${f.text.trim()}${f.hurt === 'Yes' ? ' Someone was hurt.' : ''}${visit ? ` (Visit ${visit.start}–${visit.end}.)` : ''}`
    const inc: Incident = { id, title: f.text.trim().split(/[.!?]/)[0].slice(0, 60), category: f.category, severity: f.hurt === 'Yes' && f.severity === 'Low' ? 'Medium' : f.severity, client: client?.name ?? '', caregiver: s.me.name, reportedBy: s.me.name, date: f.date,
      owner: supervisor, due: TODAY, status: 'Reported', branch: client?.branch ?? s.me.branch, sensitive: f.category === 'Safeguarding concern', notes: [{ by: s.me.name, at: stampNow(), text }], findings: '', actions: [] }
    s.setIncidents(x => [inc, ...x])
    s.log({ type: 'Incident', action: 'Reported an incident', record: `${id} ${inc.title}`, after: visit ? `Visit #${visit.id.slice(1)}` : undefined })
    s.toast(`Reported. ${supervisor} (Care Supervisor) has been told.`); onClose(); onDone(id)
  }
  return (
    <Modal title="Report a problem" sub={`It goes straight to ${supervisor}. If someone is in danger, call 911 first, then the office.`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={TriangleAlert} disabled={busy} onClick={save}>{busy ? 'Sending…' : 'Send report'}</Button></>}>
      {visit ? <AlertBanner tone="info" title={`About your visit to ${client?.name}`}>{visit.start}–{visit.end}. The report is linked to this visit.</AlertBanner>
        : <Field label="Client" required><Select value={f.clientId} onChange={x => setF({ ...f, clientId: x.target.value })} options={mine.map(c => ({ value: c.id, label: c.name }))} /></Field>}
      <Field label="What kind of problem?" required error={tried && e.category ? e.category : undefined}><Select value={f.category} onChange={x => setF({ ...f, category: x.target.value })} error={tried && !!e.category} options={[{ value: '', label: 'Choose…' }, ...lists.incidents.filter(t => t.active).map(t => t.name)]} /></Field>
      <div className="grid g-2">
        <Field label="Was anyone hurt?" required><Select value={f.hurt} onChange={x => setF({ ...f, hurt: x.target.value })} options={['No', 'Yes']} /></Field>
        <Field label="How serious?" required helper="High = needs action today."><Select value={f.severity} onChange={x => setF({ ...f, severity: x.target.value as Incident['severity'] })} options={['Low', 'Medium', 'High']} /></Field>
        {!visit && <Field label="When did it happen?" required error={tried && e.date ? e.date : undefined}><Input type="date" max={TODAY} value={f.date} onChange={x => setF({ ...f, date: x.target.value })} error={tried && !!e.date} /></Field>}
      </div>
      <Field label="What happened?" required error={tried && e.text ? e.text : undefined} helper="Say what you saw and what you did. Keep to the facts."><Textarea autoFocus value={f.text} onChange={x => setF({ ...f, text: x.target.value })} error={tried && !!e.text} placeholder="For example: Harold’s pill box was empty when I arrived. I called his wife." /></Field>
    </Modal>
  )
}
