import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/user/credits/daily?userId=X&days=180 — daily credit usage for heatmap
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const days = Math.min(
    parseInt(req.nextUrl.searchParams.get("days") || "180", 10),
    365,
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Get all deduction logs grouped by day
    const logs = await prisma.creditLog.findMany({
      where: {
        userId,
        amount: { lt: 0 }, // only deductions
        createdAt: { gte: since },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate by date string (YYYY-MM-DD)
    const dailyMap: Record<string, number> = {};
    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split("T")[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Math.abs(log.amount);
    }

    // Build array for the requested period
    const result: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: dailyMap[key] || 0 });
    }

    return NextResponse.json({ days: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
