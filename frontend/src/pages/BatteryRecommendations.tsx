import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  evaluateBatteryForRecycler,
  type RecyclerEvaluationResponse,
} from "../lib/api";

type RecommendationLabel = "Recycle" | "Reuse" | "Remanufacture" | "Repurpose";

const DEFAULT_BATTERY_ID = "BATTERY_12345";
const DEFAULT_MARKET_ID = "MKT_STD_2024";

const ORDERED_LABELS: RecommendationLabel[] = [
  "Recycle",
  "Reuse",
  "Remanufacture",
  "Repurpose",
];

const CARD_ACCENTS: Record<RecommendationLabel, string> = {
  Recycle: "from-rose-500/20 via-rose-500/5 to-transparent border-rose-400/40",
  Reuse: "from-sky-500/20 via-sky-500/5 to-transparent border-sky-400/40",
  Remanufacture:
    "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-400/40",
  Repurpose:
    "from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-400/40",
};

const toPercentNumber = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value : value * 100;
};

const formatScore = (value: number) => {
  const percent = toPercentNumber(value);
  return `${Math.round(percent)}%`;
};

export default function BatteryRecommendationPage() {
  const [batteryId, setBatteryId] = useState(DEFAULT_BATTERY_ID);
  const [marketId, setMarketId] = useState(DEFAULT_MARKET_ID);
  const [scores, setScores] = useState<RecyclerEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = useCallback(async (id: string, market: string) => {
    const trimmedId = id.trim();
    const trimmedMarket = market.trim() || DEFAULT_MARKET_ID;

    if (!trimmedId) {
      setError("Battery ID is required");
      setScores(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await evaluateBatteryForRecycler({
        id: trimmedId,
        market_id: trimmedMarket,
      });
      setScores(response);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to evaluate battery";
      setError(message);
      setScores(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runEvaluation(batteryId, marketId);
  };

  const recommendationCards = useMemo(
    () =>
      ORDERED_LABELS.map((label) => ({
        label,
        score:
          typeof scores?.[label] === "number" ? scores[label] ?? null : null,
      })),
    [scores]
  );

  const rankedCards = useMemo(
    () =>
      recommendationCards
        .filter(
          (card): card is { label: RecommendationLabel; score: number } =>
            typeof card.score === "number"
        )
        .sort((a, b) => b.score - a.score),
    [recommendationCards]
  );

  const topCard = rankedCards[0];
  const secondCard = rankedCards[1];
  const confidenceBand =
    topCard && secondCard
      ? Math.max(
          1,
          Math.round(
            Math.abs(
              toPercentNumber(topCard.score ?? 0) -
                toPercentNumber(secondCard.score ?? 0)
            ) / 2
          )
        )
      : 4;

  const outcomeText = topCard
    ? `${topCard.label} ranked #1 · ${formatScore(topCard.score)}`
    : "Run an evaluation to rank outcomes.";

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-8 text-white shadow-inner shadow-black/40 space-y-8">
      <header className="space-y-3 text-left">
        <h1 className="text-4xl font-semibold leading-tight">
          Battery recommendations
        </h1>
        <p className="text-base text-slate-300 max-w-3xl">
          Four-path decision surface generated from the latest Python model run.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-900 bg-slate-950/70 p-6 text-sm text-slate-300">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1 text-sm font-semibold text-slate-200">
            Battery ID
            <input
              value={batteryId}
              onChange={(event) => setBatteryId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="BATTERY_12345"
            />
          </label>
          <label className="flex-1 text-sm font-semibold text-slate-200">
            Market ID
            <input
              value={marketId}
              onChange={(event) => setMarketId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="MKT_STD_2024"
            />
          </label>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40 sm:flex-none sm:min-w-[150px]"
            >
              {isLoading ? "Evaluating…" : "Run evaluation"}
            </button>
          </div>
        </form>
        {error && (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Model outcome
            </p>
            <p className="text-2xl font-semibold text-white">{outcomeText}</p>
          </div>
          <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
            {scores ? `Confidence band ±${confidenceBand}%` : "Awaiting run"}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {recommendationCards.map((state) => (
            <article
              key={state.label}
              className={`rounded-2xl border bg-gradient-to-br ${
                CARD_ACCENTS[state.label]
              } p-6 shadow-lg shadow-black/20`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    {state.label}
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {state.score !== null
                      ? `${formatScore(state.score)} likelihood`
                      : "Awaiting backend score"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Likelihood</p>
                  <p className="text-3xl font-semibold text-white">
                    {state.score !== null ? formatScore(state.score) : "—"}
                  </p>
                </div>
              </div>
              {state.score !== null ? (
                <div className="mt-5 space-y-2">
                  <div className="h-3 rounded-full bg-white/10">
                    <div
                      className="h-3 rounded-full bg-white/80"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, toPercentNumber(state.score))
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    Raw score: {state.score.toFixed(1)}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-400">
                  No score returned for this path yet.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
