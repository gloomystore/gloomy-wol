import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { findHistoryByDevice } from "@/lib/db/queries/history";
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
    const history = await findHistoryByDevice(id, userUuid);

    logger.info("HISTORY", `WoL 이력 조회`, { userUuid, deviceUuid: id, count: history.length });

    return NextResponse.json({ success: true, data: { history } });
  } catch (error) {
    logger.error("HISTORY", `이력 조회 오류`, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "이력 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
