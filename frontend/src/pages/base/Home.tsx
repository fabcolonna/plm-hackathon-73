import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const publicHighlights = [
  {
    title: "Battery passport scan",
    tag: "For anyone",
    body: "Use your QR or ID to view the same passport snapshot that recyclers and owners rely on.",
    cta: { label: "Open status", href: "/battery-status" },
  },
] as const;

const workspaceHighlights = [
  {
    title: "Garagist workspace",
    tag: "Passport feed",
    body: "Inspect the raw Neo4j passport, amend repair notes, and sync updates straight into the fleet ledger.",
  },
  {
    title: "Recycler intelligence",
    tag: "Decision surface",
    body: "Compare recycle, reuse, remanufacture, or repurpose routes with the Python model running in the background.",
  },
] as const;

export default function HomePage() {
  const { user } = useAuth();
  const workspacePath = !user
    ? "/login"
    : user.role === "garage"
    ? "/battery-info"
    : "/battery-recommendations";

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-8 text-white shadow-inner shadow-black/40 space-y-8">
      <header className="space-y-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-emerald-300">
            Battery Passport
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-snug text-white">
            Minimal control tower for circular battery fleets
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Scan a passport, see what owners and recyclers see, and align every
            decision around the same dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={workspacePath}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {user ? "Enter workspace" : "Sign in"}
            <svg
              className="h-4 w-4 text-sky-200"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 8h8M8 4l4 4-4 4" />
            </svg>
          </Link>
          <Link
            to="/battery-status"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Check a passport
            <svg
              className="h-4 w-4 text-slate-300"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <rect x="2" y="2" width="4" height="4" rx="0.6" />
              <rect x="10" y="2" width="4" height="4" rx="0.6" />
              <rect x="2" y="10" width="4" height="4" rx="0.6" />
              <path d="M7 3h2M7 5h2M11 7v2M13 7v4M11 11h2M7 11v2" />
            </svg>
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-900 bg-slate-950/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              What anyone can do
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Passport tools open to every visitor
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            No login required—just the battery ID that ships with each pack.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-1">
          {publicHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-xl"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
                {item.tag}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-slate-300">{item.body}</p>
              <Link
                to={item.cta.href}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                {item.cta.label}
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 8h8M8 4l4 4-4 4" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-900 bg-slate-950/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Battery passport workspace
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Deeper views for garages and recyclers
            </h2>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {workspaceHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-5"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
                {item.tag}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
