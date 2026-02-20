"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deviceSchema, type DeviceInput } from "@/lib/validations/device";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Device } from "@/types/device";

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: DeviceInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DeviceForm({ device, onSubmit, onCancel, isSubmitting }: DeviceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || "",
      macAddress: device?.macAddress || "",
      ipAddress: device?.ipAddress || "",
      broadcastAddress: device?.broadcastAddress || "192.168.0.255",
      port: device?.port || 9,
      memo: device?.memo || "",
      repeatCount: device?.repeatCount || 3,
      repeatIntervalMs: device?.repeatIntervalMs || 500,
      isFavorite: device?.isFavorite || false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="장치 이름 *"
        placeholder="예: 내 데스크톱"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="MAC 주소 *"
        placeholder="AA:BB:CC:DD:EE:FF"
        error={errors.macAddress?.message}
        {...register("macAddress")}
      />

      <Input
        label="IP 주소"
        placeholder="192.168.0.144"
        error={errors.ipAddress?.message}
        {...register("ipAddress")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="브로드캐스트 주소"
          placeholder="192.168.0.255"
          error={errors.broadcastAddress?.message}
          {...register("broadcastAddress")}
        />
        <Input
          label="포트"
          type="number"
          placeholder="9"
          error={errors.port?.message}
          {...register("port", { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="반복 횟수"
          type="number"
          placeholder="3"
          error={errors.repeatCount?.message}
          {...register("repeatCount", { valueAsNumber: true })}
        />
        <Input
          label="반복 간격 (ms)"
          type="number"
          placeholder="500"
          error={errors.repeatIntervalMs?.message}
          {...register("repeatIntervalMs", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">메모</label>
        <textarea
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          rows={3}
          placeholder="장치에 대한 메모"
          {...register("memo")}
        />
        {errors.memo?.message && (
          <p className="text-sm text-red-400">{errors.memo.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
          {...register("isFavorite")}
        />
        <span className="text-sm text-slate-300">즐겨찾기에 추가</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {device ? "수정" : "추가"}
        </Button>
      </div>
    </form>
  );
}
