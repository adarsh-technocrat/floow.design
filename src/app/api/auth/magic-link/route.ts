import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/firebase/admin";
import { sendMagicLinkEmail } from "@/lib/email/send";

const bodySchema = z.object({
  email: z.string().email(),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.floow.design";

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const auth = getAdminAuth();

    const signInLink = await auth.generateSignInWithEmailLink(email, {
      url: `${SITE_URL}/signin`,
      handleCodeInApp: true,
    });

    await sendMagicLinkEmail(email, signInLink);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send magic link" },
      { status: 500 },
    );
  }
}
