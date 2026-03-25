# CarPool

A community carpooling PWA for sharing rides.

- Fixed fare per seat (set by driver)
- Max **4 riders** per ride
- No in-app payment — fare paid directly to driver
- Installable on Android & iOS as a PWA

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6, TypeScript |
| Styling | Tailwind CSS v3 |
| Backend + Database | Convex (real-time queries, mutations, actions) |
| Auth | Mobile OTP via MSG91 *(mock `123456` in dev)* |
| Push Notifications | Firebase Cloud Messaging *(console.log in dev)* |
| Voice/Video Calls | Daily.co |
| AI Parser | OpenRouter (`z-ai/glm-4.5-air:free`) |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Render (static site) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Convex](https://convex.dev) account

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex (first time only)

```bash
npx convex dev
```

This opens a browser to log in, creates a project, pushes the schema, and writes `VITE_CONVEX_URL` to `.env.local`.

### 3. Run the app

Open **two terminals**:

```bash
# Terminal 1 — Convex backend
npm run convex:dev

# Terminal 2 — Vite frontend
npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_CONVEX_URL` | Auto-set by `npx convex dev` |

### Convex backend (set in Convex Dashboard → Settings → Environment Variables)

| Variable | Description |
|---|---|
| `DAILY_API_KEY` | Daily.co API key — required for voice/video calls |
| `OPENROUTER_API_KEY` | OpenRouter key — optional, enables AI ride parser |

---

## Setting Up the First Admin

1. Register normally via the app with your mobile number
2. In the **Convex Dashboard** → Functions → run:
   ```
   Function: admin:makeAdmin
   Args: { "mobile": "YOUR_MOBILE_NUMBER" }
   ```
3. The **Admin** tab appears in the bottom nav on next load

After the first admin exists, additional admins can be granted from within the Admin panel.

---

## Screens

| Route | Screen | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Login & Registration (OTP flow) | Public |
| `/home` | Home — Find Pool & Offer Pool tabs, ride requests | Authenticated |
| `/post-ride` | Post a Ride | Drivers only |
| `/listing/:id` | Listing Detail + Join | Authenticated |
| `/my-listing` | My Listing Management | Active drivers |
| `/profile` | Profile — edit details, logout | Authenticated |
| `/chat` | Community group chat | Authenticated |
| `/dm/:listingId/:otherUserId` | Direct chat (driver ↔ rider) | Authenticated |
| `/ride-chat/:listingId` | Ride group chat (driver + confirmed riders) | Authenticated |
| `/call/:mode/:listingId` | Group voice call | Authenticated |
| `/call/:mode/:listingId/:otherUserId` | 1-on-1 voice call | Authenticated |
| `/admin` | Admin panel — manage users | Admin only |
| `/admin/blog` | Blog management | Admin only |
| `/blog` | Public blog list | Public |
| `/blog/:slug` | Blog post | Public |
| `/privacy` `/terms` `/data-safety` | Legal pages | Public |

---

## Project Structure

```
convex/                 # Backend — schema, queries, mutations, actions
  schema.ts             # DB tables: users, listings, bookings, messages,
                        #   rideMessages, directMessages, blogs, rideRequests
  users.ts              # User queries + mutations
  listings.ts           # Listing lifecycle (post, cancel, start, complete, expire)
  bookings.ts           # Join/cancel ride (atomic seat decrement)
  rideRequests.ts       # Ride request post/cancel/query + expiry cron
  auth.ts               # OTP send/verify (MSG91 action)
  admin.ts              # Admin queries + mutations (suspend, makeAdmin)
  chat.ts               # Community group chat
  rideMessages.ts       # Ride group chat
  directMessages.ts     # 1-on-1 DM between driver and rider
  calls.ts              # Daily.co room creation + token generation
  ai.ts                 # AI ride offer parser (OpenRouter)
  blogs.ts              # Blog CRUD
  crons.ts              # Auto-expire listings + ride requests (every 5 min)

src/
  contexts/             # AuthContext (userId stored in localStorage)
  components/           # AppShell, BottomNav, shared UI
  screens/              # One file per screen
  lib/
    matching.ts         # haversineKm + matchPercent route similarity utility
  App.tsx               # Route definitions + auth guards
  main.tsx              # ConvexProvider + BrowserRouter + React root

public/                 # PWA icons
scripts/                # generate-icons.mjs (sharp)
```

---

## Key Business Rules

- One active listing per driver at a time
- One active ride request per rider at a time
- Listings auto-expire 60 minutes after departure time (via cron)
- Ride requests auto-expire 60 minutes after departure time (via cron)
- `joinRide` atomically decrements `seatsLeft` and creates a booking
- `cancelBooking` reverts listing status from `full → open` if needed
- Driver cannot join their own ride
- Rider can only have one confirmed booking at a time
- Fare is always ₹80, set server-side on `postListing`

### Listing status lifecycle

```
open → full → started → completed
                      → cancelled
            expired (via cron)
```

---

## Messaging & Calls

Three chat scopes:

| Scope | Table | Route |
|---|---|---|
| Community (all users) | `messages` | `/chat` |
| Ride group (driver + confirmed riders) | `rideMessages` | `/ride-chat/:listingId` |
| Direct DM (driver ↔ rider) | `directMessages` | `/dm/:listingId/:otherUserId` |

Voice/video calls use **Daily.co**. `convex/calls.ts` creates or reuses a private room per listing and returns a short-lived meeting token. Requires `DAILY_API_KEY` in Convex environment variables.

---

## Ride Requests & Route Matching

Riders who can't find a suitable listing can post a **ride request** from the Find Pool tab. Requests capture pickup location, dropoff, desired departure time, seats needed, and an optional note.

Drivers see all active requests in the **Offer Pool tab** under "Riders Looking for a Ride", sorted by route match % so the best candidates appear first.

### Match % algorithm

Match % is computed client-side in `src/lib/matching.ts` using the Haversine formula:

- Pickup proximity score: `max(0, 1 − pickupDist / 5 km) × 100`
- Dropoff proximity score: `max(0, 1 − dropoffDist / 5 km) × 100`
- Final: `round((pickupScore + dropoffScore) / 2)`

| Distance per endpoint | Score |
|---|---|
| 0 km | 100% |
| 2.5 km | 50% |
| 5 km+ | 0% |

Badge colours: **green** ≥ 80%, **yellow** ≥ 50%, **grey** < 50%.

When a rider has an active request, each listing card in the Find Pool feed also shows its match % against the request.

### Request lifecycle

```
active → cancelled (rider cancels)
       → expired   (cron, 60 min after departure)
```

---

## AI Ride Parser

`convex/ai.ts` exposes a `parseRideOffer` action used in community chat. It detects ride offer messages and returns structured JSON (direction, time, seats, pickup point). Uses OpenRouter with model `z-ai/glm-4.5-air:free`. Degrades silently if `OPENROUTER_API_KEY` is unset.

---

## Regenerating Icons

If you update `public/icon.svg`, regenerate all PNG sizes with:

```bash
npm run generate-icons
```

---

## Deployment

Hosted on **Render** as a static site. Push to `main` to deploy.

```bash
npm run build   # outputs to dist/
```
