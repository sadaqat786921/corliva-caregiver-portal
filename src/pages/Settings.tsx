import { useState } from 'react'
import { Lock, Eye, EyeOff, Smartphone, LogOut, RotateCcw } from 'lucide-react'
import { useStore, resetDemoData } from '../data/store'
import { AlertBanner, Button, CardHead, ConfirmDialog, Field, Input, PageHead, Toggle } from '../components/ui'

export default function Settings() {
  const s = useStore()
  const [pw, setPw] = useState({ now: '', next: '', again: '' })
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)
  const [resetting, setResetting] = useState(false)
  const pwErr = !pw.now ? 'Enter your current password.' : pw.next.length < 8 ? 'Your new password needs at least 8 characters.' : !/[0-9]/.test(pw.next) || !/[A-Za-z]/.test(pw.next) ? 'Use at least one letter and one number.' : pw.next !== pw.again ? 'The two new passwords don’t match.' : ''

  return (
    <>
      <PageHead title="Settings" crumb="Settings" sub="Your password and where you’re signed in. Your name, phone and address are kept by the HR Officer — see My details." />
      <div className="card">
        <CardHead title="Change password" />
        <div className="card-body col" style={{ gap: 16, maxWidth: 620 }}>
          {tried && pwErr && <AlertBanner tone="danger" title="Password not changed">{pwErr}</AlertBanner>}
          <Field label="Current password"><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.now} onChange={e => setPw({ ...pw, now: e.target.value })} /></Field>
          <Field label="New password" helper="At least 8 characters, with a letter and a number."><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="New password again"><Input icon={Lock} type={show ? 'text' : 'password'} value={pw.again} onChange={e => setPw({ ...pw, again: e.target.value })} /></Field>
          <div className="row between wrap">
            <button className="link-btn row" style={{ gap: 6 }} onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}{show ? 'Hide passwords' : 'Show passwords'}</button>
            <Button onClick={() => { setTried(true); if (pwErr) return; setPw({ now: '', next: '', again: '' }); setTried(false); s.log({ type: 'Access', action: 'Changed own password', record: s.me.name }); s.toast('Password changed') }}>Change password</Button>
          </div>
          <div className="divider" />
          <div className="t-h3">Where you’re signed in</div>
          <div className="list-row" style={{ marginTop: 0 }}><Smartphone size={18} color="var(--text-muted)" /><div className="grow"><div className="t-medium">This phone or computer</div><div className="t-caption t-muted">Active now</div></div><span className="chip chip-success">This device</span></div>
          <div><Button variant="secondary" icon={LogOut} onClick={() => { s.log({ type: 'Access', action: 'Signed out of other devices', record: s.me.name }); s.toast('Signed out everywhere else') }}>Sign out of all other devices</Button></div>
        </div>
      </div>
      <div className="card card-pad row between wrap">
        <div><div className="t-h3">Try it: no internet</div><div className="t-small t-muted">For this preview. Shows what happens when you lose signal at a client’s home — nothing is saved and you’re told clearly.</div></div>
        <Toggle on={s.offline} label="Pretend there is no internet" onChange={v => s.setOffline(v)} />
      </div>
      <div className="card card-pad row between wrap">
        <div><div className="t-h3">Demo data</div><div className="t-small t-muted">Your changes in this preview are saved for this browser session. Reset to start again with the original sample data.</div></div>
        <Button variant="secondary" icon={RotateCcw} onClick={() => setResetting(true)}>Reset demo data</Button>
      </div>
      {resetting && <ConfirmDialog title="Reset demo data?" text="All changes you made in this preview will be removed and the original sample data comes back. You stay signed in." confirm="Reset demo data" danger onClose={() => setResetting(false)} onConfirm={resetDemoData} />}
    </>
  )
}
