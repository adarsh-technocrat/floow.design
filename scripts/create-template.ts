#!/usr/bin/env npx tsx
/* eslint-disable no-console */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  "adarshkumarsingh865@gmail.com",
];

function usage() {
  console.log(`
  Create a template from an existing project.

  Usage:
    npx tsx scripts/create-template.ts <projectId> [options]

  Options:
    --name <name>         Template name (auto-generated from project if omitted)
    --tag <tag>           Template tag / category (e.g. "Finance", "Social", "E-Commerce")
    --description <desc>  Template description
    --slug <slug>         URL slug (auto-generated from name if omitted)
    --admin <email>       Admin email performing the action (default: first ADMIN_EMAILS entry)
    --dry-run             Preview what would be created without writing to DB

  Examples:
    npx tsx scripts/create-template.ts clxyz123abc
    npx tsx scripts/create-template.ts clxyz123abc --name "Crypto Dashboard" --tag "Finance"
    npx tsx scripts/create-template.ts clxyz123abc --dry-run
  `);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await prisma.project.findUnique({
      where: { templateSlug: slug },
      select: { id: true },
    });
    if (!existing) return slug;
    suffix++;
    slug = `${base}-${suffix}`;
  }
}

function generateTemplateName(projectName: string, screenCount: number): string {
  const cleaned = projectName
    .replace(/^untitled\s*project$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length > 3 && cleaned.length < 80) return cleaned;
  return `App Template (${screenCount} screens)`;
}

function generateTag(frames: { label: string }[]): string {
  const labels = frames.map((f) => f.label.toLowerCase()).join(" ");
  const tagMap: Record<string, string[]> = {
    Finance: ["wallet", "crypto", "bank", "payment", "finance", "trading", "portfolio"],
    Social: ["feed", "chat", "profile", "social", "message", "story", "post"],
    "E-Commerce": ["cart", "shop", "product", "checkout", "store", "order"],
    Health: ["health", "fitness", "workout", "diet", "medical", "tracker"],
    Food: ["food", "recipe", "restaurant", "delivery", "menu", "order"],
    Travel: ["travel", "booking", "flight", "hotel", "trip", "map"],
    Education: ["course", "learn", "quiz", "study", "lesson", "class"],
    Music: ["music", "playlist", "song", "player", "audio", "podcast"],
    Productivity: ["task", "todo", "calendar", "note", "reminder", "schedule"],
  };
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((kw) => labels.includes(kw))) return tag;
  }
  return "App";
}

function generateDescription(name: string, tag: string, frames: { label: string }[]): string {
  const screens = frames.map((f) => f.label).join(", ");
  return `${name} is a ready-to-use ${tag.toLowerCase()} mobile app template with ${frames.length} screen${frames.length > 1 ? "s" : ""}: ${screens}. Built with a modern design system — customize colors, fonts, and layout instantly.`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }

  const projectId = args[0];
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const dryRun = args.includes("--dry-run");

  const customName = getArg("--name");
  const customTag = getArg("--tag");
  const customDesc = getArg("--description");
  const customSlug = getArg("--slug");
  const adminEmail = getArg("--admin") || ADMIN_EMAILS[0];

  const admin = await prisma.user.findFirst({
    where: { email: adminEmail },
    select: { id: true, email: true },
  });

  if (!admin || !ADMIN_EMAILS.includes(admin.email ?? "")) {
    console.error(`\n  ✗ Admin not found or not authorized: ${adminEmail}\n`);
    process.exit(1);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      thumbnail: true,
      ownerId: true,
      frames: {
        select: { id: true, label: true, left: true, top: true, html: true, themeId: true, variantName: true },
        orderBy: { updatedAt: "asc" },
      },
    },
  });

  if (!project) {
    console.error(`\n  ✗ Project not found: ${projectId}\n`);
    process.exit(1);
  }

  const framesWithContent = project.frames.filter((f) => f.html && f.html.length > 50);
  if (framesWithContent.length === 0) {
    console.error(`\n  ✗ Project has no screens with content.\n`);
    process.exit(1);
  }

  const templateName = customName || generateTemplateName(project.name, framesWithContent.length);
  const templateTag = customTag || generateTag(framesWithContent);
  const templateSlug = await ensureUniqueSlug(customSlug || toSlug(templateName));
  const templateDesc = customDesc || generateDescription(templateName, templateTag, framesWithContent);

  console.log("\n  ┌─────────────────────────────────────────");
  console.log(`  │  Template Preview`);
  console.log("  ├─────────────────────────────────────────");
  console.log(`  │  Source   : ${project.id}`);
  console.log(`  │  Name     : ${templateName}`);
  console.log(`  │  Slug     : ${templateSlug}`);
  console.log(`  │  Tag      : ${templateTag}`);
  console.log(`  │  Desc     : ${templateDesc.slice(0, 100)}${templateDesc.length > 100 ? "..." : ""}`);
  console.log(`  │  Screens  : ${framesWithContent.length}`);
  for (const frame of framesWithContent) {
    console.log(`  │    • ${frame.label} (${(frame.html.length / 1024).toFixed(1)}KB)`);
  }
  console.log(`  │  Thumb    : ${project.thumbnail ? "yes" : "no"}`);
  console.log(`  │  URL      : /templates/${templateSlug}`);
  console.log("  └─────────────────────────────────────────\n");

  if (dryRun) {
    console.log("  ⚡ Dry run — no changes made.\n");
    await prisma.$disconnect();
    return;
  }

  const normalizeLeft = Math.min(...framesWithContent.map((f) => f.left));
  const normalizeTop = Math.min(...framesWithContent.map((f) => f.top));

  const template = await prisma.project.create({
    data: {
      name: templateName,
      isTemplate: true,
      templateTag,
      templateSlug,
      templateDesc,
      thumbnail: project.thumbnail,
      ownerId: admin.id,
      frames: {
        create: framesWithContent.map((frame) => ({
          id: `tpl-${frame.id}-${Date.now().toString(36)}`,
          label: frame.label,
          left: frame.left - normalizeLeft,
          top: frame.top - normalizeTop,
          html: frame.html,
          themeId: frame.themeId,
          variantName: frame.variantName,
        })),
      },
    },
    select: { id: true, name: true, templateSlug: true, _count: { select: { frames: true } } },
  });

  console.log(`  ✓ Template created!`);
  console.log(`    ID      : ${template.id}`);
  console.log(`    Name    : ${template.name}`);
  console.log(`    Slug    : ${template.templateSlug}`);
  console.log(`    Screens : ${template._count.frames}`);
  console.log(`    URL     : /templates/${template.templateSlug}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n  ✗ Error:", err.message ?? err);
  prisma.$disconnect();
  process.exit(1);
});
