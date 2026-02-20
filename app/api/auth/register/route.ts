import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "@/lib/auth/jwt";
import {
  findUserByEmail,
  findUserByUserId,
  createUser,
  saveRefreshToken,
} from "@/lib/db/queries/users";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      logger.warn("AUTH", `회원가입 유효성 검사 실패`, { ip, errors: result.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          success: false,
          error: "유효성 검사 실패",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, email, password } = result.data;

    logger.info("AUTH", `회원가입 시도`, { userId, email, ip });

    const existingUserId = await findUserByUserId(userId);
    if (existingUserId) {
      logger.warn("AUTH", `회원가입 실패 - 중복 아이디`, { userId, ip });
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 아이디입니다" },
        { status: 409 }
      );
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      logger.warn("AUTH", `회원가입 실패 - 중복 이메일`, { email, ip });
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(userId, email, passwordHash);

    const accessToken = await generateAccessToken(user.userUuid);
    const refreshToken = await generateRefreshToken(user.userUuid);

    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(user.userUuid, refreshTokenHash, expiresAt);

    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, getAccessTokenCookieOptions());
    cookieStore.set("refresh_token", refreshToken, getRefreshTokenCookieOptions());

    logger.info("AUTH", `회원가입 성공`, { userId, userUuid: user.userUuid, email, ip });

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
    logger.error("AUTH", `회원가입 처리 중 오류`, { ip, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
