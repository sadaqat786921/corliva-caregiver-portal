import { useState, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle2, MailOpen, UserPlus, Check, Building2, Smartphone } from 'lucide-react'
import { useStore } from '../data/store'
import { NEWCOMER } from '../data/seed'
import { AlertBanner, Button, Field, Input, Toasts } from '../components/ui'

function AuthFrame({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-art">
        <img src="./images/corliva-logo-white.svg" alt="CORLIVA" style={{ height: 44, alignSelf: 'flex-start' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          {side ?? <>
            <div className="t-display" style={{ fontSize: 34 }}>Your visits, in your pocket.</div>
            <p style={{ opacity: .9, fontSize: 16, marginTop: 12 }}>See where you’re going, check in and out, tick off the care plan and send your record — all from your phone.</p>
          </>}
        </div>
        <img className="big-c" src="./images/corliva-symbol-light.svg" alt="" aria-hidden />
        <div className="t-caption" style={{ opacity: .8, position: 'relative' }}>© 2026 CORLIVA · Home Care Platform</div>
      </div>
      <div className="auth-panel">{children}</div>
      <Toasts />
    </div>
  )
}

export const DEMO_CODE = '246810'

export function Login() {
  const s = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState<'details' | 'code'>('details')
  const [email, setEmail] = useState('maria@royalityhomecare.com')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const isNew = email.trim().toLowerCase() === NEWCOMER.email
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Please enter a valid email address.')
    if (!pw) return setErr('Please enter your password.')
    if (isNew && s.invite !== 'used') return setErr('You haven’t set up your account yet. Open the invite we emailed you.')
    setErr(''); setStep('code')
  }
  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim() !== DEMO_CODE) return setErr('That code isn’t right. Check the 6 numbers and try again.')
    setErr(''); s.signIn(isNew ? 'new' : 'maria'); nav('/')
  }
  if (step === 'code') return (
    <AuthFrame>
      <form className="auth-card" onSubmit={verify} noValidate>
        <button type="button" className="link-btn row" style={{ gap: 6, alignSelf: 'flex-start' }} onClick={() => { setStep('details'); setErr(''); setCode('') }}><ArrowLeft size={16} />Back</button>
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Enter your security code</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>We sent a 6-digit code to <b>{email.trim()}</b>.</p></div>
        {err && <AlertBanner tone="danger" title="Code not accepted">{err}</AlertBanner>}
        <Field label="Security code"><Input icon={Lock} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6 numbers" /></Field>
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Verify and sign in</button>
        <p className="t-caption t-muted" style={{ textAlign: 'center', margin: 0 }}>Demo code: <b>{DEMO_CODE}</b></p>
      </form>
    </AuthFrame>
  )
  return (
    <AuthFrame>
      <form className="auth-card" onSubmit={submit} noValidate>
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Welcome back</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>Sign in to your caregiver workspace at {s.agency.name}.</p></div>
        {err && <AlertBanner tone="danger" title="We couldn’t sign you in">{err}</AlertBanner>}
        <Field label="Email address"><Input icon={Mail} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password">
          <div className="control"><Lock /><input type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Your password" />
            <button type="button" className="link-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ color: 'var(--text-muted)' }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        <div className="row between"><label className="check"><input type="checkbox" defaultChecked />Keep me signed in</label><Link to="/forgot" className="t-small t-medium">Forgot password?</Link></div>
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Sign in</button>
        <p className="t-caption t-muted" style={{ textAlign: 'center', margin: 0 }}>Demo: any email and password signs in as Maria Lopez, who already works here. Then security code <b>{DEMO_CODE}</b>.</p>
        <div className="invite-box">
          <MailOpen size={18} color="var(--action-primary)" />
          <div className="grow"><div className="t-small t-medium">New to {s.agency.name}?</div><div className="t-caption t-muted">HR emails you an invite. Open it to set up your account.</div></div>
          <Link to="/invite" className="btn btn-secondary btn-sm">Open my invite</Link>
        </div>
        <p className="t-caption t-muted" style={{ textAlign: 'center', margin: 0 }}>Demo: the invite is for Amina Yusuf, a new caregiver.{s.invite === 'used' ? <> She has set up her account — sign in with <b>{NEWCOMER.email}</b>.</> : ''}</p>
      </form>
    </AuthFrame>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  return (
    <AuthFrame>
      <div className="auth-card">
        <Link to="/login" className="row t-small t-medium" style={{ gap: 6 }}><ArrowLeft size={16} />Back to sign in</Link>
        {sent ? <>
          <div className="stat-icon tone-success" style={{ width: 48, height: 48, borderRadius: '50%' }}><CheckCircle2 /></div>
          <h1 className="t-h1">Check your email</h1>
          <p className="t-secondary" style={{ margin: 0 }}>If <b>{email}</b> has a CORLIVA account, we’ve sent a link to choose a new password. The link works for 1 hour.</p>
          <Button variant="secondary" onClick={() => setSent(false)}>Use a different email</Button>
        </> : <form className="col" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Please enter a valid email address.'); return } setSent(true) }} noValidate>
          <h1 className="t-h1">Reset your password</h1>
          <p className="t-secondary" style={{ margin: 0 }}>Enter the email you use for CORLIVA. We’ll send you a link to choose a new password.</p>
          <Field label="Email address" error={err}><Input icon={Mail} type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} error={!!err} autoFocus /></Field>
          <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Send reset link</button>
        </form>}
      </div>
    </AuthFrame>
  )
}

/** Opened from the invite HR emails to a new caregiver: check the details, choose a password, confirm the phone, then send documents. */
export function Invite() {
  const s = useStore()
  const nav = useNavigate()
  const g = s.caregiver(NEWCOMER.caregiverId)!
  const hr = s.users.find(u => u.role === 'HR Officer' && u.status === 'Active')
  const [step, setStep] = useState<'welcome' | 'password' | 'code' | 'done'>('welcome')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [agree, setAgree] = useState(false)
  const [code, setCode] = useState('')
  const [tried, setTried] = useState(false)
  const [err, setErr] = useState('')
  const rules = [{ ok: pw.length >= 8, text: 'At least 8 characters' }, { ok: /\d/.test(pw), text: 'At least one number' }, { ok: /[A-Za-z]/.test(pw), text: 'At least one letter' }]
  const steps = ['Your details', 'Password', 'Phone check', 'Done']
  const at = { welcome: 0, password: 1, code: 2, done: 3 }[step]
  const Dots = () => <div className="row" style={{ gap: 6 }}>{steps.map((x, k) => <span key={x} className="t-caption row" style={{ gap: 4, color: k <= at ? 'var(--action-primary)' : 'var(--text-muted)', fontWeight: k === at ? 600 : 400 }}>{k < at ? <Check size={12} /> : <b>{k + 1}</b>}{x}{k < steps.length - 1 && <span className="t-muted" style={{ marginLeft: 2 }}>·</span>}</span>)}</div>
  const side = <>
    <div className="t-display" style={{ fontSize: 34 }}>Welcome to the team.</div>
    <p style={{ opacity: .9, fontSize: 16, marginTop: 12 }}>Set up your account, then send your documents from your phone. HR checks them, and once you start work your visits appear here.</p>
  </>
  if (s.invite === 'used' && step === 'welcome') return (
    <AuthFrame side={side}>
      <div className="auth-card">
        <div className="stat-icon tone-info" style={{ width: 48, height: 48, borderRadius: '50%' }}><CheckCircle2 /></div>
        <h1 className="t-h1">This invite has been used</h1>
        <p className="t-secondary" style={{ margin: 0 }}>The account for <b>{g.email}</b> is already set up. Sign in with your email and password.</p>
        <Link to="/login" className="btn btn-primary" style={{ height: 44 }}>Go to sign in</Link>
      </div>
    </AuthFrame>
  )
  return (
    <AuthFrame side={side}>
      {step === 'welcome' && <div className="auth-card">
        <Dots />
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Hello {g.name.split(' ')[0]}, you’re invited</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>{hr?.name ?? 'HR'} (HR) invited you to join {s.agency.name}. Check these details are right.</p></div>
        <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
          <dt>Name</dt><dd>{g.name}</dd>
          <dt>Email</dt><dd>{g.email}</dd>
          <dt>Phone</dt><dd>{g.phone}</dd>
          <dt>Job</dt><dd>{g.type}</dd>
          <dt>Branch</dt><dd className="row" style={{ gap: 6 }}><Building2 size={14} />{s.branchName(g.branch)}</dd>
        </dl>
        <Button icon={UserPlus} onClick={() => setStep('password')}>Set up my account</Button>
        <p className="t-caption t-muted" style={{ margin: 0 }}>Something wrong? Call {hr?.name ?? 'HR'}{hr ? ` on ${hr.phone}` : ''} before you carry on. This invite works for 7 days.</p>
        <Link to="/login" className="t-small t-medium row" style={{ gap: 6 }}><ArrowLeft size={16} />Back to sign in</Link>
      </div>}
      {step === 'password' && <form className="auth-card" noValidate onSubmit={e => { e.preventDefault(); setTried(true); if (rules.some(r => !r.ok) || pw !== pw2 || !agree) return; setTried(false); setStep('code') }}>
        <button type="button" className="link-btn row" style={{ gap: 6, alignSelf: 'flex-start' }} onClick={() => setStep('welcome')}><ArrowLeft size={16} />Back</button>
        <Dots />
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Choose a password</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>You’ll sign in with <b>{g.email}</b> and this password.</p></div>
        <Field label="Password" required>
          <div className="control"><Lock /><input type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" autoFocus />
            <button type="button" className="link-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ color: 'var(--text-muted)' }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        <div className="col" style={{ gap: 4 }}>{rules.map(r => <span key={r.text} className="t-caption row" style={{ gap: 6, color: r.ok ? 'var(--status-success)' : tried ? 'var(--status-danger)' : 'var(--text-muted)' }}><Check size={12} />{r.text}</span>)}</div>
        <Field label="Type it again" required error={tried && pw !== pw2 ? 'The two passwords are different.' : undefined}><Input icon={Lock} type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} error={tried && pw !== pw2} /></Field>
        <label className="check" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /><span>I will keep my password to myself and only look at the clients I visit.</span></label>
        {tried && !agree && <span className="t-caption" style={{ color: 'var(--status-danger)' }}>Please tick the box to carry on.</span>}
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Continue</button>
      </form>}
      {step === 'code' && <form className="auth-card" noValidate onSubmit={e => { e.preventDefault(); if (code.trim() !== DEMO_CODE) return setErr('That code isn’t right. Check the 6 numbers and try again.'); setErr(''); s.setInvite('used'); s.signIn('new'); setStep('done') }}>
        <button type="button" className="link-btn row" style={{ gap: 6, alignSelf: 'flex-start' }} onClick={() => { setStep('password'); setErr('') }}><ArrowLeft size={16} />Back</button>
        <Dots />
        <div><h1 className="t-h1" style={{ fontSize: 26 }}>Check your phone</h1><p className="t-secondary" style={{ margin: '6px 0 0' }}>We sent a 6-digit code by text to <b>{g.phone}</b>. You’ll use a code like this each time you sign in.</p></div>
        {err && <AlertBanner tone="danger" title="Code not accepted">{err}</AlertBanner>}
        <Field label="Security code"><Input icon={Smartphone} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6 numbers" /></Field>
        <button className="btn btn-primary" type="submit" style={{ height: 44 }}>Confirm</button>
        <p className="t-caption t-muted" style={{ textAlign: 'center', margin: 0 }}>Demo code: <b>{DEMO_CODE}</b></p>
      </form>}
      {step === 'done' && <div className="auth-card">
        <div className="stat-icon tone-success" style={{ width: 48, height: 48, borderRadius: '50%' }}><CheckCircle2 /></div>
        <h1 className="t-h1">Your account is ready</h1>
        <p className="t-secondary" style={{ margin: 0 }}>Next, send your documents. HR checks each one. You can be given visits once HR starts your work.</p>
        <Button onClick={() => nav('/')}>Send my documents</Button>
      </div>}
    </AuthFrame>
  )
}
