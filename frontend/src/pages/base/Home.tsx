import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const recommendationLikelihoods = [
  { label: "Recycle", value: 0.64, accent: "bg-rose-400/20 text-rose-200" },
  { label: "Reuse", value: 0.52, accent: "bg-sky-400/20 text-sky-200" },
  {
    label: "Remanufacture",
    value: 0.21,
    accent: "bg-emerald-400/20 text-emerald-200",
  },
  {
    label: "Repurpose",
    value: 0.33,
    accent: "bg-indigo-400/20 text-indigo-200",
  },
] as const;

const DecisionMatrixView = () => (
  <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.15),_transparent_55%)]" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-slate-500">
        <span>Decision matrix</span>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.4em] text-slate-300">
          Demo
        </span>
      </div>
      <p className="text-xs text-slate-400">
        This panel is illustrative only—the live decision matrix unlocks once
        you sign in.
      </p>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {recommendationLikelihoods.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}
            >
              {(item.value * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-800">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              style={{ width: `${item.value * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function HomePage() {
  const { user } = useAuth();
  const protectedPath = !user
    ? "/login"
    : user.role === "garage"
    ? "/battery-info"
    : "/battery-recommendations";

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-white shadow-inner shadow-black/40">
      <div className="grid gap-10">
        <div className="space-y-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Minimal control tower for circular battery fleets
              </h1>
              <p className="mt-4 text-sm text-slate-300">
                Coordinate battery health and recycling recommendations between
                mechanics and recyclers, and close the loop on sustainable
                battery management.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                to={protectedPath}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {user ? "Open protected workspace" : "Sign in"}
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
                Get your battery status
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
          </div>
          <DecisionMatrixView />
        </div>
      </div>
    </section>
  );
}
