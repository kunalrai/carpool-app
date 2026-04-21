import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Queries ───────────────────────────────────────────────────────────────

export const getAllUsers = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");

    const users = await ctx.db.query("users").collect();
    // Sort: admins first, then alphabetically by name
    return users.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────

export const adminAddUser = mutation({
  args: {
    adminId: v.id("users"),
    mobile: v.string(),
    name: v.string(),
    role: v.union(v.literal("taker"), v.literal("giver"), v.literal("both")),
    carName: v.optional(v.string()),
    carColor: v.optional(v.string()),
    carNumber: v.optional(v.string()),
  },
  handler: async (ctx, { adminId, ...newUser }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", newUser.mobile))
      .unique();
    if (existing) throw new Error("A user with this mobile number already exists");

    return await ctx.db.insert("users", {
      ...newUser,
      createdAt: Date.now(),
    });
  },
});

export const setAdminStatus = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, { adminId, targetUserId, isAdmin }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    if (adminId === targetUserId && !isAdmin) {
      throw new Error("You cannot remove your own admin access");
    }
    await ctx.db.patch(targetUserId, { isAdmin });
  },
});

export const setSuspendStatus = mutation({
  args: {
    adminId: v.id("users"),
    targetUserId: v.id("users"),
    isSuspended: v.boolean(),
  },
  handler: async (ctx, { adminId, targetUserId, isSuspended }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    if (adminId === targetUserId) throw new Error("You cannot suspend yourself");
    const target = await ctx.db.get(targetUserId);
    if (target?.isAdmin) throw new Error("You cannot suspend another admin");
    await ctx.db.patch(targetUserId, { isSuspended });
  },
});

/**
 * Seed mutation — sets the first admin by mobile number.
 * Only works when ZERO admin users exist (safe one-time bootstrap).
 * Call this from the Convex dashboard → Functions → admin:makeAdmin
 */
export const makeAdmin = mutation({
  args: { mobile: v.string() },
  handler: async (ctx, { mobile }) => {
    const allUsers = await ctx.db.query("users").collect();
    const adminExists = allUsers.some((u) => u.isAdmin);
    if (adminExists) throw new Error("An admin already exists. Use setAdminStatus instead.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", mobile))
      .unique();
    if (!user) throw new Error(`No user found with mobile ${mobile}`);

    await ctx.db.patch(user._id, { isAdmin: true });
    return { success: true, name: user.name };
  },
});

// ── App Settings ──────────────────────────────────────────────────────────

/** Returns current feature flags. Defaults: callsEnabled = true. */
export const getAppSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("appSettings").first();
    return { callsEnabled: settings?.callsEnabled ?? true };
  },
});

/** Admin-only: delete a user and their core data. */
export const adminDeleteUser = mutation({
  args: { adminId: v.id("users"), targetUserId: v.id("users") },
  handler: async (ctx, { adminId, targetUserId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    if (adminId === targetUserId) throw new Error("You cannot delete yourself");
    const target = await ctx.db.get(targetUserId);
    if (target?.isAdmin) throw new Error("You cannot delete another admin");

    const listings = await ctx.db.query("listings").withIndex("by_driver", (q) => q.eq("driverId", targetUserId)).collect();
    await Promise.all(listings.map((l) => ctx.db.delete(l._id)));

    const bookings = await ctx.db.query("bookings").withIndex("by_rider", (q) => q.eq("riderId", targetUserId)).collect();
    await Promise.all(bookings.map((b) => ctx.db.delete(b._id)));

    const templates = await ctx.db.query("recurringTemplates").withIndex("by_driver", (q) => q.eq("driverId", targetUserId)).collect();
    await Promise.all(templates.map((t) => ctx.db.delete(t._id)));

    const requests = await ctx.db.query("rideRequests").withIndex("by_rider", (q) => q.eq("riderId", targetUserId)).collect();
    await Promise.all(requests.map((r) => ctx.db.delete(r._id)));

    await ctx.db.delete(targetUserId);
  },
});

/** Admin-only: get all listings with driver name. */
export const getAllListings = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    const listings = await ctx.db.query("listings").withIndex("by_created").order("desc").collect();
    return await Promise.all(
      listings.map(async (l) => {
        const driver = await ctx.db.get(l.driverId);
        return { ...l, driverName: driver?.name ?? "Unknown" };
      })
    );
  },
});

/** Admin-only: permanently delete a listing. */
export const adminDeleteListing = mutation({
  args: { adminId: v.id("users"), listingId: v.id("listings") },
  handler: async (ctx, { adminId, listingId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    const bookings = await ctx.db.query("bookings").withIndex("by_listing", (q) => q.eq("listingId", listingId)).collect();
    await Promise.all(bookings.map((b) => ctx.db.patch(b._id, { status: "cancelled" })));
    await ctx.db.delete(listingId);
  },
});

/** Admin-only: edit a listing's fare, note, pickup, or status. */
export const adminEditListing = mutation({
  args: {
    adminId: v.id("users"),
    listingId: v.id("listings"),
    fare: v.optional(v.number()),
    note: v.optional(v.string()),
    pickupPoint: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("open"), v.literal("full"), v.literal("started"),
      v.literal("completed"), v.literal("cancelled"), v.literal("expired")
    )),
  },
  handler: async (ctx, { adminId, listingId, ...changes }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(changes)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(listingId, patch as Parameters<typeof ctx.db.patch<"listings">>[1]);
  },
});

/** Admin-only: enable or disable the calling feature. */
export const setCallsEnabled = mutation({
  args: { adminId: v.id("users"), enabled: v.boolean() },
  handler: async (ctx, { adminId, enabled }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");

    const existing = await ctx.db.query("appSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, { callsEnabled: enabled });
    } else {
      await ctx.db.insert("appSettings", { callsEnabled: enabled });
    }
  },
});
