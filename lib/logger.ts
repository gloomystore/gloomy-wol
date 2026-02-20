type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

function getTimestamp(): string {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatLog(level: LogLevel, category: string, message: string, meta?: Record<string, unknown>): string {
  const ts = getTimestamp();
  const metaStr = meta ? " " + JSON.stringify(meta) : "";
  return `[${ts}] [${level}] [${category}] ${message}${metaStr}`;
}

export const logger = {
  debug(category: string, message: string, meta?: Record<string, unknown>) {
    console.log(formatLog("DEBUG", category, message, meta));
  },
  info(category: string, message: string, meta?: Record<string, unknown>) {
    console.log(formatLog("INFO", category, message, meta));
  },
  warn(category: string, message: string, meta?: Record<string, unknown>) {
    console.warn(formatLog("WARN", category, message, meta));
  },
  error(category: string, message: string, meta?: Record<string, unknown>) {
    console.error(formatLog("ERROR", category, message, meta));
  },
};
