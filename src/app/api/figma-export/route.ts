import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.to.design/html";
const API_KEY = process.env.CODE_TO_DESIGN_API_KEY;

/** Wrap frame HTML in a full document so code.to.design renders it correctly. */
function wrapHtml(html: string): string {
  // If it's already a full document, use as-is
  if (html.trimStart().toLowerCase().startsWith("<!doctype")) return html;

  return `<!DOCTYPE html>
<html lang="en" style="background: transparent;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Frame</title>
</head>
<body style="margin: 0; padding: 0; background: transparent;">
${html}
</body>
</html>`;
}

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

    const wrappedHtml = wrapHtml(html);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ html: wrappedHtml, clip: true }),
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
