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
