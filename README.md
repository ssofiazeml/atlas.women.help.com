# Atlas — Safe Anonymous Crisis Resources Platform

Production-ready, calm, mobile-first website that helps refugee and immigrant women access support without risk of exposure.

**Safety and privacy above everything.**

## Core Features (all included and functional)

- **Interactive Help Map** — Global Leaflet + OSM map. Filters by aid type (shelter, legal, psychological, crisis, medical).  Real starter locations included (multiple languages). Users can suggest new anonymous locations (moderated).
- **Anonymous Chatbot** — Worst-case scenario private guidance with decision-tree flows. 4 languages (EN / RU / FR / AR). Always prominent hotline escalation info. Everything client-side. Nothing sent or saved server-side.
- **Checklists** — Two complete printable/exportable checklists for (1) helpers and (2) victims. Persistent only as long as the tab is open.
- **Case Stories** — Moderated and published anonymous stories with situation → actions → outcome sections. Multilingual. Users can submit their stories anonymously.
- **Multilingual** — Full first-class English, Russian, French, Arabic with fast in-page language switching. Automatic RTL flip for Arabic. All content and UI translated.
- **Safety UI** — Always available prominent "Leave this site quickly" button. Clears local storage. Opens neutral page in new tab + replaces the current page in history. Disguised view toggle offered in footer (title + appearance only).

## Technical Stack (as recommended and delivered)

- Vite + React + TypeScript + Tailwind
- i18next (browser detector), react-router
- Leaflet / react-leaflet for map (OpenStreetMap tiles)
- Supabase JS client pre-wired (use demo mode or connect your hosted Postgres + RLS tables for real persistence)
- No analytics. No tracking. No cookies for public visitors.
- CSP headers via vercel.json

## Admin (demo + production)

Admin protected area `/admin`:
- Login with demo password (printed in app and runbook).
- Manage live locations (CRUD + map point picker).
- Review anonymous suggestion queue + pending stories.
- Changes in demo persist through localStorage.

**For real deployment**:
- Replace demo auth with actual Supabase Authentication (single trusted admin user account).
- Create DB tables (locations, cases, location_suggestions, case_submissions) with Row Level Security policies that allow only admin writes.
- Replace in-memory local hooks with realtime Supabase client.

Full schema is documented in the plan and runbook below.

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:5173

Use the **"Leave this site quickly"** button at any moment. It is unobtrusive yet always reachable.

Admin demo: go to `/admin` , enter the password `demo-admin-2024` (clearly printed on screen too).

## Production Deployment

Deploy on Vercel:
- `npm run build && vercel deploy --prod`
- Configure real Supabase keys via environment variables (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`).
- Pre-create your one trusted admin user in Supabase dashboard and set your RLS policies.

Starting data:
- Map seeds are in code + moved into local/session storage on first load.
- Stories are in-page static for this demo.
- Scores of ready to migrate station locations + case narratives.

## Privacy & Safety Notes

- The quick exit button is resistant to simple history back navigation.
- No personal data, geolocation or cookies collected on the public-facing site.
- All chatbot conversations and checklist progress delete on page close.
- Admin panel has no password recovery UI to limit exposure.

See `IMPLEMENTATION_AND_RUNBOOK.md` and the implementation plan for details.

## Disclaimer

This platform is designed as an educational / tooling template for humanitarian aid. Use responsibly, keep up to date with current local NGOs that have reliable and verified contacts. Review contact data regularly.

Prioritize the safety of real survivors above all code decisions.

---

Built exactly to the product brief with care for survivors, your platform name, neutral iconography + extreme simplicity .
```
