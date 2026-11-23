import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { useStore, fmtDate } from '../data/store'
import { TODAY, Visit } from '../data/seed'
import { cgState } from '../data/care'
import { EmptyState, PageHead, Tabs } from '../components/ui'
import { VisitCard } from './Today'

type Tab = 'coming' | 'send' | 'past'

export default function Visits() {
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (['coming', 'send', 'past'].includes(params.get('tab') ?? '') ? params.get('tab') : params.get('tab') === 'returned' ? 'send' : 'coming') as Tab
  const mine = s.visits.filter(v => v.caregiverId === s.me.caregiverId)
  const lists: Record<Tab, Visit[]> = {
    coming: mine.filter(v => ['Coming up', 'Checked in'].includes(cgState(v)) && v.date >= TODAY || (v.status === 'Cancelled' && v.date >= TODAY)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    send: mine.filter(v => ['Not sent yet', 'Sent back to fix'].includes(cgState(v)) || (cgState(v) === 'Checked in' && v.date < TODAY)).sort((a, b) => a.date.localeCompare(b.date)),
    past: mine.filter(v => ['Sent', 'Approved'].includes(cgState(v)) || (v.status === 'Cancelled' && v.date < TODAY) || (cgState(v) === 'Coming up' && v.date < TODAY)).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)),
  }
  // group by day
  const days = Array.from(new Set(lists[tab].map(v => v.date)))

  return (
    <>
      <PageHead title="My visits" crumb="My visits" sub="Only your own visits. Tap a visit to see the client, the tasks and to check in." />
      <div className="card">
        <div style={{ padding: '0 16px' }}><Tabs value={tab} onChange={t => setParams(t === 'coming' ? {} : { tab: t }, { replace: true })} tabs={[
          { id: 'coming', label: 'Coming up', count: lists.coming.length },
          { id: 'send', label: 'To finish', count: lists.send.length },
          { id: 'past', label: 'Done', count: lists.past.length },
        ]} /></div>
        <div className="card-body col" style={{ gap: 16 }}>
          {lists[tab].length === 0 ? <EmptyState icon={tab === 'send' ? CheckCircle2 : CalendarDays} title={tab === 'send' ? 'Nothing to finish' : 'No visits here'} text={tab === 'send' ? 'Every record is sent.' : tab === 'coming' ? 'The office will add your visits here.' : 'Sent and approved visits appear here.'} /> :
            days.map(d => (
              <div key={d} className="col" style={{ gap: 8 }}>
                <div className="t-small t-medium t-muted">{d === TODAY ? 'Today' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                {lists[tab].filter(v => v.date === d).map(v => <VisitCard key={v.id} v={v} from={`/visits${tab === 'coming' ? '' : `?tab=${tab}`}`} />)}
              </div>))}
          {tab === 'past' && <div className="hint">Sent visits are waiting for your supervisor. If one is sent back, it moves to “To finish”.</div>}
        </div>
      </div>
    </>
  )
}
