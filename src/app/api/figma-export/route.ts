import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.to.design/html";
const API_KEY = process.env.CODE_TO_DESIGN_API_KEY;

/** Wrap frame HTML in a full document at the correct dimensions. */
function wrapHtml(
  html: string,
  width?: number,
  height?: number,
  label?: string,
): string {
  if (html.trimStart().toLowerCase().startsWith("<!doctype")) return html;

  const w = width ?? 430;
  const h = height ?? 932;
  const title = label || "Screen";

  return `<!DOCTYPE html>
<html lang="en" style="background: transparent;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${w}, initial-scale=1.0" />
  <title>${title}</title>
  <style>html, body { width: ${w}px; height: ${h}px; margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
</head>
<body>
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
    const { html, width, height, label } = (await req.json()) as {
      html?: string;
      width?: number;
      height?: number;
      label?: string;
    };

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "html field is required" },
        { status: 400 },
      );
    }

    const wrappedHtml = wrapHtml(html, width, height, label);

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
