import { useMemo, useState } from "react";
import {
  fetchBatteryStatus,
  updateBatteryLifecycleStatus,
  type BatteryLifecycleStatus,
  type BatteryStatusResponse,
} from "../lib/api";
import {
  clearPendingStatusRequest,
  getPendingStatusRequest,
  type PendingStatusRequest,
} from "../lib/pendingStatus";
import { useQrScanner } from "../hooks/useQrScanner";
import { QrScannerOverlay } from "../components/QrScannerOverlay";

const STATUS_LABELS: Record<BatteryLifecycleStatus, string> = {
  original: "Original",
  repurposed: "Repurposed",
  reused: "Reused",
  remanufactured: "Remanufactured",
  waste: "Waste",
};

const STATUS_THEMES: Record<
  BatteryLifecycleStatus,
  {
    gradient: string;
    border: string;
    text: string;
    badge: string;
    blurb: string;
  }
> = {
  original: {
    gradient: "from-emerald-950 via-emerald-900 to-slate-950",
    border: "border-emerald-500/40",
    text: "text-emerald-100",
    badge: "bg-emerald-500/20 text-emerald-100",
    blurb: "Pack is untouched and ready for its primary duty cycle.",
  },
  repurposed: {
    gradient: "from-indigo-950 via-indigo-900 to-slate-950",
    border: "border-indigo-500/40",
    text: "text-indigo-100",
    badge: "bg-indigo-500/20 text-indigo-100",
    blurb: "Recommended for stationary storage or low-C-rate reuse.",
  },
  reused: {
    gradient: "from-sky-950 via-sky-900 to-slate-950",
    border: "border-sky-400/40",
    text: "text-sky-100",
    badge: "bg-sky-500/20 text-sky-100",
    blurb: "Healthy enough to re-enter another vehicle lifecycle.",
  },
  remanufactured: {
    gradient: "from-amber-950 via-amber-900 to-slate-950",
    border: "border-amber-500/40",
    text: "text-amber-100",
    badge: "bg-amber-500/20 text-amber-100",
    blurb: "Needs component refresh before redeployment.",
  },
  waste: {
    gradient: "from-rose-950 via-rose-900 to-slate-950",
    border: "border-rose-500/40",
    text: "text-rose-100",
    badge: "bg-rose-500/20 text-rose-100",
    blurb: "Send to certified recycling—no further value in-pack.",
  },
};

const DEFAULT_THEME = {
  gradient: "from-slate-950 via-slate-950 to-slate-900",
  border: "border-slate-800",
  text: "text-slate-100",
  badge: "bg-slate-800/80 text-slate-300",
  blurb: "Awaiting recycler decision payload.",
};

export default function BatteryStatusPage() {
  const [batteryId, setBatteryId] = useState<string>("");
  const [statusData, setStatusData] = useState<BatteryStatusResponse | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
  const [pendingRequest, setPendingRequest] =
    useState<PendingStatusRequest | null>(null);
  const { activeScanner, startScan, closeScanner, videoRef, scanError } =
    useQrScanner();

  const lifecycleStatus: BatteryLifecycleStatus | null =
    statusData?.status ?? null;
  const resultTheme = useMemo(
    () => (lifecycleStatus ? STATUS_THEMES[lifecycleStatus] : DEFAULT_THEME),
    [lifecycleStatus]
  );
  const heroLabel = lifecycleStatus
    ? STATUS_LABELS[lifecycleStatus]
    : "Awaiting analysis";

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
    setSyncMessage(null);
    setPendingRequest(null);

    try {
      const response = await fetchBatteryStatus(queryId);
      setStatusData(response);
      setPendingRequest(getPendingStatusRequest(response.battery_id));
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
        {
          label: "Status",
          value: lifecycleStatus ? STATUS_LABELS[lifecycleStatus] : "—",
        },
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

  const handleConfirmPendingStatus = async () => {
    if (!statusData?.battery_id || !pendingRequest || isConfirmingStatus) {
      return;
    }

    setIsConfirmingStatus(true);
    setSyncMessage(null);
    try {
      await updateBatteryLifecycleStatus(
        statusData.battery_id,
        pendingRequest.proposedStatus
      );
      clearPendingStatusRequest(statusData.battery_id);
      setPendingRequest(null);
      setSyncMessage("Status confirmed and synced.");
      await handleLookup(statusData.battery_id);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to update status";
      setSyncMessage(message);
    } finally {
      setIsConfirmingStatus(false);
    }
  };

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
            Look up the live passport status by entering a battery ID.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <label className="flex-1 text-sm font-semibold text-slate-200">
                Battery Passport ID
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={batteryId}
                    onChange={(event) =>
                      setBatteryId(event.target.value.toUpperCase())
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    placeholder="BP-XXXX"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      startScan({
                        label: "Battery",
                        onResult: (value) => setBatteryId(value.toUpperCase()),
                      })
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 p-2 text-slate-200 transition hover:border-sky-500 hover:text-sky-200"
                    aria-label="Scan Battery ID QR code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 5h4M5 4v4M16 4h4M19 4v4M4 19h4M5 16v4M16 19h4M19 16v4M10 9h4v6h-4zM15 12h1M8 12H7"
                      />
                    </svg>
                  </button>
                </div>
              </label>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={isFetching}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40 sm:flex-none sm:min-w-[150px]"
                >
                  {isFetching ? "Fetching…" : "Fetch Passport"}
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
                <p className="mt-3 text-sm text-slate-200">
                  {statusData ? resultTheme.blurb : DEFAULT_THEME.blurb}
                </p>
              </div>
              {pendingRequest ? (
                <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4">
                  <p className="text-sm text-amber-100">
                    Garagist flagged this battery as
                    <span className="font-semibold">
                      {" "}
                      {STATUS_LABELS[pendingRequest.proposedStatus]}
                    </span>
                    . Confirm to sync the change.
                  </p>
                  <p className="text-xs text-amber-200/80">
                    Requested{" "}
                    {new Date(pendingRequest.createdAt).toLocaleString()}.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmPendingStatus}
                    disabled={isConfirmingStatus}
                    className="w-full rounded-xl bg-amber-500/80 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isConfirmingStatus
                      ? "Confirming…"
                      : "Confirm status change"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No pending garage alerts for this battery.
                </p>
              )}
              {syncMessage && (
                <p className="text-center text-xs text-slate-400">
                  {syncMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <QrScannerOverlay
        activeScanner={activeScanner}
        videoRef={videoRef}
        scanError={scanError}
        onClose={closeScanner}
      />
    </section>
  );
}
