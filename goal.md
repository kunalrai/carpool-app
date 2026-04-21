# Gamification Plan — CarPool

## Philosophy
Reward **consistency and community contribution** — not spending. Every mechanic should encourage more rides, better behavior, and trust-building.

---

## Phase 1 — Points & Ride History

**Schema additions:**
- `users`: add `totalPoints`, `ridesGiven`, `ridesTaken`
- New `pointEvents` table: `userId, type, points, referenceId, createdAt`

**Point triggers (mutations):**

| Event | Points |
|---|---|
| Complete a ride as driver | +20 |
| Complete a ride as rider | +10 |
| First ride of the day | +5 bonus |
| 7-day streak (consecutive workdays) | +50 |
| Profile fully filled (photo, car, email) | +30 one-time |

**UI:**
- Points balance shown on Profile screen
- Ride history tab on Profile (past rides as driver/rider)

---

## Phase 2 — Badges & Achievements

New `badges` table: `userId, badgeId, earnedAt`

| Badge | Trigger |
|---|---|
| First Driver | Complete first ride as driver |
| First Rider | Complete first ride as rider |
| Week Warrior | 5-day consecutive ride streak |
| Century | 100 total rides |
| Trusted Driver | 50 rides given |
| Green Commuter | 30 rides taken (saves emissions) |
| Top Driver (monthly) | Most rides given in a month |

**UI:**
- Badge showcase on Profile (grid of earned/locked badges)
- Toast notification when a badge is earned

---

## Phase 3 — Leaderboard

New Convex query: `getLeaderboard(period: 'weekly' | 'monthly' | 'alltime')`

**UI:**
- New "Leaderboard" tab in bottom nav (trophy icon)
- Two boards: **Top Drivers** (rides given) / **Top Riders** (rides taken)
- Shows rank, avatar, name, count — current user row always pinned at bottom

---

## Phase 4 — Streaks & Nudges

**Streak tracking:**
- `users`: add `currentStreak`, `longestStreak`, `lastRideDate`
- Updated in `completeRide` mutation — reset if gap > 1 workday

**Nudge system (push via FCM):**
- Morning nudge if user hasn't posted/joined a ride by 8 AM on a workday
- "Your streak is at risk!" notification if no ride by end of day

---

## Build Order

```
1. pointEvents table + completeRide mutation update (awards points)
2. Ride history query + Profile history tab
3. Points balance on Profile screen
4. badges table + badge-award logic in mutations
5. Badge showcase on Profile
6. Leaderboard query + screen + bottom nav tab
7. Streak tracking in schema + mutation
8. FCM nudge actions
```

---

## What to Skip
- No ratings/stars — too much friction for a fixed community
- No rewards redemption — keep it purely social/status
- No paid tiers — community trust is the reward
