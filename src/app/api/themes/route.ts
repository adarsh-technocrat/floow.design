import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureVariantMap, resolveVariant } from "@/lib/screen-utils";

function normalizeThemeResponse(theme: {
  id: string;
  name: string;
  variables: unknown;
}) {
  return {
    id: theme.id,
    name: theme.name,
    variants: ensureVariantMap(theme.variables),
  };
}

export async function GET(req: NextRequest) {
  const themeId = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  if (themeId) {
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true, name: true, variables: true, userId: true },
    });
    if (!theme) return NextResponse.json({ theme: null });
    return NextResponse.json({ theme: normalizeThemeResponse(theme) });
  }

  if (userId) {
    const themes = await prisma.theme.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        variables: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      themes: themes.map(normalizeThemeResponse),
    });
  }

  return NextResponse.json({ error: "id or userId required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name, variants, variables } = body as {
    userId?: string;
    name?: string;
    variants?: Record<string, Record<string, string>>;
    variables?: Record<string, string>;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Accept either new `variants` format or old `variables` format
  const toStore = variants ?? ensureVariantMap(variables ?? {});

  const theme = await prisma.theme.create({
    data: {
      userId,
      name: name || "Untitled Theme",
      variables: toStore,
    },
  });

  return NextResponse.json(normalizeThemeResponse(theme));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, variants, variables, variantName } = body as {
    id?: string;
    name?: string;
    variants?: Record<string, Record<string, string>>;
    variables?: Record<string, string>;
    variantName?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;

  if (variants !== undefined) {
    // Full variants object replacement
    updateData.variables = variants;
  } else if (variables !== undefined && variantName) {
    // Update a single variant within the existing theme
    const existing = await prisma.theme.findUnique({
      where: { id },
      select: { variables: true },
    });
    const currentVariants = ensureVariantMap(existing?.variables);
    const resolvedBase = resolveVariant(currentVariants, variantName);
    currentVariants[variantName] = {
      ...resolvedBase,
      ...variables,
    };
    updateData.variables = currentVariants;
  } else if (variables !== undefined) {
    // Legacy: flat variables — auto-migrate
    updateData.variables = ensureVariantMap(variables);
  }

  const theme = await prisma.theme.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(normalizeThemeResponse(theme));
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
