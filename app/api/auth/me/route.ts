import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findUserByUuid } from "@/lib/db/queries/users";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyAccessToken(accessToken);
    } catch {
      logger.debug("AUTH", `me 조회 실패 - 만료된 토큰`, { ip });
      return NextResponse.json(
        { success: false, error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    const user = await findUserByUuid(payload.userUuid);
    if (!user) {
      logger.warn("AUTH", `me 조회 실패 - 사용자 없음`, { userUuid: payload.userUuid, ip });
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          userUuid: user.userUuid,
          userId: user.userId,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    logger.error("AUTH", `사용자 정보 조회 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "사용자 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
