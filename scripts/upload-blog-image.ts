import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const imagePath =
    "/Users/adarshkumarsingh/Desktop/mobile-flow/public/blog/lovable-vs-bolt-hero.png";
  const buffer = readFileSync(imagePath);

  console.log("Uploading to Vercel Blob...");
  const blob = await put("blog/lovable-vs-bolt-hero.png", buffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log("Uploaded:", blob.url);

  // Update the blog post cover image with the blob URL
  const post = await prisma.blogPost.update({
    where: { slug: "lovable-vs-bolt-mobile-app-ui-2026" },
    data: { coverImage: blob.url },
  });

  console.log("Updated blog post coverImage:", post.slug, "→", blob.url);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
