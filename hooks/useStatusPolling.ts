"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DeviceStatus {
  deviceUuid: string;
  status: "online" | "offline" | "unknown";
}

interface UseStatusPollingOptions {
  onStatusUpdate: (statuses: DeviceStatus[]) => void;
  enabled?: boolean;
  intervalMs?: number;
}

interface UseStatusPollingReturn {
  lastCheckedAt: number | null;
}

export function useStatusPolling({
  onStatusUpdate,
  enabled = true,
  intervalMs = 10000,
}: UseStatusPollingOptions): UseStatusPollingReturn {
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  onStatusUpdateRef.current = onStatusUpdate;

  const poll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const response = await fetch("/api/devices/check-all");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onStatusUpdateRef.current(data.data.statuses);
          setLastCheckedAt(Date.now());
        }
      }
    } catch {
      // 네트워크 오류 무시
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, intervalMs, poll]);

  return { lastCheckedAt };
}
