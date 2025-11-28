import { useMemo, useState } from "react";

type ArgKey =
  | "arg1"
  | "arg2"
  | "arg3"
  | "arg4"
  | "arg5"
  | "arg6"
  | "arg7"
  | "arg8"
  | "arg9"
  | "arg10";
type ArgsState = Record<ArgKey, string>;

type BatteryRecord = {
  id: string;
  label: string;
  summary: string;
  attributes: Array<{ label: string; value: string }>;
  args: ArgsState;
};

const BATTERY_DB: BatteryRecord[] = [
  {
    id: "BP-9021",
    label: "Pack 9021 · Fleet A",
    summary: "Recovered from workshop diagnostics 14 minutes ago.",
    attributes: [
      { label: "Health index", value: "92%" },
      { label: "State of charge", value: "54%" },
      { label: "Cycles", value: "241" },
      { label: "Traceability", value: "Complete" },
    ],
    args: {
      arg1: "0.92",
      arg2: "0.54",
      arg3: "241",
      arg4: "0.03",
      arg5: "0.78",
      arg6: "0.12",
      arg7: "0.88",
      arg8: "0.65",
      arg9: "0.43",
      arg10: "0.22",
    },
  },
  {
    id: "BP-6138",
    label: "Pack 6138 · Return loop",
    summary: "Awaiting thermal stabilization in zone 3.",
    attributes: [
      { label: "Health index", value: "67%" },
      { label: "State of charge", value: "28%" },
      { label: "Cycles", value: "312" },
      { label: "Traceability", value: "Partial" },
    ],
    args: {
      arg1: "0.67",
      arg2: "0.28",
      arg3: "312",
      arg4: "0.18",
      arg5: "0.42",
      arg6: "0.21",
      arg7: "0.61",
      arg8: "0.37",
      arg9: "0.29",
      arg10: "0.11",
    },
  },
];

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000";

const STATUS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/evaluate`;

const QR_CODES = BATTERY_DB.map((pack) => pack.id);

const resolveResultTheme = (value: string | null) => {
  if (!value) {
    return {
      gradient: "from-slate-950 via-slate-950 to-slate-900",
      border: "border-slate-800",
      text: "text-slate-100",
      badge: "bg-slate-800/80 text-slate-300",
    };
  }

  const lowered = value.toLowerCase();
  if (/(replace|scrap|reject|fault)/.test(lowered)) {
    return {
      gradient: "from-rose-950 via-rose-900 to-slate-950",
      border: "border-rose-500/40",
      text: "text-rose-100",
      badge: "bg-rose-500/20 text-rose-100",
    };
  }
  if (/(monitor|watch|diagnostic|service)/.test(lowered)) {
    return {
      gradient: "from-amber-950 via-amber-900 to-slate-950",
      border: "border-amber-400/40",
      text: "text-amber-100",
      badge: "bg-amber-400/20 text-amber-100",
    };
  }
  return {
    gradient: "from-emerald-950 via-emerald-900 to-slate-950",
    border: "border-emerald-500/40",
    text: "text-emerald-100",
    badge: "bg-emerald-500/20 text-emerald-100",
  };
};

export default function BatteryStatusPage() {
  const [batteryId, setBatteryId] = useState<string>(QR_CODES[0]);
  const [selectedRecord, setSelectedRecord] = useState<BatteryRecord | null>(
    BATTERY_DB[0] ?? null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultTheme = useMemo(() => resolveResultTheme(result), [result]);

  const availableRecords = BATTERY_DB;

  const handleScan = (id?: string) => {
    const nextId = (id ?? batteryId).toUpperCase();
    setBatteryId(nextId);
    setError(null);
    setResult(null);
    setIsFetching(true);

    const match = availableRecords.find((item) => item.id === nextId) ?? null;
    setTimeout(() => {
      setSelectedRecord(match);
      if (!match) {
        setError("No matching battery passport was found in the vault.");
        setIsFetching(false);
        return;
      }
      setIsFetching(false);
      void evaluateRecord(match);
    }, 400);
  };

  const evaluateRecord = async (record: BatteryRecord) => {
    const payload: ArgsState = { ...record.args };

    try {
      const response = await fetch(STATUS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? "Request failed");
      }

      const parsedResult = (data as { result?: unknown }).result;
      setResult(
        typeof parsedResult === "undefined" ? "" : String(parsedResult)
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error";
      setError(message);
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
            Pick a code below or type the ID printed on your battery label.
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
                  onClick={() => handleScan()}
                  disabled={isFetching}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40 sm:flex-none sm:min-w-[150px]"
                >
                  {isFetching ? "Looking up…" : "Lookup"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Battery details
            </p>
            {selectedRecord ? (
              <div className="mt-4 space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedRecord.label}
                  </h2>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {selectedRecord.attributes.map((attribute) => (
                    <li
                      key={attribute.label}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <p className="text-sm text-slate-400">
                        {attribute.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {attribute.value}
                      </p>
                    </li>
                  ))}
                </ul>
                {error && (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Scan a QR code to load attributes.
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
                  {result || "Awaiting analysis"}
                </p>
              </div>
              <p className="text-sm text-slate-400 text-center">
                {result
                  ? "Worst-case scenario already factored into this guidance."
                  : "Use Lookup to fetch the latest reading for your battery."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
