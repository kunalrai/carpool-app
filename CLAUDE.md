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

### Auth
`AuthContext` stores a Convex `Id<"users">` in `localStorage` (no JWT). `useAuth()` exposes `userId`, `login(id)`, `logout()`.

`AppShell` constrains all app screens to `max-w-md mx-auto` (mobile frame). Landing, legal, and blog pages render full-width.

### Route Map
| Path | Screen | Layout |
|---|---|---|
| `/` | Landing page | Full-width, public |
| `/login` | Login & Registration (OTP + new user form) | Full-width, public |
| `/home` | Home — listings feed, My Ride banner, direction filter | Tab (bottom nav) |
| `/profile` | Profile | Tab |
| `/chat` | Community group chat (all users) | Tab |
| `/admin` | Admin panel | Tab (admin only) |
| `/post-ride` | Post a Ride | Full-screen |
| `/listing/:id` | Listing Detail + join | Full-screen |
| `/my-listing` | My Listing Management (car owner view) | Full-screen |
| `/dm/:listingId/:otherUserId` | Direct chat between driver and rider | Full-screen |
| `/ride-chat/:listingId` | Ride group chat (driver + confirmed riders) | Full-screen |
| `/call/:mode/:listingId` | Group voice call (Daily.co) | Full-screen |
| `/call/:mode/:listingId/:otherUserId` | 1-on-1 voice call | Full-screen |
| `/blog` | Public blog list | Full-width |
| `/blog/:slug` | Blog post | Full-width |
| `/admin/blog` | Admin blog management | Full-width, admin only |
| `/privacy` `/terms` `/data-safety` | Legal pages | Full-width, public |

### Database Schema (7 tables)
- **`users`** — indexed `by_mobile`. Car fields only required when role is `giver`/`both`. `isAdmin` and `isSuspended` are optional booleans.
- **`listings`** — status lifecycle: `open → full → started → completed | cancelled | expired`. Fare always 80. A cron (`crons.ts`) runs every 5 min to patch listings to `expired` status.
- **`bookings`** — one confirmed booking per rider at a time (enforced in mutations).
- **`messages`** — community group chat messages, indexed `by_time`.
- **`rideMessages`** — ride-specific group chat, indexed `by_listing_time`.
- **`directMessages`** — 1-on-1 driver↔rider chat scoped to a listing, indexed `by_listing` and `by_receiver_read`.
- **`blogs`** — admin-authored articles, `status: draft | published`, indexed `by_status` and `by_slug`.

Key indexes to use in queries:
- `listings.by_direction_status` — for the feed filter
- `listings.by_driver` — for the driver's active listing
- `bookings.by_rider_status` — for a rider's current booking
- `bookings.by_listing` — for listing's confirmed riders
- `directMessages.by_receiver_read` — for unread DM badge count

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

## Additional Features

### Messaging & Calls
Three chat scopes: community (`messages` table / `convex/chat.ts`), ride group (`rideMessages` / `convex/rideMessages.ts`), and direct DM (`directMessages` / `convex/directMessages.ts`). Voice/video calls use **Daily.co** — `convex/calls.ts` exposes `getCallToken` action that creates/reuses a private room and returns a short-lived meeting token. Requires `DAILY_API_KEY` env var in Convex.

### AI Ride Parser
`convex/ai.ts` exposes `parseRideOffer` action — detects ride offers in community chat messages and returns structured JSON (direction, time, seats, pickup). Uses **OpenRouter** (`OPENROUTER_API_KEY` env var, model `z-ai/glm-4.5-air:free`). If the key is absent, it silently returns `null`.

### Blog
Admins author posts in `/admin/blog`. Public reads at `/blog` and `/blog/:slug`. Content is plain text, paragraphs separated by `\n\n`. Drafts are only visible to admins.

## Dev Shortcuts (temporary)
- OTP: hardcoded `123456` instead of real MSG91 calls
- FCM: `console.log` the notification payload, do not call FCM API
- AI parser degrades gracefully if `OPENROUTER_API_KEY` is unset
- Calls require `DAILY_API_KEY` set in Convex environment variables
