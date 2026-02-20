"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

interface WolButtonProps {
  deviceUuid: string;
  deviceName: string;
  onWake?: () => void;
}

export function WolButton({ deviceUuid, deviceName, onWake }: WolButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  const handleWake = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/devices/${deviceUuid}/wake`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${deviceName}에 매직 패킷을 전송했습니다`);
        onWake?.();
      } else {
        toast.error(data.error || "매직 패킷 전송에 실패했습니다");
      }
    } catch {
      toast.error("매직 패킷 전송 중 오류가 발생했습니다");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="sm"
      isLoading={isSending}
      onClick={handleWake}
      title="Wake-on-LAN 매직 패킷 전송"
    >
      {isSending ? "전송 중..." : "Wake"}
    </Button>
  );
}
