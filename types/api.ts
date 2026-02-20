export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface DeviceStatusEvent {
  deviceUuid: string;
  status: "online" | "offline" | "unknown";
  checkedAt: string;
}

export interface SSEMessage {
  type: "status" | "heartbeat";
  data: DeviceStatusEvent[] | null;
}
