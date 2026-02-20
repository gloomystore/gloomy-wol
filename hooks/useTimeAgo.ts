"use client";

import { useState, useEffect } from "react";

export function useTimeAgo(timestamp: number | null): string {
  const [, tick] = useState(0);

  useEffect(() => {
    if (timestamp === null) return;
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [timestamp]);

  if (timestamp === null) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}분 ${secs}초 전`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins}분 전`;
}
