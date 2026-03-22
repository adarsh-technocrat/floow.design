import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthProvider } from "@prisma/client";

const providerMap: Record<string, AuthProvider> = {
  "google.com": AuthProvider.GOOGLE,
  "github.com": AuthProvider.GITHUB,
  "apple.com": AuthProvider.APPLE,
  password: AuthProvider.EMAIL,
};

// POST /api/auth/sync — upsert user record after Firebase auth
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      uid?: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      phoneNumber?: string;
      provider?: string;
    };

    const { uid, email, displayName, photoURL, phoneNumber, provider } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    const mappedProvider = provider ? providerMap[provider] ?? null : null;

    await prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        email: email || null,
        displayName: displayName || null,
        photoURL: photoURL || null,
        phoneNumber: phoneNumber || null,
        provider: mappedProvider,
      },
      update: {
        ...(email !== undefined && { email }),
        ...(displayName !== undefined && { displayName }),
        ...(photoURL !== undefined && { photoURL }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(provider !== undefined && { provider: mappedProvider }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
