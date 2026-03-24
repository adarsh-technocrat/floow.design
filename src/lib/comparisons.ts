import { prisma } from "@/lib/db";

export interface Comparison {
  slug: string;
  competitorName: string;
  competitorLogo: string | null;
  competitorUrl: string | null;
  title: string;
  description: string;
  content: string;
  floowFeatures: string[];
  competitorFeatures: string[];
  floowPros: string[];
  competitorPros: string[];
  verdict: string;
  keywords: string[];
}

function toComparison(row: {
  slug: string;
  competitorName: string;
  competitorLogo: string | null;
  competitorUrl: string | null;
  title: string;
  description: string;
  content: string;
  floowFeatures: string[];
  competitorFeatures: string[];
  floowPros: string[];
  competitorPros: string[];
  verdict: string;
  keywords: string[];
}): Comparison {
  return {
    slug: row.slug,
    competitorName: row.competitorName,
    competitorLogo: row.competitorLogo,
    competitorUrl: row.competitorUrl,
    title: row.title,
    description: row.description,
    content: row.content,
    floowFeatures: row.floowFeatures,
    competitorFeatures: row.competitorFeatures,
    floowPros: row.floowPros,
    competitorPros: row.competitorPros,
    verdict: row.verdict,
    keywords: row.keywords,
  };
}

export async function getAllComparisons(): Promise<Comparison[]> {
  const rows = await prisma.comparison.findMany({
    where: { published: true },
    orderBy: { competitorName: "asc" },
  });
  return rows.map(toComparison);
}

export async function getComparisonBySlug(
  slug: string,
): Promise<Comparison | undefined> {
  const row = await prisma.comparison.findUnique({ where: { slug } });
  if (!row || !row.published) return undefined;
  return toComparison(row);
}

export async function getAllComparisonSlugs(): Promise<string[]> {
  const rows = await prisma.comparison.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/* ------------------------------------------------------------------ */
/* Dummy data — used when no DB rows exist yet                         */
/* ------------------------------------------------------------------ */
export const DUMMY_COMPARISONS: Comparison[] = [
  {
    slug: "floow-vs-uizard",
    competitorName: "Uizard",
    competitorLogo: null,
    competitorUrl: "https://uizard.io",
    title: "floow.design vs Uizard — AI Mobile App Design Comparison",
    description:
      "Compare floow.design and Uizard for AI-powered mobile app design. See how they stack up on features, mobile focus, export options, and pricing.",
    content: `## floow.design vs Uizard: Which AI Design Tool Is Better for Mobile Apps?

Both floow.design and Uizard use AI to help you design apps, but they take very different approaches. Here's an honest comparison.

### Focus & Philosophy

**floow.design** is built exclusively for mobile app design. Every feature, component, and AI model is optimized for creating iOS and Android screens. This laser focus means better mobile-specific outputs.

**Uizard** is a more general-purpose AI design tool that handles web, mobile, and presentation design. It's broader but less specialized for mobile.

### AI Design Quality

floow generates designs using mobile-specific AI models trained on thousands of production mobile apps. This means:
- Better component selection for mobile contexts
- Proper touch target sizing
- Platform-native navigation patterns
- Consistent spacing optimized for thumb zones

Uizard's AI is trained on a broader dataset, which can sometimes produce designs that feel more "web-like" on mobile.

### Export Options

floow offers Figma export with structured layers, plus Flutter and React Native code generation. Uizard exports to Figma and provides React code.

### Pricing

Both offer free tiers. floow's pricing is optimized for individual designers and small teams building mobile apps, while Uizard targets a broader audience with enterprise plans.`,
    floowFeatures: [
      "AI mobile app design",
      "iOS & Android native components",
      "Flutter code export",
      "React Native code export",
      "Figma export with auto-layout",
      "Custom design themes",
      "Multi-screen flow generation",
      "Real-time AI iteration",
    ],
    competitorFeatures: [
      "AI design for web & mobile",
      "Screenshot to design",
      "Hand-drawn sketch to design",
      "Figma export",
      "React code export",
      "Team collaboration",
      "Design templates",
      "Presentation mode",
    ],
    floowPros: [
      "Mobile-first AI — better mobile design quality",
      "Flutter & React Native code export",
      "Platform-specific components (Material & Cupertino)",
      "Custom design themes with token export",
      "Faster iteration with natural language",
    ],
    competitorPros: [
      "Broader scope — web + mobile + presentations",
      "Screenshot and sketch import",
      "Larger template library",
      "More established brand with bigger community",
      "Team collaboration features",
    ],
    verdict:
      "If you're specifically building mobile apps, floow.design delivers higher quality mobile-specific designs with better export options for mobile developers. If you need a general-purpose AI design tool for web and mobile, Uizard offers more flexibility. For mobile-focused teams, floow is the clear winner.",
    keywords: [
      "floow vs uizard",
      "uizard alternative",
      "ai app design comparison",
      "best ai mobile design tool",
    ],
  },
  {
    slug: "floow-vs-figma",
    competitorName: "Figma",
    competitorLogo: null,
    competitorUrl: "https://figma.com",
    title: "floow.design vs Figma — AI-First vs Traditional Design Tool",
    description:
      "Compare floow.design and Figma for mobile app design. See how AI-powered design compares to traditional manual design workflows.",
    content: `## floow.design vs Figma: AI-First Design vs Manual Design

Figma is the industry-standard design tool. floow.design is an AI-first alternative built specifically for mobile app design. Here's how they compare.

### Different Approaches

**Figma** gives you a blank canvas and professional-grade tools to design anything. It requires design skills and time, but offers unlimited creative control.

**floow.design** gives you a prompt field. Describe your app and get complete designs in seconds. It's faster but more guided.

### When to Use Each

**Choose floow when:**
- You need mobile app designs fast
- You don't have a dedicated designer
- You're prototyping or validating ideas
- You want AI-generated starting points

**Choose Figma when:**
- You need pixel-perfect custom designs
- You're designing for web, print, or other media
- You have a professional design team
- You need advanced prototyping features

### They Work Together

floow exports directly to Figma. Many teams use floow to generate initial designs, then refine them in Figma. It's not either/or — it's a workflow.

### AI Features

Figma has added AI features (Figma AI), but they augment the manual workflow. floow is AI-native — the AI is the primary design engine, not an add-on.`,
    floowFeatures: [
      "AI-powered design generation",
      "Natural language input",
      "Instant mobile app screens",
      "Flutter & React Native export",
      "Mobile-optimized components",
      "One-click theme switching",
      "No design skills required",
      "Real-time AI iteration",
    ],
    competitorFeatures: [
      "Professional-grade design canvas",
      "Advanced prototyping",
      "Dev mode for developers",
      "Design systems & variables",
      "Real-time collaboration",
      "Plugin ecosystem",
      "Auto-layout",
      "Figma AI (augmentation)",
    ],
    floowPros: [
      "10x faster for mobile app design",
      "No design skills required",
      "AI-native workflow",
      "Mobile-specific component library",
      "Direct code export (Flutter, React Native)",
    ],
    competitorPros: [
      "Industry standard — everyone knows Figma",
      "Unlimited creative control",
      "Massive plugin ecosystem",
      "Advanced prototyping and animations",
      "Works for any design type (web, print, etc.)",
    ],
    verdict:
      "Figma is the better tool for professional designers who need full creative control. floow.design is better for anyone who needs mobile app designs quickly without a design background. The best workflow uses both: floow for initial design generation, Figma for refinement.",
    keywords: [
      "floow vs figma",
      "figma alternative",
      "figma ai alternative",
      "figma alternative for mobile",
    ],
  },
  {
    slug: "floow-vs-visily",
    competitorName: "Visily",
    competitorLogo: null,
    competitorUrl: "https://visily.ai",
    title: "floow.design vs Visily — AI Mobile Design Comparison",
    description:
      "Compare floow.design and Visily for AI-powered app design. See the differences in mobile focus, wireframing, and design output quality.",
    content: `## floow.design vs Visily: Focused Mobile Design vs General Wireframing

Both tools use AI to accelerate design, but they serve different primary use cases.

### Core Focus

**floow.design** focuses exclusively on generating high-fidelity mobile app designs. You describe your app and get production-ready screens.

**Visily** is primarily a wireframing and diagramming tool with AI features. It's great for flowcharts, wireframes, and early-stage ideation across web and mobile.

### Design Output

floow produces high-fidelity mobile screens with proper components, spacing, and platform conventions. The output is closer to a final design.

Visily produces wireframes and low-to-mid fidelity designs. It's better for early exploration but requires more work to reach production quality.

### Collaboration

Visily has stronger real-time collaboration features, making it better for teams that want to brainstorm together.

floow is more focused on the individual design generation workflow, with sharing via export and preview links.

### AI Capabilities

floow's AI is specialized for mobile app design — it understands screen types, navigation patterns, and platform guidelines deeply.

Visily's AI helps with wireframe generation, screenshot-to-design conversion, and smart layout suggestions.`,
    floowFeatures: [
      "High-fidelity mobile design",
      "AI screen generation",
      "Flutter & React Native export",
      "Figma export",
      "Platform-native components",
      "Custom themes",
      "Multi-screen flows",
      "Natural language iteration",
    ],
    competitorFeatures: [
      "AI wireframing",
      "Flowchart & diagramming",
      "Screenshot to wireframe",
      "Real-time collaboration",
      "Template library",
      "Figma import/export",
      "Design system basics",
      "Presentation mode",
    ],
    floowPros: [
      "Higher fidelity mobile-specific output",
      "Direct code export for mobile frameworks",
      "Platform-native iOS & Android components",
      "Deeper AI understanding of mobile patterns",
      "Custom design theme system",
    ],
    competitorPros: [
      "Better for wireframing & diagramming",
      "Stronger real-time collaboration",
      "Broader use case (web + mobile + diagrams)",
      "Screenshot to design conversion",
      "More affordable for large teams",
    ],
    verdict:
      "If your primary goal is creating high-fidelity mobile app designs, floow.design produces better output with more useful export options. If you need a wireframing and diagramming tool with AI features, Visily is the better choice. For mobile-focused teams, floow is recommended.",
    keywords: [
      "floow vs visily",
      "visily alternative",
      "ai wireframe comparison",
      "best ai design tool mobile",
    ],
  },
  {
    slug: "floow-vs-flutterflow",
    competitorName: "FlutterFlow",
    competitorLogo: null,
    competitorUrl: "https://flutterflow.io",
    title: "floow.design vs FlutterFlow — Design vs No-Code App Builder",
    description:
      "Compare floow.design and FlutterFlow. See how AI design generation compares to visual no-code app building for mobile development.",
    content: `## floow.design vs FlutterFlow: AI Design vs No-Code Building

These tools serve different stages of the mobile app development process.

### Different Tools, Different Jobs

**floow.design** is a design tool. It generates the visual design of your mobile app — screens, layouts, components, and themes. It outputs designs and code that developers implement.

**FlutterFlow** is a no-code/low-code app builder. It lets you build functional Flutter apps visually, with real backend integrations, logic, and deployable output.

### When to Use Each

**Use floow when:**
- You're in the design/ideation phase
- You need to create mockups and prototypes quickly
- You want AI-generated design options
- You plan to have developers build the actual app

**Use FlutterFlow when:**
- You want to build a functional app without coding
- You need backend integration (Firebase, Supabase, APIs)
- You're a solo founder building an MVP
- You want a deployable app, not just designs

### They're Complementary

floow generates the design → export to Figma or Flutter code → use FlutterFlow or custom development to build. Many teams use floow for rapid design exploration, then FlutterFlow for implementation.

### Cost Comparison

floow is more affordable for the design phase. FlutterFlow's pricing reflects its broader scope as a full app development platform.`,
    floowFeatures: [
      "AI mobile app design",
      "Natural language to design",
      "Figma export",
      "Flutter code generation",
      "iOS & Android designs",
      "Custom themes",
      "Multi-screen flows",
      "Preview sharing",
    ],
    competitorFeatures: [
      "Visual no-code app builder",
      "Firebase/Supabase integration",
      "Custom actions & logic",
      "Deployable Flutter apps",
      "App Store publishing",
      "API integrations",
      "Team collaboration",
      "Version control",
    ],
    floowPros: [
      "Faster design generation — seconds vs hours",
      "AI-powered — no manual design work",
      "Better for design exploration & ideation",
      "More affordable for design-only needs",
      "Framework-agnostic export (Flutter + React Native)",
    ],
    competitorPros: [
      "Builds functional apps, not just designs",
      "Backend & database integrations",
      "Deploys directly to app stores",
      "More complete development platform",
      "Built-in logic and state management",
    ],
    verdict:
      "floow.design and FlutterFlow aren't direct competitors — they solve different problems. Use floow for fast AI design generation and FlutterFlow for no-code app building. The ideal workflow starts with floow for design, then moves to FlutterFlow (or custom Flutter development) for implementation.",
    keywords: [
      "floow vs flutterflow",
      "flutterflow alternative",
      "ai design vs no code builder",
      "mobile app design vs app builder",
    ],
  },
];
