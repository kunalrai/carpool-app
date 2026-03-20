import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Mark expired listings as cancelled every 5 minutes so the reactive
// query re-fires and they disappear from the rider feed.
crons.interval(
  "expire-old-listings",
  { minutes: 5 },
  internal.listings.expireListings
);

// Expire ride requests 60 minutes after their departure time.
crons.interval(
  "expire-old-requests",
  { minutes: 5 },
  internal.rideRequests.expireRequests
);

// Auto-create listings for recurring templates once per hour.
// Checks active templates whose day-of-week (IST) matches today.
crons.interval(
  "spawn-recurring-listings",
  { hours: 1 },
  internal.recurring.spawnDailyListings
);

export default crons;
