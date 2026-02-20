"use client";

import { useState, useEffect, useCallback } from "react";
import type { Device } from "@/types/device";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch("/api/devices");
      const data = await response.json();
      if (data.success) {
        setDevices(data.data.devices);
        setError(null);
      } else {
        setError(data.error || "장치 목록을 불러올 수 없습니다");
      }
    } catch {
      setError("장치 목록을 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const updateDeviceStatus = useCallback(
    (deviceUuid: string, status: "online" | "offline" | "unknown") => {
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceUuid === deviceUuid ? { ...d, lastStatus: status } : d
        )
      );
    },
    []
  );

  return {
    devices,
    isLoading,
    error,
    refetch: fetchDevices,
    updateDeviceStatus,
  };
}
