import type { BatteryLifecycleStatus } from "./api";

export type PendingStatusRequest = {
  batteryId: string;
  proposedStatus: BatteryLifecycleStatus;
  createdAt: number;
};

const STORAGE_KEY = "pendingBatteryStatusRequests";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): PendingStatusRequest[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => ({
        batteryId: String(entry?.batteryId ?? ""),
        proposedStatus: entry?.proposedStatus as BatteryLifecycleStatus,
        createdAt: Number(entry?.createdAt ?? Date.now()),
      }))
      .filter((entry) => entry.batteryId && entry.proposedStatus);
  } catch {
    return [];
  }
}

function writeAll(entries: PendingStatusRequest[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function queuePendingStatusRequest(
  batteryId: string,
  proposedStatus: BatteryLifecycleStatus
) {
  const trimmedId = batteryId.trim();
  if (!trimmedId) {
    return;
  }

  const existing = readAll().filter((entry) => entry.batteryId !== trimmedId);
  const next: PendingStatusRequest = {
    batteryId: trimmedId,
    proposedStatus,
    createdAt: Date.now(),
  };
  writeAll([...existing, next]);
  return next;
}

export function getPendingStatusRequest(batteryId: string) {
  const trimmedId = batteryId.trim();
  if (!trimmedId) {
    return null;
  }

  return readAll().find((entry) => entry.batteryId === trimmedId) ?? null;
}

export function clearPendingStatusRequest(batteryId: string) {
  const trimmedId = batteryId.trim();
  if (!trimmedId) {
    return;
  }

  const remaining = readAll().filter((entry) => entry.batteryId !== trimmedId);
  writeAll(remaining);
}
