"use client";

import type { Device } from "@/types/device";
import { DeviceCard } from "./DeviceCard";

interface DeviceListProps {
  devices: Device[];
  timeAgo?: string;
  onWake?: () => void;
}

export function DeviceList({ devices, timeAgo, onWake }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-slate-500 text-sm">등록된 장치가 없습니다</p>
        <p className="text-slate-600 text-xs mt-1">
          새 장치를 추가해 WoL을 시작하세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <DeviceCard
          key={device.deviceUuid}
          device={device}
          timeAgo={timeAgo}
          onWake={onWake}
        />
      ))}
    </div>
  );
}
