import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findDevicesByUser } from "@/lib/db/queries/devices";
import { checkDeviceStatus } from "@/lib/network/status-checker";
import { updateDeviceStatus } from "@/lib/db/queries/devices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_CHECK_INTERVAL = 30000; // 30초
const HEARTBEAT_INTERVAL = 25000; // 25초

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  let userUuid: string;
  try {
    const payload = await verifyAccessToken(accessToken);
    userUuid = payload.userUuid;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let statusTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          closed = true;
        }
      };

      const checkStatuses = async () => {
        if (closed) return;
        try {
          const devices = await findDevicesByUser(userUuid);
          const devicesWithIp = devices.filter((d) => d.ipAddress);

          const results = await Promise.all(
            devicesWithIp.map(async (device) => {
              const status = await checkDeviceStatus(device.ipAddress!);
              if (status !== device.lastStatus) {
                await updateDeviceStatus(device.deviceUuid, status);
              }
              return {
                deviceUuid: device.deviceUuid,
                status,
                checkedAt: new Date().toISOString(),
              };
            })
          );

          send("status", JSON.stringify(results));
        } catch {
          // 에러 무시, 다음 주기에 재시도
        }
      };

      // 초기 상태 확인
      await checkStatuses();

      // 주기적 상태 확인
      statusTimer = setInterval(checkStatuses, STATUS_CHECK_INTERVAL);

      // 하트비트
      heartbeatTimer = setInterval(() => {
        send("heartbeat", "{}");
      }, HEARTBEAT_INTERVAL);

      // 연결 종료 감지
      request.signal.addEventListener("abort", () => {
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (statusTimer) clearInterval(statusTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      closed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (statusTimer) clearInterval(statusTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
