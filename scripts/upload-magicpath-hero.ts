import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const buffer = readFileSync(
    "/Users/adarshkumarsingh/Downloads/fe5f4a6a-03a7-454a-863b-294162055957.png",
  );

  console.log("Uploading to Vercel Blob...");
  const blob = await put("blog/magicpath-alternatives-hero.png", buffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log("Uploaded:", blob.url);

  const post = await prisma.blogPost.update({
    where: { slug: "freepik-ai-review" },
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
