"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDevices } from "@/hooks/useDevices";
import { useStatusPolling } from "@/hooks/useStatusPolling";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { DeviceList } from "@/components/devices/DeviceList";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { devices, isLoading: devicesLoading, refetch, updateDeviceStatus } = useDevices();
  const isVisible = usePageVisible();
  const [fastMode, setFastMode] = useState(true);

  const handleStatusUpdate = useCallback(
    (statuses: { deviceUuid: string; status: "online" | "offline" | "unknown" }[]) => {
      statuses.forEach((s) => {
        updateDeviceStatus(s.deviceUuid, s.status);
      });
      // 모든 장치의 상태가 확정(online/offline)되면 slow 모드로 전환
      if (statuses.length > 0 && statuses.every((s) => s.status !== "unknown")) {
        setFastMode(false);
      }
    },
    [updateDeviceStatus]
  );

  const { lastCheckedAt } = useStatusPolling({
    onStatusUpdate: handleStatusUpdate,
    enabled: !!user && devices.length > 0 && isVisible,
    intervalMs: fastMode ? 1000 : 10000,
  });

  const timeAgo = useTimeAgo(lastCheckedAt);

  const handleWake = useCallback(() => {
    setFastMode(true);
    refetch();
  }, [refetch]);

  if (authLoading || devicesLoading) {
    return <Spinner className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">장치 목록</h1>
          <p className="text-sm text-slate-400 mt-1">
            {devices.length}개의 장치가 등록되어 있습니다
          </p>
        </div>
        <Link href="/devices/new">
          <Button>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            장치 추가
          </Button>
        </Link>
      </div>

      <DeviceList devices={devices} timeAgo={timeAgo} onWake={handleWake} />
    </div>
  );
}
