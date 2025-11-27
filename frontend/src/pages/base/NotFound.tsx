import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-center text-white shadow-inner shadow-black/40 space-y-4">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
        Battery passport
      </p>
      <h1 className="text-6xl font-semibold">404</h1>
      <p className="text-base text-slate-300">
        This route does not exist. Head back to the Battery Passport portal.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Return home
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
    </section>
  );
}
