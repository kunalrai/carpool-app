import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const C = {
  primary: "#003d9b",
  surface: "#faf8ff",
  surfaceContainerLow: "#f3f3fd",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191b23",
  onSurfaceVariant: "#434654",
  outline: "#737685",
  outlineVariant: "#c3c6d6",
  secondaryContainer: "#c7dfff",
  onSecondaryContainer: "#4b637e",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogsPage() {
  const navigate = useNavigate();
  const blogs = useQuery(api.blogs.getPublishedBlogs);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.surface }} className="min-h-screen">

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between border-b"
        style={{ background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C.outlineVariant + "33" }}
      >
        <button
          onClick={() => navigate("/")}
          className="font-extrabold text-xl tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.primary }}
        >
          GC Ridepool
        </button>
        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white"
          style={{ background: C.primary }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-16 py-16 md:py-24" style={{ background: C.surfaceContainerLow }}>
        <div className="max-w-7xl mx-auto">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: C.secondaryContainer, color: C.onSecondaryContainer }}
          >
            ✍️ Community Blog
          </span>
          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
          >
            Commute smarter.<br />
            <span style={{ color: C.primary }}>Read, learn, share.</span>
          </h1>
          <p className="text-lg max-w-xl" style={{ color: C.onSurfaceVariant }}>
            Tips, stories, and guides for Gaur City ↔ HCL commuters.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="px-6 md:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          {blogs === undefined && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border animate-pulse" style={{ background: C.surfaceContainerLowest, borderColor: C.outlineVariant + "33", height: 240 }} />
              ))}
            </div>
          )}

          {blogs?.length === 0 && (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">✍️</p>
              <p className="text-lg font-semibold mb-1" style={{ color: C.onSurface }}>No articles yet</p>
              <p className="text-sm" style={{ color: C.outline }}>Check back soon — articles are on the way.</p>
            </div>
          )}

          {blogs && blogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((post, i) => (
                <button
                  key={post._id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="text-left rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow group"
                  style={{ background: C.surfaceContainerLowest, borderColor: C.outlineVariant + "22" }}
                >
                  {/* Cover emoji banner */}
                  <div
                    className="flex items-center justify-center text-5xl"
                    style={{
                      height: 140,
                      background: [
                        `linear-gradient(135deg, #dae2ff, #c7dfff)`,
                        `linear-gradient(135deg, #c7dfff, #d1e4ff)`,
                        `linear-gradient(135deg, #ffdbcf, #ffe8e0)`,
                      ][i % 3],
                    }}
                  >
                    {post.coverEmoji ?? "📝"}
                  </div>

                  <div className="p-5">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: C.secondaryContainer, color: C.onSecondaryContainer }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2
                      className="text-base font-bold mb-2 leading-snug group-hover:text-blue-800 transition-colors line-clamp-2"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
                    >
                      {post.title}
                    </h2>
                    <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: C.onSurfaceVariant }}>
                      {post.excerpt}
                    </p>
                    <p className="text-[11px]" style={{ color: C.outline }}>
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-10 border-t" style={{ borderColor: C.outlineVariant + "33" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-sm font-bold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>GC Ridepool</span>
          <div className="flex gap-6 text-xs" style={{ color: C.outline }}>
            <button onClick={() => navigate("/privacy")} className="hover:underline">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:underline">Terms</button>
            <button onClick={() => navigate("/data-safety")} className="hover:underline">Data Safety</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
