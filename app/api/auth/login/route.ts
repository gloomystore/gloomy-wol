import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "@/lib/auth/jwt";
import { findUserByUserId, saveRefreshToken } from "@/lib/db/queries/users";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      logger.warn("AUTH", `로그인 유효성 검사 실패`, { ip, errors: result.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          success: false,
          error: "유효성 검사 실패",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, password } = result.data;

    logger.info("AUTH", `로그인 시도`, { userId, ip });

    const user = await findUserByUserId(userId);
    if (!user) {
      logger.warn("AUTH", `로그인 실패 - 존재하지 않는 사용자`, { userId, ip });
      return NextResponse.json(
        { success: false, error: "아이디 또는 비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      logger.warn("AUTH", `로그인 실패 - 비밀번호 불일치`, { userId, ip });
      return NextResponse.json(
        { success: false, error: "아이디 또는 비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    const accessToken = await generateAccessToken(user.userUuid);
    const refreshToken = await generateRefreshToken(user.userUuid);

    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.userUuid, refreshTokenHash, expiresAt);

    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, getAccessTokenCookieOptions());
    cookieStore.set("refresh_token", refreshToken, getRefreshTokenCookieOptions());

    logger.info("AUTH", `로그인 성공`, { userId, userUuid: user.userUuid, ip });

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
    logger.error("AUTH", `로그인 처리 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "로그인 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
