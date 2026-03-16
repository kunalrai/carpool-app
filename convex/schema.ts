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
   * listings — a driver's posted ride offer
   * status lifecycle: open → full (auto) → started → completed | cancelled | expired
   * fare is always 80; stored for display consistency.
   * Listings auto-expire 60 min after departureTime if not started (cron patches to 'expired').
   */
  listings: defineTable({
    driverId: v.id("users"),
    direction: v.union(v.literal("GC_TO_HCL"), v.literal("HCL_TO_GC")),
    departureTime: v.number(), // Unix ms timestamp
    pickupPoint: v.optional(v.string()),
    note: v.optional(v.string()),
    totalSeats: v.number(), // 1–4
    seatsLeft: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("full"),
      v.literal("started"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    fare: v.number(), // always 80
    createdAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_direction_status", ["direction", "status"])
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
   * directMessages — private 1-on-1 messages between a driver and a rider
   * scoped to a specific listing (ride context).
   */
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
