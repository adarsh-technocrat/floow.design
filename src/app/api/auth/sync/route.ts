import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email/send";
import { requireAuth } from "@/lib/auth";

const providerMap: Record<string, string> = {
  "google.com": "GOOGLE",
  "github.com": "GITHUB",
  "apple.com": "APPLE",
  password: "EMAIL",
};

// POST /api/auth/sync — upsert user record after Firebase auth
export async function POST(req: NextRequest) {
  const [uid, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email as string) || null;
  const displayName = (body.displayName as string) || null;
  const photoURL = (body.photoURL as string) || null;
  const phoneNumber = (body.phoneNumber as string) || null;
  const provider = body.provider as string | undefined;

  // Map Firebase provider ID to our enum string value
  const mappedProvider = provider
    ? ((providerMap[provider] as "GOOGLE" | "GITHUB" | "APPLE" | "EMAIL") ??
      null)
    : null;

  try {
    // Handle email uniqueness conflict:
    // If a stale user row exists with this email under a different ID,
    // clear its email so our upsert won't conflict.
    if (email) {
      await prisma.user.updateMany({
        where: { email, NOT: { id: uid } },
        data: { email: null },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true },
    });
    const isNewUser = !existingUser;

    await prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        email,
        displayName,
        photoURL,
        phoneNumber,
        provider: mappedProvider,
      },
      update: {
        email,
        displayName,
        photoURL,
        phoneNumber,
        provider: mappedProvider,
      },
    });

    if (isNewUser && email) {
      sendWelcomeEmail(email, displayName || "").catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null
          ? JSON.stringify(e)
          : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
