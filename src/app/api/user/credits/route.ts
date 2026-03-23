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

    // Resolve project names for logs that have projectId
    const projectIds = [
      ...new Set(logs.map((l) => l.projectId).filter(Boolean) as string[]),
    ];
    const projects =
      projectIds.length > 0
        ? await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
          })
        : [];
    const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        amount: l.amount,
        balance: l.balance,
        projectId: l.projectId,
        projectName: l.projectId
          ? projectNameMap.get(l.projectId) ?? null
          : null,
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
