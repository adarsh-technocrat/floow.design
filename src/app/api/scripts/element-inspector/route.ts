import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const scriptPath = path.join(
    process.cwd(),
    "src/lib/iframe/element-inspector.js",
  );
  const content = readFileSync(scriptPath, "utf-8");
  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
