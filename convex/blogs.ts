import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// ── Public queries ──────────────────────────────────────────────────────────

export const getPublishedBlogs = query({
  args: {},
  handler: async (ctx) => {
    const blogs = await ctx.db
      .query("blogs")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return blogs.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
  },
});

export const getBlogBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const blogs = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .collect();
    const blog = blogs[0] ?? null;
    if (!blog || blog.status !== "published") return null;
    const author = await ctx.db.get(blog.authorId);
    return { ...blog, authorName: author?.name ?? "Admin" };
  },
});

// ── Admin queries ───────────────────────────────────────────────────────────

export const getAllBlogs = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    const blogs = await ctx.db.query("blogs").collect();
    return blogs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBlogById = query({
  args: { blogId: v.id("blogs"), adminId: v.id("users") },
  handler: async (ctx, { blogId, adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    return await ctx.db.get(blogId);
  },
});

// ── Admin mutations ─────────────────────────────────────────────────────────

export const createBlog = mutation({
  args: {
    adminId: v.id("users"),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverEmoji: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    publish: v.boolean(),
  },
  handler: async (ctx, { adminId, publish, ...data }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");

    const baseSlug = toSlug(data.title);
    // Ensure slug uniqueness by appending timestamp if needed
    const existing = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
      .collect();
    const slug = existing.length > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

    const now = Date.now();
    return await ctx.db.insert("blogs", {
      ...data,
      slug,
      authorId: adminId,
      status: publish ? "published" : "draft",
      publishedAt: publish ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBlog = mutation({
  args: {
    adminId: v.id("users"),
    blogId: v.id("blogs"),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverEmoji: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    publish: v.boolean(),
  },
  handler: async (ctx, { adminId, blogId, publish, ...data }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    const blog = await ctx.db.get(blogId);
    if (!blog) throw new Error("Blog not found");

    const now = Date.now();
    await ctx.db.patch(blogId, {
      ...data,
      status: publish ? "published" : "draft",
      publishedAt: publish ? (blog.publishedAt ?? now) : undefined,
      updatedAt: now,
    });
  },
});

export const deleteBlog = mutation({
  args: { adminId: v.id("users"), blogId: v.id("blogs") },
  handler: async (ctx, { adminId, blogId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin?.isAdmin) throw new Error("Unauthorized");
    await ctx.db.delete(blogId);
  },
});
