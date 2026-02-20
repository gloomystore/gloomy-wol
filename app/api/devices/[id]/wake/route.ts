import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findDeviceByUuid } from "@/lib/db/queries/devices";
import { createWolHistory } from "@/lib/db/queries/history";
import { sendMagicPacket } from "@/lib/wol/magic-packet";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

async function getUserUuid(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    const payload = await verifyAccessToken(accessToken);
    return payload.userUuid;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const device = await findDeviceByUuid(id, userUuid);
    if (!device) {
      logger.warn("WOL", `Wake 요청 실패 - 장치 없음`, { userUuid, deviceUuid: id, ip });
      return NextResponse.json(
        { success: false, error: "장치를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    logger.info("WOL", `Wake 요청 시작`, {
      userUuid,
      deviceUuid: device.deviceUuid,
      deviceName: device.name,
      mac: device.macAddress,
      broadcastAddress: device.broadcastAddress,
      port: device.port,
      repeatCount: device.repeatCount,
      ip,
    });

    try {
      await sendMagicPacket(device.macAddress, {
        broadcastAddress: device.broadcastAddress,
        port: device.port,
        repeatCount: device.repeatCount,
        repeatIntervalMs: device.repeatIntervalMs,
      });

      const history = await createWolHistory(device.deviceUuid, userUuid, "success");

      const responseBody = {
        success: true,
        data: {
          message: `${device.name}에 매직 패킷을 전송했습니다`,
          history,
        },
      };

      logger.info("WOL", `Wake 요청 성공`, {
        userUuid,
        deviceUuid: device.deviceUuid,
        deviceName: device.name,
        mac: device.macAddress,
        historyUuid: history.historyUuid,
        ip,
      });

      return NextResponse.json(responseBody);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      await createWolHistory(device.deviceUuid, userUuid, "failure", errorMessage);

      logger.error("WOL", `Wake 요청 실패 - 패킷 전송 오류`, {
        userUuid,
        deviceUuid: device.deviceUuid,
        deviceName: device.name,
        mac: device.macAddress,
        error: errorMessage,
        ip,
      });

      return NextResponse.json(
        { success: false, error: `매직 패킷 전송 실패: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("WOL", `Wake 처리 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Wake-on-LAN 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
