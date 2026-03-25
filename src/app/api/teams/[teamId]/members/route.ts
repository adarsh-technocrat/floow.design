import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeamMembership } from "@/lib/team-auth";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;
  const body = await req.json();
  const { memberId } = body as { memberId?: string };
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const requester = await requireTeamMembership(userId, teamId, "ADMIN");
  if (!requester)
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );

  const target = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });
  if (!target || target.teamId !== teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "Cannot remove the team owner" },
      { status: 400 },
    );
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;
  const body = await req.json();
  const { memberId, role } = body as {
    memberId?: string;
    role?: "ADMIN" | "MEMBER";
  };
  if (!memberId || !role) {
    return NextResponse.json(
      { error: "memberId and role required" },
      { status: 400 },
    );
  }

  const requester = await requireTeamMembership(userId, teamId, "OWNER");
  if (!requester)
    return NextResponse.json(
      { error: "Only the owner can change roles" },
      { status: 403 },
    );

  const target = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });
  if (!target || target.teamId !== teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "Cannot change the owner role" },
      { status: 400 },
    );
  }

  await prisma.teamMember.update({ where: { id: memberId }, data: { role } });
  return NextResponse.json({ ok: true });
}
