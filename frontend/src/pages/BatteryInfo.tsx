import { useState } from "react";

export default function BatteryInfoPage() {
  //
  // GLOBAL EDIT MODE (controls ALL fields)
  //
  const [isEditing, setIsEditing] = useState(false);

  //
  // SECTION A (Identification & Safety)
  //
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
  const [fieldsC, setFieldsC] = useState({
    disassembly: "",
    partNumbers: "",
    batteryStatus: "",
  });

  const commonInputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-10 text-white shadow-inner shadow-black/40 space-y-10">

      {/* HEADER */}
      <p className="text-xs uppercase tracking-[0.35em] text-sky-300">
        Protected · Garage
      </p>

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold leading-tight">Battery Info</h1>

        {/* SINGLE EDIT BUTTON */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-xl bg-sky-600 px-6 py-2 font-semibold hover:bg-sky-500 transition"
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <p className="text-sm text-slate-400">
        Complete battery information panel.
      </p>

      {/* A. Identification & Safety */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-sky-300">
          A. Identification & Safety
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <input
              disabled={!isEditing}
              value={fieldsA.status}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, status: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Model</span>
            <input
              disabled={!isEditing}
              value={fieldsA.batteryModel}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, batteryModel: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Chemistry</span>
            <input
              disabled={!isEditing}
              value={fieldsA.chemistry}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, chemistry: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>State of Charge (SOC)</span>
            <input
              disabled={!isEditing}
              value={fieldsA.soc}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, soc: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Information on accidents</span>
            <input
              disabled={!isEditing}
              value={fieldsA.accidentInfo}
              onChange={(e) =>
                setFieldsA((p) => ({ ...p, accidentInfo: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>
        </div>
      </section>


      {/* B. Diagnosis & Health Status */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-sky-300">
          B. Diagnosis & Health Status
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>defects & malfunctions</span>
            <input
              disabled={!isEditing}
              value={fieldsB.defects}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, defects: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>State of Health (SOH)</span>
            <input
              disabled={!isEditing}
              value={fieldsB.soh}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, soh: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Power Capability</span>
            <input
              disabled={!isEditing}
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

          <label className="flex flex-col gap-1 text-sm">
            <span>Temperature Information</span>
            <input
              disabled={!isEditing}
              value={fieldsB.temperature}
              onChange={(e) =>
                setFieldsB((p) => ({ ...p, temperature: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            <span>Total Energy Throughput</span>
            <input
              disabled={!isEditing}
              value={fieldsB.energyThroughput}
              onChange={(e) =>
                setFieldsB((p) => ({
                  ...p,
                  energyThroughput: e.target.value,
                }))
              }
              className={commonInputClass}
            />
          </label>
        </div>
      </section>

      {/* C. Repairability */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-sky-300">
          C. Repairability & Feasibility
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span>Design for Disassembly</span>
            <input
              disabled={!isEditing}
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
              disabled={!isEditing}
              value={fieldsC.partNumbers}
              onChange={(e) =>
                setFieldsC((p) => ({ ...p, partNumbers: e.target.value }))
              }
              className={commonInputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Battery Status</span>
            <input
              disabled={!isEditing}
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
