import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { deviceSchema } from "@/lib/validations/device";
import {
  findDeviceByUuid,
  updateDevice,
  deleteDevice,
} from "@/lib/db/queries/devices";
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
      logger.warn("DEVICE", `장치 조회 실패 - 없음`, { userUuid, deviceUuid: id });
      return NextResponse.json(
        { success: false, error: "장치를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    logger.info("DEVICE", `장치 상세 조회`, { userUuid, deviceUuid: id, name: device.name });
    return NextResponse.json({ success: true, data: { device } });
  } catch (error) {
    logger.error("DEVICE", `장치 조회 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "장치 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const result = deviceSchema.partial().safeParse(body);
    if (!result.success) {
      logger.warn("DEVICE", `장치 수정 유효성 검사 실패`, { userUuid, deviceUuid: id, errors: result.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          success: false,
          error: "유효성 검사 실패",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const device = await updateDevice(id, userUuid, result.data);
    if (!device) {
      logger.warn("DEVICE", `장치 수정 실패 - 없음`, { userUuid, deviceUuid: id });
      return NextResponse.json(
        { success: false, error: "장치를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    logger.info("DEVICE", `장치 수정 완료`, { userUuid, deviceUuid: id, changes: Object.keys(result.data) });
    return NextResponse.json({ success: true, data: { device } });
  } catch (error) {
    logger.error("DEVICE", `장치 수정 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "장치 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const deleted = await deleteDevice(id, userUuid);
    if (!deleted) {
      logger.warn("DEVICE", `장치 삭제 실패 - 없음`, { userUuid, deviceUuid: id });
      return NextResponse.json(
        { success: false, error: "장치를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    logger.info("DEVICE", `장치 삭제 완료`, { userUuid, deviceUuid: id });
    return NextResponse.json({ success: true, message: "장치가 삭제되었습니다" });
  } catch (error) {
    logger.error("DEVICE", `장치 삭제 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "장치 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
