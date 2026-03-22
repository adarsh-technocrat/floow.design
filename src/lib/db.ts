import { PrismaClient } from "@prisma/client";
import { DEFAULT_PROJECT_ID } from "@/constants/project";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensureProject(projectId: string = DEFAULT_PROJECT_ID) {
  await prisma.project.upsert({
    where: { id: projectId },
    create: { id: projectId },
    update: {},
  });
}

export async function ensureUser(
  userId: string,
  meta?: { email?: string | null; displayName?: string | null },
) {
  const update =
    meta &&
    (meta.email !== undefined || meta.displayName !== undefined)
      ? {
          ...(meta.email !== undefined ? { email: meta.email } : {}),
          ...(meta.displayName !== undefined
            ? { displayName: meta.displayName }
            : {}),
        }
      : {};
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: meta?.email ?? undefined,
      displayName: meta?.displayName ?? undefined,
    },
    update,
  });
}

export const ensureDefaultProject = () => ensureProject(DEFAULT_PROJECT_ID);
