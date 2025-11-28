import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../context/auth-context";

const ROLE_CARDS: Array<{
  role: UserRole;
  title: string;
  subtitle: string;
  responsibilities: string[];
}> = [
  {
    role: "garage",
    title: "Mechanic",
    subtitle: "Service, test and release fleet batteries",
    responsibilities: [
      "Push health status checks",
      "Trigger safety recommendations",
      "Share service notes with recyclers",
    ],
  },
  {
    role: "recycler",
    title: "Recycler",
    subtitle: "Close the loop by dismantling and refurbishing",
    responsibilities: [
      "Receive qualified packs",
      "Request traceability reports",
      "Update downstream availability",
    ],
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const roleDefaultPath: Record<UserRole, string> = {
    garage: "/battery-info",
    recycler: "/battery-recommendations",
  };

  const guardedPathAccess: Record<string, UserRole[]> = {
    "/battery-info": ["garage"],
    "/battery-recommendations": ["recycler"],
  };

  const requestedPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? null;

  const getDestinationForRole = (role: UserRole) => {
    if (!requestedPath) {
      return roleDefaultPath[role];
    }

    const allowedRoles = guardedPathAccess[requestedPath];
    if (allowedRoles && !allowedRoles.includes(role)) {
      return roleDefaultPath[role];
    }

    return requestedPath;
  };

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate(getDestinationForRole(role), { replace: true });
  };

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-white shadow-inner shadow-black/40">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
          Secure portal
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-white">
          Sign in as
        </h1>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {ROLE_CARDS.map((card) => (
          <article
            key={card.role}
            className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <svg
                  className="h-8 w-8 text-sky-200"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  {card.role === "garage" ? (
                    <>
                      <rect x="6" y="8" width="20" height="12" rx="3" />
                      <path d="M10 12h12M10 16h8" />
                    </>
                  ) : (
                    <>
                      <path d="M8 10h16l-2 12H10z" />
                      <path d="M12 14l4 4 4-4" />
                    </>
                  )}
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                  {card.role === "garage" ? "Workshop" : "Recovery"}
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{card.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {card.responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleLogin(card.role)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              Sign in as {card.title}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
