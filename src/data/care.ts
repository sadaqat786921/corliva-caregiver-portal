// Caregiver portal rules: visit states, when you can check in, location, and what must be done before sending.
import { CarePlan, TODAY, Visit, nowHM } from './seed'

/** The states a caregiver sees (BRD VIS-09: scheduled, in progress, submitted, returned, approved). */
export type CgState = 'Coming up' | 'Checked in' | 'Not sent yet' | 'Sent' | 'Sent back to fix' | 'Approved' | 'Cancelled'
export function cgState(v: Visit): CgState {
  if (v.status === 'Cancelled') return 'Cancelled'
  if (v.approval === 'Approved') return 'Approved'
  if (v.approval === 'Sent back') return 'Sent back to fix'
  if (v.approval === 'To review') return 'Sent'
  if (v.checkOut) return 'Not sent yet'
  if (v.checkIn) return 'Checked in'
  return 'Coming up'
}
export const stateTone = (s: CgState) => s === 'Approved' ? 'success' : s === 'Sent back to fix' ? 'danger' : s === 'Not sent yet' ? 'warning' : s === 'Checked in' || s === 'Sent' ? 'info' : 'neutral'

const mins = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m }
/** Check-in opens 60 minutes before the start, on the day of the visit only. */
export const CHECKIN_EARLY = 60
export function checkInBlock(v: Visit): string | null {
  if (v.status === 'Cancelled') return 'This visit was cancelled.'
  if (v.date > TODAY) return 'You can check in on the day of the visit.'
  if (v.date < TODAY) return 'This visit was on an earlier day. Call the office if you need to record it.'
  if (mins(nowHM()) < mins(v.start) - CHECKIN_EARLY) return `You can check in from ${String(Math.floor((mins(v.start) - CHECKIN_EARLY) / 60)).padStart(2, '0')}:${String((mins(v.start) - CHECKIN_EARLY) % 60).padStart(2, '0')}.`
  return null
}
export const minutesLate = (v: Visit) => v.date === TODAY && !v.checkIn ? Math.max(0, mins(nowHM()) - mins(v.start)) : 0

/**
 * Ask the browser for the caregiver's location (VIS-04). If it is refused or not available,
 * we record that as an exception — we never make a location up (VIS-05).
 */
export function captureLocation(): Promise<{ text: string; ok: boolean }> {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) return resolve({ text: 'Location not available on this device', ok: false })
    const timer = setTimeout(() => resolve({ text: 'Location not available (took too long)', ok: false }), 8000)
    navigator.geolocation.getCurrentPosition(
      p => { clearTimeout(timer); resolve({ text: `Location shared (accurate to about ${Math.max(5, Math.round(p.coords.accuracy))} m)`, ok: true }) },
      e => { clearTimeout(timer); resolve({ text: e.code === 1 ? 'Location not shared — permission refused' : 'Location not available', ok: false }) },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
    )
  })
}
export const locationOk = (place?: string) => !!place && (place.startsWith('Location shared') || place === 'At the client’s home')

/** Everything that must be done before the record can be sent (VIS-06, VIS-08). */
export function missingBeforeSend(v: Visit, plan?: CarePlan): string[] {
  const out: string[] = []
  if (!v.checkIn) out.push('Check in')
  const tasks = plan?.tasks ?? []
  const answered = (t: string) => (v.tasksDone ?? []).includes(t) || !!v.taskReasons?.[t]
  const notAnswered = tasks.filter(t => !answered(t))
  if (notAnswered.length) out.push(`Say if these were done: ${notAnswered.join(', ')}`)
  if (!v.checkOut) out.push('Check out')
  return out
}

/** "45 minutes" / "1 hour 10 minutes" */
export const lateText = (m: number) => { const h = Math.floor(m / 60), r = m % 60; return [h ? `${h} hour${h > 1 ? 's' : ''}` : '', r ? `${r} minute${r > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ') }
