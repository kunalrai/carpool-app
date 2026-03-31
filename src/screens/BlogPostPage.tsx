import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = useQuery(api.blogs.getBlogBySlug, { slug: slug ?? "" });

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — CarPool Blog`;
    const meta = document.querySelector('meta[name="description"]');
    const excerpt = post.content.slice(0, 155).replace(/\n/g, " ").trimEnd();
    if (meta) meta.setAttribute("content", excerpt + (post.content.length > 155 ? "…" : ""));
    return () => {
      document.title = "CarPool — Save Money on Your Daily Commute";
    };
  }, [post]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.surface }} className="min-h-screen">

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center gap-3 border-b"
        style={{ background: "rgba(250,248,255,0.85)", backdropFilter: "blur(20px)", borderColor: C.outlineVariant + "33" }}
      >
        <button onClick={() => navigate("/blog")} className="text-sm font-medium hover:underline" style={{ color: C.primary }}>
          ← Blog
        </button>
        <span className="text-sm" style={{ color: C.outlineVariant }}>|</span>
        <button
          onClick={() => navigate("/")}
          className="font-bold text-sm"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.primary }}
        >
          GC Ridepool
        </button>
      </nav>

      {/* Loading */}
      {post === undefined && (
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-14 animate-pulse space-y-4">
          <div className="h-8 rounded-xl w-3/4" style={{ background: C.surfaceContainerLow }} />
          <div className="h-4 rounded-xl w-1/3" style={{ background: C.surfaceContainerLow }} />
          <div className="h-64 rounded-2xl" style={{ background: C.surfaceContainerLow }} />
        </div>
      )}

      {/* Not found */}
      {post === null && (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-bold mb-2" style={{ color: C.onSurface }}>Article not found</p>
          <p className="text-sm mb-6" style={{ color: C.outline }}>It may have been unpublished or the link is incorrect.</p>
          <button onClick={() => navigate("/blog")} className="px-6 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: C.primary }}>
            Back to Blog
          </button>
        </div>
      )}

      {/* Post */}
      {post && (
        <>
          {/* Cover banner */}
          <div
            className="flex items-center justify-center text-7xl md:text-8xl"
            style={{
              height: 220,
              background: "linear-gradient(135deg, #dae2ff 0%, #c7dfff 100%)",
            }}
          >
            {post.coverEmoji ?? "📝"}
          </div>

          <article className="max-w-3xl mx-auto px-6 md:px-10 py-12">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: C.secondaryContainer, color: C.onSecondaryContainer }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
            >
              {post.title}
            </h1>

            <div className="flex items-center gap-3 mb-8 pb-8 border-b" style={{ borderColor: C.outlineVariant + "33" }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: C.primary }}
              >
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.onSurface }}>{post.authorName}</p>
                <p className="text-xs" style={{ color: C.outline }}>{formatDate(post.publishedAt ?? post.createdAt)}</p>
              </div>
            </div>

            {/* Excerpt */}
            <p className="text-lg leading-relaxed mb-8 font-medium" style={{ color: C.onSurfaceVariant }}>
              {post.excerpt}
            </p>

            {/* Body — split on double newlines into paragraphs */}
            <div className="space-y-5">
              {post.content.split("\n\n").map((para, i) => {
                const trimmed = para.trim();
                if (!trimmed) return null;
                // Headings: lines starting with ##
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-xl font-bold pt-4"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}
                    >
                      {trimmed.replace(/^## /, "")}
                    </h2>
                  );
                }
                // Bullet lists: lines starting with -
                if (trimmed.startsWith("- ")) {
                  const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
                  return (
                    <ul key={i} className="list-disc list-inside space-y-1.5 pl-2">
                      {items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                          {item.replace(/^- /, "")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-sm md:text-base leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* CTA */}
            <div
              className="mt-14 p-8 rounded-2xl text-center"
              style={{ background: "linear-gradient(135deg, #003d9b, #0052cc)" }}
            >
              <p className="text-white font-bold text-lg mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Ready to share your commute?
              </p>
              <p className="text-white/70 text-sm mb-5">Join the GC Ridepool community today.</p>
              <button
                onClick={() => navigate("/login")}
                className="bg-white px-8 py-3 rounded-full font-bold text-sm"
                style={{ color: C.primary }}
              >
                Get Started Free
              </button>
            </div>

            {/* Back */}
            <div className="mt-10 pt-8 border-t" style={{ borderColor: C.outlineVariant + "33" }}>
              <button onClick={() => navigate("/blog")} className="text-sm font-medium hover:underline" style={{ color: C.primary }}>
                ← Back to all articles
              </button>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
