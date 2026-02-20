"use client";

import Link from "next/link";
import type { Device } from "@/types/device";
import { DeviceStatusBadge } from "./DeviceStatusBadge";
import { WolButton } from "./WolButton";

interface DeviceCardProps {
  device: Device;
  timeAgo?: string;
  onWake?: () => void;
}

export function DeviceCard({ device, timeAgo, onWake }: DeviceCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/devices/${device.deviceUuid}`}
              className="text-base font-semibold text-slate-100 hover:text-blue-400 transition-colors truncate"
            >
              {device.name}
            </Link>
            {device.isFavorite && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-mono">{device.macAddress}</p>
            {device.ipAddress && (
              <p className="text-sm text-slate-500">{device.ipAddress}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <DeviceStatusBadge status={device.lastStatus} timeAgo={timeAgo} />
          <WolButton
            deviceUuid={device.deviceUuid}
            deviceName={device.name}
            onWake={onWake}
          />
        </div>
      </div>
      {device.memo && (
        <p className="mt-2 text-xs text-slate-500 truncate">{device.memo}</p>
      )}
    </div>
  );
}
