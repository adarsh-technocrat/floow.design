import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { resend } from "@/lib/email/client";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    [key: string]: unknown;
  };
}

function getRecipientEmail(data: ResendWebhookPayload["data"]): string | null {
  if (data.to && data.to.length > 0) return data.to[0];
  return null;
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET || !AUDIENCE_ID) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const body = await req.text();

  // Verify webhook signature
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  let payload: ResendWebhookPayload;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const email = getRecipientEmail(payload.data);
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  try {
    switch (payload.type) {
      case "email.delivered": {
        // Add to audience on successful delivery
        await resend.contacts.create({
          audienceId: AUDIENCE_ID,
          email,
          unsubscribed: false,
        });
        break;
      }

      case "email.bounced": {
        // Remove bounced contacts from audience
        await resend.contacts.remove({
          audienceId: AUDIENCE_ID,
          email,
        });
        break;
      }

      case "email.complained": {
        // Unsubscribe contacts who marked as spam
        await resend.contacts.update({
          audienceId: AUDIENCE_ID,
          id: email,
          unsubscribed: true,
        });
        break;
      }
    }
  } catch {
    // Silent fail — audience sync is non-critical
  }

  return NextResponse.json({ ok: true });
}
