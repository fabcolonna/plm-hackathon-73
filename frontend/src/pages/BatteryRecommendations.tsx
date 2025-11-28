const RECOMMENDATION_STATES = [
  {
    label: "Recycle",
    score: 0.64,
    headline: "Most energy efficient outcome",
    summary:
      "High contamination risk and steady capacity fade point towards safe-material recovery.",
    accent: "from-rose-500/20 via-rose-500/5 to-transparent border-rose-400/40",
    signals: [
      "Voltage instability detected during load surge",
      "Chemistry lineage fully traceable",
      "Recycler line has capacity this week",
    ],
    nextSteps: [
      "Book shredding slot at Plant 7",
      "Push passport + teardown photos",
    ],
  },
  {
    label: "Reuse",
    score: 0.52,
    headline: "Viable for low-demand loops",
    summary:
      "Electrolyte window intact and thermal history remains stable for secondary markets.",
    accent: "from-sky-500/20 via-sky-500/5 to-transparent border-sky-400/40",
    signals: ["SoC drift < 3% on last audit", "PCR documentation uploaded"],
    nextSteps: ["Match with refurb partner", "Queue extended soak test"],
  },
  {
    label: "Remanufacture",
    score: 0.21,
    headline: "Module refresh recommended",
    summary:
      "Cell variance moderate; a module swap would unlock another 18 months of duty.",
    accent:
      "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-400/40",
    signals: ["Seal integrity intact", "Power electronics passed continuity"],
    nextSteps: ["Pull bill of materials", "Issue work order to reman floor"],
  },
  {
    label: "Repurpose",
    score: 0.33,
    headline: "Great candidate for stationary storage",
    summary:
      "Thermal swings already within microgrid tolerances—minimal prep required.",
    accent:
      "from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-400/40",
    signals: [
      "Comms interface still responsive",
      "Enclosure corrosion minimal",
    ],
    nextSteps: ["Share telemetry pack with grid ops", "Quote logistics"],
  },
] as const;

const meta = {
  jobId: "JOB-47F92",
  lastSync: "11:42 CET · 10 minutes ago",
  modelVersion: "v0.8.3-alpha",
  dataset: "RecyclerOps-CycleYear4",
};

const formatScore = (value: number) => `${Math.round(value * 100)}%`;

export default function BatteryRecommendationPage() {
  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-8 text-white shadow-inner shadow-black/40 space-y-8">
      <header className="space-y-3 text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
          Protected · Recycler
        </p>
        <h1 className="text-4xl font-semibold leading-tight">
          Battery recommendations
        </h1>
        <p className="text-base text-slate-300 max-w-3xl">
          Four-path decision surface generated from the latest python model run.
          Prioritize the highest score but review the supporting signals before
          locking the batch.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-900 bg-slate-950/70 p-6 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Job ID
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{meta.jobId}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Model version
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {meta.modelVersion}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Dataset
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {meta.dataset}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Last sync
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {meta.lastSync}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Model outcome
            </p>
            <p className="text-2xl font-semibold text-white">
              Recycle ranked #1 · {formatScore(RECOMMENDATION_STATES[0].score)}
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
            Confidence band ±4%
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {RECOMMENDATION_STATES.map((state) => (
            <article
              key={state.label}
              className={`rounded-2xl border bg-gradient-to-br ${state.accent} p-6 shadow-lg shadow-black/20`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    {state.label}
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {state.headline}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Likelihood</p>
                  <p className="text-3xl font-semibold text-white">
                    {formatScore(state.score)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-200">{state.summary}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Signals
                  </p>
                  <ul className="mt-3 space-y-2">
                    {state.signals.map((signal) => (
                      <li key={signal} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Next actions
                  </p>
                  <ul className="mt-3 space-y-2">
                    {state.nextSteps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-900 bg-slate-950/70 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Decision guardrails
          </p>
          <p className="text-sm text-slate-300">
            Data stays encrypted in transit. Once you confirm a path we push the
            job token to the recycler ERP and lock the passport. Reversing a
            choice requires auditor override.
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Ready to commit?
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              Confirm the recycle path to broadcast teardown instructions.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Traceability checklist
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            {[
              "Passport signature verified",
              "Chain-of-custody QR scanned",
              "Thermal history archived",
              "EPR paperwork attached",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              >
                <span>{item}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                  Ready
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
