import type { FormEvent } from "react";
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

const ARGUMENT_KEYS: ArgKey[] = [
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
];

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000";

const EVALUATE_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/evaluate`;

const createInitialState = (): ArgsState => {
  return ARGUMENT_KEYS.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {} as ArgsState);
};

export default function App() {
  const [formValues, setFormValues] = useState<ArgsState>(() =>
    createInitialState()
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<
    "menu" | "view1" | "view2" | "view3"
  >("menu");

  const emptyFieldCount = useMemo(
    () => ARGUMENT_KEYS.filter((key) => formValues[key].trim() === "").length,
    [formValues]
  );

  const handleChange = (key: ArgKey, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFormValues(createInitialState());
    setIsLoading(false);
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

    const payload = ARGUMENT_KEYS.reduce((acc, key) => {
      acc[key] = formValues[key];
      return acc;
    }, {} as ArgsState);

    try {
      const response = await fetch(EVALUATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "The evaluation request failed."
        );
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
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-[80%] flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-lg font-semibold uppercase tracking-[0.2em] text-sky-400">
            Battery Passport ~ Recommendation Checker
          </p>
        </header>

        {/* MENU */}
        {activeView === "menu" && (
          <div className="grid grid-cols-1 gap-6 mt-8">
            <button
              onClick={() => setActiveView("view1")}
              className="rounded-xl bg-sky-700 p-5 text-white text-xl font-semibold shadow hover:bg-sky-600 transition"
            >
              Battery status
            </button>

            <button
              onClick={() => setActiveView("view2")}
              className="rounded-xl bg-sky-700 p-5 text-white text-xl font-semibold shadow hover:bg-sky-600 transition"
            >
              Recommendation
            </button>

            <button
              onClick={() => setActiveView("view3")}
              className="rounded-xl bg-sky-700 p-5 text-white text-xl font-semibold shadow hhover:bg-sky-600 transition"
            >
              Battery information
            </button>
          </div>
        )}

        {/* VIEW 1 */}
        {activeView === "view1" && (
          <>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40"
            >
              <div className="flex flex-col gap-6 justify-center">
                <p className="text-base text-slate-300 text-center">
                  Provide the ten required arguments for the recommendation checker.
                </p>

                <div className="grid gap-6 md:grid-cols-5">
                  {ARGUMENT_KEYS.map((key, index) => (
                    <label
                      key={key}
                      className="flex flex-col gap-2 text-sm font-medium text-slate-200"
                    >
                      <span className="flex items-center justify-between">
                        <span>
                          Argument {index + 1}
                          <span className="ml-2 text-xs font-mono text-slate-400">
                            {key}
                          </span>
                        </span>
                      </span>
                      <input
                        type="text"
                        required
                        value={formValues[key]}
                        onChange={(event) =>
                          handleChange(key, event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-center text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
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
                      className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2 text-base font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? "Evaluating…" : "Evaluate"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-2 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="text-sm text-slate-400">
                    {emptyFieldCount === 0
                      ? "All arguments ready."
                      : `${emptyFieldCount} arg(s) remaining.`}
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </p>
                )}
              </div>
            </form>

            {/* Cards */}
            {result !== null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div className="rounded-2xl p-6 text-white shadow-xl bg-sky-600">
                  <h3 className="text-lg font-semibold mb-2">Sky Card</h3>
                  <p className="text-sm opacity-90">This card uses sky-blue theme.</p>
                </div>

                <div className="rounded-2xl p-6 text-white shadow-xl bg-emerald-600">
                  <h3 className="text-lg font-semibold mb-2">Emerald Card</h3>
                  <p className="text-sm opacity-90">Emerald-green theme.</p>
                </div>

                <div className="rounded-2xl p-6 text-white shadow-xl bg-rose-600">
                  <h3 className="text-lg font-semibold mb-2">Rose Card</h3>
                  <p className="text-sm opacity-90">Rose-red theme.</p>
                </div>

                <div className="rounded-2xl p-6 text-white shadow-xl bg-indigo-600">
                  <h3 className="text-lg font-semibold mb-2">Indigo Card</h3>
                  <p className="text-sm opacity-90">Indigo theme.</p>
                </div>
              </div>
            )}

            {/* RESULT */}
            {result !== null && (
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 mt-6">
                <h2 className="text-xl font-semibold text-emerald-300">Result</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-base text-emerald-100">
                  {result || "No value returned"}
                </p>
              </section>
            )}
          </>
        )}

        {/* VIEW 2 */}
        {activeView === "view2" && (
          <div className="text-white text-center text-2xl mt-8">
            Ansicht 2 – (hier kannst du später Inhalte einfügen)
          </div>
        )}

        {/* VIEW 3 */}
        {activeView === "view3" && (
          <div className="text-white text-center text-2xl mt-8">
            Ansicht 3 – (hier kommt später Analyse)
          </div>
        )}
      </div>
    </div>
  );
}
