import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

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
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  const body = await req.json();
  const { name } = body as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
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
