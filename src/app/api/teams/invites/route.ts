import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return NextResponse.json({ invites: [] });

  const invites = await prisma.teamInvite.findMany({
    where: { email: user.email.toLowerCase(), status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      team: { select: { id: true, name: true } },
      inviter: { select: { displayName: true, email: true } },
    },
  });

  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, token, action } = body as {
    userId?: string;
    token?: string;
    action?: "accept" | "decline";
  };
  if (!userId || !token || !action) {
    return NextResponse.json({ error: "userId, token, and action required" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: { select: { id: true, name: true } } },
  });

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }
  if (invite.expiresAt < new Date()) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  if (action === "decline") {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED" },
    });
    return NextResponse.json({ ok: true });
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId } },
  });
  if (existingMember) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ ok: true, teamId: invite.teamId });
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: invite.role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({ ok: true, teamId: invite.teamId, teamName: invite.team.name });
}
