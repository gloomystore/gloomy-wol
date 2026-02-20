import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findDevicesByUser, updateDeviceStatus } from "@/lib/db/queries/devices";
import { checkDeviceStatus } from "@/lib/network/status-checker";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const devices = await findDevicesByUser(userUuid);

    // IP가 있는 장치들 동시에 ping
    const results = await Promise.all(
      devices.map(async (device) => {
        if (!device.ipAddress) {
          return {
            deviceUuid: device.deviceUuid,
            status: "unknown" as const,
          };
        }

        const status = await checkDeviceStatus(device.ipAddress);

        // DB 상태가 바뀌었으면 업데이트 + 로그
        if (status !== device.lastStatus) {
          await updateDeviceStatus(device.deviceUuid, status);
          logger.info("STATUS", `장치 상태 변경`, {
            deviceUuid: device.deviceUuid,
            deviceName: device.name,
            ip: device.ipAddress,
            before: device.lastStatus,
            after: status,
          });
        }

        return {
          deviceUuid: device.deviceUuid,
          status,
        };
      })
    );

    return NextResponse.json({ success: true, data: { statuses: results } });
  } catch (error) {
    logger.error("STATUS", `전체 상태 확인 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
