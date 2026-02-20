export interface Device {
  deviceUuid: string;
  userUuid: string;
  name: string;
  macAddress: string;
  ipAddress: string | null;
  broadcastAddress: string;
  port: number;
  memo: string | null;
  repeatCount: number;
  repeatIntervalMs: number;
  lastStatus: "online" | "offline" | "unknown";
  lastStatusCheckedAt: Date | null;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceFormData {
  name: string;
  macAddress: string;
  ipAddress?: string;
  broadcastAddress?: string;
  port?: number;
  memo?: string;
  repeatCount?: number;
  repeatIntervalMs?: number;
  isFavorite?: boolean;
}

export interface WolHistory {
  historyUuid: string;
  deviceUuid: string;
  userUuid: string;
  result: "success" | "failure";
  errorMessage: string | null;
  deviceRespondedAt: Date | null;
  createdAt: Date;
  deviceName?: string;
  macAddress?: string;
}
