import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/projects/trash — list trashed projects for the authenticated user
export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const projects = await prisma.project.findMany({
      where: { trashedAt: { not: null }, ownerId: userId },
      orderBy: { trashedAt: "desc" },
      select: {
        id: true,
        name: true,
        trashedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { frames: true } },
      },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        screens: p._count.frames,
        trashedAt: p.trashedAt?.toISOString() ?? null,
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

// POST /api/projects/trash — restore a trashed project
export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership before restoring
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id },
      data: { trashedAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/trash — permanently delete a project and all its data
export async function DELETE(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership before permanent deletion
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete related records first, then the project
    await prisma.$transaction([
      prisma.chatSession.deleteMany({ where: { projectId: id } }),
      prisma.frame.deleteMany({ where: { projectId: id } }),
      prisma.project.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
