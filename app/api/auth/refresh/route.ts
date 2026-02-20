import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "@/lib/auth/jwt";
import { findUserByUuid, saveRefreshToken } from "@/lib/db/queries/users";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      logger.warn("AUTH", `토큰 갱신 실패 - refresh token 없음`, { ip });
      return NextResponse.json(
        { success: false, error: "Refresh token이 없습니다" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      logger.warn("AUTH", `토큰 갱신 실패 - 유효하지 않은 refresh token`, { ip });
      return NextResponse.json(
        { success: false, error: "유효하지 않은 refresh token입니다" },
        { status: 401 }
      );
    }

    const user = await findUserByUuid(payload.userUuid);
    if (!user) {
      logger.warn("AUTH", `토큰 갱신 실패 - 사용자 없음`, { userUuid: payload.userUuid, ip });
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    const newAccessToken = await generateAccessToken(user.userUuid);
    const newRefreshToken = await generateRefreshToken(user.userUuid);

    const newRefreshTokenHash = await hashPassword(newRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.userUuid, newRefreshTokenHash, expiresAt);

    cookieStore.set("access_token", newAccessToken, getAccessTokenCookieOptions());
    cookieStore.set("refresh_token", newRefreshToken, getRefreshTokenCookieOptions());

    logger.info("AUTH", `토큰 갱신 성공`, { userId: user.userId, userUuid: user.userUuid, ip });

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
    logger.error("AUTH", `토큰 갱신 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "토큰 갱신 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
