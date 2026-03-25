# CarPool

A community carpooling PWA for sharing rides.

- Fixed fare per seat (set by driver)
- Max **4 riders** per ride
- No in-app payment — fare paid directly to driver
- Installable on Android & iOS as a PWA

**Live app:** https://carpool-virid.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TypeScript |
| Styling | Tailwind CSS v3 |
| Backend + Database | Convex (real-time) |
| Auth | Mobile OTP via MSG91 *(mock in dev)* |
| Push Notifications | Firebase Cloud Messaging *(mock in dev)* |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel |

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

This will open a browser to log in, create a project, push the schema, and automatically write `VITE_CONVEX_URL` to `.env.local`.

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
| `/login` | Login & Registration (OTP flow) | Public |
| `/home` | Home — listings feed, My Ride banner | Authenticated |
| `/post-ride` | Post a Ride | Drivers only (has car details) |
| `/listing/:id` | Listing Detail + Join | Authenticated |
| `/my-listing` | My Listing Management | Active drivers |
| `/profile` | Profile — edit details, logout | Authenticated |
| `/admin` | Admin Panel — manage users | Admin only |

---

## Project Structure

```
convex/          # Backend — schema, queries, mutations, actions
  schema.ts      # Database tables: users, listings, bookings
  users.ts       # User queries + mutations
  listings.ts    # Listing queries + mutations (post, cancel, start, end)
  bookings.ts    # Booking queries + mutations (join, cancel)
  auth.ts        # OTP send/verify actions
  admin.ts       # Admin queries + mutations

src/
  contexts/      # AuthContext (userId in localStorage)
  components/    # BottomNav
  screens/       # One file per screen (Login, Home, PostRide, etc.)
  App.tsx        # Route definitions + auth guards
  main.tsx       # ConvexProvider + React root

public/          # PWA icons (generated via scripts/generate-icons.mjs)
scripts/         # Icon generation script (sharp)
```

---

## Key Business Rules

- One active listing per driver at a time
- Listings auto-expire **30 minutes** after departure time
- `joinRide` atomically decrements `seatsLeft`
- Driver cannot join their own ride
- Rider can only have one confirmed booking at a time

---

## Regenerating Icons

If you update `public/icon.svg`, regenerate all PNG icons with:

```bash
npm run generate-icons
```

---

## Deployment

Hosted on **Vercel**. Every push to `main` auto-deploys.

```bash
git push origin main  # triggers auto-deploy
```

---

## Pending

- **Step 11** — Wire up [MSG91](https://msg91.com) for real OTP delivery
- **Step 12** — Wire up [Firebase Cloud Messaging](https://firebase.google.com) for push notifications
