import { useMemo, useState } from "react";
import { fetchBatteryStatus, type BatteryStatusResponse } from "../lib/api";

type OutcomeLabel = "Recycle" | "Reuse" | "Remanufacture" | "Repurpose";

const OUTCOME_THEMES: Record<
  OutcomeLabel,
  {
    gradient: string;
    border: string;
    text: string;
    badge: string;
    blurb: string;
  }
> = {
  Recycle: {
    gradient: "from-rose-950 via-rose-900 to-slate-950",
    border: "border-rose-500/40",
    text: "text-rose-100",
    badge: "bg-rose-500/20 text-rose-100",
    blurb: "Materials recovery route unlocked by recycler ops.",
  },
  Reuse: {
    gradient: "from-sky-950 via-sky-900 to-slate-950",
    border: "border-sky-400/40",
    text: "text-sky-100",
    badge: "bg-sky-500/20 text-sky-100",
    blurb: "Ready for secondary-life deployments with minimal prep.",
  },
  Remanufacture: {
    gradient: "from-emerald-950 via-emerald-900 to-slate-950",
    border: "border-emerald-500/40",
    text: "text-emerald-100",
    badge: "bg-emerald-500/20 text-emerald-100",
    blurb: "Send to reman floor for module refresh and QA.",
  },
  Repurpose: {
    gradient: "from-indigo-950 via-indigo-900 to-slate-950",
    border: "border-indigo-500/40",
    text: "text-indigo-100",
    badge: "bg-indigo-500/20 text-indigo-100",
    blurb: "Great fit for stationary storage and low-C rate duty.",
  },
};

const DEFAULT_THEME = {
  gradient: "from-slate-950 via-slate-950 to-slate-900",
  border: "border-slate-800",
  text: "text-slate-100",
  badge: "bg-slate-800/80 text-slate-300",
  blurb: "Awaiting recycler decision payload.",
};

const normalizeOutcome = (value: string | null): OutcomeLabel | null => {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  if (!lowered) return null;
  if (lowered.includes("recycle")) return "Recycle";
  if (lowered.includes("reuse")) return "Reuse";
  if (lowered.includes("reman")) return "Remanufacture";
  if (lowered.includes("repurpose")) return "Repurpose";
  return null;
};

export default function BatteryStatusPage() {
  const [batteryId, setBatteryId] = useState<string>("");
  const [statusData, setStatusData] = useState<BatteryStatusResponse | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawOutcome = statusData?.status ?? null;
  const normalizedOutcome = useMemo(
    () => normalizeOutcome(rawOutcome),
    [rawOutcome]
  );
  const resultTheme = useMemo(
    () =>
      normalizedOutcome ? OUTCOME_THEMES[normalizedOutcome] : DEFAULT_THEME,
    [normalizedOutcome]
  );
  const heroLabel = normalizedOutcome ?? rawOutcome ?? "Awaiting analysis";

  const handleLookup = async (id?: string) => {
    const queryId = (id ?? batteryId).trim();
    setBatteryId(queryId);

    if (!queryId) {
      setError("Battery ID is required");
      setStatusData(null);
      return;
    }

    setIsFetching(true);
    setError(null);
    setStatusData(null);

    try {
      const response = await fetchBatteryStatus(queryId);
      setStatusData(response);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to fetch battery status";
      setError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const detailMetrics = statusData
    ? [
        { label: "Battery ID", value: statusData.battery_id },
        { label: "Status", value: statusData.status },
        {
          label: "State of Health",
          value:
            typeof statusData.soh_percent === "number"
              ? `${Math.round(statusData.soh_percent)}%`
              : "—",
        },
        {
          label: "Voltage",
          value:
            typeof statusData.voltage === "number"
              ? `${statusData.voltage.toFixed(2)} V`
              : "—",
        },
        {
          label: "Capacity",
          value:
            typeof statusData.capacity === "number"
              ? `${statusData.capacity.toFixed(1)} kWh`
              : "—",
        },
        {
          label: "Temperature",
          value:
            typeof statusData.temperature === "number"
              ? `${statusData.temperature.toFixed(1)} °C`
              : "—",
        },
      ]
    : [];

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-8 text-white shadow-inner shadow-black/40 space-y-8">
      <header className="space-y-3 text-left">
        <h1 className="text-4xl font-semibold leading-tight text-white">
          Battery Status
        </h1>
        <p className="text-base text-slate-300 max-w-3xl">
          Scan a QR code and instantly see what the battery looks like right
          now.
        </p>
      </header>
      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Scan your battery
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Look up the live passport status by entering a battery ID from the
            owner app.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <label className="flex-1 text-sm font-semibold text-slate-200">
                Battery Passport ID
                <input
                  value={batteryId}
                  onChange={(event) =>
                    setBatteryId(event.target.value.toUpperCase())
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="BP-XXXX"
                />
              </label>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={isFetching}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40 sm:flex-none sm:min-w-[150px]"
                >
                  {isFetching ? "Looking up…" : "Lookup"}
                </button>
              </div>
            </div>
            {error && (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Battery details
            </p>
            {statusData ? (
              <div className="mt-4 space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {statusData.battery_id}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Owner-visible telemetry refreshed when the lookup runs.
                  </p>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {detailMetrics.map((metric) => (
                    <li
                      key={metric.label}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {metric.value}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Run a lookup to load owner-facing metrics like voltage, State of
                Health, and capacity.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Battery result
            </p>
            <div className="mt-4 space-y-4">
              <div
                className={`rounded-3xl border ${resultTheme.border} bg-gradient-to-br ${resultTheme.gradient} p-8 text-center shadow-inner shadow-black/30`}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] ${resultTheme.badge}`}
                >
                  Outcome
                </span>
                <p
                  className={`mt-4 text-3xl font-semibold ${resultTheme.text}`}
                >
                  {heroLabel}
                </p>
                {statusData?.status && normalizedOutcome === null && (
                  <p className="mt-1 text-sm text-slate-300">
                    Reported status: {statusData.status}
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-200">
                  {statusData ? resultTheme.blurb : DEFAULT_THEME.blurb}
                </p>
              </div>
              <p className="text-sm text-slate-400 text-center">
                {statusData
                  ? "Values mirror the owner portal so you can confirm what they see."
                  : "Use Lookup to fetch the latest reading for your battery."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
