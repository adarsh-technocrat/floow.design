import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const buffer = readFileSync(
    "/Users/adarshkumarsingh/Downloads/Minimalist e-icon on dark background.png",
  );

  console.log("Uploading to Vercel Blob...");
  const blob = await put("blog/emergent-ai-review-hero.png", buffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log("Uploaded:", blob.url);

  const post = await prisma.blogPost.update({
    where: { slug: "emergent-ai-review" },
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
