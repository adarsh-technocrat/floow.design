import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function generateApiKey(): string {
  return "fl_" + randomBytes(28).toString("base64url");
}

// GET — list all API keys for a user (key shown masked)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      key: true,
      lastUsed: true,
      revoked: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  const masked = keys.map((k) => ({
    ...k,
    key: k.key.slice(0, 7) + "..." + k.key.slice(-4),
  }));

  return NextResponse.json({ keys: masked });
}

// POST — create a new API key
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name } = body as { userId?: string; name?: string };
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const keyName = name?.trim() || "Untitled Key";
  const rawKey = generateApiKey();

  const record = await prisma.apiKey.create({
    data: { userId, name: keyName, key: rawKey },
  });

  // Return the full key only on creation — user must copy it now
  return NextResponse.json({ id: record.id, name: record.name, key: rawKey, createdAt: record.createdAt });
}

// DELETE — revoke an API key
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id, userId } = body as { id?: string; userId?: string };
  if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });

  // Ensure the key belongs to the user
  const existing = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.apiKey.update({
    where: { id },
    data: { revoked: true, revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
