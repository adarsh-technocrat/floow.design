#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * One-command blog publisher for floow.design
 *
 * Takes an HTML or Markdown article + optional images,
 * uploads images to Vercel Blob, converts HTML → MDX if needed,
 * extracts metadata, and seeds the database.
 *
 * Usage:
 *   npx tsx scripts/publish-blog.ts <article.html|article.md> [options]
 *
 * Options:
 *   --images <path1,path2,...>   Comma-separated image paths
 *   --cover <path>              Cover/thumbnail image path
 *   --slug <slug>               Custom slug (auto-generated from title if omitted)
 *   --category <cat>            Category (default: "General")
 *   --tags <t1,t2,...>          Comma-separated tags
 *   --author <name>             Author name (default: "floow.design Team")
 *   --author-role <role>        Author role (default: "Team")
 *   --draft                     Save as draft (default: published)
 *   --dry-run                   Preview without writing to DB
 *
 * Examples:
 *   npx tsx scripts/publish-blog.ts ~/Downloads/article.html --cover ~/Downloads/thumb.png
 *   npx tsx scripts/publish-blog.ts ~/Downloads/post.md --images ~/Downloads/img1.png,~/Downloads/img2.png --cover ~/Downloads/cover.png --tags "AI,design,no-code"
 *   npx tsx scripts/publish-blog.ts ~/Downloads/article.html --slug my-custom-slug --category "Tutorial" --draft
 */

import { readFileSync, existsSync } from "fs";
import { basename, extname, resolve } from "path";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import TurndownService from "turndown";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/*  CLI Parsing                                                        */
/* ------------------------------------------------------------------ */

const BOOLEAN_FLAGS = new Set(["draft", "dry-run"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  let articlePath = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = "true";
      } else {
        flags[key] = args[++i] || "";
      }
    } else if (!articlePath) {
      articlePath = arg;
    }
  }

  return { articlePath, flags };
}

/* ------------------------------------------------------------------ */
/*  HTML → Markdown conversion                                         */
/* ------------------------------------------------------------------ */

function htmlToMarkdown(html: string): {
  markdown: string;
  meta: ExtractedMeta;
} {
  const meta = extractMetaFromHtml(html);

  // Strip <head>, <nav>, <footer>, <script>, <style> tags — keep only article body
  let body = html;

  // Extract just the <main> or <article> content if present
  const mainMatch = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = body.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch) body = mainMatch[1];
  else if (articleMatch) body = articleMatch[1];

  // Remove scripts, styles, nav, footer
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
  body = body.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  body = body.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  body = body.replace(/<header[\s\S]*?<\/header>/gi, "");

  // Convert custom HTML patterns to markdown-friendly equivalents before Turndown

  // Convert stat-cards to blockquotes
  body = body.replace(
    /<div class="stat-card">\s*<div class="big">([\s\S]*?)<\/div>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi,
    (_m, big, text) =>
      `<blockquote><p><strong>${big.trim()}</strong> — ${text.trim()}</p></blockquote>`,
  );

  // Convert step tips to blockquote tips
  body = body.replace(
    /<span class="tip">([\s\S]*?)<\/span>/gi,
    (_m, text) => `<blockquote><p>💡 ${text.trim()}</p></blockquote>`,
  );

  // Convert checklist items
  body = body.replace(/<ul class="check">/gi, "<ul>");

  // Convert pill rows / term rows — just remove the wrapper divs
  body = body.replace(/<div class="(?:pill-row|term-row|mistake-grid)">/gi, "");
  body = body.replace(/<\/div>\s*(?=<div class="(?:term|mistake-card))/gi, "");

  // Convert term chips to list items
  body = body.replace(
    /<div class="term"><strong>(.*?)<\/strong>(.*?)<\/div>/gi,
    (_m, label, rest) => `- **${label}**${rest}`,
  );

  // Convert mistake cards
  body = body.replace(
    /<div class="mistake-card[^"]*">\s*<p class="label">([\s\S]*?)<\/p>\s*<p class="title">([\s\S]*?)<\/p>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi,
    (_m, label, title, desc) =>
      `### ${label.trim()} ${title.trim()}\n\n${desc.trim()}`,
  );

  // Convert step numbers to headings
  body = body.replace(
    /<li class="step">\s*<div class="step-n">\d+<\/div>\s*<div class="step-content">\s*<h3>([\s\S]*?)<\/h3>\s*([\s\S]*?)<\/div>\s*<\/li>/gi,
    (_m, heading, content) => `### ${heading.trim()}\n\n${content.trim()}`,
  );

  // Convert arrow steps
  body = body.replace(
    /<li class="step">\s*<div class="step-n">→<\/div>\s*<div class="step-content">\s*<h3>([\s\S]*?)<\/h3>\s*([\s\S]*?)<\/div>\s*<\/li>/gi,
    (_m, heading, content) => `**${heading.trim()}:** ${content.trim()}`,
  );

  // Convert CTA blocks
  body = body.replace(
    /<div class="cta">[\s\S]*?<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi,
    (_m, title, desc, href, label) =>
      `---\n\n## ${title.trim()}\n\n${desc.trim()}\n\n[${label.trim()}](${href})\n\n---`,
  );

  // Remove remaining CTA wrappers
  body = body.replace(/<div class="cta">[\s\S]*?<\/div>/gi, "");

  // Convert FAQ details/summary to H3 + paragraph
  body = body.replace(
    /<details>\s*<summary>([\s\S]*?)<\/summary>\s*(?:<div[^>]*>\s*)?([\s\S]*?)(?:\s*<\/div>)?\s*<\/details>/gi,
    (_m, q, a) => {
      const question = q.replace(/<[^>]*>/g, "").trim();
      const answer = a.replace(/<\/?div[^>]*>/g, "").trim();
      return `<h3>${question}</h3>\n${answer}`;
    },
  );

  // Convert FAQ header
  body = body.replace(
    /<p class="faq-header">([\s\S]*?)<\/p>/gi,
    (_m, text) => `## ${text.trim()}`,
  );

  // Clean remaining wrapper divs
  body = body.replace(/<div[^>]*>/gi, "");
  body = body.replace(/<\/div>/gi, "");
  body = body.replace(/<section[^>]*>/gi, "");
  body = body.replace(/<\/section>/gi, "");
  body = body.replace(/<ol class="steps">/gi, "");
  body = body.replace(/<\/ol>/gi, "");

  const td = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  // Keep line breaks in the right places
  td.addRule("lineBreak", {
    filter: "br",
    replacement: () => "\n",
  });

  // Convert HTML tables to markdown pipe tables
  td.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const el = node as unknown as HTMLTableElement;
      const rows: string[][] = [];
      const allRows = el.querySelectorAll
        ? Array.from(el.querySelectorAll("tr"))
        : Array.from(el.getElementsByTagName("tr"));

      for (const row of allRows) {
        const cells = Array.from(
          row.querySelectorAll
            ? row.querySelectorAll("th, td")
            : [
                ...Array.from(row.getElementsByTagName("th")),
                ...Array.from(row.getElementsByTagName("td")),
              ],
        );
        rows.push(
          cells.map((c) =>
            td
              .turndown((c as HTMLElement).innerHTML)
              .replace(/\n/g, " ")
              .replace(/\|/g, "\\|")
              .trim(),
          ),
        );
      }

      if (rows.length === 0) return "";

      const lines: string[] = [];
      // Header row
      lines.push("| " + rows[0].join(" | ") + " |");
      // Separator
      lines.push("| " + rows[0].map(() => "---").join(" | ") + " |");
      // Body rows
      for (let i = 1; i < rows.length; i++) {
        lines.push("| " + rows[i].join(" | ") + " |");
      }
      return "\n\n" + lines.join("\n") + "\n\n";
    },
  });

  // Prevent Turndown from also processing inner table elements
  td.addRule("tableCell", {
    filter: ["thead", "tbody", "tfoot", "tr", "th", "td"],
    replacement: () => "",
  });

  let markdown = td.turndown(body);

  // Clean up excessive newlines
  markdown = markdown.replace(/\n{4,}/g, "\n\n\n");

  // Convert tip blockquotes to Callout components
  markdown = markdown.replace(
    /> 💡\s*([\s\S]*?)(?=\n\n|\n(?!>))/g,
    (_m, text) => `<Callout type="tip">\n${text.trim()}\n</Callout>`,
  );

  return { markdown, meta };
}

interface ExtractedMeta {
  title: string;
  description: string;
  slug: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMetaFromHtml(html: string): ExtractedMeta {
  const titleMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"/i,
  );

  const rawTitle = titleMatch
    ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, "").trim())
    : "Untitled Post";
  const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : "";
  const slug = slugify(rawTitle);

  return { title: rawTitle, description, slug };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/* ------------------------------------------------------------------ */
/*  Image upload                                                       */
/* ------------------------------------------------------------------ */

async function uploadImage(
  localPath: string,
  blobFolder: string,
): Promise<string> {
  const absPath = resolve(localPath);
  if (!existsSync(absPath)) {
    throw new Error(`Image not found: ${absPath}`);
  }

  const buffer = readFileSync(absPath);
  const ext = extname(absPath).slice(1) || "png";
  const name = basename(absPath, `.${ext}`)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-|-$/g, "");

  const blobPath = `${blobFolder}/${name}.${ext}`;
  const contentType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
        ? "image/webp"
        : ext === "svg"
          ? "image/svg+xml"
          : "image/png";

  console.log(`  📤 Uploading ${basename(absPath)} → ${blobPath}`);

  const blob = await put(blobPath, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`     ✅ ${blob.url}`);
  return blob.url;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const { articlePath, flags } = parseArgs();

  if (!articlePath) {
    console.error(`
  Usage: npx tsx scripts/publish-blog.ts <article.html|article.md> [options]

  Options:
    --images <path1,path2,...>   Comma-separated image paths (embedded in content)
    --cover <path>              Cover/thumbnail image path
    --slug <slug>               Custom slug (auto-generated from title if omitted)
    --category <cat>            Category (default: "General")
    --tags <t1,t2,...>          Comma-separated tags
    --author <name>             Author name (default: "floow.design Team")
    --author-role <role>        Author role (default: "Team")
    --draft                     Save as draft instead of publishing
    --dry-run                   Preview without writing to DB

  Examples:
    npx tsx scripts/publish-blog.ts ~/Downloads/article.html --cover ~/Downloads/thumb.png
    npx tsx scripts/publish-blog.ts ~/Downloads/post.md --images img1.png,img2.png --tags "AI,design"
`);
    process.exit(1);
  }

  const absArticlePath = resolve(articlePath);
  if (!existsSync(absArticlePath)) {
    console.error(`❌ Article file not found: ${absArticlePath}`);
    process.exit(1);
  }

  const ext = extname(absArticlePath).toLowerCase();
  const raw = readFileSync(absArticlePath, "utf-8");
  const isHtml = ext === ".html" || ext === ".htm";

  console.log(
    `\n📄 Reading ${basename(absArticlePath)} (${isHtml ? "HTML" : "Markdown"})\n`,
  );

  // ── Convert content ──
  let content: string;
  let title: string;
  let description: string;
  let autoSlug: string;

  if (isHtml) {
    const { markdown, meta } = htmlToMarkdown(raw);
    content = markdown;
    title = meta.title;
    description = meta.description;
    autoSlug = meta.slug;
  } else {
    content = raw;
    // Try to extract title from first H1
    const h1Match = raw.match(/^#\s+(.+)$/m);
    title = h1Match ? h1Match[1].trim() : "Untitled Post";
    description = "";
    autoSlug = slugify(title);
  }

  const slug = flags.slug || autoSlug;
  const blobFolder = `blog/${slug}`;

  // ── Upload images ──
  const imageUrls: Record<string, string> = {};

  if (flags.images) {
    const imagePaths = flags.images.split(",").map((p) => p.trim());
    console.log(`🖼️  Uploading ${imagePaths.length} inline image(s)...\n`);
    for (const imgPath of imagePaths) {
      const url = await uploadImage(imgPath, blobFolder);
      imageUrls[basename(imgPath)] = url;
    }
    console.log();
  }

  let coverImageUrl: string | undefined;
  if (flags.cover) {
    console.log(`🖼️  Uploading cover image...\n`);
    coverImageUrl = await uploadImage(flags.cover, blobFolder);
    console.log();
  }

  // ── Replace local image references with blob URLs ──
  // Handles both markdown ![alt](filename) and HTML <img src="filename">
  for (const [filename, url] of Object.entries(imageUrls)) {
    // Replace any reference to the filename (with or without path)
    const escapedName = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:(?:\\./|/|[^()"'\\s]*/)?${escapedName})`,
      "g",
    );
    content = content.replace(pattern, url);
  }

  // ── Build post data ──
  const tags = flags.tags ? flags.tags.split(",").map((t) => t.trim()) : [];
  const published = flags.draft !== "true";

  const post = {
    slug,
    title,
    description,
    content,
    tldr: null as string | null,
    coverImage: coverImageUrl || null,
    category: flags.category || "General",
    tags,
    author: flags.author || "floow.design Team",
    authorRole: flags["author-role"] || "Team",
    published,
  };

  // ── Preview ──
  console.log("━".repeat(60));
  console.log(`  Title:       ${post.title}`);
  console.log(`  Slug:        ${post.slug}`);
  console.log(`  Category:    ${post.category}`);
  console.log(`  Tags:        ${post.tags.join(", ") || "(none)"}`);
  console.log(`  Author:      ${post.author}`);
  console.log(`  Cover:       ${post.coverImage || "(none)"}`);
  console.log(`  Published:   ${post.published}`);
  console.log(`  Content:     ${post.content.length} chars`);
  console.log("━".repeat(60));

  if (flags["dry-run"] === "true") {
    console.log("\n🏃 Dry run — skipping DB write.\n");
    console.log("--- Content preview (first 500 chars) ---");
    console.log(post.content.slice(0, 500));
    console.log("...\n");
    await prisma.$disconnect();
    return;
  }

  // ── Seed DB ──
  console.log("\n💾 Seeding database...");

  await prisma.blogPost.upsert({
    where: { slug: post.slug },
    create: {
      slug: post.slug,
      title: post.title,
      description: post.description,
      content: post.content,
      tldr: post.tldr,
      coverImage: post.coverImage,
      category: post.category,
      tags: post.tags,
      author: post.author,
      authorRole: post.authorRole,
      published: post.published,
    },
    update: {
      title: post.title,
      description: post.description,
      content: post.content,
      tldr: post.tldr,
      coverImage: post.coverImage,
      category: post.category,
      tags: post.tags,
      author: post.author,
      authorRole: post.authorRole,
      published: post.published,
    },
  });

  await prisma.$disconnect();

  console.log(`\n✅ Blog post published!`);
  console.log(`   → /blog/${post.slug}\n`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
