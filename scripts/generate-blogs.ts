/**
 * Blog Generation Pipeline for floow.design
 *
 * Generates SEO-optimized blog posts using Gemini (with web search grounding),
 * generates banner images via Gemini Imagen, uploads to Vercel Blob,
 * and seeds them directly into the database.
 *
 * Usage:
 *   npx tsx scripts/generate-blogs.ts                # generates 1 blog
 *   npx tsx scripts/generate-blogs.ts 3              # generates 3 blogs
 *   npx tsx scripts/generate-blogs.ts 5 --dry-run    # preview without DB write
 *   npx tsx scripts/generate-blogs.ts 2 --time "week" --location "US"
 *   npx tsx scripts/generate-blogs.ts 1 --topic "Figma vs Framer in 2026"
 *   npx tsx scripts/generate-blogs.ts 3 --topic "vibe coding,AI prototyping tools,design tokens"
 */

import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const PRODUCT = {
  name: "floow.design",
  url: "https://floow.design",
  description:
    "AI-powered mobile app design platform that turns plain-English descriptions into pixel-perfect mobile app designs for iOS and Android in seconds",
  niche:
    "AI design tools, mobile app design, no-code/low-code design platforms, AI-generated UI/UX, and Figma competitors",
};

const DEFAULTS = {
  count: 1,
  time: "week",
  location: "global tech/design industry",
  author: "floow.design",
  authorRole: "Editorial",
};

/* ------------------------------------------------------------------ */
/*  Parse CLI args                                                     */
/* ------------------------------------------------------------------ */

const BOOLEAN_FLAGS = new Set(["dry-run"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = "true";
      } else {
        flags[key] = args[i + 1] ?? "true";
        i++;
      }
    } else {
      positional.push(args[i]);
    }
  }

  // Parse topics: comma-separated string → array
  const rawTopics = flags.topic || flags.topics || "";
  const topics = rawTopics
    ? rawTopics
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  return {
    count: parseInt(positional[0] || String(DEFAULTS.count), 10),
    time: flags.time || DEFAULTS.time,
    location: flags.location || DEFAULTS.location,
    topics,
    dryRun: "dry-run" in flags,
  };
}

/* ------------------------------------------------------------------ */
/*  Init clients                                                       */
/* ------------------------------------------------------------------ */

function getGeminiClient(): GoogleGenAI {
  // Option 1: Direct API key (simplest)
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // Option 2: Vertex AI service account credentials
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (project && clientEmail && privateKey) {
    console.log(
      `  Using Vertex AI (project: ${project}, location: ${location})`,
    );
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
          type: "service_account" as const,
        },
      },
    });
  }

  console.error(
    "Missing AI credentials. Set one of:\n" +
      "  1. GOOGLE_GENERATIVE_AI_API_KEY (get at https://aistudio.google.com/apikey)\n" +
      "  2. GOOGLE_VERTEX_PROJECT + GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY",
  );
  process.exit(1);
}

function getPrisma(): PrismaClient {
  return new PrismaClient();
}

/* ------------------------------------------------------------------ */
/*  Step 1: Generate blog content via Gemini + web search grounding    */
/* ------------------------------------------------------------------ */

interface BlogContent {
  title: string;
  slug: string;
  description: string;
  tldr: string;
  category: string;
  tags: string[];
  mdxContent: string;
  bannerPrompt: string;
}

async function generateBlogContent(
  ai: GoogleGenAI,
  time: string,
  location: string,
  existingSlugs: string[],
  topic?: string,
): Promise<BlogContent> {
  const avoidList =
    existingSlugs.length > 0
      ? `\n\nIMPORTANT: Do NOT write about topics covered by these existing slugs — pick a DIFFERENT story:\n${existingSlugs.map((s) => `- ${s}`).join("\n")}`
      : "";

  const topicDirective = topic
    ? `Write a concise, SEO-optimized article specifically about: "${topic}". Search the web for the latest news, developments, and insights from the past ${time} on this topic. Ground the article in real, recent facts and sources.`
    : `Search the web for news from the past ${time} in the ${location} related to ${PRODUCT.niche}. Pick the single strongest, most relevant story and write a concise, SEO-optimized news article about it.`;

  const prompt = `You are a senior tech journalist writing for ${PRODUCT.name} (${PRODUCT.url}), an ${PRODUCT.description}.

${topicDirective}${avoidList}

Return a valid JSON object with EXACTLY this structure (no markdown fencing, no extra text):
{
  "title": "The article headline — compelling, SEO-friendly, under 80 chars",
  "slug": "kebab-case-seo-keyword-rich-slug",
  "description": "150-160 char meta description for SEO",
  "tldr": "One sentence summary of the key takeaway",
  "category": "One of: Industry News, AI Tools, Design Trends, Product Updates, Tutorial",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "mdxContent": "The full article body in MDX/Markdown format with ## headings, bullet lists, bold text, links to sources. Include a ## Sources section at the end with linked citations. Naturally mention ${PRODUCT.name} once in the closing paragraph as context — not an ad. Write 800-1200 words. Make it tight and factual. No fluff.",
  "bannerPrompt": "A detailed prompt for generating a photorealistic banner image for this article. Describe a clean, modern tech/design scene relevant to the article topic. No text in the image. 16:9 aspect ratio. Professional photography style."
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.7,
    },
  });

  const text = response.text ?? "";

  // Extract JSON — try multiple strategies
  let parsed: BlogContent;
  try {
    // Strategy 1: Direct parse (clean JSON response)
    const jsonMatch =
      text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error("No JSON block found");
    }
    parsed = JSON.parse(jsonMatch[1].trim()) as BlogContent;
  } catch {
    // Strategy 2: Ask Gemini to regenerate as clean JSON
    console.log(`  Retrying with JSON repair...`);
    const fixResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The following text contains a blog article as broken/incomplete JSON. Extract the content and return it as a single valid JSON object. Do NOT wrap in markdown fences. Do NOT truncate the mdxContent field — include the full article. Return ONLY the JSON:\n\n${text.slice(0, 30000)}`,
      config: { temperature: 0 },
    });
    const fixedText = fixResponse.text ?? "";
    // Try extracting from markdown fences first, then raw
    const fixedMatch =
      fixedText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      fixedText.match(/(\{[\s\S]*\})/);
    if (!fixedMatch) {
      throw new Error(
        `Failed to extract JSON after repair:\n${fixedText.slice(0, 300)}`,
      );
    }
    parsed = JSON.parse(fixedMatch[1].trim()) as BlogContent;
  }

  // Validate required fields
  if (!parsed.title || !parsed.slug || !parsed.mdxContent) {
    throw new Error(
      `Missing required fields in generated content: ${JSON.stringify(Object.keys(parsed))}`,
    );
  }

  // Clean slug
  parsed.slug = parsed.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return parsed;
}

/* ------------------------------------------------------------------ */
/*  Step 2: Generate banner image                                      */
/*                                                                     */
/*  Priority:                                                          */
/*    1. Nano Banana 2 (gemini-3.1-flash-image-preview)                */
/*    2. Nano Banana   (gemini-2.5-flash-image-preview)                */
/*    3. Imagen 4.0 API                                                */
/*    4. Unsplash fallback                                             */
/* ------------------------------------------------------------------ */

type ImageResult = { imageBytes: string; mimeType: string };

// Nano Banana models — Gemini Flash Image (newest first)
const NANO_BANANA_MODELS = [
  "gemini-3.1-flash-image-preview", // Nano Banana 2
  "gemini-2.5-flash-image-preview", // Nano Banana (original)
];

// Imagen models — dedicated image generation API
const IMAGEN_MODELS = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];

function extractImageFromParts(
  parts: unknown[] | undefined,
): ImageResult | null {
  if (!parts) return null;
  for (const part of parts) {
    const p = part as Record<string, unknown>;
    const inlineData = p.inlineData as
      | { data?: string; mimeType?: string }
      | undefined;
    if (inlineData?.data && inlineData?.mimeType?.startsWith("image/")) {
      return { imageBytes: inlineData.data, mimeType: inlineData.mimeType };
    }
  }
  return null;
}

async function tryNanoBanana(
  ai: GoogleGenAI,
  prompt: string,
): Promise<ImageResult | null> {
  for (const model of NANO_BANANA_MODELS) {
    try {
      const label = model.includes("3.1") ? "Nano Banana 2" : "Nano Banana";
      console.log(`    Trying ${label} (${model})...`);

      const response = await ai.models.generateContent({
        model,
        contents: `Generate a single high-quality, photorealistic banner image for a blog post. No text or watermarks in the image. 16:9 aspect ratio.\n\n${prompt}`,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const result = extractImageFromParts(
        response.candidates?.[0]?.content?.parts as unknown[] | undefined,
      );
      if (result) {
        console.log(`    Success with ${label}`);
        return result;
      }
    } catch (err) {
      const msg = (err as Error).message?.slice(0, 120) ?? "Unknown error";
      console.log(`    ${model} failed: ${msg}`);
    }
  }
  return null;
}

async function tryImagen(
  ai: GoogleGenAI,
  prompt: string,
): Promise<ImageResult | null> {
  for (const model of IMAGEN_MODELS) {
    try {
      console.log(`    Trying ${model}...`);
      const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9",
        },
      });

      const image = response.generatedImages?.[0];
      if (image?.image?.imageBytes) {
        console.log(`    Success with ${model}`);
        return {
          imageBytes: image.image.imageBytes,
          mimeType: image.image.mimeType || "image/png",
        };
      }
    } catch (err) {
      console.log(
        `    ${model} failed: ${(err as Error).message?.slice(0, 120)}`,
      );
    }
  }
  return null;
}

async function generateBannerImage(
  ai: GoogleGenAI,
  bannerPrompt: string,
  slug: string,
): Promise<string> {
  // Strategy 1: Nano Banana (Gemini Flash Image — best quality)
  let result = await tryNanoBanana(ai, bannerPrompt);

  // Strategy 2: Imagen API (dedicated image generation)
  if (!result) {
    result = await tryImagen(ai, bannerPrompt);
  }

  // Upload to Vercel Blob if we got an image
  if (result) {
    try {
      const buffer = Buffer.from(result.imageBytes, "base64");
      const ext = result.mimeType.includes("jpeg") ? "jpg" : "png";
      const blob = await put(`blog-banners/${slug}.${ext}`, buffer, {
        access: "public",
        contentType: result.mimeType,
      });
      console.log(`  Banner uploaded: ${blob.url}`);
      return blob.url;
    } catch (err) {
      console.warn(`  Blob upload failed: ${(err as Error).message}`);
    }
  }

  // Strategy 3: Unsplash fallback
  console.warn(`  All image generation failed, using Unsplash fallback`);
  return `https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1200&auto=format&fit=crop`;
}

/* ------------------------------------------------------------------ */
/*  Step 3: Write MDX file + seed to database                          */
/* ------------------------------------------------------------------ */

import fs from "fs";
import path from "path";

function writeMdxFile(blog: BlogContent, coverImage: string): string {
  const blogDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const frontmatter = `---
title: "${blog.title.replace(/"/g, '\\"')}"
description: "${blog.description.replace(/"/g, '\\"')}"
date: "${new Date().toISOString().split("T")[0]}"
author: "${DEFAULTS.author}"
authorRole: "${DEFAULTS.authorRole}"
category: "${blog.category}"
tags: [${blog.tags.map((t) => `"${t}"`).join(", ")}]
tldr: "${blog.tldr.replace(/"/g, '\\"')}"
coverImage: "${coverImage}"
published: true
---

${blog.mdxContent}`;

  const filePath = path.join(blogDir, `${blog.slug}.mdx`);
  fs.writeFileSync(filePath, frontmatter, "utf-8");
  console.log(`  MDX written: src/content/blog/${blog.slug}.mdx`);
  return filePath;
}

async function seedToDatabase(
  prisma: PrismaClient,
  blog: BlogContent,
  coverImage: string,
): Promise<void> {
  await prisma.blogPost.upsert({
    where: { slug: blog.slug },
    create: {
      slug: blog.slug,
      title: blog.title,
      description: blog.description,
      content: blog.mdxContent,
      tldr: blog.tldr,
      coverImage,
      category: blog.category,
      tags: blog.tags,
      author: DEFAULTS.author,
      authorRole: DEFAULTS.authorRole,
      published: true,
    },
    update: {
      title: blog.title,
      description: blog.description,
      content: blog.mdxContent,
      tldr: blog.tldr,
      coverImage,
      category: blog.category,
      tags: blog.tags,
      author: DEFAULTS.author,
      authorRole: DEFAULTS.authorRole,
      published: true,
    },
  });
  console.log(`  Seeded to DB: ${blog.slug}`);
}

/* ------------------------------------------------------------------ */
/*  Main pipeline                                                      */
/* ------------------------------------------------------------------ */

async function main() {
  const { count, time, location, topics, dryRun } = parseArgs();

  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  floow.design Blog Generation Pipeline     ║`);
  console.log(`╠════════════════════════════════════════════╣`);
  console.log(`║  Blogs to generate: ${String(count).padEnd(23)}║`);
  console.log(`║  Time range:        ${time.padEnd(23)}║`);
  console.log(`║  Location:          ${location.slice(0, 23).padEnd(23)}║`);
  console.log(
    `║  Topics:            ${(topics.length > 0 ? topics.length + " provided" : "auto-discover").padEnd(23)}║`,
  );
  console.log(`║  Dry run:           ${String(dryRun).padEnd(23)}║`);
  console.log(`╚════════════════════════════════════════════╝`);
  if (topics.length > 0) {
    console.log(`\n  Topics:`);
    topics.forEach((t, i) => console.log(`    ${i + 1}. ${t}`));
  }
  console.log();

  const ai = getGeminiClient();
  const prisma = dryRun ? (null as unknown as PrismaClient) : getPrisma();

  // Get existing slugs to avoid duplicates
  let existingSlugs: string[] = [];
  if (!dryRun) {
    const existing = await prisma.blogPost.findMany({
      select: { slug: true },
    });
    existingSlugs = existing.map((e) => e.slug);
  }

  const generated: string[] = [];

  for (let i = 0; i < count; i++) {
    const num = i + 1;
    // Assign topic: cycle through provided topics, or undefined for auto-discover
    const topic = topics.length > 0 ? topics[i % topics.length] : undefined;
    console.log(`\n[${num}/${count}] Generating blog post...`);
    if (topic) console.log(`  Topic: "${topic}"`);

    try {
      // Step 1: Generate content
      console.log(`  Step 1/3: Generating content with Gemini + web search...`);
      const blog = await generateBlogContent(
        ai,
        time,
        location,
        [...existingSlugs, ...generated],
        topic,
      );
      console.log(`  Title: "${blog.title}"`);
      console.log(`  Slug:  ${blog.slug}`);

      // Step 2: Generate banner
      console.log(`  Step 2/3: Generating banner image...`);
      let coverImage: string;
      if (dryRun) {
        coverImage =
          "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1200&auto=format&fit=crop";
        console.log(`  Banner: [skipped — dry run]`);
      } else {
        coverImage = await generateBannerImage(
          ai,
          blog.bannerPrompt,
          blog.slug,
        );
      }

      // Step 3: Write MDX + seed DB
      console.log(`  Step 3/3: Writing MDX file and seeding database...`);
      writeMdxFile(blog, coverImage);

      if (!dryRun) {
        await seedToDatabase(prisma, blog, coverImage);
      } else {
        console.log(`  DB seed: [skipped — dry run]`);
      }

      generated.push(blog.slug);
      console.log(`  Done!`);
    } catch (err) {
      console.error(
        `  ERROR generating blog ${num}: ${(err as Error).message}`,
      );
      if ((err as Error).stack) {
        console.error(
          `  ${(err as Error).stack?.split("\n").slice(1, 3).join("\n  ")}`,
        );
      }
    }
  }

  // Summary
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Generated ${generated.length}/${count} blog posts:`);
  generated.forEach((slug) => console.log(`  - ${slug}`));
  if (!dryRun) {
    console.log(`\nAll posts seeded to database and written as MDX files.`);
    console.log(`Blog is live at ${PRODUCT.url}/blog`);
  } else {
    console.log(`\nDry run complete. MDX files written but DB not touched.`);
  }
  console.log(`${"═".repeat(50)}\n`);

  if (!dryRun && prisma) {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
