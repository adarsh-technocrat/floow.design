import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { setNote, deleteNote } from "./store";

async function verifyProjectAccess(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, teamId: true },
  });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  if (project.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId } },
    });
    return !!member;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const body = await req.json();
    const { noteId, projectId, ...meta } = body as {
      noteId?: string;
      projectId?: string;
      text?: string;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      color?: string;
      fontSize?: number;
    };

    if (!noteId || !projectId) {
      return NextResponse.json(
        { error: "noteId and projectId required" },
        { status: 400 },
      );
    }

    if (!(await verifyProjectAccess(projectId, userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await setNote(noteId, projectId, meta);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const noteId = req.nextUrl.searchParams.get("noteId");
    if (!noteId) {
      return NextResponse.json(
        { error: "noteId query parameter required" },
        { status: 400 },
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { projectId: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!(await verifyProjectAccess(note.projectId, userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteNote(noteId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
