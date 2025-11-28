import { useMemo, useState } from "react";
import {
  fetchBatteryDetails,
  updateBatteryMeasurements,
  type BatteryDetailsResponse,
  type BatteryLifecycleStatus,
} from "../lib/api";
import { queuePendingStatusRequest } from "../lib/pendingStatus";
import { useQrScanner } from "../hooks/useQrScanner";
import { QrScannerOverlay } from "../components/QrScannerOverlay";

const DEFAULT_BATTERY_ID = "BATTERY_12345";
type EditableDetailKey = "voltage" | "capacity" | "temperature";

const LIFECYCLE_STATUS_OPTIONS: BatteryLifecycleStatus[] = [
  "original",
  "repurposed",
  "reused",
  "remanufactured",
  "waste",
];

const STATUS_LABELS: Record<BatteryLifecycleStatus, string> = {
  original: "Original",
  repurposed: "Repurposed",
  reused: "Reused",
  remanufactured: "Remanufactured",
  waste: "Waste",
};

const DETAIL_FIELD_ORDER: Array<{
  key: keyof BatteryDetailsResponse;
  label: string;
  formatter?: (value: unknown) => string;
  editableKey?: EditableDetailKey;
}> = [
  { key: "battery_status", label: "Status" },
  { key: "battery_model", label: "Model" },
  { key: "chemistry", label: "Chemistry" },
  {
    key: "soh_percent",
    label: "State of health",
    formatter: (value) =>
      typeof value === "number" ? `${Math.round(value)}%` : "—",
  },
  {
    key: "voltage",
    label: "Voltage",
    formatter: (value) =>
      typeof value === "number" ? `${value.toFixed(2)} V` : "—",
    editableKey: "voltage",
  },
  {
    key: "capacity",
    label: "Capacity",
    formatter: (value) =>
      typeof value === "number" ? `${value.toFixed(1)} kWh` : "—",
    editableKey: "capacity",
  },
  {
    key: "temperature",
    label: "Temperature",
    formatter: (value) =>
      typeof value === "number" ? `${value.toFixed(1)} °C` : "—",
    editableKey: "temperature",
  },
  {
    key: "energy_throughput",
    label: "Energy throughput",
    formatter: (value) =>
      typeof value === "number" ? `${value.toLocaleString()} kWh` : "—",
  },
];

export default function BatteryInfoPage() {
  const [batteryId, setBatteryId] = useState(DEFAULT_BATTERY_ID);
  const [details, setDetails] = useState<BatteryDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableDetailKey | null>(
    null
  );
  const [draftValue, setDraftValue] = useState("0");
  const [isSavingField, setIsSavingField] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [proposedStatus, setProposedStatus] =
    useState<BatteryLifecycleStatus>("original");
  const [statusQueueMessage, setStatusQueueMessage] = useState<string | null>(
    null
  );
  const { activeScanner, startScan, closeScanner, videoRef, scanError } =
    useQrScanner();

  const formattedFields = useMemo(() => {
    if (!details) return [];

    return DETAIL_FIELD_ORDER.map(({ key, label, formatter, editableKey }) => {
      const rawValue = details[key];
      if (formatter) {
        return { label, value: formatter(rawValue), rawValue, editableKey };
      }
      if (typeof rawValue === "number") {
        return { label, value: rawValue.toString(), rawValue, editableKey };
      }
      return {
        label,
        value: rawValue ? String(rawValue) : "—",
        rawValue,
        editableKey,
      };
    });
  }, [details]);

  const handleLookup = async () => {
    const trimmedId = batteryId.trim();
    if (!trimmedId) {
      setError("Battery ID is required");
      setDetails(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDetails(null);

    try {
      const record = await fetchBatteryDetails(trimmedId);
      setDetails(record);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to fetch battery details";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const beginEdit = (field: EditableDetailKey, rawValue: unknown) => {
    if (!details) return;
    const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue);
    setDraftValue(Number.isFinite(numeric) ? String(numeric) : "");
    setEditingField(field);
    setUpdateMessage(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue("0");
  };

  const handleSaveField = async () => {
    if (!details || !editingField) return;
    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed)) {
      setUpdateMessage("Please enter a numeric value.");
      return;
    }

    setIsSavingField(true);
    setUpdateMessage(null);
    try {
      await updateBatteryMeasurements(details.battery_id, {
        [editingField]: parsed,
      });
      const refreshed = await fetchBatteryDetails(details.battery_id);
      setDetails(refreshed);
      setEditingField(null);
      setUpdateMessage("Saved changes.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to save field";
      setUpdateMessage(message);
    } finally {
      setIsSavingField(false);
    }
  };

  const handleQueueStatusChange = () => {
    if (!details) {
      setStatusQueueMessage("Load a battery before sending status updates.");
      return;
    }

    queuePendingStatusRequest(details.battery_id, proposedStatus);
    setStatusQueueMessage(
      `Signaled ${STATUS_LABELS[proposedStatus]} to the battery owner.`
    );
  };

  return (
    <section className="rounded-3xl border border-slate-900 bg-slate-950/80 p-8 text-white shadow-inner shadow-black/40 space-y-8">
      <header className="space-y-3 text-left">
        <h1 className="text-4xl font-semibold leading-tight">Battery Info</h1>
        <p className="text-base text-slate-300 max-w-3xl">
          Query the battery passport stored in Neo4j and show exactly what the
          garagist endpoint returns.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Scan your battery
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Look up the live passport status by entering a battery ID.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <label className="flex-1 text-sm font-semibold text-slate-200">
              Battery Passport ID
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={batteryId}
                  onChange={(event) => setBatteryId(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="BP-XXXX"
                />
                <button
                  type="button"
                  onClick={() =>
                    startScan({
                      label: "Battery",
                      onResult: (value) => setBatteryId(value),
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
                onClick={handleLookup}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40 sm:flex-none sm:min-w-[150px]"
              >
                {isLoading ? "Fetching…" : "Fetch passport"}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-900 bg-slate-950/70 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Passport snapshot
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {details?.battery_id ?? "No record loaded"}
            </h2>
          </div>
          {details?.created_at && (
            <p className="text-sm text-slate-400">
              Created {new Date(details.created_at).toLocaleString()}
            </p>
          )}
        </div>

        {details ? (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {formattedFields.map((field) => {
                const isEditable = Boolean(field.editableKey);
                const isEditing =
                  isEditable && editingField === field.editableKey;
                return (
                  <li
                    key={field.label}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {field.label}
                      </p>
                      {isEditable && !isEditing && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-sky-300 transition hover:text-sky-200"
                          onClick={() =>
                            beginEdit(field.editableKey!, field.rawValue)
                          }
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-3">
                        <input
                          type="number"
                          value={draftValue}
                          onChange={(event) =>
                            setDraftValue(event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveField}
                            disabled={isSavingField}
                            className="flex-1 rounded-xl bg-sky-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
                          >
                            {isSavingField ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500"
                            onClick={cancelEdit}
                            disabled={isSavingField}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xl font-semibold text-white">
                        {field.value}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {updateMessage && (
              <p className="text-xs text-slate-400">{updateMessage}</p>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Owner alert
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Pick the next lifecycle status and send the owner a pending
                  alert. The status becomes official once they confirm it on
                  their dashboard.
                </p>
              </div>
              <label className="block text-sm font-semibold text-slate-200">
                Lifecycle outcome
                <select
                  value={proposedStatus}
                  onChange={(event) =>
                    setProposedStatus(
                      event.target.value as BatteryLifecycleStatus
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  {LIFECYCLE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="w-full rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
                onClick={handleQueueStatusChange}
              >
                Notify owner about change
              </button>
              {statusQueueMessage && (
                <p className="text-xs text-slate-400">{statusQueueMessage}</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Run a lookup to populate this grid directly from the battery
            passport API response.
          </p>
        )}
      </section>
      <QrScannerOverlay
        activeScanner={activeScanner}
        videoRef={videoRef}
        scanError={scanError}
        onClose={closeScanner}
      />
    </section>
  );
}
