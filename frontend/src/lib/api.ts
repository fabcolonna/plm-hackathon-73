const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5001"
).replace(/\/$/, "");

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  const rawBody = await response.text();
  const data = rawBody ? JSON.parse(rawBody) : null;

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error?: unknown }).error)
        : `API error (${response.status})`;
    throw new Error(message || "Request failed");
  }

  return (data as T) ?? ({} as T);
}

// TYPES

export type BatteryStatusResponse = {
  battery_id: string;
  status: string;
  voltage: number;
  capacity: number;
  soh_percent: number;
  temperature?: number;
  [key: string]: unknown;
};

export type BatteryDetailsResponse = {
  battery_id: string;
  voltage: number;
  capacity: number;
  temperature: number;
  created_at: string;
  soh_percent: number;
  chemistry: string;
  battery_model: string;
  battery_status: string;
  energy_throughput: number;
  [key: string]: unknown;
};

export type CreateBatteryPayload = {
  battery_id: string;
  voltage: number;
  capacity: number;
  temperature: number;
};

export type CreateBatteryResponse = {
  message: string;
  battery_id: string;
};

export type RecyclerEvaluationRequest = {
  id: string;
  market_id: string;
};

export type RecyclerEvaluationResponse = Record<string, number> & {
  Recycle?: number;
  Reuse?: number;
  Remanufacture?: number;
  Repurpose?: number;
};

// API FUNCTIONS

export async function fetchBatteryStatus(batteryId: string) {
  if (!batteryId.trim()) {
    throw new Error("Battery ID is required");
  }
  return apiRequest<BatteryStatusResponse>(
    `/proprietaire/status/${encodeURIComponent(batteryId.trim())}`
  );
}

export async function fetchBatteryDetails(batteryId: string) {
  if (!batteryId.trim()) {
    throw new Error("Battery ID is required");
  }
  return apiRequest<BatteryDetailsResponse>(
    `/garagist/battery/${encodeURIComponent(batteryId.trim())}`
  );
}

export async function createBatteryRecord(payload: CreateBatteryPayload) {
  return apiRequest<CreateBatteryResponse>("/garagist/battery", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function evaluateBatteryForRecycler(
  payload: RecyclerEvaluationRequest
) {
  if (!payload.id.trim()) {
    throw new Error("Battery ID is required");
  }
  if (!payload.market_id.trim()) {
    throw new Error("Market ID is required");
  }

  return apiRequest<RecyclerEvaluationResponse>("/recycler/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: payload.id.trim(),
      market_id: payload.market_id.trim(),
    }),
  });
}
