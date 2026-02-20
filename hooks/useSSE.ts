"use client";

import { useEffect, useRef, useCallback } from "react";
import type { DeviceStatusEvent } from "@/types/api";

interface UseSSEOptions {
  onStatusUpdate: (events: DeviceStatusEvent[]) => void;
  enabled?: boolean;
}

export function useSSE({ onStatusUpdate, enabled = true }: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  onStatusUpdateRef.current = onStatusUpdate;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/sse/status");

    es.addEventListener("status", (event) => {
      try {
        const data = JSON.parse(event.data) as DeviceStatusEvent[];
        onStatusUpdateRef.current(data);
      } catch {
        // 파싱 에러 무시
      }
    });

    es.addEventListener("heartbeat", () => {
      // 연결 유지용
    });

    es.onerror = () => {
      es.close();
      // 5초 후 재연결
      setTimeout(() => {
        if (enabled) connect();
      }, 5000);
    };

    eventSourceRef.current = es;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      eventSourceRef.current?.close();
      return;
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect, enabled]);
}
