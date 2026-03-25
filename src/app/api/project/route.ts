import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";
import { ensureVariantMap } from "@/lib/screen-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const projectId = req.nextUrl.searchParams.get("id") ?? "";

    if (!projectId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership before returning project data
    const projectCheck = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, teamId: true },
    });

    if (!projectCheck) {
      return NextResponse.json({
        name: "Untitled Project",
        frames: [],
        messages: [],
      });
    }

    // Allow access if user owns the project or is a team member
    if (projectCheck.ownerId !== userId) {
      if (projectCheck.teamId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: projectCheck.teamId, userId } },
        });
        if (!teamMember) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const [project, chatSession, userThemes] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          frames: {
            select: {
              id: true,
              label: true,
              left: true,
              top: true,
              html: true,
              themeId: true,
              variantName: true,
              theme: { select: { id: true, name: true, variables: true } },
            },
          },
        },
      }),
      prisma.chatSession.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { messages: true },
      }),
      prisma.theme.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, variables: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({
        name: "Untitled Project",
        frames: [],
        messages: [],
      });
    }

    const records = (chatSession?.messages as ChatSessionMessageRecord[]) ?? [];
    const messages = recordsToUiMessages(records);

    const frames = project.frames.map((f) => {
      const normalizedVariantName =
        !f.themeId && f.variantName === "light"
          ? undefined
          : (f.variantName ?? undefined);
      return {
        id: f.id,
        label: f.label,
        left: f.left,
        top: f.top,
        html: f.html,
        themeId: f.themeId,
        variantName: normalizedVariantName,
      };
    });

    const allThemes = userThemes.reduce(
      (acc, t) => {
        acc[t.id] = {
          id: t.id,
          name: t.name,
          variants: ensureVariantMap(t.variables),
        };
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string;
          variants: Record<string, Record<string, string>>;
        }
      >,
    );

    return NextResponse.json({
      name: project.name,
      frames,
      messages,
      themes: Object.values(allThemes),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
