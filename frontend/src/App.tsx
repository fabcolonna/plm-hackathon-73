import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import type { UserRole } from "./context/auth-context";

type NavLinkItem = {
  to: string;
  label: string;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
};

const NAV_LINKS: NavLinkItem[] = [
  { to: "/", label: "Home" },
  {
    to: "/battery-info",
    label: "Battery Info",
    requiresAuth: true,
    allowedRoles: ["garage"],
  },
  {
    to: "/battery-recommendations",
    label: "Battery Recommendations",
    requiresAuth: true,
    allowedRoles: ["recycler"],
  },
  { to: "/battery-status", label: "Battery Status" },
];

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <NavLink
              to="/"
              className="text-lg font-semibold uppercase tracking-[0.2em] text-sky-400"
            >
              Battery Passport
            </NavLink>
          </div>

          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-slate-300">
            {NAV_LINKS.filter((link) => {
              if (link.requiresAuth && !user) {
                return false;
              }
              if (link.allowedRoles) {
                return user ? link.allowedRoles.includes(user.role) : false;
              }
              return true;
            }).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full border px-4 py-1.5 transition ${
                    isActive
                      ? "border-sky-500 text-white"
                      : "border-transparent hover:border-slate-600"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User info and logout/sign-in button */}
          <div className="flex items-center gap-3 text-sm text-slate-300">
            {user ? (
              <>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                  {user.role === "garage" ? "Mechanic" : "Recycler"}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-700 px-4 py-1 font-semibold text-white transition hover:border-slate-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-full border border-sky-500 px-4 py-1 font-semibold text-white hover:bg-sky-500/10"
              >
                Sign in
              </NavLink>
            )}
          </div>
        </header>

        <main className="mt-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
