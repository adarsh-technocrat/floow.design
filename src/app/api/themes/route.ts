import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const themeId = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  if (themeId) {
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true, name: true, variables: true, userId: true },
    });
    return NextResponse.json({ theme });
  }

  if (userId) {
    const themes = await prisma.theme.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, variables: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ themes });
  }

  return NextResponse.json({ error: "id or userId required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name, variables } = body as {
    userId?: string;
    name?: string;
    variables?: Record<string, string>;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const theme = await prisma.theme.create({
    data: {
      userId,
      name: name || "Default",
      variables: variables ?? {},
    },
  });

  return NextResponse.json({
    id: theme.id,
    name: theme.name,
    variables: theme.variables,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, variables } = body as {
    id?: string;
    name?: string;
    variables?: Record<string, string>;
  };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (variables !== undefined) updateData.variables = variables;

  const theme = await prisma.theme.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    id: theme.id,
    name: theme.name,
    variables: theme.variables,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.frame.updateMany({
    where: { themeId: id },
    data: { themeId: null },
  });

  await prisma.theme.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
