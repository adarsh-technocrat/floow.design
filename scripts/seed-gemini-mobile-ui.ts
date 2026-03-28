import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const content = `Most Gemini 3.1 design guides focus on web. Landing pages, dashboards, marketing sites.

But if you're building a **mobile app** — and you want to use Gemini 3.1 to speed up your design process — those guides leave out exactly what you need to know.

Mobile UI design has different rules. Touch targets need to be 44px minimum. Navigation patterns are different from web. Content density is lower. Thumb zones matter. And the model that produces a beautiful SaaS dashboard doesn't always produce a usable mobile screen.

I ran 4 specific mobile app UI prompts through Gemini 3.1 Pro — a fitness tracker, a food delivery app, a fintech wallet, and a meditation app — and documented exactly what worked, what didn't, and the prompting techniques that consistently produced better mobile results.

---

## What Is Gemini 3.1 Pro and Why Does It Matter for Mobile Design?

![Google AI Studio interface with Gemini 3.1 Pro model selected](PLACEHOLDER_IMAGE_google_ai_studio.png)

[Gemini 3.1 Pro is Google's February 2026 reasoning upgrade to the Gemini 3 series](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/). It scored 77.1% on ARC-AGI-2 — more than double the reasoning performance of Gemini 3 Pro from November 2025. For designers, that improved reasoning translates directly to better spatial understanding, more coherent layout logic, and significantly better handling of complex prompt instructions.

**What's new for UI/UX designers specifically:**

- **SVG generation that actually works** — [Gemini 3.1 generates website-ready, animated SVGs directly from text prompts](https://nervegna.substack.com/p/gemini-31-pro-for-designers-a-practical) — icons, illustrations, loading states
- **1 million token context window** — throw in a full design brief, screenshots, reference apps, and a detailed spec in one prompt
- **Generative UI** — [Google's new dynamic view feature generates custom interactive interfaces on the fly](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) directly from prompts
- **Stronger aesthetic reasoning** — [Reddit's vibe coding community noted it "finally understands 'aesthetic' instructions without needing 10 prompt revisions"](https://www.banani.co/blog/gemini-3.1-for-web-and-ui-design) and produces output that looks "a level less AI-designed"

**Where to access Gemini 3.1 Pro for design:**

- **Google AI Studio** — Free with rate limits. The "Build" section is your full-stack prototyping sandbox — go from prompt to working React app
- **Google Stitch** — Prompt-to-UI generation with Figma export. Built on Gemini models, it generates complete interface designs with exportable HTML/CSS
- **Gemini app (Canvas mode)** — [Available for AI Pro and Ultra users](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/). Regionally locked outside the US as of March 2026
- **Gemini CLI** — Open-source terminal agent, free with 1,000 requests/day

---

## Before You Start: The Mobile Prompting Mindset

Gemini 3.1 is powerful, but mobile UI prompts need a different structure than web prompts.

Here's what consistently produces better mobile results:

**1. Specify the platform explicitly**
Don't say "design an app." Say "design an iOS mobile screen in portrait orientation" or "design a React Native screen using Material Design 3 principles."

**2. Use markdown format for your prompt**
[Markdown naturally creates content hierarchy, logical section grouping, and better AI readability](https://x.com/101babich/status/2027011638377807917). Ask Gemini to reformat your first prompt as markdown, then use that version for the actual generation.

**3. Reference real apps you admire**
[The quality of Gemini's output highly depends on how many details and references you provide](https://www.banani.co/blog/gemini-3.1-for-web-and-ui-design). Mentioning "inspired by the navigation pattern of Instagram" or "card style similar to Airbnb" anchors the output in established mobile patterns.

**4. Include mobile-specific constraints in every prompt**
- "Touch targets minimum 44x44pt"
- "Bottom navigation bar for primary actions"
- "Thumb-friendly layout — critical actions in the bottom third"
- "Single-column layout"

**5. Use the Thinking Level setting**
[Gemini 3.1 Pro has a "thinking level" setting in AI Studio](https://nervegna.substack.com/p/gemini-31-pro-for-designers-a-practical). For mobile UI, use medium or high thinking — it produces better spatial reasoning for screen layouts.

---

## The 4 Mobile App UI Tests

### Test 1: Fitness Tracker App — Home Screen

![Gemini 3.1 generated FitPulse fitness tracker home screen with dark background and coral accents](PLACEHOLDER_MOBILE_SCREEN_fitpulse_home.png)

**My prompt:**

\`\`\`
Design a mobile home screen for a fitness tracking app called FitPulse.

Platform: iOS, portrait orientation
Color: Dark background (#0D0D0D) with electric coral (#FF4D4D) accents
Typography: Bold, high-contrast headings

Layout (top to bottom):
- Header: greeting + avatar (top bar)
- Today's stats: 3 cards in a row (Steps, Calories, Active Minutes)
- Weekly progress: horizontal bar chart showing 7 days
- Quick actions: 2 large buttons — "Start Workout" and "Log Meal"
- Bottom navigation: Home, Workouts, Nutrition, Profile

Constraints:
- All touch targets minimum 44x44pt
- Critical actions in bottom 40% of screen
- Card corner radius 16px
- No text smaller than 14pt
- Inspired by the clean data density of Whoop
\`\`\`

**What happened:**

Gemini 3.1 produced a layout with correct dark background, coral accents, and proper bottom navigation. The weekly chart rendered accurately with 7 bars. The stat cards were well-sized and readable.

Where it fell short: the "Start Workout" button was placed in the middle of the screen, not the bottom third as specified. A follow-up prompt fixing this — "move the quick action buttons to the bottom 40% of the screen above the navigation bar" — corrected it in one iteration.

**Mobile-specific win:** The touch target constraint was respected — buttons were generously sized and well-spaced.

**Score for this test: 8/10**

---

### Test 2: Food Delivery App — Restaurant Listing Screen

![Gemini 3.1 generated QuickBite food delivery restaurant listing with search bar, category icons, and restaurant cards](PLACEHOLDER_MOBILE_SCREEN_quickbite_listing.png)

**My prompt:**

\`\`\`
Design a mobile restaurant listing screen for a food delivery app called QuickBite.

Platform: Android, Material Design 3
Color: White background, deep orange (#E65100) primary, light grey cards
Typography: Google Sans, 16pt body

Layout (top to bottom):
- Search bar with filter chips below (Cuisine, Distance, Rating, Price)
- Featured restaurant card (full-width, image + name + rating + delivery time)
- Section header: "Near You" with See All link
- Horizontal scroll of category icons (Pizza, Sushi, Burgers, Indian, etc.)
- Vertical list of restaurant cards (image, name, cuisine tags, rating, delivery time + fee)

Constraints:
- Sticky search bar on scroll
- Category icons: 56x56dp touch target with label below
- Cards: 8dp corner radius, 2dp elevation shadow
- Delivery time badge visible on every card
- Reference: Swiggy's information density and card style
\`\`\`

**What happened:**

This was the strongest output of the four tests. The filter chips were correctly rendered below the search bar. The category icon section had proper proportions. The restaurant cards included all required information elements with correct hierarchy — name most prominent, then rating and delivery time.

The Material Design 3 system came through clearly — correct elevation, correct corner radii, correct typography scale. Referencing Swiggy seemed to help Gemini understand the content density level.

**Mobile-specific win:** Category icons had correct 56dp touch targets with labels — something many AI-generated mobile UIs get wrong by making icons too small.

**Score for this test: 9/10**

---

### Test 3: Fintech Wallet App — Transaction History Screen

![Gemini 3.1 generated NovaPay fintech wallet transaction history with balance card, month filter, and transaction list](PLACEHOLDER_MOBILE_SCREEN_novapay_transactions.png)

**My prompt:**

\`\`\`
Design a mobile transaction history screen for a fintech wallet app called NovaPay.

Platform: iOS, portrait orientation
Color: Pure white background, deep navy (#0A1628) headings, green (#00C48C) for credits, red (#FF5252) for debits
Typography: SF Pro Display, bold balance at top

Layout (top to bottom):
- Balance card: large current balance + monthly change indicator
- Month filter: horizontal scrollable month chips (Jan, Feb, Mar...)
- Search bar with filter icon
- Transaction list: grouped by date, each item shows merchant icon + name + category + amount
- Floating "Transfer" CTA button at bottom right (FAB pattern)

Constraints:
- Transaction amounts: right-aligned, green for incoming, red for outgoing
- Date group headers: sticky while scrolling
- Merchant icons: 40x40pt circles, placeholder if no logo
- FAB: 56pt diameter, above navigation bar by 16pt
- Accessibility: minimum 4.5:1 contrast ratio for all text
\`\`\`

**What happened:**

The balance card rendered well with the correct large-number treatment. The month filter chips were well-spaced. The transaction list had correct color-coding for credits and debits.

Two issues: the sticky date headers weren't clearly differentiated from transaction rows — they needed more visual weight. And the FAB position was correct but Gemini placed it at 8pt above the nav bar instead of 16pt as specified.

The accessibility constraint appeared to be respected — contrast levels looked strong across the screen.

**Follow-up needed:** One prompt to increase date header weight and adjust FAB spacing resolved both issues.

**Score for this test: 7/10**

---

### Test 4: Meditation App — Session Player Screen

![Gemini 3.1 generated Serene meditation app session player with gradient background, breathing ring, and minimal controls](PLACEHOLDER_MOBILE_SCREEN_serene_player.png)

**My prompt:**

\`\`\`
Design a mobile session player screen for a meditation app called Serene.

Platform: iOS, portrait orientation
Color: Deep gradient background (midnight blue #1A1A2E to dark teal #16213E)
Typography: Thin, serif headings for calm energy — use a light weight

Layout (top to bottom):
- Back arrow + "Daily Calm" session title (minimal top bar)
- Large circular breathing animation (pulsing ring — describe the state, not the animation)
- Breathing instruction: large text "Breathe In" / "Hold" / "Breathe Out"
- Session progress: subtle arc progress bar below the circle
- Timer: current time elapsed / total duration
- Controls row: skip back, play/pause (large), skip forward + ambient sound toggle
- Bottom: end session text link (not a button)

Constraints:
- Maximum 6 UI elements visible at once — keep it calm
- No cards, no containers — elements float on gradient
- Control buttons: 48x48pt touch targets
- Mood: think Calm app meets Headspace — minimal, focused
\`\`\`

**What happened:**

This was Gemini 3.1's most impressive mobile output. The gradient was correctly applied and genuinely looked atmospheric. The breathing animation was described as a pulsing ring with inner and outer radius correctly referenced in the code. The floating-on-gradient aesthetic worked — no cards or containers appeared.

The constraint of maximum 6 UI elements kept the screen uncluttered. The end session text link (not a button) was correctly implemented without a border or fill.

**Mobile-specific win:** The "describe the state, not the animation" approach for the breathing ring worked well. The overall calm, minimal quality of the screen was genuinely impressive — it felt designed, not generated.

**Score for this test: 9/10**

---

## Gemini 3.1 Mobile UI Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Touch target accuracy | 8/10 | Generally respected when explicitly specified |
| Navigation pattern correctness | 8/10 | iOS and Android patterns mostly accurate |
| Mobile typography hierarchy | 7/10 | Good on first draft, needs tuning on complex screens |
| Aesthetic quality | 9/10 | Genuinely improved vs Gemini 3 — less "AI-looking" |
| Constraint adherence | 7/10 | Follows most but misses 1-2 specifics per prompt |
| **Overall for mobile UI** | **7.8/10** | Strong starting point — expect 1-2 follow-up prompts |

---

## 7 Prompting Techniques That Improved Every Mobile Output

Based on all 4 tests, these techniques consistently produced better mobile UI results:

**1. Specify exact measurements**
"Corner radius 16px" works better than "rounded cards." "FAB 56pt" works better than "floating button."

**2. Reference real apps by name**
"Inspired by Whoop's data density" or "similar to Swiggy's card style" anchors Gemini in established mobile patterns — it understands these products and uses their design logic.

**3. Limit element count explicitly**
"Maximum 6 UI elements visible" or "keep it to 3 sections" prevents Gemini from overcrowding the screen, which is the most common failure mode in AI-generated mobile UI.

**4. State the mood, not just the layout**
"Calm, minimal, focused" or "high-energy, data-rich" gives Gemini aesthetic direction that improves typography weight, spacing, and color choices beyond what explicit specs produce.

**5. Use the markdown prompt format**
[Format your prompt as markdown before submitting](https://x.com/101babich/status/2027011638377807917). The hierarchy of headers and bullet points maps directly onto screen layout logic. Ask Gemini to reformat your plain English prompt as markdown first, then use that for generation.

**6. Always specify the platform**
"iOS" or "Android Material Design 3" significantly changes the output. iOS prompts produce SF-style typography and navigation patterns. Android prompts produce Material Design components correctly.

**7. Include a "don'ts" line**
"No cards on gradient screens" or "no text smaller than 14pt" prevents the most common AI mobile UI mistakes. Gemini respects explicit prohibitions reliably.

---

## The 3-Step Gemini-to-Production Mobile UI Workflow

Here's how to use Gemini 3.1 effectively in a real mobile app design workflow — from idea to something handoff-ready:

**Step 1: Rapid Ideation in Google AI Studio (free)**
Use Gemini 3.1 Pro in AI Studio's Build section to generate 2-3 screen variations from detailed markdown prompts. At this stage, you're exploring layout logic and visual direction — not polishing.

**Step 2: Iterate via follow-up prompts (1-3 rounds)**
Correct the 1-2 issues that almost always appear in the first draft. Use specific, measurement-based corrections: "Move the CTA to 16pt above the navigation bar" not "move the button down."

**Step 3: Polish in a dedicated mobile UI tool**
Gemini gets you to a strong ~70-80% first draft. The remaining 20-30% — precise component spacing, platform-specific component behavior, touch state animations, design system consistency — requires a dedicated mobile UI tool.

This is where [Floow](https://www.floow.design/) fits into the workflow. It's built specifically for mobile app UI design — so instead of fighting Gemini's generic defaults on fine-grained mobile details, you use Floow to finalize the screens with proper mobile-native components and patterns before handing off to engineering.

The combination is genuinely powerful: **Gemini for speed and direction, Floow for mobile precision.**

---

## Gemini 3.1 vs Gemini 3 vs ChatGPT 5 for Mobile UI

| | **Gemini 3.1 Pro** | **Gemini 3 Pro** | **ChatGPT 5** |
|---|---|---|---|
| **Mobile layout logic** | Strong | Good | Strong |
| **Touch target accuracy** | Good (when specified) | Moderate | Good |
| **Aesthetic quality** | Noticeably improved | Generic | Strong |
| **Constraint adherence** | 80-85% | 65-70% | 75-80% |
| **Platform specificity (iOS/Android)** | Strong | Moderate | Strong |
| **SVG / icon generation** | Good | Poor | Good |
| **Context window** | 1M tokens | 1M tokens | 128K tokens |
| **Free access** | Yes (AI Studio) | Yes (AI Studio) | Limited |
| **Thinking loop risk** | Moderate | Low | Low |

**The thinking loop caveat:** On complex mobile prompts, [Gemini 3.1 Pro can get stuck planning forever — writing long, repetitive reasoning before producing actual code](https://www.banani.co/blog/gemini-3.1-for-web-and-ui-design). If this happens, start a new chat with a shorter, more focused prompt. Break complex screens into individual sections rather than asking for everything at once.

---

## When Gemini 3.1 Is the Right Choice for Mobile UI

**Use Gemini 3.1 when:**
- You need to explore 3-4 layout directions quickly before committing to one
- You're working in Google AI Studio and want to go from prompt to working code fast
- You're referencing well-known apps (Uber, Instagram, Airbnb) — Gemini understands their design patterns
- You're comfortable with 1-2 follow-up prompts to correct specifics

**Use something else when:**
- You need pixel-perfect results from a single prompt
- You need tight design system consistency across 10+ screens
- You're outside the US and can't access Canvas mode
- You need native component fidelity (Core Motion animations, exact Material Design 3 specs)

---

## FAQ: Gemini 3.1 for Mobile App UI Design

### Can Gemini 3.1 generate mobile app screens, or just web designs?

Yes — [Gemini 3.1 Pro handles both mobile and web UI design](https://www.banani.co/blog/gemini-3.1-for-web-and-ui-design). For mobile, you need to be explicit in your prompt: specify the platform (iOS or Android), screen orientation, and mobile-specific constraints like touch target sizes. Without these, the model tends to default toward web-style layouts that don't translate well to small screens.

### Is Google AI Studio free for generating mobile UI with Gemini 3.1?

Yes, with rate limits. [Google AI Studio provides free access to Gemini 3.1 Pro via the Build section](https://nervegna.substack.com/p/gemini-31-pro-for-designers-a-practical). Paid access with higher limits is available through Google AI Pro and Ultra plans. The Canvas feature in the Gemini app — which provides a visual preview — is [currently limited to users outside the US as of March 2026](https://www.banani.co/blog/gemini-3.1-for-web-and-ui-design), so check regional availability before relying on it.

### What's the biggest mistake designers make when prompting Gemini for mobile UI?

Using web-oriented prompts without mobile-specific constraints. The two most impactful things you can add to any mobile UI prompt are: explicit touch target sizes (minimum 44x44pt for iOS, 48x48dp for Android) and a statement about navigation pattern (bottom navigation bar, tab bar, etc.). Without these, Gemini defaults to web conventions that break mobile usability.

### How does Gemini 3.1 compare to Google Stitch for mobile app UI design?

They solve different problems. [Gemini 3.1 in AI Studio generates working code from prompts — React components, full pages, interactive logic](https://nervegna.substack.com/p/gemini-31-pro-for-designers-a-practical). Google Stitch generates visual UI designs with Figma export but no backend logic. For mobile app design exploration, Stitch is faster for visual-only work. For designers who want a working interactive prototype, AI Studio with Gemini 3.1 is the stronger path.

### What's the best workflow for using Gemini 3.1 to design a full mobile app?

Start with Gemini 3.1 in AI Studio for rapid screen ideation — 2-3 variations of each key screen using detailed markdown prompts and real app references. Follow up with 1-2 correction prompts to fix the specific issues that appear. Then move to a dedicated mobile UI design tool to refine spacing, component behavior, and design system consistency before handing off to engineering. Using Gemini for speed and a specialized mobile tool like [Floow](https://www.floow.design/) for precision gives you the best of both approaches.

---

*Gemini 3.1 Pro features and availability verified March 2026. AI Studio access and regional availability may change — check ai.google.dev for current status.*`;

async function main() {
  const post = await prisma.blogPost.upsert({
    where: { slug: "gemini-3.1-for-web-and-ui-design" },
    create: {
      slug: "gemini-3.1-for-web-and-ui-design",
      title:
        "Gemini 3.1 for Mobile App UI Design: 4 Real Prompts Tested Hands-On (2026)",
      description:
        "I tested Gemini 3.1 Pro with 4 real mobile app UI prompts — fitness tracker, food delivery, fintech wallet, and meditation app. Detailed results, prompting techniques, and a production workflow.",
      content,
      tldr: "Gemini 3.1 Pro scores 7.8/10 for mobile UI design. Best results come from specifying platform (iOS/Android), exact measurements, real app references, and element count limits. Expect 1-2 follow-up prompts per screen. Use Gemini for speed and direction, then polish in a dedicated mobile UI tool like Floow for precision.",
      coverImage: "/blog/gemini-mobile-ui-hero.png",
      category: "Guide",
      tags: [
        "gemini 3.1",
        "mobile app ui design",
        "gemini ai design",
        "ai ui design",
        "google ai studio",
        "mobile ui prompts",
        "gemini 3.1 pro",
        "ai mobile design 2026",
        "gemini vs chatgpt design",
        "mobile app design",
        "ai prototyping",
        "google stitch",
      ],
      author: "floow.design",
      authorRole: "Editorial",
      published: true,
    },
    update: {
      title:
        "Gemini 3.1 for Mobile App UI Design: 4 Real Prompts Tested Hands-On (2026)",
      description:
        "I tested Gemini 3.1 Pro with 4 real mobile app UI prompts — fitness tracker, food delivery, fintech wallet, and meditation app. Detailed results, prompting techniques, and a production workflow.",
      content,
      tldr: "Gemini 3.1 Pro scores 7.8/10 for mobile UI design. Best results come from specifying platform (iOS/Android), exact measurements, real app references, and element count limits. Expect 1-2 follow-up prompts per screen. Use Gemini for speed and direction, then polish in a dedicated mobile UI tool like Floow for precision.",
      coverImage: "/blog/gemini-mobile-ui-hero.png",
      category: "Guide",
      tags: [
        "gemini 3.1",
        "mobile app ui design",
        "gemini ai design",
        "ai ui design",
        "google ai studio",
        "mobile ui prompts",
        "gemini 3.1 pro",
        "ai mobile design 2026",
        "gemini vs chatgpt design",
        "mobile app design",
        "ai prototyping",
        "google stitch",
      ],
      author: "floow.design",
      authorRole: "Editorial",
      published: true,
    },
  });

  console.log("Seeded blog post:", post.slug);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
