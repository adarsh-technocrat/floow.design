import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          credits: true,
          seats: true,
          creditsResetAt: true,
          _count: { select: { members: true, projects: true } },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    ownerId: m.team.ownerId,
    role: m.role,
    credits: m.team.credits,
    seats: m.team.seats,
    creditsResetAt: m.team.creditsResetAt?.toISOString() ?? null,
    memberCount: m.team._count.members,
    projectCount: m.team._count.projects,
  }));

  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name } = body as { userId?: string; name?: string };
  if (!userId || !name?.trim()) {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  return NextResponse.json({ id: team.id, name: team.name });
}
