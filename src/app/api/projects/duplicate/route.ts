import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const source = await prisma.project.findUnique({
      where: { id },
      select: {
        name: true,
        ownerId: true,
        teamId: true,
        frames: {
          select: {
            label: true,
            left: true,
            top: true,
            html: true,
            themeId: true,
            variantName: true,
          },
          orderBy: { left: "asc" },
        },
      },
    });

    if (!source || source.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const duplicate = await prisma.project.create({
      data: {
        name: `${source.name} (copy)`,
        ownerId: userId,
        ...(source.teamId ? { teamId: source.teamId } : {}),
        frames: {
          create: source.frames.map((f) => ({
            id: crypto.randomUUID().replace(/-/g, "").slice(0, 20),
            label: f.label,
            left: f.left,
            top: f.top,
            html: f.html,
            themeId: f.themeId,
            variantName: f.variantName,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { frames: true } },
      },
    });

    return NextResponse.json({
      id: duplicate.id,
      name: duplicate.name,
      screens: duplicate._count.frames,
      createdAt: duplicate.createdAt.toISOString(),
      updatedAt: duplicate.updatedAt.toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
