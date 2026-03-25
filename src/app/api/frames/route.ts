import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { setFrame, deleteFrame } from "./store";

// Verify the authenticated user owns the project (or is a team member)
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
    const { frameId, html, label, left, top, projectId, themeId } = body as {
      frameId?: string;
      html?: string;
      label?: string;
      left?: number;
      top?: number;
      projectId?: string;
      themeId?: string;
    };
    if (!frameId || typeof html !== "string") {
      return NextResponse.json(
        { error: "frameId and html required" },
        { status: 400 },
      );
    }
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // Verify ownership before modifying frames
    if (!(await verifyProjectAccess(projectId, userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await setFrame(frameId, html, { label, left, top, projectId, themeId });
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
    const frameId = req.nextUrl.searchParams.get("frameId");
    if (!frameId) {
      return NextResponse.json(
        { error: "frameId query parameter required" },
        { status: 400 },
      );
    }

    // Verify the frame's project belongs to this user
    const frame = await prisma.frame.findUnique({
      where: { id: frameId },
      select: { projectId: true },
    });

    if (!frame) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!(await verifyProjectAccess(frame.projectId, userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteFrame(frameId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
