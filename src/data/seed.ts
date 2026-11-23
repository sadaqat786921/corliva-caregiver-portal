// Demo data for the CORLIVA Caregiver portal (works on a phone or a computer).
// The signed-in person is Maria Lopez, Certified aide, North Branch.
// Her regular clients: Robert King (Mon, Wed, Fri 11:00–13:00) and Harold Jenkins (every day 15:00–16:00).
// Everything is relative to "today" so the demo always looks current.

export type Role =
  | 'Agency Admin'
  | 'Care Coordinator'
  | 'Care Supervisor'
  | 'HR Officer'
  | 'Finance Officer'
  | 'Caregiver'
  | 'Client / Family'

export interface Branch { id: string; name: string }
export interface User { id: string; name: string; email: string; role: Role; branch: string; status: 'Invited' | 'Active' | 'Switched off'; phone: string }
export interface ListItem { id: string; name: string; active: boolean; note?: string }
export interface Note { by: string; at: string; text: string }

/* ---- Clients ---- */
export interface Person { id: string; name: string; relationship: string; phone: string; email: string; emergency: boolean; representative: boolean; appAccess: 'No access' | 'Invited' | 'Active' | 'Removed' }
export interface Client {
  id: string; name: string; dob: string; branch: string; status: 'Active' | 'On hold' | 'Discharged'; coordinator: string
  services: string; since: string; phone: string; address: string; payer: string
  language: string; preferences: string; access: string; people: Person[]; fromReferral?: string
  statusReason?: string; history: Note[]
  /** What the home assessment found (copied over when the referral became a client). */
  assessment?: { date: string; by: string; needs: string; risks: string; mobility: string; hours: number | null }
}

/* ---- Care plans (Coordinator drafts, Care Supervisor approves) ---- */
export type PlanStatus = 'Draft' | 'Awaiting review' | 'Approved' | 'Changes requested' | 'Superseded'
export interface CarePlan {
  id: string; clientId: string; version: number; status: PlanStatus
  services: string[]; tasks: string[]; instructions: string; goals: string; hoursPerWeek: number | null; reviewDate: string
  createdBy: string; createdDate: string; submittedDate?: string; approvedBy?: string; approvedDate?: string; effectiveDate?: string
  comments: Note[]
  /** Planned review of an approved plan, recorded by the Care Supervisor. */
  lastReview?: { by: string; date: string; outcome: 'No changes needed' | 'Changes needed'; note: string }
}

/* ---- Documents (uploading does not mean checked) ---- */
export type DocStatus = 'Not checked' | 'Checked' | 'Rejected' | 'Not needed' | 'Replaced'
export interface ClientDoc { id: string; clientId: string; name: string; category: string; uploadedBy: string; date: string; expiry?: string; status: DocStatus; checkedBy?: string; checkedDate?: string; reason?: string }

/* ---- Caregiver checks the Care Supervisor is responsible for (HR handles the rest) ---- */
export type CheckStatus = 'To do' | 'Waiting for check' | 'Checked' | 'Rejected' | 'Expired' | 'Not needed'
export interface CgCheck { id: string; caregiverId: string; name: string; why: string; blocking: boolean; status: CheckStatus; due?: string; expiry?: string; evidence?: string; checkedBy?: string; checkedDate?: string; reason?: string }
export const DOC_CATEGORIES = ['Service agreement', 'Signed care plan', 'Hospital discharge letter', 'Insurance or funding letter', 'Photo ID', 'Consent form', 'Other']

/* ---- Caregivers (HR keeps these; Coordinators view them to match visits) ---- */
export type EmploymentStatus = 'Applicant' | 'Active' | 'Inactive' | 'Terminated' | 'Archived'
export interface Caregiver {
  id: string; name: string; branch: string; type: 'Certified aide' | 'Companion' | 'Home health aide'
  skills: string[]; days: number[]; from: string; to: string; maxHours: number; phone: string
  /* ---- Kept by the HR Officer ---- */
  status: EmploymentStatus; email: string; address: string; dob: string
  start?: string; end?: string; hours: 'Full-time' | 'Part-time' | 'As needed'
  emergency: { name: string; relationship: string; phone: string }
  history: Note[]
}

/* ---- Visits ---- */
export type VisitStatus = 'Scheduled' | 'In progress' | 'Completed' | 'Unassigned' | 'Cancelled'
export interface Visit {
  id: string; clientId: string; caregiverId: string | null; date: string; start: string; end: string; branch: string; service: string
  status: VisitStatus; series?: string; checkIn?: string; checkOut?: string; review?: string; coverNote?: string; cancelReason?: string
  /* ---- What the caregiver app recorded, and the Care Supervisor's check ---- */
  approval?: 'To review' | 'Sent back' | 'Approved'
  place?: string            // where they checked in: "At the client’s home" or how far away
  tasksDone?: string[]      // care plan tasks ticked off in the app
  tasksNote?: string        // why a task wasn't done
  cgNote?: string           // the caregiver's note at check-out
  original?: { checkIn?: string; checkOut?: string }   // times before a correction (kept)
  returned?: { reason: string; by: string; at: string }
  approvedBy?: string; approvedAt?: string
  billing?: 'Invoiced'      // set by Finance; after this, changes need an adjustment
  adjustment?: { reason: string; by: string; at: string; before: string; after: string; status: 'Sent to Finance' }
  override?: { reason: string; by: string; at: string }
  /* ---- Caregiver portal ---- */
  outPlace?: string                      // where they checked out
  taskReasons?: Record<string, string>   // why each task wasn't done
  sentAt?: string                        // when the record was sent to the Care Supervisor
  corrections?: { by: string; at: string; why: string }[]   // caregiver's own fixes after a return
}

export type IncidentStatus = 'Reported' | 'Under review' | 'Action required' | 'Resolved' | 'Closed'
export interface IncidentAction { id: string; text: string; who: string; due: string; done: boolean; doneAt?: string }
export interface Incident { id: string; title: string; category: string; severity: 'Low' | 'Medium' | 'High'; client: string; caregiver?: string; reportedBy: string; date: string; owner: string; due: string; status: IncidentStatus; branch: string; sensitive: boolean; notes: Note[]
  findings: string; actions: IncidentAction[]; resolution?: string; closingNote?: string }
export interface AuditEntry { id: string; at: string; actor: string; action: string; record: string; type: string; before?: string; after?: string; reason?: string }
export interface Inbox { id: string; title: string; body: string; at: string; read: boolean; link: string; tone: 'danger' | 'warning' | 'info' | 'success' }

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
export const TODAY = addDays(0)
export const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
const shift = (hm: string, mins: number) => { const [h, m] = hm.split(':').map(Number); const t = Math.max(0, Math.min(23 * 60 + 59, h * 60 + m + mins)); return `${pad(Math.floor(t / 60))}:${pad(t % 60)}` }

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Display stamp like "12 Nov, 10:15" for a day offset from today. */
export const stampFor = (dayOffset: number, time: string) => { const d = new Date(); d.setDate(d.getDate() + dayOffset); return `${d.getDate()} ${MON[d.getMonth()]}, ${time}` }

export const ME = { name: 'Maria Lopez', role: 'Caregiver' as Role, branch: 'north', email: 'maria@royalityhomecare.com', phone: '(217) 555-0203', initials: 'ML', caregiverId: 'g3' }
/** New caregiver for the joining demo: HR added her as an applicant and sent an invite. */
export const NEWCOMER = { name: 'Amina Yusuf', role: 'Caregiver' as Role, branch: 'north', email: 'amina.yusuf@example.com', phone: '(217) 555-0212', initials: 'AY', caregiverId: 'g12' }

export const ROLES: { role: Role; does: string }[] = [
  { role: 'Care Coordinator', does: 'Handles referrals, client set-up, care plan drafts, schedules, finding cover and family requests.' },
  { role: 'Care Supervisor', does: 'Approves care plans, reviews finished visits, checks documents and skills, owns incidents and can make exceptions to blocking rules.' },
]

export const branches: Branch[] = [{ id: 'north', name: 'North Branch' }, { id: 'south', name: 'South Branch' }]

export const users: User[] = [
  { id: 'u0', name: 'Fred Morgan', email: 'fred@royalityhomecare.com', role: 'Agency Admin', branch: 'all', status: 'Active', phone: '(217) 555-0100' },
  { id: 'u1', name: 'Aisha Rahman', email: 'aisha@royalityhomecare.com', role: 'Care Coordinator', branch: 'north', status: 'Active', phone: '(217) 555-0101' },
  { id: 'u2', name: 'Michael Brooks', email: 'michael@royalityhomecare.com', role: 'Care Supervisor', branch: 'all', status: 'Active', phone: '(217) 555-0102' },
  { id: 'u3', name: 'Lena Ortiz', email: 'lena@royalityhomecare.com', role: 'HR Officer', branch: 'all', status: 'Active', phone: '(217) 555-0103' },
  { id: 'u8', name: 'Sara Kim', email: 'sara@royalityhomecare.com', role: 'Care Coordinator', branch: 'north', status: 'Active', phone: '(217) 555-0108' },
  { id: 'u4', name: 'Daniel Reed', email: 'daniel@royalityhomecare.com', role: 'Care Coordinator', branch: 'south', status: 'Active', phone: '(217) 555-0104' },
  { id: 'u5', name: 'Nina Patel', email: 'nina@royalityhomecare.com', role: 'Finance Officer', branch: 'all', status: 'Active', phone: '(217) 555-0105' },
]

export const lists: Record<string, ListItem[]> = {
  services: [
    { id: 's1', name: 'Personal care', active: true, note: 'Bathing, dressing, toileting' },
    { id: 's2', name: 'Companionship', active: true, note: 'Company, outings, conversation' },
    { id: 's3', name: 'Homemaking', active: true, note: 'Light cleaning, laundry, meals' },
    { id: 's4', name: 'Respite care', active: true, note: 'Short breaks for family carers' },
    { id: 's5', name: 'Medication reminders', active: true, note: 'Prompts only, no administering' },
  ],
  sources: [
    { id: 'r1', name: 'Hospital discharge', active: true }, { id: 'r2', name: 'Family or friend', active: true }, { id: 'r3', name: 'Doctor’s office', active: true },
    { id: 'r4', name: 'Website enquiry', active: true }, { id: 'r5', name: 'Insurance or care manager', active: true },
  ],
  tasks: [
    { id: 't1', name: 'Help with bathing', active: true }, { id: 't2', name: 'Help getting dressed', active: true }, { id: 't3', name: 'Prepare a meal', active: true },
    { id: 't4', name: 'Medication reminder', active: true }, { id: 't5', name: 'Light housekeeping', active: true }, { id: 't6', name: 'Walk or gentle exercise', active: true },
    { id: 't7', name: 'Laundry', active: true }, { id: 't8', name: 'Company and conversation', active: true },
  ],
  incidents: [
    { id: 'i1', name: 'Fall', active: true }, { id: 'i2', name: 'Medication concern', active: true }, { id: 'i3', name: 'Missed visit', active: true },
    { id: 'i4', name: 'Injury to caregiver', active: true }, { id: 'i5', name: 'Complaint', active: true }, { id: 'i6', name: 'Safeguarding concern', active: true, note: 'Only approved roles can see these' },
  ],
  reasons: [
    { id: 'c1', name: 'Client in hospital', active: true }, { id: 'c2', name: 'Client asked to cancel', active: true },
    { id: 'c3', name: 'No caregiver available', active: true }, { id: 'c4', name: 'Weather or travel problem', active: true },
  ],
}

/** Set by the Agency Admin. Care Coordinators are not on the override list. */
export const rules = { overrideRoles: ['Agency Admin', 'Care Supervisor'] as Role[], lateArrivalMins: 15 }

const HN = (day: number, by: string, text: string): Note => ({ by, at: stampFor(day, '10:00'), text })
type CgBase = Omit<Caregiver, 'status' | 'email' | 'address' | 'dob' | 'start' | 'end' | 'hours' | 'emergency' | 'history'>
const CG = (b: CgBase, e: Partial<Caregiver> & { dob: string; address: string; emergency: Caregiver['emergency'] }): Caregiver => ({
  ...b, status: 'Active', email: b.name.toLowerCase().split(' ')[0] + '@royalityhomecare.com', hours: 'Full-time', start: addDays(-400), history: [], ...e,
})
export const caregivers: Caregiver[] = [
  CG({ id: 'g1', name: 'Grace Mensah', branch: 'north', type: 'Certified aide', skills: ['Personal care', 'Medication reminders', 'Homemaking', 'Companionship'], days: [0, 1, 2, 3, 4, 5, 6], from: '07:00', to: '15:00', maxHours: 40, phone: '(217) 555-0201' },
    { dob: '1986-04-12', address: '14 Elm St, Springfield, IL 62701', start: addDays(-1200), emergency: { name: 'Kofi Mensah', relationship: 'Husband', phone: '(217) 555-0901' } }),
  CG({ id: 'g2', name: 'Daniel Osei', branch: 'north', type: 'Certified aide', skills: ['Personal care', 'Medication reminders', 'Respite care'], days: [1, 2, 3, 4, 5], from: '08:00', to: '18:00', maxHours: 40, phone: '(217) 555-0202' },
    { dob: '1991-09-03', address: '220 Walnut Ave, Springfield, IL 62702', start: addDays(-740), emergency: { name: 'Ama Osei', relationship: 'Sister', phone: '(217) 555-0902' } }),
  CG({ id: 'g3', name: 'Maria Lopez', branch: 'north', type: 'Certified aide', skills: ['Personal care', 'Medication reminders', 'Companionship', 'Homemaking'], days: [0, 1, 2, 3, 4, 5, 6], from: '10:00', to: '19:00', maxHours: 40, phone: '(217) 555-0203' },
    { dob: '1979-01-22', address: '9 Cedar Ct, Springfield, IL 62704', start: addDays(-2100), emergency: { name: 'Luis Lopez', relationship: 'Son', phone: '(217) 555-0903' } }),
  CG({ id: 'g7', name: 'Hannah Lee', branch: 'north', type: 'Companion', skills: ['Companionship', 'Homemaking'], days: [1, 2, 3, 4, 5], from: '09:00', to: '17:00', maxHours: 30, phone: '(217) 555-0207' },
    { dob: '1998-06-30', address: '31 Birch Rd, Springfield, IL 62701', start: addDays(-20), hours: 'Part-time', emergency: { name: 'Joy Lee', relationship: 'Mother', phone: '(217) 555-0907' } }),
  CG({ id: 'g9', name: 'Rosa Diaz', branch: 'north', type: 'Home health aide', skills: ['Personal care', 'Medication reminders', 'Respite care', 'Homemaking'], days: [0, 1, 2, 3, 4, 5, 6], from: '06:00', to: '14:00', maxHours: 40, phone: '(217) 555-0209' },
    { dob: '1983-11-17', address: '77 Lake Dr, Springfield, IL 62703', start: addDays(-1500), emergency: { name: 'Carlos Diaz', relationship: 'Husband', phone: '(217) 555-0909' } }),
  CG({ id: 'g10', name: 'Ben Okafor', branch: 'north', type: 'Certified aide', skills: ['Personal care', 'Companionship', 'Respite care'], days: [1, 2, 3, 4, 5, 6], from: '09:00', to: '17:00', maxHours: 35, phone: '(217) 555-0210' },
    { dob: '1994-02-08', address: '5 Oak Pl, Springfield, IL 62702', start: addDays(-330), emergency: { name: 'Ngozi Okafor', relationship: 'Wife', phone: '(217) 555-0910' } }),
  CG({ id: 'g11', name: 'Lily Chen', branch: 'north', type: 'Companion', skills: ['Companionship', 'Homemaking'], days: [0, 2, 4, 6], from: '12:00', to: '20:00', maxHours: 24, phone: '(217) 555-0211' },
    { dob: '2000-10-05', address: '48 Maple St, Springfield, IL 62704', start: addDays(-200), hours: 'Part-time', emergency: { name: 'Wei Chen', relationship: 'Father', phone: '(217) 555-0911' } }),
  CG({ id: 'g5', name: 'Sofia Novak', branch: 'south', type: 'Certified aide', skills: ['Personal care', 'Homemaking'], days: [1, 2, 3, 4, 5], from: '08:00', to: '16:00', maxHours: 40, phone: '(217) 555-0205' },
    { dob: '1988-07-19', address: '12 River Rd, Springfield, IL 62703', start: addDays(-900), emergency: { name: 'Petr Novak', relationship: 'Husband', phone: '(217) 555-0905' } }),
  CG({ id: 'g6', name: 'James Carter', branch: 'south', type: 'Companion', skills: ['Companionship', 'Homemaking'], days: [0, 1, 2, 3, 4, 5, 6], from: '09:00', to: '18:00', maxHours: 35, phone: '(217) 555-0206' },
    { dob: '1975-03-28', address: '3 Mill Lane, Springfield, IL 62703', start: addDays(-600), emergency: { name: 'Ruth Carter', relationship: 'Wife', phone: '(217) 555-0906' } }),
  CG({ id: 'g4', name: 'Nora Kim', branch: 'north', type: 'Home health aide', skills: ['Personal care', 'Medication reminders'], days: [1, 2, 3, 4, 5], from: '08:00', to: '16:00', maxHours: 40, phone: '(217) 555-0204' },
    { status: 'Inactive', dob: '1990-12-01', address: '66 Pine St, Springfield, IL 62701', start: addDays(-800), emergency: { name: 'Jae Kim', relationship: 'Husband', phone: '(217) 555-0904' },
      history: [HN(-30, 'Lena Ortiz', 'Paused work: maternity leave until spring.')] }),
  CG({ id: 'g8', name: 'Peter Walsh', branch: 'north', type: 'Companion', skills: ['Companionship'], days: [1, 3, 5], from: '10:00', to: '14:00', maxHours: 15, phone: '(217) 555-0208' },
    { status: 'Terminated', dob: '1968-05-14', address: '90 Hill Rd, Springfield, IL 62702', start: addDays(-500), end: addDays(-40), hours: 'Part-time', emergency: { name: 'Mary Walsh', relationship: 'Wife', phone: '(217) 555-0908' },
      history: [HN(-40, 'Lena Ortiz', 'Employment ended: moved out of the area. Last day worked.')] }),
  CG({ id: 'g12', name: 'Amina Yusuf', branch: 'north', type: 'Certified aide', skills: ['Personal care', 'Homemaking'], days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00', maxHours: 40, phone: '(217) 555-0212' },
    { status: 'Applicant', start: undefined, email: 'amina.yusuf@example.com', dob: '1996-08-21', address: '18 Grove St, Springfield, IL 62704', emergency: { name: 'Hassan Yusuf', relationship: 'Brother', phone: '(217) 555-0912' },
      history: [HN(-6, 'Lena Ortiz', 'Added as an applicant after interview. Invite sent so she can set up her account and send her documents.')] }),
  CG({ id: 'g13', name: 'Tom Becker', branch: 'south', type: 'Companion', skills: ['Companionship'], days: [2, 4, 6], from: '10:00', to: '16:00', maxHours: 20, phone: '(217) 555-0213' },
    { status: 'Applicant', start: undefined, hours: 'Part-time', dob: '1972-01-30', address: '41 Station Rd, Springfield, IL 62703', emergency: { name: 'Eva Becker', relationship: 'Wife', phone: '(217) 555-0913' },
      history: [HN(-2, 'Lena Ortiz', 'Added as an applicant after interview.')] }),
]

const P = (id: string, name: string, relationship: string, phone: string, email: string, emergency: boolean, representative: boolean, appAccess: Person['appAccess']): Person => ({ id, name, relationship, phone, email, emergency, representative, appAccess })
export const clients: Client[] = [
  { id: 'c1', name: 'Margaret Hale', dob: '1937-05-02', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care, Medication reminders', since: 'Mar 2025', phone: '(217) 555-0311', address: '14 Elm St, Springfield, IL 62701', payer: 'Long-term care insurance', language: 'English', preferences: 'Prefers female caregivers. Likes a cup of tea after her bath.', access: 'Key safe by the front door, code given by phone. Small dog — friendly.',
    people: [P('p1', 'Susan Hale', 'Daughter', '(217) 555-0611', 'susan.hale@example.com', true, true, 'Active'), P('p2', 'Tom Hale', 'Son', '(217) 555-0612', '', true, false, 'No access')], history: [] },
  { id: 'c2', name: 'Robert King', dob: '1944-10-19', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Companionship', since: 'Jan 2026', phone: '(217) 555-0312', address: '9 Oak Lane, Springfield, IL 62702', payer: 'Private pay', language: 'English', preferences: 'Loves baseball and short walks to the park.', access: 'Ring the bell twice. Hard of hearing.',
    people: [P('p3', 'Mark King', 'Son', '(217) 555-0613', 'mark.king@example.com', true, true, 'Active')], history: [] },
  { id: 'c5', name: 'Dorothy Fields', dob: '1935-02-11', branch: 'north', status: 'On hold', coordinator: 'Aisha Rahman', services: 'Personal care', since: 'Nov 2024', phone: '(217) 555-0315', address: '31 Maple Dr, Springfield, IL 62704', payer: 'Private pay', language: 'English', preferences: '', access: 'Son lets carers in.', statusReason: 'In hospital since 2 Nov',
    people: [P('p4', 'Jim Fields', 'Son', '(217) 555-0615', 'jim.fields@example.com', true, true, 'Invited')], history: [{ by: 'Aisha Rahman', at: '2 Nov, 09:10', text: 'Put on hold. Reason: in hospital since 2 Nov.' }] },
  { id: 'c6', name: 'Harold Jenkins', dob: '1940-08-19', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Medication reminders', since: 'Sep 2026', phone: '(217) 555-0316', address: '88 Cedar Ave, Springfield, IL 62701', payer: 'Private pay', language: 'English', preferences: 'Afternoon visits only.', access: 'Wife at home to let carers in.',
    people: [P('p5', 'Linda Jenkins', 'Wife', '(217) 555-0418', '', true, true, 'No access')], fromReferral: 'R-1020', history: [] },
  { id: 'c9', name: 'Edith Morris', dob: '1939-12-07', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care', since: 'May 2026', phone: '(217) 555-0319', address: '40 Grove St, Springfield, IL 62702', payer: 'Long-term care insurance', language: 'English', preferences: 'Early riser. Likes porridge for breakfast.', access: 'Key under the blue pot (agreed with family).',
    people: [P('p6', 'Paul Morris', 'Son', '(217) 555-0619', 'paul.morris@example.com', true, true, 'Active')], history: [] },
  { id: 'c12', name: 'Samuel Grant', dob: '1942-03-28', branch: 'north', status: 'Active', coordinator: 'Sara Kim', services: 'Personal care', since: 'Dec 2025', phone: '(217) 555-0322', address: '27 Park Ave, Springfield, IL 62701', payer: 'Private pay', language: 'English, some Spanish', preferences: 'Uses a walking frame indoors.', access: 'Wife at home.',
    people: [P('p7', 'Ruth Grant', 'Wife', '(217) 555-0622', '', true, true, 'No access')], history: [] },
  { id: 'c13', name: 'Gloria Vance', dob: '1946-07-15', branch: 'north', status: 'Active', coordinator: 'Aisha Rahman', services: 'Personal care, Homemaking', since: 'Nov 2026', phone: '(217) 555-0323', address: '', payer: 'Medicaid waiver', language: 'English', preferences: '', access: '',
    people: [P('p8', 'Rita Vance', 'Sister', '(217) 555-0623', 'rita.vance@example.com', true, true, 'No access')], fromReferral: 'R-1010', history: [],
    assessment: { date: addDays(-6), by: 'Michael Brooks', needs: 'Help washing and dressing; light housework while her hip heals.', risks: 'Moving home to a ground-floor flat. Address to confirm.', mobility: 'Walks with a frame', hours: 10 } },
  { id: 'c3', name: 'Evelyn Price', dob: '1941-01-09', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Homemaking, Personal care', since: 'Aug 2025', phone: '(217) 555-0313', address: '72 River Rd, Springfield, IL 62703', payer: 'Medicaid waiver', language: 'English', preferences: 'Likes the radio on. Keeps a tidy kitchen.', access: 'Front door unlocked from 8am.',
    people: [P('p9', 'Carl Price', 'Nephew', '(217) 555-0624', 'carl.price@example.com', true, true, 'Active')], history: [] },
  { id: 'c14', name: 'Walter Brooks', dob: '1938-09-23', branch: 'south', status: 'Active', coordinator: 'Daniel Reed', services: 'Companionship', since: 'Jun 2026', phone: '(217) 555-0324', address: '5 Mill Lane, Springfield, IL 62703', payer: 'Veterans benefits', language: 'English', preferences: 'Enjoys card games and talking about the navy.', access: 'Daughter leaves a key with the neighbour at no. 7.',
    people: [P('p10', 'Joan Brooks', 'Daughter', '(217) 555-0625', 'joan.brooks@example.com', true, true, 'Active')], history: [] },
]

export const carePlans: CarePlan[] = [
  { id: 'cp1', clientId: 'c1', version: 2, status: 'Approved', services: ['Personal care', 'Medication reminders'], tasks: ['Help with bathing', 'Help getting dressed', 'Medication reminder', 'Prepare a meal'], instructions: 'Shower seat in the bathroom. Check skin on heels for redness. Medicines are in the blue box on the kitchen table.', goals: 'Stay safe and independent at home.', hoursPerWeek: 14, reviewDate: addDays(-3), createdBy: 'Aisha Rahman', createdDate: addDays(-185), submittedDate: addDays(-184), approvedBy: 'Michael Brooks', approvedDate: addDays(-183), effectiveDate: addDays(-183), comments: [] },
  { id: 'cp1b', clientId: 'c1', version: 3, status: 'Awaiting review', services: ['Personal care', 'Medication reminders'], tasks: ['Help with bathing', 'Help getting dressed', 'Medication reminder', 'Prepare a meal', 'Walk or gentle exercise'], instructions: 'Shower seat in the bathroom. Check skin on heels for redness. Medicines are in the blue box on the kitchen table. Use the new grab rail by the shower — stay with Margaret while she steps out.', goals: 'Stay safe and independent at home. Walk to the end of the street with help by spring.', hoursPerWeek: 16, reviewDate: addDays(180), createdBy: 'Aisha Rahman', createdDate: addDays(-1), submittedDate: addDays(0), comments: [{ by: 'Aisha Rahman', at: stampFor(0, '08:15'), text: 'Updated after her slip in the bathroom (INC-208). Added a short walk and 2 more hours a week — Susan (daughter) agrees.' }] },
  { id: 'cp1a', clientId: 'c1', version: 1, status: 'Superseded', services: ['Personal care'], tasks: ['Help with bathing', 'Help getting dressed'], instructions: 'Shower seat in the bathroom.', goals: 'Stay safe at home.', hoursPerWeek: 10, reviewDate: addDays(-185), createdBy: 'Aisha Rahman', createdDate: addDays(-370), approvedBy: 'Michael Brooks', approvedDate: addDays(-368), effectiveDate: addDays(-368), comments: [] },
  { id: 'cp2', clientId: 'c2', version: 1, status: 'Approved', services: ['Companionship'], tasks: ['Company and conversation', 'Walk or gentle exercise'], instructions: 'Short walk to the park if the weather is fine.', goals: 'Less lonely; keep active.', hoursPerWeek: 6, reviewDate: addDays(-5), createdBy: 'Aisha Rahman', createdDate: addDays(-300), approvedBy: 'Michael Brooks', approvedDate: addDays(-298), effectiveDate: addDays(-298), comments: [] },
  { id: 'cp5', clientId: 'c5', version: 1, status: 'Approved', services: ['Personal care'], tasks: ['Help with bathing', 'Help getting dressed'], instructions: '', goals: '', hoursPerWeek: 10, reviewDate: addDays(30), createdBy: 'Aisha Rahman', createdDate: addDays(-360), approvedBy: 'Michael Brooks', approvedDate: addDays(-358), effectiveDate: addDays(-358), comments: [] },
  { id: 'cp6', clientId: 'c6', version: 1, status: 'Approved', services: ['Medication reminders'], tasks: ['Medication reminder'], instructions: 'Three afternoon medicines in the pill box. Remind him to drink water.', goals: 'Never miss afternoon medicines.', hoursPerWeek: 7, reviewDate: addDays(120), createdBy: 'Aisha Rahman', createdDate: addDays(-50), approvedBy: 'Michael Brooks', approvedDate: addDays(-49), effectiveDate: addDays(-49), comments: [] },
  { id: 'cp9', clientId: 'c9', version: 1, status: 'Approved', services: ['Personal care'], tasks: ['Help getting dressed', 'Prepare a meal'], instructions: 'Porridge for breakfast.', goals: '', hoursPerWeek: 7.5, reviewDate: addDays(40), createdBy: 'Aisha Rahman', createdDate: addDays(-180), approvedBy: 'Michael Brooks', approvedDate: addDays(-178), effectiveDate: addDays(-178), comments: [] },
  { id: 'cp9b', clientId: 'c9', version: 2, status: 'Changes requested', services: ['Personal care', 'Homemaking'], tasks: ['Help getting dressed', 'Prepare a meal', 'Laundry'], instructions: 'Porridge for breakfast. Laundry on Fridays.', goals: '', hoursPerWeek: 10, reviewDate: addDays(180), createdBy: 'Aisha Rahman', createdDate: addDays(-4), submittedDate: addDays(-4), comments: [{ by: 'Michael Brooks', at: `${addDays(-2)}`, text: 'Please add the goals and say who does the laundry if Edith is unwell. Then send it back to me.' }] },
  { id: 'cp12', clientId: 'c12', version: 1, status: 'Approved', services: ['Personal care'], tasks: ['Help with bathing', 'Help getting dressed', 'Walk or gentle exercise'], instructions: 'Uses a walking frame indoors.', goals: '', hoursPerWeek: 15, reviewDate: addDays(25), createdBy: 'Sara Kim', createdDate: addDays(-330), approvedBy: 'Michael Brooks', approvedDate: addDays(-328), effectiveDate: addDays(-328), comments: [] },
  { id: 'cp13', clientId: 'c13', version: 1, status: 'Awaiting review', services: ['Personal care', 'Homemaking'], tasks: ['Help with bathing', 'Help getting dressed', 'Light housekeeping', 'Laundry'], instructions: 'Walks with a frame — keep the hallway clear. Ground-floor flat.', goals: 'Get back to washing and dressing on her own as her hip heals.', hoursPerWeek: 10, reviewDate: addDays(90), createdBy: 'Aisha Rahman', createdDate: addDays(-2), submittedDate: addDays(-1), comments: [{ by: 'Aisha Rahman', at: stampFor(-1, '16:40'), text: 'First plan, made from the hospital assessment. Start date is in 4 days.' }] },
  { id: 'cp3', clientId: 'c3', version: 1, status: 'Approved', services: ['Homemaking', 'Personal care'], tasks: ['Light housekeeping', 'Laundry', 'Help getting dressed'], instructions: 'Radio on while you work. Laundry on Mondays.', goals: 'Keep the home clean and safe.', hoursPerWeek: 6, reviewDate: addDays(70), createdBy: 'Daniel Reed', createdDate: addDays(-460), approvedBy: 'Michael Brooks', approvedDate: addDays(-458), effectiveDate: addDays(-458), comments: [] },
  { id: 'cp14', clientId: 'c14', version: 1, status: 'Approved', services: ['Companionship'], tasks: ['Company and conversation', 'Walk or gentle exercise'], instructions: 'Loves a game of cards.', goals: 'Less lonely.', hoursPerWeek: 4, reviewDate: addDays(30), createdBy: 'Daniel Reed', createdDate: addDays(-160), approvedBy: 'Michael Brooks', approvedDate: addDays(-158), effectiveDate: addDays(-158), comments: [] },
]

const HOME = 'At the client’s home'
const H = (day: number, time: string, by: string, text: string): Note => ({ by, at: stampFor(day, time), text })

/** Maria's visits: two weeks back and two weeks ahead, every state a caregiver sees. */
function buildVisits(): Visit[] {
  const PATTERN: [string, number[], string, string, string][] = [
    ['c2', [1, 3, 5], '11:00', '13:00', 'Companionship'],
    ['c6', [0, 1, 2, 3, 4, 5, 6], '15:00', '16:00', 'Medication reminders'],
  ]
  const out: Visit[] = []
  let n = 4800
  for (let day = -14; day <= 14; day++) {
    const d = new Date(); d.setDate(d.getDate() + day)
    for (const [cid, days, start, end, service] of PATTERN) {
      if (!days.includes(d.getDay())) continue
      n += 1
      const plan = carePlans.find(p => p.clientId === cid && p.status === 'Approved')
      const v: Visit = { id: 'v' + n, clientId: cid, caregiverId: 'g3', date: iso(d), start, end, branch: 'north', service, status: 'Scheduled', series: 's-' + cid }
      if (day < 0) {
        Object.assign(v, { status: 'Completed', checkIn: shift(start, 2), checkOut: shift(end, 1), place: HOME, outPlace: HOME, tasksDone: [...(plan?.tasks ?? [])], sentAt: stampFor(day, shift(end, 5)) })
        if (day <= -5) Object.assign(v, { approval: 'Approved', approvedBy: 'Michael Brooks', approvedAt: stampFor(day + 1, '10:00') })
        else v.approval = 'To review'
      }
      out.push(v)
    }
  }
  const past = (cid: string, k = 0) => out.filter(v => v.clientId === cid && v.date < TODAY).sort((a, b) => b.date.localeCompare(a.date))[k]
  // Yesterday's Harold visit: checked out but not sent yet
  const y = past('c6', 0); if (y) Object.assign(y, { approval: undefined, sentAt: undefined, cgNote: undefined })
  // Harold, a few days ago: sent back by the Care Supervisor
  const r = past('c6', 2); if (r) Object.assign(r, { approval: 'Sent back', checkOut: '17:10', cgNote: 'Harold was in good spirits.', returned: { reason: 'Check-out at 17:10 looks wrong — the visit ends at 16:00. Please correct it to the time you really left.', by: 'Michael Brooks', at: stampFor(-1, '11:20') } })
  // Robert's last visit: checked in from the car park (no signal at the door)
  const l = past('c2', 0); if (l) Object.assign(l, { place: '0.6 miles from the home', cgNote: 'No phone signal at the door, so I checked in from the car park on the main road.' })
  // A visit cancelled by the family
  const c = past('c2', 1); if (c) Object.assign(c, { status: 'Cancelled', checkIn: undefined, checkOut: undefined, place: undefined, outPlace: undefined, tasksDone: undefined, sentAt: undefined, approval: undefined, approvedBy: undefined, approvedAt: undefined, cancelReason: 'Client asked to cancel' })
  // Today's visits follow the clock so the demo always has a visit about to start:
  // the first one starts in 15–30 minutes, the next an hour after the first ends.
  const now = new Date(); let at = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15 + 15
  const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const toM = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3)
  const today = out.filter(v => v.date === TODAY).sort((a, b) => a.start.localeCompare(b.start))
  const need = today.reduce((t, v) => t + toM(v.end) - toM(v.start) + 60, 0)
  if (at + need <= 23 * 60) for (const v of today) { const len = toM(v.end) - toM(v.start); v.start = hm(at); v.end = hm(at + len); at += len + 60 }
  return out
}
export const visits: Visit[] = buildVisits()

/* ---- Incidents Maria reported (she sees only her own) ---- */
const A = (id: string, text: string, who: string, due: number, done = false): IncidentAction => ({ id, text, who, due: addDays(due), done, doneAt: done ? stampFor(due, '12:00') : undefined })
export const incidents: Incident[] = [
  { id: 'INC-207', title: 'Medication box was empty', category: 'Medication concern', severity: 'Medium', client: 'Harold Jenkins', caregiver: 'Maria Lopez', reportedBy: 'Maria Lopez', date: addDays(-2), owner: 'Michael Brooks', due: addDays(2), status: 'Action required', branch: 'north', sensitive: false,
    notes: [H(-2, '15:20', 'Maria Lopez', 'Weekly pill box empty on arrival. Called his wife.'), H(-1, '09:00', 'Michael Brooks', 'Pharmacy confirmed the weekly delivery was missed.')],
    findings: 'The pharmacy missed the weekly delivery.', actions: [A('a3', 'Ask the pharmacy to set up a repeat delivery', 'Aisha Rahman', -1, true), A('a4', 'Caregiver to check the pill box at every visit and report if low', 'Maria Lopez', 2)] },
  { id: 'INC-187', title: 'Wrong day for tablets', category: 'Medication concern', severity: 'Low', client: 'Harold Jenkins', caregiver: 'Maria Lopez', reportedBy: 'Maria Lopez', date: addDays(-55), owner: 'Michael Brooks', due: addDays(-48), status: 'Closed', branch: 'north', sensitive: false,
    notes: [H(-55, '15:30', 'Maria Lopez', 'Harold took Tuesday’s tablets on Monday.')], findings: 'Pill box days were hard to read.', actions: [A('a8', 'Get a large-print pill box', 'Aisha Rahman', -50, true)], resolution: 'Large-print pill box in use.', closingNote: 'Closed.' },
]

export const audit: AuditEntry[] = []

export const inbox: Inbox[] = [
  { id: 'n1', title: 'Visit sent back to fix: Harold Jenkins', body: 'Check-out time looks wrong', at: 'Yesterday', read: false, link: '/visits?tab=returned', tone: 'danger' },
  { id: 'n2', title: 'Visit not sent yet: Harold Jenkins', body: 'Yesterday 15:00–16:00 — finish and send it', at: 'Today', read: false, link: '/visits?tab=send', tone: 'warning' },
  { id: 'n3', title: 'Update on your report INC-207', body: 'Pharmacy confirmed the delivery was missed', at: 'Yesterday', read: true, link: '/incidents/INC-207', tone: 'info' },
]

/** Alerts for the new caregiver (Amina) while she is joining. */
export const newcomerInbox: Inbox[] = [
  { id: 'a1', title: 'HR asked you to book your TB test', body: 'Send the result here when you have it', at: '5 days ago', read: false, link: '/', tone: 'warning' },
  { id: 'a2', title: 'Your background check result is with HR', body: 'HR will check it', at: 'Yesterday', read: true, link: '/', tone: 'info' },
]
