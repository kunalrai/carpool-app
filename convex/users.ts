import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getProfilePhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const getUserByMobile = query({
  args: { mobile: v.string() },
  handler: async (ctx, { mobile }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", mobile))
      .unique();
  },
});

export const registerUser = mutation({
  args: {
    mobile: v.string(),
    name: v.string(),
    role: v.union(v.literal("taker"), v.literal("giver"), v.literal("both")),
    email: v.optional(v.string()),
    carName: v.optional(v.string()),
    carColor: v.optional(v.string()),
    carNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate registrations
    const existing = await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", args.mobile))
      .unique();
    if (existing) throw new Error("User already registered");

    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("taker"), v.literal("giver"), v.literal("both"))
    ),
    email: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    carName: v.optional(v.string()),
    carColor: v.optional(v.string()),
    carNumber: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...fields }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // When switching back to 'taker', explicitly unset car fields.
    // Convex treats undefined in patch as "remove this optional field".
    const updates: Record<string, unknown> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.photoStorageId !== undefined) updates.photoStorageId = fields.photoStorageId;
    if (fields.role !== undefined) {
      updates.role = fields.role;
      if (fields.role === "taker") {
        updates.carName = undefined;
        updates.carColor = undefined;
        updates.carNumber = undefined;
      }
    }
    if (fields.carName !== undefined) updates.carName = fields.carName;
    if (fields.carColor !== undefined) updates.carColor = fields.carColor;
    if (fields.carNumber !== undefined) updates.carNumber = fields.carNumber;

    await ctx.db.patch(userId, updates);
  },
});

export const saveFcmToken = mutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    await ctx.db.patch(userId, { fcmToken: token });
  },
});
