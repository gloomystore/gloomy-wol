import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { deleteAllRefreshTokens } from "@/lib/db/queries/users";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    let userUuid: string | null = null;
    if (accessToken) {
      try {
        const payload = await verifyAccessToken(accessToken);
        userUuid = payload.userUuid;
        await deleteAllRefreshTokens(payload.userUuid);
      } catch {
        // 토큰이 만료되었어도 로그아웃 처리
      }
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    logger.info("AUTH", `로그아웃`, { userUuid: userUuid || "unknown(expired)", ip });

    return NextResponse.json({
      success: true,
      message: "로그아웃되었습니다",
    });
  } catch (error) {
    logger.error("AUTH", `로그아웃 처리 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "로그아웃 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
