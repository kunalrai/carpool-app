import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * users — one record per registered mobile number
   * role:  'taker' = ride seeker only
   *        'giver' = driver only
   *        'both'  = can do either
   * Car fields are required when role includes 'giver'.
   */
  users: defineTable({
    mobile: v.string(),
    name: v.string(),
    role: v.union(v.literal("taker"), v.literal("giver"), v.literal("both")),
    carName: v.optional(v.string()),
    carColor: v.optional(v.string()),
    carNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    fcmToken: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    isSuspended: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_mobile", ["mobile"]),

  /**
   * recurringTemplates — a driver's standing weekly schedule.
   * daysOfWeek: array of JS day numbers (0=Sun, 1=Mon … 6=Sat).
   * A cron runs hourly and auto-creates a listing for each active template
   * whose day matches today (IST) and whose departure is still in the future.
   */
  recurringTemplates: defineTable({
    driverId: v.id("users"),
    fromLabel: v.string(),
    toLabel: v.string(),
    fromLat: v.number(),
    fromLng: v.number(),
    toLat: v.number(),
    toLng: v.number(),
    fromPlaceId: v.optional(v.string()),
    toPlaceId: v.optional(v.string()),
    departureTimeHHMM: v.string(), // "08:30" 24-h
    totalSeats: v.number(),
    fare: v.number(),
    daysOfWeek: v.array(v.number()),
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_active", ["isActive"]),

  /**
   * listings — a driver's posted ride offer
   * status lifecycle: open → full (auto) → started → completed | cancelled | expired
   * Listings auto-expire 60 min after departureTime if not started (cron patches to 'expired').
   */
  listings: defineTable({
    driverId: v.id("users"),
    fromLabel: v.string(),         // e.g. "Gaur City 1, Greater Noida"
    toLabel: v.string(),           // e.g. "HCL Campus, Sector 136, Noida"
    fromLat: v.number(),
    fromLng: v.number(),
    toLat: v.number(),
    toLng: v.number(),
    fromPlaceId: v.optional(v.string()),
    toPlaceId: v.optional(v.string()),
    departureTime: v.number(),     // Unix ms timestamp
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
    totalSeats: v.number(),        // 1–4
    seatsLeft: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("full"),
      v.literal("started"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    fare: v.number(),              // ₹ per seat, set by driver
    templateId: v.optional(v.id("recurringTemplates")), // set when auto-created by cron
    createdAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_status_departure", ["status", "departureTime"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  /**
   * messages — community group chat for all GaurCity-HCL carpool members.
   * Any registered user can read and send.
   */
  messages: defineTable({
    senderId: v.id("users"),
    text: v.string(), // max 500 chars
    createdAt: v.number(),
  }).index("by_time", ["createdAt"]),

  /**
   * bookings — a rider's seat reservation on a listing
   * status: confirmed → cancelled | completed (set when ride ends or expires)
   * One active (confirmed) booking per rider at a time is enforced in mutations.
   */
  bookings: defineTable({
    listingId: v.id("listings"),
    riderId: v.id("users"),
    status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
    joinedAt: v.number(),
    checkedIn: v.optional(v.boolean()),
    checkedOut: v.optional(v.boolean()),
  })
    .index("by_listing", ["listingId"])
    .index("by_rider", ["riderId"])
    .index("by_listing_rider", ["listingId", "riderId"])
    .index("by_rider_status", ["riderId", "status"]),

  /**
   * rideMessages — group chat for all participants of a specific ride.
   * Only the driver and confirmed riders can read and send.
   */
  rideMessages: defineTable({
    listingId: v.id("listings"),
    senderId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_listing_time", ["listingId", "createdAt"]),

  /**
   * blogs — admin-authored articles visible on the public /blog page.
   * status: 'draft' (admin only) | 'published' (public)
   */
  blogs: defineTable({
    title: v.string(),
    slug: v.string(),            // URL-friendly, unique
    excerpt: v.string(),         // short summary shown in list view
    content: v.string(),         // full body (plain text, paragraph-separated by \n\n)
    authorId: v.id("users"),
    coverEmoji: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_slug", ["slug"]),

  directMessages: defineTable({
    listingId: v.id("listings"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  })
    .index("by_listing", ["listingId"])
    .index("by_receiver_read", ["receiverId", "read"]),
});
