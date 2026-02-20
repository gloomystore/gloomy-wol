import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { deviceSchema } from "@/lib/validations/device";
import { findDevicesByUser, createDevice } from "@/lib/db/queries/devices";
import { logger } from "@/lib/logger";

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

export async function GET() {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const devices = await findDevicesByUser(userUuid);
    logger.info("DEVICE", `장치 목록 조회`, { userUuid, count: devices.length });
    return NextResponse.json({ success: true, data: { devices } });
  } catch (error) {
    logger.error("DEVICE", `장치 목록 조회 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "장치 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = deviceSchema.safeParse(body);
    if (!result.success) {
      logger.warn("DEVICE", `장치 추가 유효성 검사 실패`, { userUuid, errors: result.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          success: false,
          error: "유효성 검사 실패",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const device = await createDevice(userUuid, result.data);
    logger.info("DEVICE", `장치 추가 완료`, {
      userUuid,
      deviceUuid: device.deviceUuid,
      name: result.data.name,
      mac: result.data.macAddress,
      ip: result.data.ipAddress,
    });
    return NextResponse.json({ success: true, data: { device } }, { status: 201 });
  } catch (error) {
    logger.error("DEVICE", `장치 추가 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "장치 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
