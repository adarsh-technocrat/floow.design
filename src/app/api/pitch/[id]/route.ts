import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureVariantMap } from "@/lib/screen-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        ownerId: true,
        frames: {
          select: { id: true, label: true, html: true },
          orderBy: { updatedAt: "desc" },
          take: 3,
        },
        pitchConcepts: {
          orderBy: { slotIndex: "asc" },
          select: {
            slotIndex: true,
            themeId: true,
            variantName: true,
            description: true,
            hidden: true,
          },
        },
        pitchComments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slotIndex: true,
            author: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userThemes = await prisma.theme.findMany({
      where: { userId: project.ownerId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, variables: true },
    });

    const themes = userThemes.map((t) => ({
      id: t.id,
      name: t.name,
      variants: ensureVariantMap(t.variables),
    }));

    const frames = project.frames.map((f) => ({
      id: f.id,
      label: f.label,
      html: f.html,
    }));

    const slots = Array.from({ length: 3 }, (_, i) => {
      const saved = project.pitchConcepts.find((c) => c.slotIndex === i);
      return {
        themeId: saved?.themeId ?? null,
        variantName: saved?.variantName ?? "light",
        description: saved?.description ?? "",
        hidden: saved?.hidden ?? false,
      };
    });

    return NextResponse.json({
      name: project.name,
      frames,
      themes,
      slots,
      comments: project.pitchComments,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  try {
    const body = (await req.json()) as {
      slots: {
        themeId: string | null;
        variantName: string;
        description: string;
        hidden: boolean;
      }[];
    };

    if (!Array.isArray(body.slots) || body.slots.length !== 3) {
      return NextResponse.json(
        { error: "slots must be an array of 3 items" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.$transaction(
      body.slots.map((slot, i) =>
        prisma.pitchConcept.upsert({
          where: { projectId_slotIndex: { projectId, slotIndex: i } },
          create: {
            projectId,
            slotIndex: i,
            themeId: slot.themeId,
            variantName: slot.variantName,
            description: slot.description,
            hidden: slot.hidden,
          },
          update: {
            themeId: slot.themeId,
            variantName: slot.variantName,
            description: slot.description,
            hidden: slot.hidden,
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  try {
    const body = (await req.json()) as {
      slotIndex: number;
      author: string;
      body: string;
    };

    if (
      typeof body.slotIndex !== "number" ||
      body.slotIndex < 0 ||
      body.slotIndex > 2
    ) {
      return NextResponse.json(
        { error: "slotIndex must be 0, 1, or 2" },
        { status: 400 },
      );
    }

    if (!body.author?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "author and body are required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comment = await prisma.pitchComment.create({
      data: {
        projectId,
        slotIndex: body.slotIndex,
        author: body.author.trim(),
        body: body.body.trim(),
      },
      select: {
        id: true,
        slotIndex: true,
        author: true,
        body: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ comment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
