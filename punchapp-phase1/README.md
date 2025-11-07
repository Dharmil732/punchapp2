# Punch App Final (v14)

- App Router, protected by middleware → `/signin` first
- Unified Home with Punch/Break controls
- Role-based navigation (Admin/Manager/Supervisor/Employee)
- All top-level pages present & gated
- Mobile-friendly, dark UI
- Demo API stubs (return mock data). Replace with Supabase RPC.

## Setup
1. Copy `.env.example` to `.env.local` and set Supabase URL & anon key.
2. `npm i && npm run dev` (local) or deploy to Vercel (set the env vars).
3. Ensure a row exists in `profiles` for the logged-in user with `role` set (`admin|manager|supervisor|employee`).

## Wiring to Supabase
- Replace `/api/action` and `/api/state` with calls to your RPC:
  - `do_punch(action, ts, geo, ...)`
  - `current_state_for_user()`
- Replace demo endpoints under `/api/tasks`, `/api/shifts`, `/api/requests` with table queries.
