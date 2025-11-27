import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

const ARGUMENT_KEYS = [
  "arg1",
  "arg2",
  "arg3",
  "arg4",
  "arg5",
  "arg6",
  "arg7",
  "arg8",
  "arg9",
  "arg10",
] as const;

type ArgKey = (typeof ARGUMENT_KEYS)[number];
type ArgsState = Record<ArgKey, string>;

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000";

const STATUS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/evaluate`;

const createInitialState = (): ArgsState =>
  ARGUMENT_KEYS.reduce<ArgsState>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {} as ArgsState);

export default function BatteryStatusPage() {
  const { user } = useAuth();
  const [formValues, setFormValues] = useState<ArgsState>(createInitialState);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyFieldCount = useMemo(
    () => ARGUMENT_KEYS.filter((key) => formValues[key].trim() === "").length,
    [formValues]
  );

  const handleChange = (key: ArgKey, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFormValues(createInitialState());
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const hasEmptyField = ARGUMENT_KEYS.some(
      (key) => formValues[key].trim() === ""
    );

    if (hasEmptyField) {
      setError("Please provide values for all 10 arguments before evaluating.");
      return;
    }

    setIsLoading(true);

    const payload = ARGUMENT_KEYS.reduce<ArgsState>((acc, key) => {
      acc[key] = formValues[key];
      return acc;
    }, {} as ArgsState);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-white shadow-inner shadow-black/40 space-y-10">
      <header className="space-y-3 text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
          Protected · Battery Status
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-white">
          Status endpoint
        </h1>
        <p className="text-base text-slate-300 max-w-3xl">
          {user?.role === "garage"
            ? "Push workshop diagnostics to the cloud recommendation engine."
            : "Review incoming workshop diagnostics before reclaiming packs."}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6"
        >
          <div className="flex flex-col gap-6">
            <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-500">
              Ten-argument payload
            </p>

            <div className="grid gap-4 md:grid-cols-5">
              {ARGUMENT_KEYS.map((key, index) => (
                <label
                  key={key}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs font-semibold text-slate-400"
                >
                  <span className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.35em]">
                    <span>Arg {index + 1}</span>
                    <span className="font-mono">{key}</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={formValues[key]}
                    onChange={(event) => handleChange(key, event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-center text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    placeholder="Value"
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
                >
                  {isLoading ? "Evaluating…" : "Send status"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Reset
                </button>
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {emptyFieldCount === 0
                  ? "All arguments ready"
                  : `${emptyFieldCount} arg(s) remaining`}
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Submission status
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Each payload encrypts before hitting the recommendation engine.
              Keep the tab open until you receive a response.
            </p>
          </div>

          {result !== null && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {["Health", "Thermal", "Cycle", "Trace"].map((metric) => (
                  <article
                    key={metric}
                    className="rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                      {metric}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {metric === "Health"
                        ? "Overall pack condition"
                        : metric === "Thermal"
                        ? "Temperature anomalies"
                        : metric === "Cycle"
                        ? "Charge cycle delta"
                        : "Passport traceability"}
                    </p>
                  </article>
                ))}
              </div>

              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <h2 className="text-lg font-semibold text-emerald-200">
                  Latest response
                </h2>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-emerald-100">
                  {result || "No value returned"}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
