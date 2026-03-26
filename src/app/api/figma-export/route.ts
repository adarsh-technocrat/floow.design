import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.to.design/html";
const API_KEY = process.env.CODE_TO_DESIGN_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Figma export is not configured" },
      { status: 503 },
    );
  }

  try {
    const { html } = (await req.json()) as { html?: string };

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "html field is required" },
        { status: 400 },
      );
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ html, clip: true }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `code.to.design API error: ${res.status}`, detail: text },
        { status: res.status },
      );
    }

    const clipboardData = await res.text();
    return new NextResponse(clipboardData, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
