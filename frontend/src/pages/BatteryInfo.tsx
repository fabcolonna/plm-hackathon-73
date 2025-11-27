import { useState } from "react";

export default function BatteryInfoPage() {
  //
  // SECTION A (Identification & Safety)
  //
  const [editA, setEditA] = useState(false);
  const [fieldsA, setFieldsA] = useState({
    status: "",
    batteryModel: "",
    chemistry: "",
    soc: "",
    accidentInfo: "",
  });

  //
  // SECTION B (Diagnosis & Health Status)
  //
  const [editB, setEditB] = useState(false);
  const [fieldsB, setFieldsB] = useState({
    defects: "",
    soh: "",
    internalResistance: "",
    temperature: "",
    energyThroughput: "",
  });

  //
  // SECTION C (Repairability)
  //
  const [editC, setEditC] = useState(false);
  const [fieldsC, setFieldsC] = useState({
    disassembly: "",
    partNumbers: "",
    batteryStatus: "",
  });

  // helper
  const commonInputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

  //
  // RENDER
  //
  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-white shadow-inner shadow-black/40 space-y-10">
      <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
        Protected · Garage
      </p>

      <h1 className="text-4xl font-semibold leading-tight">Battery Info</h1>
      <p className="text-sm text-slate-400">Complete battery information panel.</p>

      {/* -------------------------------------------------------- */}
      {/* SECTION A — Identification & Safety */}
      {/* -------------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-sky-300">
            A. Identification & Safety
          </h2>

          <button
            onClick={() => setEditA(!editA)}
            className="rounded-xl bg-sky-600 px-5 py-2 font-semibold hover:bg-sky-500 transition"
          >
            {editA ? "Save" : "Edit"}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Status */}
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <input
              disabled={!editA}
              value={fieldsA.status}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, status: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* Battery Model */}
          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Model</span>
            <input
              disabled={!editA}
              value={fieldsA.batteryModel}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, batteryModel: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* Chemistry */}
          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Chemistry</span>
            <input
              disabled={!editA}
              value={fieldsA.chemistry}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, chemistry: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* SOC */}
          <label className="flex flex-col gap-1 text-sm">
            <span>State of Charge (SOC)</span>
            <input
              disabled={!editA}
              value={fieldsA.soc}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, soc: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* Accident Info */}
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Information on accidents</span>
            <input
              disabled={!editA}
              value={fieldsA.accidentInfo}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, accidentInfo: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* SECTION B — Diagnosis & Health Status */}
      {/* -------------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-sky-300">
            B. Diagnosis & Health Status
          </h2>

          <button
            onClick={() => setEditB(!editB)}
            className="rounded-xl bg-sky-600 px-5 py-2 font-semibold hover:bg-sky-500 transition"
          >
            {editB ? "Save" : "Edit"}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Defects */}
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Known defects or malfunctions</span>
            <input
              disabled={!editB}
              value={fieldsB.defects}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, defects: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* SOH */}
          <label className="flex flex-col gap-1 text-sm">
            <span>State of Health (SOH)</span>
            <input
              disabled={!editB}
              value={fieldsB.soh}
              onChange={(e) => setFieldsB((p) => ({ ...p, soh: e.target.value }))}
              className={commonInputClass}
            />
          </label>

          {/* Internal Resistance */}
          <label className="flex flex-col gap-1 text-sm">
            <span>Internal Resistance / Power Capability</span>
            <input
              disabled={!editB}
              value={fieldsB.internalResistance}
              onChange={(e) =>
                setFieldsB((p) => ({
                  ...p,
                  internalResistance: e.target.value,
                }))
              }
              className={commonInputClass}
            />
          </label>

          {/* Temperature Info */}
          <label className="flex flex-col gap-1 text-sm">
            <span>Temperature Information</span>
            <input
              disabled={!editB}
              value={fieldsB.temperature}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, temperature: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          {/* Energy Throughput */}
          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            <span>Total Energy Throughput</span>
            <input
              disabled={!editB}
              value={fieldsB.energyThroughput}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, energyThroughput: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* SECTION C — Repairability */}
      {/* -------------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-sky-300">
            C. Repairability & Feasibility
          </h2>

          <button
            onClick={() => setEditC(!editC)}
            className="rounded-xl bg-sky-600 px-5 py-2 font-semibold hover:bg-sky-500 transition"
          >
            {editC ? "Save" : "Edit"}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span>Design for Disassembly</span>
            <input
              disabled={!editC}
              value={fieldsC.disassembly}
              onChange={(e) =>
                setFieldsC((p) => ({ ...p, disassembly: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Part Numbers</span>
            <input
              disabled={!editC}
              value={fieldsC.partNumbers}
              onChange={(e) =>
                setFieldsC((p) => ({ ...p, partNumbers: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Status (original / refurbished / waste)</span>
            <input
              disabled={!editC}
              value={fieldsC.batteryStatus}
              onChange={(e) =>
                setFieldsC((p) => ({ ...p, batteryStatus: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>
        </div>
      </section>
    </section>
  );
}

