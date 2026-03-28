import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates: { slug: string; replacements: [string, string][] }[] = [
  {
    slug: "lovable-vs-bolt-mobile-app-ui-2026",
    replacements: [
      // "The Gap Neither Tool Solves" section
      [
        `The fix? **Design your UI before you code it.** Tools like [Floow](https://www.floow.design/) let you visually define your app's look — custom colors, layouts, and components — before feeding anything into Lovable or Bolt. This approach means fewer credit-burning iteration loops and a final app that actually feels unique.

Think of it as: **design first, then build.**`,

        `The fix? **Design your mobile app UI before you code it.** Neither Lovable nor Bolt gives you fine control over your mobile app UI — you're stuck prompting and re-prompting to get screens that don't look like default Tailwind templates. [Floow](https://www.floow.design/) is built specifically for mobile app UI design — generate and refine your mobile screens with AI before exporting to Lovable, Bolt, or any builder. This means fewer credit-burning iteration loops and a final app that actually looks like yours.

Think of it as: **design your mobile screens first, then build.**`,
      ],
      // FAQ answer about generic UIs
      [
        `The best solution is to define your visual design with a dedicated UI design tool before prompting Lovable or Bolt.`,
        `The best solution is to design your mobile app screens first with a dedicated mobile UI design tool like [Floow](https://www.floow.design/) before prompting Lovable or Bolt.`,
      ],
    ],
  },
  {
    slug: "magic-patterns-alternatives",
    replacements: [
      [
        `The best way to fix that is to define your visual direction first, before you prompt any of these tools. A tool like [Floow](https://www.floow.design/) lets you explore and lock down your UI look — colors, component style, layout logic — before passing your design into a generator or handing off to a developer. Think of it as doing your design thinking before your design prompting.`,

        `The best way to fix that is to define your visual direction first — especially if you're building a mobile app. Most of these tools are web-focused and struggle with mobile-specific UI patterns. [Floow](https://www.floow.design/) is built specifically for mobile app UI design — generate and refine your mobile screens with AI before passing them into any code generator or handing off to a developer. Think of it as doing your mobile design thinking before your design prompting.`,
      ],
    ],
  },
  {
    slug: "freepik-ai-review",
    replacements: [
      [
        `The fastest way to fix this is to define your visual direction first — component style, color palette, spacing logic — before prompting any of these tools. A dedicated AI UI design tool like [Floow](https://www.floow.design/) handles that layer, so what you take into your PM prototyping workflow already looks intentional rather than generic.`,

        `The fastest way to fix this is to define your visual direction first — especially for mobile apps. None of these tools generate polished mobile app screens out of the box. [Floow](https://www.floow.design/) is built specifically for mobile app UI design — generate mobile-first screens with AI, refine them visually, and hand off to engineering or feed into any prototyping tool. For PMs building mobile apps, it's the missing layer between your idea and a professional-looking prototype.`,
      ],
    ],
  },
  {
    slug: "emergent-ai-review",
    replacements: [
      [
        `Emergent is not built for design. Its UI output is functional but generic. There's no Figma export, no design system integration, and visual customization requires slow, credit-heavy iteration. If you need a polished, branded UI, design it first in a dedicated AI design tool — something like [Floow](https://www.floow.design/) — then hand the visual spec to Emergent or a developer to build. The two tools complement each other: design layer first, build layer second.`,

        `Emergent is not built for design — and mobile UI is where this gap hurts the most. Emergent supports React Native for mobile apps, but the generated mobile screens look generic and iterating on mobile UI burns credits fast. [Floow](https://www.floow.design/) is built specifically for mobile app UI design — generate and refine your mobile screens with AI first, then hand the visual spec to Emergent to build. Mobile UI is where Emergent is weakest and where Floow is purpose-built. The two tools complement each other: design your mobile screens first, build second.`,
      ],
      // FAQ answer about UI quality
      [
        `For a product that needs to look designed rather than generated, use a dedicated UI design tool for the visual layer and Emergent for the build layer.`,
        `For a mobile app that needs to look designed rather than generated, use [Floow](https://www.floow.design/) — built specifically for mobile app UI design — for the visual layer, then hand off to Emergent for the build layer.`,
      ],
    ],
  },
];

async function main() {
  for (const { slug, replacements } of updates) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { content: true },
    });

    if (!post) {
      console.log(`⚠️  Post not found: ${slug}`);
      continue;
    }

    let content = post.content;
    let changed = false;

    for (const [oldText, newText] of replacements) {
      if (content.includes(oldText)) {
        content = content.replace(oldText, newText);
        changed = true;
        console.log(`  ✅ Replaced text in ${slug}`);
      } else {
        console.log(
          `  ⚠️  Text not found in ${slug}: "${oldText.slice(0, 60)}..."`,
        );
      }
    }

    if (changed) {
      await prisma.blogPost.update({
        where: { slug },
        data: { content },
      });
      console.log(`✅ Updated: ${slug}`);
    } else {
      console.log(`⏭️  No changes needed: ${slug}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
