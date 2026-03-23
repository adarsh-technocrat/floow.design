import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects — list active (non-trashed) projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { trashedAt: null, isTemplate: false },
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
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body as { name?: string }).name || "Untitled Project";

    const project = await prisma.project.create({
      data: { name },
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
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
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
