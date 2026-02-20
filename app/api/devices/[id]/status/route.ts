import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findDeviceByUuid, updateDeviceStatus } from "@/lib/db/queries/devices";
import { checkDeviceStatus } from "@/lib/network/status-checker";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json(
        { success: false, error: "장치를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!device.ipAddress) {
      return NextResponse.json({
        success: true,
        data: { status: "unknown", checkedAt: new Date().toISOString() },
      });
    }

    const status = await checkDeviceStatus(device.ipAddress);
    await updateDeviceStatus(device.deviceUuid, status);

    if (status !== device.lastStatus) {
      logger.info("STATUS", `개별 장치 상태 변경`, {
        deviceUuid: device.deviceUuid,
        deviceName: device.name,
        ip: device.ipAddress,
        before: device.lastStatus,
        after: status,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("STATUS", `개별 상태 확인 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
