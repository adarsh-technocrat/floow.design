import { prisma } from "@/lib/db";

const ROLE_HIERARCHY = { OWNER: 3, ADMIN: 2, MEMBER: 1 } as const;

type TeamRoleString = "OWNER" | "ADMIN" | "MEMBER";

export async function requireTeamMembership(
  userId: string,
  teamId: string,
  minimumRole: TeamRoleString = "MEMBER",
) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) return null;
  if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minimumRole]) return null;

  return member;
}

export async function resolveCreditsSource(
  userId: string,
  projectId?: string,
): Promise<{ type: "user" | "team"; id: string }> {
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true },
    });
    if (project?.teamId) {
      return { type: "team", id: project.teamId };
    }
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: { select: { id: true, credits: true } } },
  });
  if (membership?.team) {
    return { type: "team", id: membership.team.id };
  }

  return { type: "user", id: userId };
}
