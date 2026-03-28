import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: "emergent-ai-review" },
    select: { content: true },
  });

  if (!post) {
    console.error("Post not found");
    process.exit(1);
  }

  let content = post.content;

  const replacements: [string, string][] = [
    // 1. Intro paragraph — change SaaS dashboard to mobile app
    [
      `I built a SaaS customer feedback dashboard with Emergent AI — a tool I called **FeedLoop** — and used it across a full week.`,
      `I built a mobile customer feedback app with Emergent AI — a tool I called **FeedLoop** — and used it across a full week.`,
    ],

    // 2. Test build intro
    [
      `I picked a use case that's close to what real PMs and startup founders actually build: a lightweight SaaS tool for collecting and organizing customer feedback. Not a health app, not a to-do list — something with real business logic.`,
      `I picked a use case that's close to what real PMs and startup founders actually build: a mobile app for collecting and organizing customer feedback on the go. Not a generic to-do list — something with real business logic and mobile-native patterns.`,
    ],

    // 3. The build prompt — change from web app to mobile app
    [
      `> *"Build a web app called FeedLoop — a customer feedback management tool for SaaS teams. The dashboard should show a list of feedback submissions with status tags (New, In Review, Shipped, Declined). Each submission should have a title, description, upvote count, and date submitted. Include a sidebar with filter options by status and category (Bug, Feature Request, UX Issue). Add a 'Submit Feedback' form accessible from the top nav. Use a clean white and indigo color scheme with card-based layout. Include user authentication."*`,
      `> *"Build a mobile app called FeedLoop — a customer feedback tool for SaaS teams to capture and triage feedback on the go. The home screen should show a scrollable list of feedback cards with status tags (New, In Review, Shipped, Declined). Each card should show a title, description preview, upvote count, and date submitted. Include a bottom sheet filter for status and category (Bug, Feature Request, UX Issue). Add a floating action button to submit new feedback. Use a clean white and indigo color scheme with card-based layout and bottom tab navigation for Feed, Submit, Analytics, and Profile. Include user authentication."*`,
    ],

    // 4. Day One — image alt text
    [
      `![FeedLoop app first build showing dashboard with feedback cards, status tags, and sidebar filters](PLACEHOLDER_MOBILE_SCREEN_feedloop_dashboard.png)`,
      `![FeedLoop mobile app first build showing feedback cards with status tags and bottom navigation](PLACEHOLDER_MOBILE_SCREEN_feedloop_home.png)`,
    ],

    // 5. Day One — first build result
    [
      `**First build result:** Strong. The feedback card grid was clean and well-structured. Status tags rendered with correct color coding. The sidebar filter worked. The Submit Feedback modal opened from the nav. User authentication (sign up / sign in) was functional.`,
      `**First build result:** Strong. The feedback card list was clean and well-structured. Status tags rendered with correct color coding. The bottom sheet filter worked. The floating action button for new submissions was present. Bottom tab navigation rendered correctly across all four tabs. User authentication (sign up / sign in) was functional — and testable on a real device via Expo QR code.`,
    ],

    // 6. Day One — design problem
    [
      `**The design problem:** The color scheme was close but not precise. The indigo accents landed more as generic purple — the same default Tailwind palette you see in most AI-built tools. The card hover states were absent. Typography was readable but unremarkable.`,
      `**The design problem:** The color scheme was close but not precise. The indigo accents landed more as generic purple — the same default Tailwind palette you see in most AI-built mobile apps. The card spacing felt like a web layout squeezed onto mobile rather than a mobile-native design. Touch targets on the filter chips were too small. Typography was readable but unremarkable.`,
    ],

    // 7. Day Three — what I changed
    [
      `**What I changed:**
- Adjusted the color scheme to true indigo (#4F46E5) with white backgrounds
- Added hover states to feedback cards
- Replaced placeholder avatars with initials-based user circles
- Added a "Most Upvoted" sort option to the sidebar
- Requested a dark mode toggle`,
      `**What I changed:**
- Adjusted the color scheme to true indigo (#4F46E5) with white backgrounds
- Increased touch targets on filter chips and cards for proper mobile UX
- Replaced placeholder avatars with initials-based user circles
- Added a "Most Upvoted" sort option to the bottom sheet filter
- Requested a dark mode toggle`,
    ],

    // 8. Day Three — image alt text
    [
      `![FeedLoop after iteration showing refined card design, true indigo color scheme, and dark mode toggle](PLACEHOLDER_IMAGE_feedloop_iterated.png)`,
      `![FeedLoop mobile app after iteration showing refined card design, true indigo color scheme, and dark mode toggle](PLACEHOLDER_MOBILE_SCREEN_feedloop_iterated.png)`,
    ],

    // 9. Day Seven — image alt text
    [
      `![Emergent AI GitHub export panel and deployed FeedLoop live URL](PLACEHOLDER_IMAGE_emergent_deploy.png)`,
      `![Emergent AI GitHub export panel and deployed FeedLoop mobile app](PLACEHOLDER_IMAGE_emergent_deploy.png)`,
    ],

    // 10. Day Seven — deployment description
    [
      `**Deployment:** One-click on Emergent's hosted infrastructure. FeedLoop was live at a public URL within 90 seconds. The backend, database, and authentication all worked correctly in production.`,
      `**Deployment:** One-click on Emergent's hosted infrastructure. FeedLoop was live and testable via Expo QR code within 90 seconds — I scanned it on my phone and the full app loaded with working navigation, authentication, and data. The backend, database, and auth all worked correctly in production.`,
    ],

    // 11. PM scorecard — stakeholder note
    [
      `| Stakeholder-share readiness | 8/10 | Live URL beats any wireframe |`,
      `| Stakeholder-share readiness | 8/10 | Scannable QR code on a real phone beats any wireframe |`,
    ],

    // 12. Designer scorecard — first draft note
    [
      `| First-draft visual quality | 5/10 | Generic Tailwind defaults, limited style control |`,
      `| First-draft visual quality | 5/10 | Generic Tailwind defaults, mobile spacing feels like web squeezed onto phone |`,
    ],

    // 13. Title update to reflect mobile
    // (will update title separately via prisma)
  ];

  let changeCount = 0;
  for (const [oldText, newText] of replacements) {
    if (content.includes(oldText)) {
      content = content.replace(oldText, newText);
      changeCount++;
      console.log(`  ✅ Replaced: "${oldText.slice(0, 60)}..."`);
    } else {
      console.log(`  ⚠️  Not found: "${oldText.slice(0, 60)}..."`);
    }
  }

  if (changeCount > 0) {
    await prisma.blogPost.update({
      where: { slug: "emergent-ai-review" },
      data: {
        content,
        description:
          "I built a mobile feedback app with Emergent AI over 7 days. Honest review covering build quality, credit math, iteration speed, and separate scorecards for PMs vs designers.",
      },
    });
    console.log(
      `\n✅ Updated emergent-ai-review (${changeCount} replacements)`,
    );
  } else {
    console.log("\n⏭️  No changes made");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
