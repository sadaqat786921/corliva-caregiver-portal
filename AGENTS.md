# AGENTS.md — CORLIVA Caregiver Portal

Read this before changing anything. This app is a finished, approved design. Do **not** redesign it, restyle it, swap the layout, add Tailwind, add a UI kit, or "modernise" it. Only make the change you are asked for, in the same style.

## What this is
CORLIVA is a home care platform. This repo is the **Caregiver** portal. The signed-in person is **Maria Lopez**, Certified aide, **North Branch** of the agency "Royality Home Care". It is a clickable React prototype with built-in demo data. It shares its design system with the Agency Admin, Care Coordinator, Care Supervisor, Director of Nursing and HR Officer portals.

From the BRD (VIS-01 to VIS-11, User Flow 3): a **phone-friendly web app** (no native app). The caregiver sees only their own visits, the client details they need, care plan instructions and tasks; checks in and out with their location; marks tasks done or not done (with a reason); writes notes; reports a problem; sends the visit record; fixes and resends a record the Care Supervisor sent back. **No access** to other clients, other caregivers, reports, invoices, pay or settings.

## Stack
- React 19 + Vite + TypeScript. Only extra packages: `react-router-dom` and `lucide-react`. Plain web app at the top level of the repo: `index.html` (with `<div id="root">`) and entry `src/main.tsx`. No backend, no API calls, no `.env`.
- `HashRouter` (keep it — the app must work from any static host and in Figma Make)
- Icons: `lucide-react` only
- Styling: plain CSS in `src/styles.css` using CSS variables. **No Tailwind, no CSS reset libraries, no styled-components.**
- Font: Inter, from the font files in `src/fonts` (`src/fonts/inter.css`, imported in `src/main.tsx`). No Google Fonts link.
- Images live in `public/images/` and are referenced with relative paths like `./images/corliva-logo-white.svg`

## Design system (mirrors the Figma file "Corliva", page "03 · Foundations & Components")
- Page background: brand blue `--bg-page #105CBC`. The sidebar sits directly on the blue.
- Sidebar: width 236px, white text and icons, uppercase section labels (11px semibold), nav items 44px tall. The **active item is a white pill** (radius 37px) with dark text `#292D32`.
- Main content: a rounded light panel `--bg-panel #F8F6F6`, radius 24px, with a white header bar (radius 8px, border `#E5EAF1`, height 59px).
- Cards: white, 1px border `#E5EAF1`, radius 12px.
- Primary action colour `--action-primary #0E66D4`. Status colours: success `#18794A`, warning `#9A5B00`, danger `#C0322B`, each with a soft background.
- Status is always a **word plus a colour** (chips), never colour alone.
- **On a phone (760px wide or less)** the sidebar is replaced by a bottom bar (Today, My visits, Incidents, My details), cards stack in one column, buttons are big, and pop-ups open from the bottom.
- Every token is in `:root` at the top of `src/styles.css`. Use the variables; don't hard-code new colours.

## Writing style
Caregivers use this on a phone between visits; the client is non-technical and over 50. Use short, plain English: "Check in now", "Not done", "Send record", "Report a problem". No jargon.

## Rules that must keep working
- **Joining (new caregiver)**: nobody signs up on their own. HR adds an applicant in the HR portal and an invite is emailed. The invite (`/invite`, `Auth.tsx → Invite`) shows their details → choose a password (8+ characters, a letter and a number, typed twice, tick the promise) → phone security code → account ready. An invite can be used once. Until HR presses **Start work**, the person only has **Getting started** (`GettingStarted.tsx`: documents to send, HR's answer on each, what happens next, HR's phone), **My details** and **Settings** — visits and incidents are not shown.
- **Only her own work**: Maria sees only visits assigned to her, the clients on those visits, and incidents she reported.
- **Visit states** (`src/data/care.ts → cgState`): Coming up → Checked in → Not sent yet → Sent → Approved, or Sent back to fix, or Cancelled. These are the same records the Care Supervisor approves (`approval`: To review / Sent back / Approved).
- **Check-in** opens on the visit day from 60 minutes before the start. Check-in and check-out ask the browser for the location. If it is refused or not available she can still check in — it is saved as "Location not shared" so the Supervisor sees it. A location is **never made up**.
- **Tasks**: every care plan task must be marked Done or Not done; Not done needs a reason.
- **Send record**: only when checked in, every task answered and checked out (`missingBeforeSend` lists what's missing). One press only — the button is disabled while sending, so a record is never sent twice. After sending it can't be changed.
- **Sent back to fix**: the Supervisor's reason shows at the top. "Correct times" keeps the original times ("was …") and needs a reason; then "Send again" puts it back in the Supervisor's "To review".
- **No internet**: nothing is saved without a connection — she sees "Not saved — no internet connection". Settings has a "Try it: no internet" switch for the demo.
- **Report a problem** (from a visit or the Incidents page): goes to the Care Supervisor of her branch (Michael Brooks) as "Reported". Safeguarding is kept private. She can add information later and sees actions asked of her; only the Supervisor moves or closes it.
- **My details** is view only, except sending documents: a new copy goes to HR as "Waiting for check" (old copy kept, and an in-date old copy still counts until HR checks the new one). Skills checks are done with the Supervisor. Readiness is worked out by the same HR rules (`src/data/hr.ts → readiness`). Time off and contact changes: call HR.
- Nothing is ever deleted. Every change is recorded.

## Structure
```
src/
  styles.css               design tokens + all component styles (phone layout at the bottom)
  data/seed.ts             demo data: Maria's visits (14 days back, 14 ahead; today's times follow the clock), clients, care plans, incidents
  data/hr.ts               requirements, documents, time off and readiness — the same rules as the HR Officer portal
  data/care.ts             visit state, check-in window, location, what's missing before sending
  data/store.tsx           app state (saved in sessionStorage), toasts, history, no-internet switch, Reset demo data
  components/ui.tsx        Button, Field, Input, Select, Chip, Modal, Tabs, Toggle, AlertBanner, EmptyState, ...
  components/Shell.tsx     sidebar + bottom bar on phones + header (alerts, profile menu)
  components/CareActions.tsx  ReportIncident pop-up, useOnline (no-internet check)
  pages/                   Today, GettingStarted, Visits, VisitDetail, Incidents (+ IncidentDetail), Me, Settings, Auth
```

## Demo data
Maria visits **Robert King** (Mon/Wed/Fri, Companionship) and **Harold Jenkins** (every day, Medication reminders). Demo story: today's two visits are waiting; yesterday's Harold visit is not sent yet; an earlier Harold visit was sent back by Michael Brooks (check-out 17:10 looks wrong); one Robert visit was checked in from the car park; one was cancelled by the family; her report INC-207 (empty pill box) has an action asked of her; her first-aid certificate runs out soon. Amina Yusuf (new caregiver) has her photo ID checked, her background check waiting, and HR has asked for her TB test. Every change is saved in **sessionStorage**. **Reset demo data** is in the profile menu and in Settings.

## Demo sign-in
- **Working caregiver:** any email and any password → **Sign in** → security code **246810** → **Verify and sign in**. Opens **Today** (signed in as Maria Lopez).
- **New caregiver:** on the sign-in screen press **Open my invite** → Set up my account → choose a password → code **246810** → **Send my documents**. Opens **Getting started** (signed in as Amina Yusuf, the applicant in the HR portal). After that, sign in again with `amina.yusuf@example.com`.

## Screens (full screens, never side panels)
- **Invite** (`/invite`) — your details, password, phone check, done.
- **Getting started** (`/`, new caregiver only) — welcome, documents (Send it / Send again, HR's request or reason), what happens next (5 steps), tips for good photos, HR's phone.
- **Today** (`/`) — greeting, the visit she is on or her next visit with a big button, To finish (sent back / not sent yet), today's visits, next 7 days, her reports and anything asked of her. Warnings when she is not ready to work or on time off.
- **My visits** (`/visits`) — Coming up / To finish / Done, grouped by day.
- **Visit** (`/visits/:id`) — status banner, Your visit steps (1 Check in, 2 Tasks, 3 Notes, 4 Check out, Send record), care plan instructions, client (address, getting in, phone, language, likes, emergency contact), visit details (repeats, office phone), Report a problem, Correct times.
- **Incidents** (`/incidents`, `/incidents/:id`) — her reports: Being dealt with / Sorted; report screen with progress, what she reported, Asked of you, Updates (Add information), who is dealing with it, how it was sorted.
- **My details** (`/me`) — ready to work, documents and checks (Send a new copy), when she usually works, time off, contact details.
- **Settings** — password, where you're signed in, "Try it: no internet", Reset demo data.

## Other roles
- **Care Supervisor** — `sadaqat786921/Corliva-care-supervisor-portal` (approves the visit records sent from here, sends back to fix, owns incidents).
- **Care Coordinator** — `sadaqat786921/Corliva-care-cordinator-portal` (plans visits and assigns caregivers).
- **HR Officer** — `sadaqat786921/Corliva-hr-officer-portal` (checks the documents sent from here, readiness, time off).
- **Director of Nursing** — `sadaqat786921/Corliva-don-portal`.
- **Agency Admin** — `sadaqat786921/Corliva-agency-admin-portal`.
- **Finance Officer** — own portal: `sadaqat786921/corliva-finance-officer-portal` (bills approved visits, records payments, money owed, timesheets and payroll exports; applies adjustments asked for after invoicing).
- **Client & Family** — own portal: `sadaqat786921/corliva-client-family-portal` (phone-friendly: visits, checked visit summaries, care plan in use, shared documents, updates, change requests to the coordinator).
- **Super Admin (Platform Admin)** — own portal: `sadaqat786921/corliva-super-admin-portal` (CORLIVA's own team: adds agencies and their first Agency Admin, plans and subscriptions, features per agency, roles and permissions, connections, sign-in security, backups and platform audit history; support access to an agency is view only and the Agency Admin is told).

## Run
```
npm install
npm run dev     # preview
npm run build   # must finish with no errors
```
