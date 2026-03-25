import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeamMembership } from "@/lib/team-auth";
import { sendTeamInviteEmail } from "@/lib/email/send";
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

  const invites = await prisma.teamInvite.findMany({
    where: { teamId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      inviter: { select: { displayName: true, email: true } },
    },
  });

  return NextResponse.json({ invites });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;
  const body = await req.json();
  const { email, role = "MEMBER" } = body as {
    email?: string;
    role?: "ADMIN" | "MEMBER";
  };
  if (!email?.trim()) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const requester = await requireTeamMembership(userId, teamId, "ADMIN");
  if (!requester)
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId, user: { email: email.trim().toLowerCase() } },
  });
  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a team member" },
      { status: 400 },
    );
  }

  const existingInvite = await prisma.teamInvite.findFirst({
    where: { teamId, email: email.trim().toLowerCase(), status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "Invite already sent to this email" },
      { status: 400 },
    );
  }

  const [invite, inviterUser, team] = await Promise.all([
    prisma.teamInvite.create({
      data: {
        teamId,
        email: email.trim().toLowerCase(),
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true },
    }),
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
  ]);

  sendTeamInviteEmail(
    email.trim().toLowerCase(),
    inviterUser?.displayName || inviterUser?.email || "A teammate",
    team?.name || "a team",
    invite.token,
  ).catch(() => {});

  return NextResponse.json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const { teamId } = await params;
  const body = await req.json();
  const { inviteId } = body as { inviteId?: string };
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId required" }, { status: 400 });
  }

  const requester = await requireTeamMembership(userId, teamId, "ADMIN");
  if (!requester)
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );

  await prisma.teamInvite.delete({ where: { id: inviteId } });
  return NextResponse.json({ ok: true });
}
