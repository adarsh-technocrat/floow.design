import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/projects — list active (non-trashed) projects for the authenticated user
export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const teamId = req.nextUrl.searchParams.get("teamId");

  try {
    const where: Record<string, unknown> = {
      trashedAt: null,
      isTemplate: false,
    };

    if (teamId) {
      where.teamId = teamId;
    } else {
      const teamIds = (
        await prisma.teamMember.findMany({
          where: { userId },
          select: { teamId: true },
        })
      ).map((m) => m.teamId);

      where.OR = [
        { ownerId: userId },
        ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { frames: true } },
        frames: {
          orderBy: { updatedAt: "asc" },
          take: 1,
          select: { html: true },
        },
      },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        screens: p._count.frames,
        thumbnail: p.thumbnail,
        firstFrameHtml: p.frames[0]?.html || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const body = await req.json().catch(() => ({}));
    const { name: rawName, teamId } = body as {
      name?: string;
      teamId?: string;
    };
    const name = rawName || "Untitled Project";

    const project = await prisma.project.create({
      data: {
        name,
        ownerId: userId,
        ...(teamId ? { teamId } : {}),
      },
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      screens: 0,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE /api/projects — soft-delete (trash) a project
export async function DELETE(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership before trashing
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true, teamId: true },
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id },
      data: { trashedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
