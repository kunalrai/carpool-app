# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GaurCity-HCL Carpool** — A fixed-route carpooling PWA between Gaur City (GC1/GC2) and HCL campus. Fixed fare ₹80/seat, max 4 riders, no in-app payment.

## Commands

```bash
# Start Vite dev server and Convex backend simultaneously (two terminals)
npm run dev          # Vite at http://localhost:5173
npm run convex:dev   # Convex dev server (syncs schema, generates types)

# First-time Convex setup (interactive — links project to Convex cloud)
npx convex dev

# Build for production
npm run build
npm run preview
```

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 6, TypeScript |
| Styling | Tailwind CSS v3 (config in `tailwind.config.js`) |
| Backend + DB | Convex (real-time queries, mutations, actions) |
| Auth | Mobile OTP via MSG91 (mock OTP `123456` during dev) |
| Push Notifications | Firebase Cloud Messaging — `console.log` only during dev |
| PWA | `vite-plugin-pwa` (configured in `vite.config.ts`) |
| Hosting | Render (static site) |

## Architecture

### Convex (backend)
All server-side logic lives in `convex/`. Convex runs as a separate process (`npm run convex:dev`) and auto-generates TypeScript types into `convex/_generated/` (gitignored — never edit manually).

- **`convex/schema.ts`** — single source of truth for all table shapes and indexes
- **`convex/*.ts`** — queries (real-time subscriptions), mutations (atomic writes), actions (external API calls like MSG91, FCM)

Convex URL is injected at runtime via `VITE_CONVEX_URL` env var (set in `.env.local` after running `npx convex dev`).

### React Frontend (`src/`)
- `main.tsx` — wraps app in `<ConvexProvider>` + `<BrowserRouter>`
- `App.tsx` — route definitions (6 screens)
- Global CSS utilities defined in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`

### Route Map
| Path | Screen |
|---|---|
| `/login` | S1 — Login & Registration (OTP flow + new user form) |
| `/home` | S3 — Home (listings feed, My Ride banner, direction filter) |
| `/post-ride` | S4 — Post a Ride |
| `/listing/:id` | S5 — Listing Detail + join |
| `/my-listing` | S6 — My Listing Management (driver view) |
| `/profile` | S2 — Profile |

### Database Schema (3 tables)
- **`users`** — indexed by `mobile`. Car fields only required when role is `giver`/`both`.
- **`listings`** — status lifecycle: `open → full → started | cancelled`. Fare always 80. Auto-expire 60 min after `departureTime` if not started (enforced in queries, not a cron).
- **`bookings`** — one confirmed booking per rider at a time (enforced in mutations).

Key indexes to use in queries:
- `listings.by_direction_status` — for the feed filter
- `listings.by_driver` — for the driver's active listing
- `bookings.by_rider_status` — for a rider's current booking
- `bookings.by_listing` — for listing's confirmed riders

## Business Rules (enforce in mutations)
- One active listing per driver at a time
- `joinRide` must atomically decrement `seatsLeft` and create booking
- `cancelBooking` must revert `status` from `full → open` if needed
- `postListing` sets `fare: 80`, `seatsLeft: totalSeats`, `status: 'open'`

## Admin Setup (first-time)

Admin users have an `isAdmin: true` field in the `users` table. To bootstrap the first admin:

1. Register normally via the app (OTP login + registration)
2. In the **Convex Dashboard** → your project → **Functions** tab → run:
   ```
   Function: admin:makeAdmin
   Args: { "mobile": "9876543210" }
   ```
3. The Admin tab will appear in the bottom nav on next load

After the first admin exists, additional admins can be granted from within the Admin panel (tap a user → Make Admin).

## Dev Shortcuts (temporary)
- OTP: hardcoded `123456` instead of real MSG91 calls
- FCM: `console.log` the notification payload, do not call FCM API

## Build Order
Steps completed: **1** (scaffold) **2** (schema) **3** (Convex queries + mutations) **4** (S1 Login/Registration) **5** (S3 Home) **6** (S4 Post a Ride) **9** (S2 Profile)

Next: **7** → S5 Listing Detail + join flow
