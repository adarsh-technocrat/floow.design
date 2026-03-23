import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeamMembership } from "@/lib/team-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const body = await req.json();
  const { userId, memberId } = body as { userId?: string; memberId?: string };
  if (!userId || !memberId) {
    return NextResponse.json({ error: "userId and memberId required" }, { status: 400 });
  }

  const requester = await requireTeamMembership(userId, teamId, "ADMIN");
  if (!requester) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 400 });
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const body = await req.json();
  const { userId, memberId, role } = body as {
    userId?: string;
    memberId?: string;
    role?: "ADMIN" | "MEMBER";
  };
  if (!userId || !memberId || !role) {
    return NextResponse.json({ error: "userId, memberId, and role required" }, { status: 400 });
  }

  const requester = await requireTeamMembership(userId, teamId, "OWNER");
  if (!requester) return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });

  const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change the owner role" }, { status: 400 });
  }

  await prisma.teamMember.update({ where: { id: memberId }, data: { role } });
  return NextResponse.json({ ok: true });
}
