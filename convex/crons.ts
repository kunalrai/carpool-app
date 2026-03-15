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

export default crons;
