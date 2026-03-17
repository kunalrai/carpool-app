import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Seed — run once from Convex dashboard to publish the success story ──────
// Args: { "mobile": "<admin-mobile-number>" }
export const seedSuccessStory = mutation({
  args: { mobile: v.string() },
  handler: async (ctx, { mobile }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", mobile))
      .collect();
    const author = users[0];
    if (!author) throw new Error("User not found for mobile: " + mobile);

    const slug = "how-i-saved-rs-3200-every-month-with-gc-ridepool";
    const existing = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .collect();
    if (existing.length > 0) return "Already seeded";

    const now = Date.now();
    await ctx.db.insert("blogs", {
      title: "How I Saved ₹3,200 Every Month — My Carpool Story",
      slug,
      excerpt:
        "I was spending ₹4,000 a month on auto-rickshaws and cabs just to get to HCL and back. Then a colleague told me about GC Ridepool. Here's how everything changed.",
      content: `## The Problem Nobody Talks About

Every morning at 8:15 AM, I would stand outside Gaur City 2's gate and frantically wave at every passing auto. Some days I got one in five minutes. Most days it was twenty. And on rainy days? Forget it — surge pricing would kick in and I'd be paying ₹180 for a ₹60 ride.

I am a software engineer at HCL Tech. I moved to Gaur City in early 2024 because the rent was reasonable and the area was developing fast. What nobody warned me about was the daily commute cost.

## The Numbers Were Ugly

I sat down one Sunday and actually counted what I was spending:

- Auto to sector 62 and then share cab to HCL: ₹90–₹120 each way
- On rainy or late days, app cabs: ₹150–₹200 each way
- Average per working day: ₹160 (to and fro)
- Monthly (25 working days): ₹4,000

That's ₹48,000 a year. On commuting alone. It was nearly 15% of my take-home salary going up in exhaust fumes.

## A Colleague Mentioned GC Ridepool

In October, a colleague Saurabh — who lives in GC1 — mentioned he'd been using an app called GC Ridepool. He said he just paid the driver directly, no commission, no platform cut.

I signed up that evening. OTP login, done in 30 seconds. The next morning I opened the app at 8:10 and saw three rides already listed for 8:30. I joined one. The driver — Ramesh bhai, a GC2 resident who works at the same HCL campus — picked me up right outside my building gate.

We had four people in the car. Everyone split the cost. I paid ₹200 for the week. The entire week.

## What Changed

The group chat feature was the real surprise. Our ride group has five of us now — we coordinate every morning in the app without sharing phone numbers. If someone is running late, they drop a message. If the driver has a day off, we rearrange. It works like a well-oiled machine.

Voice calls inside the app meant I never had to share my personal number with strangers, which I was uncomfortable with before.

## The Math After GC Ridepool

Here's the honest breakdown after three months on the platform:

- My share per ride: approximately ₹50–₹60 each way
- Monthly cost: ₹800 on average
- Monthly saving: ₹3,200

That's ₹38,400 saved per year. I used that money to finally buy myself a decent laptop for side projects.

## What I Would Tell Other GC Residents

If you live in Gaur City and work anywhere near the HCL or sector 62 belt, you are almost certainly overpaying for your commute. The infrastructure exists — your neighbours are already driving the same route every single day. You just need a way to connect.

GC Ridepool is that way. It took me one OTP and three taps to book my first ride. The community is professional, the drivers are punctual (our group chat keeps everyone honest), and there are zero platform fees.

The only thing I regret is not joining sooner.`,
      coverEmoji: "🚗",
      tags: ["success story", "savings", "commute", "real experience"],
      authorId: author._id,
      status: "published",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return "Success story published!";
  },
});

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
