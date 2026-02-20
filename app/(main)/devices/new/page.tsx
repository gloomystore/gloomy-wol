"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { useToast } from "@/components/providers/ToastProvider";
import type { DeviceInput } from "@/lib/validations/device";

export default function NewDevicePage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DeviceInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("장치가 추가되었습니다");
        router.push("/");
      } else {
        toast.error(result.error || "장치 추가에 실패했습니다");
      }
    } catch {
      toast.error("장치 추가 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-6">새 장치 추가</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <DeviceForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/")}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
