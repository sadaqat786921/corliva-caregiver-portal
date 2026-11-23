// What each caregiver needs, their documents, time off and readiness — the same rules the HR Officer portal uses.
import { Caregiver, Note, TODAY, Visit, addDays, stampFor } from './seed'

/* ---- What each caregiver needs (set by the Agency Admin in Rules & Requirements) ---- */
export type CgType = Caregiver['type']
export interface Requirement { id: string; name: string; types: CgType[]; blocking: boolean; renewMonths: number | null; checkedBy: 'HR Officer' | 'Care Supervisor'; why: string }
const AIDES: CgType[] = ['Certified aide', 'Home health aide']
const ALL: CgType[] = ['Certified aide', 'Home health aide', 'Companion']
export const requirements: Requirement[] = [
  { id: 'q-id', name: 'Photo ID', types: ALL, blocking: true, renewMonths: null, checkedBy: 'HR Officer', why: 'Proves who they are.' },
  { id: 'q-bg', name: 'Background check', types: ALL, blocking: true, renewMonths: 36, checkedBy: 'HR Officer', why: 'Required before working with clients. Every 3 years.' },
  { id: 'q-rtw', name: 'Right to work', types: ALL, blocking: true, renewMonths: null, checkedBy: 'HR Officer', why: 'Allowed to work in the US. Some papers run out.' },
  { id: 'q-cert', name: 'Aide certificate', types: AIDES, blocking: true, renewMonths: 24, checkedBy: 'HR Officer', why: 'State certificate for personal care.' },
  { id: 'q-fa', name: 'First-aid certificate', types: AIDES, blocking: true, renewMonths: 24, checkedBy: 'HR Officer', why: 'Must be in date to do personal care.' },
  { id: 'q-tb', name: 'TB test', types: AIDES, blocking: true, renewMonths: 12, checkedBy: 'HR Officer', why: 'Yearly health check.' },
  { id: 'q-dl', name: 'Driving licence and car insurance', types: ALL, blocking: false, renewMonths: 12, checkedBy: 'HR Officer', why: 'Needed if they drive to visits.' },
  { id: 'q-tr', name: 'Annual training', types: ALL, blocking: false, renewMonths: 12, checkedBy: 'HR Officer', why: 'Safety refresher every year.' },
  { id: 'q-sk', name: 'Personal care skills check', types: AIDES, blocking: false, renewMonths: 12, checkedBy: 'Care Supervisor', why: 'Watched by a Care Supervisor.' },
]

/* ---- Each caregiver's evidence for each requirement ---- */
export type ReqStatus = 'Missing' | 'Waiting for check' | 'Checked' | 'Rejected' | 'Not needed'
export interface OldFile { file: string; uploaded: string; expiry?: string; outcome: string }
export interface CgRequirement {
  id: string; caregiverId: string; reqId: string; status: ReqStatus
  file?: string; uploadedBy?: string; uploaded?: string; expiry?: string
  checkedBy?: string; checkedDate?: string; reason?: string; asked?: string
  previous: OldFile[]; history: Note[]
}

const H = (day: number, by: string, text: string): Note => ({ by, at: stampFor(day, '10:00'), text })
let n = 0
const ok = (caregiverId: string, reqId: string, uploadedDay: number, expiryDay: number | null, by = 'Lena Ortiz'): CgRequirement => ({
  id: 'cr' + (++n), caregiverId, reqId, status: 'Checked', file: `${requirements.find(r => r.id === reqId)!.name}.pdf`, uploadedBy: by, uploaded: addDays(uploadedDay),
  expiry: expiryDay === null ? undefined : addDays(expiryDay), checkedBy: reqId === 'q-sk' ? 'Michael Brooks' : 'Lena Ortiz', checkedDate: addDays(uploadedDay + 1), previous: [], history: [H(uploadedDay + 1, reqId === 'q-sk' ? 'Michael Brooks' : 'Lena Ortiz', 'Checked.')],
})
const miss = (caregiverId: string, reqId: string, asked?: string): CgRequirement => ({ id: 'cr' + (++n), caregiverId, reqId, status: 'Missing', asked, previous: [], history: [] })

/** Every active caregiver starts fully checked, then the exceptions below are applied. */
function build(): CgRequirement[] {
  const out: CgRequirement[] = []
  const spread: Record<string, number> = { 'q-bg': 500, 'q-cert': 300, 'q-fa': 250, 'q-tb': 140, 'q-dl': 170, 'q-tr': 120, 'q-sk': 200 }
  const people: [string, CgType][] = [['g1', 'Certified aide'], ['g2', 'Certified aide'], ['g3', 'Certified aide'], ['g7', 'Companion'], ['g9', 'Home health aide'], ['g10', 'Certified aide'], ['g11', 'Companion'], ['g5', 'Certified aide'], ['g6', 'Companion'], ['g4', 'Home health aide'], ['g8', 'Companion']]
  people.forEach(([gid, type], k) => requirements.filter(r => r.types.includes(type)).forEach(r => {
    const exp = r.renewMonths === null ? null : (spread[r.id] ?? 200) + k * 7
    out.push(ok(gid, r.id, -(r.renewMonths ? r.renewMonths * 30 - (exp ?? 0) : 400), exp))
  }))
  const set = (gid: string, rid: string, patch: Partial<CgRequirement>) => { const x = out.find(y => y.caregiverId === gid && y.reqId === rid)!; Object.assign(x, patch) }
  // Daniel Osei: first-aid ran out; new certificate sent in yesterday, waiting for HR
  set('g2', 'q-fa', { status: 'Waiting for check', file: 'First-aid certificate 2026.pdf', uploadedBy: 'Daniel Osei (caregiver app)', uploaded: addDays(-1), expiry: addDays(729), checkedBy: undefined, checkedDate: undefined,
    previous: [{ file: 'First-aid certificate 2024.pdf', uploaded: addDays(-735), expiry: addDays(-6), outcome: 'Ran out' }], history: [H(-735, 'Lena Ortiz', 'Checked.'), H(-6, 'System', 'Ran out. Daniel can’t be given visits.'), H(-1, 'Daniel Osei', 'Sent a new certificate.')] })
  // Hannah Lee: new starter, background check sent in, not checked yet
  set('g7', 'q-bg', { status: 'Waiting for check', file: 'Background check result.pdf', uploadedBy: 'Lena Ortiz', uploaded: addDays(-2), expiry: addDays(1093), checkedBy: undefined, checkedDate: undefined, history: [H(-2, 'Lena Ortiz', 'Uploaded the result from the checking service.')] })
  // Ben Okafor: annual training runs out soon
  set('g10', 'q-tr', { expiry: addDays(9) })
  set('g10', 'q-sk', { status: 'Waiting for check', checkedBy: undefined, checkedDate: undefined, file: 'Skills check form.pdf', uploaded: addDays(-1), history: [H(-1, 'Lena Ortiz', 'Uploaded the skills check form for the Care Supervisor.')] })
  // Rosa Diaz: TB test runs out soon; driving licence photo was unreadable
  set('g9', 'q-tb', { expiry: addDays(20) })
  set('g9', 'q-dl', { status: 'Rejected', reason: 'Photo of the licence is blurred — please send a clear copy.', file: 'Licence photo.jpg', uploaded: addDays(-5), checkedDate: addDays(-4), history: [H(-5, 'Rosa Diaz', 'Sent a photo of her licence.'), H(-4, 'Lena Ortiz', 'Rejected: photo is blurred.')] })
  // Maria Lopez: first-aid certificate runs out soon (she sends the new one from the caregiver portal)
  set('g3', 'q-fa', { expiry: addDays(18) })
  // Lily Chen: right-to-work papers run out soon
  set('g11', 'q-rtw', { expiry: addDays(25) })
  // James Carter: doesn't drive
  set('g6', 'q-dl', { status: 'Not needed', reason: 'Doesn’t drive — takes the bus to visits.', file: undefined, expiry: undefined, history: [H(-500, 'Lena Ortiz', 'Marked not needed: doesn’t drive.')] })
  // Applicants
  out.push(ok('g12', 'q-id', -5, null), { ...miss('g12', 'q-bg'), status: 'Waiting for check', file: 'Background check result.pdf', uploadedBy: 'Lena Ortiz', uploaded: addDays(-1), expiry: addDays(1094), history: [H(-1, 'Lena Ortiz', 'Uploaded the result from the checking service.')] },
    miss('g12', 'q-rtw'), miss('g12', 'q-cert'), miss('g12', 'q-fa'), miss('g12', 'q-tb', 'Please book your TB test and send the result.'), miss('g12', 'q-dl'), miss('g12', 'q-tr'), miss('g12', 'q-sk'))
  out.push({ ...miss('g13', 'q-id'), status: 'Waiting for check', file: 'Passport.jpg', uploadedBy: 'Tom Becker (email)', uploaded: addDays(0), history: [H(0, 'Lena Ortiz', 'Saved the passport photo Tom emailed.')] },
    miss('g13', 'q-bg'), miss('g13', 'q-rtw'), miss('g13', 'q-dl'), miss('g13', 'q-tr'))
  return out
}
export const cgRequirements: CgRequirement[] = build()

/* ---- Time off (dated unavailability) ---- */
export type TimeOffType = 'Holiday' | 'Sick' | 'Family' | 'Training' | 'Other'
export interface TimeOff { id: string; caregiverId: string; from: string; to: string; type: TimeOffType; note: string; status: 'Booked' | 'Cancelled'; by: string; at: string; cancelReason?: string }
export const timeOff: TimeOff[] = [
  { id: 'to1', caregiverId: 'g1', from: addDays(9), to: addDays(11), type: 'Holiday', note: 'Family wedding.', status: 'Booked', by: 'Lena Ortiz', at: stampFor(-3, '11:00') },
  { id: 'to2', caregiverId: 'g6', from: addDays(2), to: addDays(2), type: 'Family', note: 'Hospital appointment with his wife.', status: 'Booked', by: 'Lena Ortiz', at: stampFor(-1, '15:30') },
  { id: 'to3', caregiverId: 'g11', from: addDays(-12), to: addDays(-8), type: 'Holiday', note: '', status: 'Booked', by: 'Lena Ortiz', at: stampFor(-30, '09:00') },
  { id: 'to4', caregiverId: 'g3', from: addDays(-20), to: addDays(-19), type: 'Sick', note: 'Flu.', status: 'Booked', by: 'Lena Ortiz', at: stampFor(-20, '07:10') },
  { id: 'to5', caregiverId: 'g9', from: addDays(15), to: addDays(16), type: 'Training', note: 'Planned course — moved to next month.', status: 'Cancelled', by: 'Lena Ortiz', at: stampFor(-9, '10:00'), cancelReason: 'Course moved to next month.' },
]

/* ---- Rules ---- */
export const reqDef = (id: string) => requirements.find(r => r.id === id)!
export const forCaregiver = (g: Caregiver, list: CgRequirement[]) => requirements.filter(r => r.types.includes(g.type)).map(r => ({ def: r, rec: list.find(x => x.caregiverId === g.id && x.reqId === r.id) }))

/** Status as people see it: a checked item past its date shows Expired. */
export type ShownStatus = ReqStatus | 'Expired'
export const shown = (rec?: CgRequirement): ShownStatus => !rec ? 'Missing' : rec.status === 'Checked' && rec.expiry && rec.expiry < TODAY ? 'Expired' : rec.status
export const runsOutSoon = (rec?: CgRequirement) => !!rec && rec.status === 'Checked' && !!rec.expiry && rec.expiry >= TODAY && rec.expiry <= addDays(30)
const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

export type ReadyState = 'Ready to work' | 'Ready, with reminders' | 'Not ready' | 'Not set up'
export interface Readiness { state: ReadyState; blocking: string[]; warnings: string[]; done: number; total: number }
/** Readiness is worked out from employment and requirements — never typed in by hand. */
export function readiness(g: Caregiver, list: CgRequirement[]): Readiness {
  const items = forCaregiver(g, list)
  const blocking: string[] = [], warnings: string[] = []
  if (g.status !== 'Active') blocking.push(g.status === 'Applicant' ? 'Hasn’t started work yet' : g.status === 'Inactive' ? 'Work is paused' : 'No longer employed')
  items.forEach(({ def, rec }) => {
    const st = shown(rec)
    // A new copy of something already checked and still in date: the old copy counts until HR checks the new one.
    const prev = rec?.previous[0]
    if (st === 'Waiting for check' && prev?.outcome === 'Replaced' && (!prev.expiry || prev.expiry >= TODAY)) { warnings.push(`New ${def.name.toLowerCase()} waiting for a check (the old one is fine until ${prev.expiry ? fmt(prev.expiry) : 'then'})`); return }
    const text = st === 'Missing' ? `${def.name} not sent in` : st === 'Waiting for check' ? `${def.name} waiting for a check` : st === 'Rejected' ? `${def.name} rejected` : st === 'Expired' ? `${def.name} ran out ${fmt(rec!.expiry!)}` : ''
    if (text) (def.blocking ? blocking : warnings).push(text)
    else if (runsOutSoon(rec)) warnings.push(`${def.name} runs out ${fmt(rec!.expiry!)}`)
  })
  const done = items.filter(i => ['Checked', 'Not needed'].includes(shown(i.rec))).length
  const state: ReadyState = items.length === 0 ? 'Not set up' : blocking.length ? 'Not ready' : warnings.length ? 'Ready, with reminders' : 'Ready to work'
  return { state, blocking, warnings, done, total: items.length }
}

/** Booked time off covering a date. */
export const offOn = (gid: string, date: string, list: TimeOff[]) => list.find(t => t.caregiverId === gid && t.status === 'Booked' && t.from <= date && t.to >= date)

/** Why an upcoming visit no longer works for its caregiver (HR reasons only). */
export function hrReason(v: Visit, g: Caregiver, reqs: CgRequirement[], off: TimeOff[]): string | undefined {
  const r = readiness(g, reqs)
  if (r.state === 'Not ready') return `${g.name} is not ready to work: ${r.blocking[0].toLowerCase()}`
  const t = offOn(g.id, v.date, off)
  if (t) return `${g.name} is on time off (${t.type.toLowerCase()})`
  const day = new Date(v.date + 'T00:00').getDay()
  if (!g.days.includes(day) || v.start < g.from || v.end > g.to) return `${g.name} no longer works at this time`
  return undefined
}
export const isHrFlag = (review: string | undefined, g: Caregiver) => !!review && review.startsWith(g.name + ' ')

/** Re-check every upcoming visit for one caregiver; flag or clear HR reasons. Returns how many are now flagged. */
export function reflag(visits: Visit[], g: Caregiver, reqs: CgRequirement[], off: TimeOff[]): { visits: Visit[]; flagged: number } {
  let flagged = 0
  const next = visits.map(v => {
    if (v.caregiverId !== g.id || v.date < TODAY || v.status !== 'Scheduled') return v
    const why = hrReason(v, g, reqs, off)
    if (why) { flagged++; return v.review === why ? v : { ...v, review: why } }
    return isHrFlag(v.review, g) ? { ...v, review: undefined } : v
  })
  return { visits: next, flagged }
}

