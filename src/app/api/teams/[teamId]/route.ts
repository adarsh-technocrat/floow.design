import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeamMembership } from "@/lib/team-auth";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;

  const member = await requireTeamMembership(userId, teamId);
  if (!member)
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      credits: true,
      seats: true,
      creditsResetAt: true,
      billingInterval: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          user: {
            select: { email: true, displayName: true, photoURL: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { projects: true } },
    },
  });

  if (!team)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return NextResponse.json({ team });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;
  const body = await req.json();
  const { name } = body as { name?: string };

  const member = await requireTeamMembership(userId, teamId, "ADMIN");
  if (!member)
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { ...(name?.trim() ? { name: name.trim() } : {}) },
  });

  return NextResponse.json({ id: updated.id, name: updated.name });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;

  const member = await requireTeamMembership(userId, teamId, "OWNER");
  if (!member)
    return NextResponse.json(
      { error: "Only the owner can delete the team" },
      { status: 403 },
    );

  await prisma.$transaction([
    prisma.teamInvite.deleteMany({ where: { teamId } }),
    prisma.teamCreditLog.deleteMany({ where: { teamId } }),
    prisma.teamMember.deleteMany({ where: { teamId } }),
    prisma.project.updateMany({ where: { teamId }, data: { teamId: null } }),
    prisma.team.delete({ where: { id: teamId } }),
  ]);

  return NextResponse.json({ ok: true });
}
