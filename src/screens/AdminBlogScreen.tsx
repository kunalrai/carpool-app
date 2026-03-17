import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";

type BlogDoc = {
  _id: Id<"blogs">;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverEmoji?: string;
  tags?: string[];
  status: "draft" | "published";
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
};

const EMOJI_OPTIONS = ["📝", "🚗", "🌱", "🛣️", "💬", "🔒", "⏰", "🤝", "📱", "🌆", "💡", "🗺️"];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Blog editor (create / edit) ─────────────────────────────────────────────

function BlogEditor({
  adminId,
  existing,
  onDone,
}: {
  adminId: Id<"users">;
  existing?: BlogDoc;
  onDone: () => void;
}) {
  const createBlog = useMutation(api.blogs.createBlog);
  const updateBlog = useMutation(api.blogs.updateBlog);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [coverEmoji, setCoverEmoji] = useState(existing?.coverEmoji ?? "📝");
  const [tagsRaw, setTagsRaw] = useState((existing?.tags ?? []).join(", "));
  const [publish, setPublish] = useState(existing?.status === "published");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!excerpt.trim()) { setError("Excerpt is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }
    setError(null);
    setSaving(true);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      if (existing) {
        await updateBlog({ adminId, blogId: existing._id, title, excerpt, content, coverEmoji, tags, publish });
      } else {
        await createBlog({ adminId, title, excerpt, content, coverEmoji, tags, publish });
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{existing ? "Edit Article" : "New Article"}</h2>
          <button onClick={onDone} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Cover emoji picker */}
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Cover Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setCoverEmoji(e)}
                className={`w-10 h-10 text-xl rounded-xl border-2 transition-colors ${coverEmoji === e ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Title *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5 Tips for a Better Carpool Experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Excerpt * <span className="font-normal normal-case text-gray-400">(shown in card preview)</span></label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="A short 1–2 sentence summary of the article…"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Content * <span className="font-normal normal-case text-gray-400">— use ## for headings, - for bullet points, blank line between paragraphs</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              placeholder={"## Introduction\n\nYour article content goes here...\n\n## Tips\n\n- First tip\n- Second tip"}
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Tags <span className="font-normal normal-case text-gray-400">(comma separated)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. commute, tips, carpooling"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setPublish(!publish)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${publish ? "bg-green-500" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${publish ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{publish ? "Publish" : "Save as Draft"}</span>
          </label>

          <div className="flex gap-3">
            <button onClick={onDone} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#003d9b" }}
            >
              {saving ? "Saving…" : existing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function AdminBlogScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const blogs = useQuery(api.blogs.getAllBlogs, { adminId: userId as Id<"users"> });
  const deleteBlog = useMutation(api.blogs.deleteBlog);

  const [editing, setEditing] = useState<BlogDoc | null | "new">(null);
  const [deleting, setDeleting] = useState<Id<"blogs"> | null>(null);

  const handleDelete = async (blogId: Id<"blogs">) => {
    setDeleting(blogId);
    try {
      await deleteBlog({ adminId: userId as Id<"users">, blogId });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900 flex-1">Blog Management</h1>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "#003d9b" }}
        >
          <span className="text-base leading-none">+</span> New Article
        </button>
      </div>

      <div className="px-5 py-5 max-w-2xl mx-auto">
        {/* Preview link */}
        <button
          onClick={() => navigate("/blog")}
          className="w-full mb-5 py-3 rounded-xl border border-dashed text-sm font-medium text-blue-700 border-blue-300 bg-blue-50"
        >
          👁 View public blog page →
        </button>

        {/* List */}
        {blogs === undefined && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24 border border-gray-100" />
            ))}
          </div>
        )}

        {blogs?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-sm">No articles yet. Create your first one!</p>
          </div>
        )}

        <div className="space-y-3">
          {(blogs ?? []).map((blog) => (
            <div key={blog._id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
              <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 shrink-0">
                {blog.coverEmoji ?? "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate">{blog.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${blog.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {blog.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{blog.excerpt}</p>
                <p className="text-[10px] text-gray-300 mt-1">{formatDate(blog.updatedAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditing(blog as BlogDoc)}
                  className="text-xs font-semibold text-blue-600 px-3 py-1.5 rounded-lg bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog._id)}
                  disabled={deleting === blog._id}
                  className="text-xs font-semibold text-red-500 px-3 py-1.5 rounded-lg bg-red-50 disabled:opacity-50"
                >
                  {deleting === blog._id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor modal */}
      {editing !== null && (
        <BlogEditor
          adminId={userId as Id<"users">}
          existing={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}
