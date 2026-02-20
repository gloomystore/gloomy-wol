"use client";

interface DeviceStatusBadgeProps {
  status: "online" | "offline" | "unknown";
  timeAgo?: string;
}

export function DeviceStatusBadge({ status, timeAgo }: DeviceStatusBadgeProps) {
  const config = {
    online: {
      color: "bg-green-500",
      text: "온라인",
      textColor: "text-green-400",
    },
    offline: {
      color: "bg-slate-500",
      text: "오프라인",
      textColor: "text-slate-400",
    },
    unknown: {
      color: "bg-yellow-500",
      text: "확인 중",
      textColor: "text-yellow-400",
    },
  };

  const { color, text, textColor } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span
        className={`h-2 w-2 rounded-full ${color} ${
          status === "online" ? "animate-pulse-dot" : ""
        }`}
      />
      {text}
      {timeAgo && (
        <span className="text-slate-500 font-normal">({timeAgo})</span>
      )}
    </span>
  );
}
