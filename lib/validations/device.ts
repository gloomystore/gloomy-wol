import { z } from "zod";

const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

export const deviceSchema = z.object({
  name: z
    .string()
    .min(1, "장치 이름을 입력하세요")
    .max(100, "장치 이름은 100자 이하여야 합니다"),
  macAddress: z
    .string()
    .min(1, "MAC 주소를 입력하세요")
    .regex(macAddressRegex, "유효한 MAC 주소 형식이 아닙니다 (예: AA:BB:CC:DD:EE:FF)"),
  ipAddress: z
    .string()
    .regex(ipAddressRegex, "유효한 IP 주소 형식이 아닙니다")
    .optional()
    .or(z.literal("")),
  broadcastAddress: z
    .string()
    .regex(ipAddressRegex, "유효한 브로드캐스트 주소 형식이 아닙니다")
    .optional()
    .or(z.literal("")),
  port: z
    .number()
    .int()
    .min(1, "포트는 1 이상이어야 합니다")
    .max(65535, "포트는 65535 이하여야 합니다")
    .optional(),
  memo: z.string().max(500, "메모는 500자 이하여야 합니다").optional(),
  repeatCount: z
    .number()
    .int()
    .min(1, "반복 횟수는 1 이상이어야 합니다")
    .max(10, "반복 횟수는 10 이하여야 합니다")
    .optional(),
  repeatIntervalMs: z
    .number()
    .int()
    .min(100, "반복 간격은 100ms 이상이어야 합니다")
    .max(5000, "반복 간격은 5000ms 이하여야 합니다")
    .optional(),
  isFavorite: z.boolean().optional(),
});

export type DeviceInput = z.infer<typeof deviceSchema>;
