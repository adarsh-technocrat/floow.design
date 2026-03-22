import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/user/credits?userId=X&limit=50&offset=0 — get credit usage logs
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "50", 10),
    100,
  );
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

  try {
    const [logs, total] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.creditLog.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        amount: l.amount,
        balance: l.balance,
        projectId: l.projectId,
        meta: l.meta,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
