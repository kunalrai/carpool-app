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

In October, a colleague Saurabh — who lives in GC1 — mentioned he'd been using an app called GC Ridepool. He said he just paid the car owner directly, no commission, no platform cut.

I signed up that evening. OTP login, done in 30 seconds. The next morning I opened the app at 8:10 and saw three rides already listed for 8:30. I joined one. The car owner — Ramesh bhai, a GC2 resident who works at the same HCL campus — picked me up right outside my building gate.

We had four people in the car. Everyone split the cost. I paid ₹200 for the week. The entire week.

## What Changed

The group chat feature was the real surprise. Our ride group has five of us now — we coordinate every morning in the app without sharing phone numbers. If someone is running late, they drop a message. If the car owner has a day off, we rearrange. It works like a well-oiled machine.

Voice calls inside the app meant I never had to share my personal number with strangers, which I was uncomfortable with before.

## The Math After GC Ridepool

Here's the honest breakdown after three months on the platform:

- My share per ride: approximately ₹50–₹60 each way
- Monthly cost: ₹800 on average
- Monthly saving: ₹3,200

That's ₹38,400 saved per year. I used that money to finally buy myself a decent laptop for side projects.

## What I Would Tell Other GC Residents

If you live in Gaur City and work anywhere near the HCL or sector 62 belt, you are almost certainly overpaying for your commute. The infrastructure exists — your neighbours are already driving the same route every single day. You just need a way to connect.

GC Ridepool is that way. It took me one OTP and three taps to book my first ride. The community is professional, the car owners are punctual (our group chat keeps everyone honest), and there are zero platform fees.

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

// ── Seed — run once to publish all 4 articles ────────────────────────────────
// Args: { "mobile": "<admin-mobile-number>" }
export const seedFourArticles = mutation({
  args: { mobile: v.string() },
  handler: async (ctx, { mobile }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_mobile", (q) => q.eq("mobile", mobile))
      .collect();
    const author = users[0];
    if (!author) throw new Error("User not found for mobile: " + mobile);

    const articles = [
      {
        slug: "5-tips-for-a-perfect-carpool-experience",
        title: "5 Tips for a Perfect Carpool Experience",
        excerpt:
          "Carpooling works best when everyone plays their part. Whether you're a car owner or a rider, these five habits will make every commute smoother for the whole group.",
        coverEmoji: "💡",
        tags: ["tips", "carpool", "commute", "etiquette"],
        content: `## Why Etiquette Matters in a Carpool

A carpool is more than a shared cab — it is a small community that meets every working day. When it works well, everyone arrives on time, stress is low, and costs are down. When it doesn't, one person's bad habit ruins the morning for four others.

Here are five habits that the best carpoolers in our GC Ridepool community follow consistently.

## Tip 1: Be Ready Before the Car Owner Arrives

The golden rule. If the listing says 8:30 AM, be at your pickup point by 8:25. The car owner is not a cab — they cannot circle the block waiting. Every minute you cost the car owner is a minute taken from four other people's mornings.

Use the in-app group chat to let the group know if you are running late. A 60-second message saves everyone ten minutes of uncertainty.

## Tip 2: Communicate Through the App, Not Personal Numbers

GC Ridepool has group chat and voice calls built in for a reason. Keep all ride coordination inside the app. This protects your privacy and keeps the conversation in one place where everyone can see it.

Never ask co-riders for their personal number. If someone is not responding, use the app's call feature.

## Tip 3: Keep the Car Clean

Treat the car owner's car like you'd want a guest to treat your home. No food with strong smells, no leaving wrappers behind, no muddy shoes on the seats. If you are unwell, book a different ride for the day.

A quick "thank you" to the car owner goes a long way too.

## Tip 4: Cancel Early If You Cannot Make It

Life happens — late nights, sick days, work-from-home. If you know the evening before that you won't need the ride, cancel your booking so the car owner can adjust. Last-minute cancellations leave empty seats and frustrated car owners.

The app makes cancellation a single tap. Use it.

## Tip 5: Pay Promptly and Accurately

Agree on the split before the ride or follow whatever the group has settled on. Pay in cash at the end of the ride without the car owner having to ask. If you owe money from a previous day, clear it the next morning.

Awkward payment conversations are the fastest way to sour a good carpool group.

## The Best Carpools Feel Like a Team

The groups that last months and years in our community are the ones where everyone feels respected. Small habits — punctuality, clear communication, a clean car, prompt payment — compound into a commute that everyone looks forward to.`,
      },
      {
        slug: "carpooling-vs-cabs-the-honest-comparison",
        title: "Carpooling vs. Cabs: The Honest Comparison for GC Commuters",
        excerpt:
          "Ola, Uber, or carpool? We broke down the real cost, comfort, and reliability of each option for the Gaur City to HCL route so you don't have to.",
        coverEmoji: "🛣️",
        tags: ["comparison", "savings", "cabs", "carpooling"],
        content: `## The Three Options Every GC Resident Has

If you live in Gaur City and work at HCL or anywhere in the sector 62 belt, you have roughly three ways to get there every day:

- Auto-rickshaw + shared cab
- Ola or Uber
- Carpool via GC Ridepool

Most people default to whatever they used on day one and never question it. We did the questioning for you.

## Cost Comparison (Monthly, 25 Working Days)

Here is what a typical commuter spends on each option for the GC ↔ HCL route:

- Auto + shared cab (both ways): ₹3,500 – ₹4,500
- Ola/Uber (both ways, average): ₹4,500 – ₹6,000 (higher on surge)
- GC Ridepool carpool: ₹600 – ₹900

The carpool wins on cost by a wide margin. Even on the worst month, it is a fraction of what cabs charge.

## Reliability

Cabs score well here — you can always book one, even at midnight. But for a fixed daily commute at a predictable time, reliability means something different. It means your car owner is already coming your way and has committed to picking you up.

In a well-organised carpool group, reliability is actually higher than cabs because the car owner is going to the same destination anyway. They have skin in the game.

Auto-rickshaws are the least reliable — availability is weather-dependent, and auto drivers frequently refuse short routes.

## Comfort

Ola/Uber wins on comfort for a solo traveller. You get the whole back seat.

But carpooling in a sedan with two or three familiar faces from your building is not uncomfortable — most regulars report that the social aspect actually makes the commute more pleasant. You stop staring at your phone and start having actual conversations.

## Privacy and Safety

Cabs involve sharing your real-time location and phone number with a stranger each trip. GC Ridepool's co-riders are registered community members. Your phone number is never shown to anyone. In-app chat and voice calls replace the need to exchange personal details.

## The Verdict

- Occasional or late-night travel: use Ola/Uber
- Daily fixed-route commute at a regular time: GC Ridepool, without question

The savings alone — typically ₹3,000+ per month — pay for a decent dinner out every week. The community aspect is a bonus you will not expect but will come to appreciate.`,
      },
      {
        slug: "how-carpooling-helps-the-environment-noida",
        title: "Every Shared Ride Counts: The Environmental Case for Carpooling in Noida",
        excerpt:
          "Noida's air quality is a serious problem. Here is how something as simple as sharing your daily commute can make a measurable difference — for your neighbourhood and your lungs.",
        coverEmoji: "🌱",
        tags: ["environment", "sustainability", "noida", "green commute"],
        content: `## Noida's Air Quality Problem

Noida consistently ranks among India's most polluted cities, especially between October and February. The primary contributors are vehicular emissions, construction dust, and crop burning from nearby states. Of these, vehicular emissions are the one factor that urban residents can directly control.

The GC ↔ HCL corridor alone sees thousands of daily commuter trips, the majority in private or hire vehicles carrying a single passenger.

## The Simple Maths of Carpooling

A car carrying one person to HCL emits roughly the same amount of CO₂ as a car carrying four people. The fuel burned is nearly identical. The emissions per person, however, drop by 75% when the car is full.

If 100 commuters on the GC ↔ HCL route shifted from solo cabs to 4-person carpools:

- Cars on the road: reduced from 100 to 25
- CO₂ emissions: reduced by approximately 75%
- Fuel consumed collectively: reduced by 75%

These are not small numbers when multiplied across a year and across the thousands of commuters in our community.

## Less Traffic, Faster Commutes

Fewer cars on the road means less congestion. Less congestion means shorter commute times for everyone — including people who cannot carpool. The benefit is not limited to those who participate.

The GC to sector 62 stretch is notorious for bottlenecks during peak hours. A meaningful shift toward carpooling among the HCL workforce alone could noticeably reduce peak-hour traffic on this stretch.

## What You Can Do

You do not need to change your lifestyle. You just need to leave at the same time you already leave, with a few neighbours who are already going the same direction.

GC Ridepool makes the coordination invisible. Post a ride or join one in under a minute. The app handles the group chat, the seat management, and the communication. You just show up.

## The Bigger Picture

Individual actions feel small against a city-scale problem. But carpooling is one of the rare cases where the individual benefit (saving ₹3,000+ per month) and the collective benefit (cleaner air, less traffic) point in exactly the same direction.

You save money and the city breathes a little easier. That is a trade worth making every morning.`,
      },
      {
        slug: "how-to-be-a-great-car-owner-gc-ridepool",
        title: "How to Be a Great Car Owner on GC Ridepool",
        excerpt:
          "Car owners are the backbone of the GC Ridepool community. Here is everything you need to know to build a loyal group of riders and make your commute pay for itself.",
        coverEmoji: "🤝",
        tags: ["car owners", "guide", "tips", "community"],
        content: `## Why Driving Is Worth It

When you post a ride on GC Ridepool, you are already making this commute. The car is going to HCL regardless. Every rider who joins shares the fuel cost, the toll, and the wear on your vehicle — without you having to go a single metre out of your way.

With a full car of four riders, many car owners find that their daily commute costs them nothing at all.

## Setting Up a Great Listing

A clear, accurate listing attracts the right riders and avoids confusion.

- Set your departure time to when you actually plan to leave your building gate — not your ideal time, your real time
- Add a pickup point that is specific: "Gaur City 2 Gate 3, near the pharmacy" is better than "GC2"
- Use the note field to mention anything useful: "AC car", "prefer silent commute", "stopping at Sector 62 metro if needed"

Riders appreciate honesty. An accurate listing leads to a smooth pickup and a happy group.

## Building a Regular Group

The best carpools are not random daily bookings — they are consistent groups that commute together week after week. Once you have a reliable set of riders, everyone's mornings become predictable and stress-free.

To build this:

- Be consistent with your departure time every day
- Use the group chat to communicate changes early
- Be friendly but professional — you do not need to be best friends, just reliable colleagues

Regular riders will rebook with you automatically. A steady group also means a steady contribution to your fuel costs every month.

## Handling Cancellations Gracefully

Riders sometimes cancel last minute. It happens. Here is how to handle it without frustration:

- Keep your listing open so other riders can join until you actually depart
- If a rider is a no-show, cancel their booking so your seat count reflects reality
- Use the group chat to check if the group is ready before you leave — a 2-minute heads-up prevents everyone from rushing

If a particular rider repeatedly cancels last minute, you are within your rights to not accept their future bookings.

## Getting Paid Without Awkwardness

Agree on the amount before the first ride. Once a group is established, payment becomes automatic — riders know what they owe and pay when they board.

Keep a simple weekly or monthly tally if the group prefers it that way. Some groups pay daily, others settle weekly on Fridays. Whatever works for your group is fine — the important thing is that everyone is clear from day one.

## The Reward Beyond Money

The most experienced car owners on GC Ridepool say the same thing: after a few weeks, the carpool becomes the best part of the commute. You arrive at work having already spoken to colleagues, shared the news, and had a laugh. Compare that to 40 minutes alone in traffic.

Post your first ride. The community is waiting.`,
      },
    ];

    let published = 0;
    const now = Date.now();

    for (const article of articles) {
      const existing = await ctx.db
        .query("blogs")
        .withIndex("by_slug", (q) => q.eq("slug", article.slug))
        .collect();
      if (existing.length > 0) continue;

      await ctx.db.insert("blogs", {
        ...article,
        authorId: author._id,
        status: "published",
        publishedAt: now - published * 24 * 60 * 60 * 1000, // stagger dates by 1 day each
        createdAt: now - published * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      published++;
    }

    return `Published ${published} new article(s). Skipped ${articles.length - published} already existing.`;
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
