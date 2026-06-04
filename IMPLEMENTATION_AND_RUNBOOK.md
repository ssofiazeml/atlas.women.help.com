# Atlas Implementation & Runbook

## Overview & Safety Philosophy
All user features are intentionally client-side or clearly authenticated.
- No personal data is ever stored beyond a session.
- Nothing is sent to servers for end user interactions except read manifests for public data via Supabase.
- Authentication is reserved strictly for the single admin role; normal users never log in.

The goal of this MVP is production-ready use today with easy path to real hosted DB.

## Run Commands
```
npm run dev        # start local with HMR
npm run build      # prod bundle
npm run preview    # local preview of built bundle
```

Startup command for Orchids/cloud environment config (already set):
```
npm install; npm run dev
```

## Running the Dev Preview
1. Run `npm install`
2. Run `npm run dev`
3. Use configured preview URL (redirects you to this localhost in Orchids)

Current active public proxy preview page reflects changes instantly via HMR.

## Environment Variables
Create `.env.local` (example in `.env.example`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

This platform works fully in demo mode without keys.
You should connect Supabase **only for authenticated admin writes** while keeping the anon client key for public-read locations & stories.

## Admin Flow
- Visit `/admin`
- Password for current demo ("demo-admin-2024") is shown plainly.
- Two tabs:
  - **Locations**: add / edit / delete map pins. Click on the small embedded world map to pick a coordinate.
  - **Moderation**:
    - Review pending user location suggestions. "Publish to map" adds them instantly to the live searchable data shared with the public /map view.
    - Story submissions queue. Approve adds published record (demo in-memory).

Important: in this demo everything is persisted in the browser only until the user clears localStorage. Live production version swaps the saveMapLocations + get... with Supabase update/insert/select calls guarded by RLS.

## Switching From Demo → Supabase Production
1. Create Supabase project.
2. Enable email+password auth. Invite only your single account (disable public sign-ups).
3. Create these tables:

```sql
create table locations (
  id bigint primary key generated always as identity,
  lat double precision not null,
  lng double precision not null,
  category text[] default '{}',
  name jsonb not null,
  description jsonb,
  city text, country text,
  contact_phone text, contact_web text,
  verified boolean default true,
  created_at timestamptz default now()
);

create table cases (
  id bigint primary key generated always as identity,
  published boolean default false,
  title jsonb, situation jsonb, actions jsonb, outcome jsonb,
  created_at timestamptz default now()
);

create table location_suggestions ( ... similar schema for awaiting review );
create table case_submissions ( ... awaiting review for stories );
```

4. Setup RLS:
   - Public SELECT on `locations` where verified = true, and SELECT on cases where published.
   - Write permitted only for service role (or the authenticated admin user).
5. You may use the included demoData hooks as inspiration while you call `supabase.from('locations').select('*')` inside admin service.

6. Use one trusted uid; `insert into admins(uid) values ('your-uid');`

## Security Notes (must review before going live)
- Strong CSP enforced by vercel.json (no unsafe inline external scripts)
- All admin authenticated operations must go through Supabase Auth token with Row Level Security
- Disguised mode only client / cosmetic — does NOT hide real traffic or referrer
- Always test quick exit on all new pages.
  1. Click = new tab neutral page opens + current page replaced → user cannot press back.
- Recommend keeping neutral domain for deployed site if at all possible (no mentions of crisis in hostname).
- The app favors public OSM tiles (currently unpkg / osm — no user tracking keys).

## Testing Safety Checklist
- Language change (esp. Arabic RTL)
- Quick exit testing across browsers: opens clean neutral page and stops backward navigation leak.
- Map markers + search/filter work with fresh local data edited from admin
- Chatbot tree exercises all common paths + always displays hotline notes
- Checklists: mark any checkboxes then export .txt and print-test
- Stories: open full detail + submit a dummy anonymous story via modal
- Admin: correct login denial on wrong password + successful add + publish of new location + suggested story flows reflected live on public pages (map / stories)
- Console: zero leaked PII, no web error tracking
- Mobile touchscreen friendly buttons and large targets

## Milestones Delivered (match to original brief)

✅ Full architecture documented
✅ Recommended stack + reasoning (Vite/React + Supabase + privacy map choice)
✅ Database schema explained
✅ UI/UX flows for each section documented in plans
✅ Key code examples (Map, Chatbot, and Admin) all live
✅ Anonymity + exit +CSP + tracking prevention built in
✅ MVP-first release path documented

## Common Admin Tasks Runbook
Add a verified new shelter:
1. Login → Locations tab → + Add new location
2. Type name multi-lang, pick point on map, choose category, fill notes + phone/website → Save
3. The public /map now reflects it

Review + reject a user's suggestion:
- Moderation tab  → pending suggestions list → Reject

Publish a suggestion:
- Moderation tab → "Publish to map"

Publish submitted anonymous story:
- Moderation → pending cases row → Approve

## Demo Data Reset
Run in console: localStorage.clear() then reload. All demo seeds reappear.

Or call the helper exposed as `resetAllDemoData()` from lib/demoData.

## Next Steps to Scale
- Real hosted Postgres with RLS
- Optional Supabase files for story evidence (keep minimal)
- Edge rate limits on public suggestion inserts
- Improve translations continuity via translators / crowdsourcing tooling
- Add fine grained search + geofencing when traffic increases

---

Remember: the single most critical thing is that users who depend on your service understand that the code never compromises their location or safety.

Stay safe.
```
