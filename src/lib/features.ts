import { prisma } from "@/lib/db";

export interface Feature {
  slug: string;
  title: string;
  headline: string;
  description: string;
  content: string;
  icon: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  benefits: string[];
  keywords: string[];
  order: number;
}

function toFeature(row: {
  slug: string;
  title: string;
  headline: string;
  description: string;
  content: string;
  icon: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  benefits: string[];
  keywords: string[];
  order: number;
}): Feature {
  return {
    slug: row.slug,
    title: row.title,
    headline: row.headline,
    description: row.description,
    content: row.content,
    icon: row.icon,
    videoUrl: row.videoUrl,
    imageUrl: row.imageUrl,
    benefits: row.benefits,
    keywords: row.keywords,
    order: row.order,
  };
}

export async function getAllFeatures(): Promise<Feature[]> {
  const rows = await prisma.feature.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map(toFeature);
}

export async function getFeatureBySlug(
  slug: string,
): Promise<Feature | undefined> {
  const row = await prisma.feature.findUnique({ where: { slug } });
  if (!row || !row.published) return undefined;
  return toFeature(row);
}

export async function getAllFeatureSlugs(): Promise<string[]> {
  const rows = await prisma.feature.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/* ------------------------------------------------------------------ */
/* Dummy data — used when no DB rows exist yet                         */
/* ------------------------------------------------------------------ */
export const DUMMY_FEATURES: Feature[] = [
  {
    slug: "ai-mobile-app-design",
    title: "AI Mobile App Design",
    headline: "Describe your app idea. Get a complete design in seconds.",
    description:
      "Type what you want in plain English — screens, flows, style — and our AI generates pixel-perfect mobile app designs instantly. No design skills required.",
    content: `## How It Works

**1. Describe your vision**
Tell floow what your app should look like. Mention screens, color palette, style, or even reference existing apps.

**2. AI generates your design**
Our AI understands mobile design patterns — navigation bars, tab bars, cards, lists, modals — and composes them into production-ready layouts.

**3. Iterate with natural language**
Don't like something? Just say "make the header larger" or "switch to a dark theme" and watch your design update in real-time.

## Why Choose AI-Powered Design?

Traditional mobile app design requires weeks of wireframing, mockups, and iteration. With floow, you go from idea to polished design in minutes — not weeks.

- **10x faster** than manual design workflows
- **No Figma expertise needed** — just describe what you want
- **Production-quality output** — proper spacing, typography, and component hierarchy
- **Mobile-first** — every design follows iOS and Android guidelines`,
    icon: "sparkles",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "Go from idea to design in under 60 seconds",
      "No design skills or Figma expertise required",
      "AI understands iOS & Android design conventions",
      "Natural language iteration — just describe changes",
    ],
    keywords: [
      "ai mobile app design",
      "ai app design tool",
      "text to mobile app design",
      "ai design generator",
    ],
    order: 1,
  },
  {
    slug: "ai-screen-generator",
    title: "AI Screen Generator",
    headline: "Generate complete app screens with one prompt.",
    description:
      "From login flows to dashboards — our AI creates fully-designed mobile screens with proper layout, spacing, and typography. Every component follows platform guidelines.",
    content: `## Generate Any Screen Type

floow can generate virtually any mobile app screen:

- **Onboarding flows** — Welcome screens, sign-up, login, OTP verification
- **Dashboards** — Analytics, metrics, activity feeds
- **Content screens** — Feed layouts, article views, media galleries
- **E-commerce** — Product cards, cart, checkout, order tracking
- **Social features** — Profiles, messaging, notifications
- **Settings** — Account management, preferences, toggles

## Smart Component Selection

Our AI doesn't just place random elements on a screen. It understands which components belong where:

- Navigation patterns that match platform conventions
- Proper touch target sizes (44pt minimum)
- Accessible color contrast ratios
- Responsive layouts that adapt to different device sizes

## Bulk Generation

Need an entire app? Describe all your screens at once and floow will generate a complete, consistent set of designs with shared styling and navigation patterns.`,
    icon: "layout",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "100+ component types supported",
      "Platform-native design patterns",
      "Consistent styling across screens",
      "Bulk screen generation for complete apps",
    ],
    keywords: [
      "ai screen generator",
      "ai ui generator",
      "mobile screen design ai",
      "app screen generator",
    ],
    order: 2,
  },
  {
    slug: "export-to-figma",
    title: "Export to Figma & Code",
    headline: "Export your AI designs to Figma, Flutter, or any platform.",
    description:
      "Take your AI-generated designs anywhere. Export to Figma for further editing, generate Flutter or React Native code, or share preview links with your team.",
    content: `## Flexible Export Options

### Figma Export
Export your designs as structured Figma files with proper layers, auto-layout, and named components. Your design team can pick up right where the AI left off.

### Code Export
Generate production-ready code for your preferred framework:
- **Flutter** — Dart widgets with Material/Cupertino components
- **React Native** — JSX components with StyleSheet
- **HTML/CSS** — Clean, responsive markup

### Share & Preview
Generate shareable preview links to get feedback from stakeholders without requiring any tools or accounts.

## Why Export Matters

AI-generated designs are a starting point, not a final product. floow gives you the flexibility to:
- Hand off to developers with clean, structured output
- Refine in your existing design tool
- Present to clients with interactive previews
- Integrate into your existing CI/CD pipeline`,
    icon: "download",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "Structured Figma export with auto-layout",
      "Flutter & React Native code generation",
      "Shareable preview links",
      "Clean, developer-friendly output",
    ],
    keywords: [
      "export design to figma",
      "figma to flutter",
      "figma to react native",
      "design to code",
    ],
    order: 3,
  },
  {
    slug: "ios-android-design",
    title: "iOS & Android Design",
    headline:
      "Pixel-perfect designs for both platforms — Material & Cupertino.",
    description:
      "Design for iOS and Android simultaneously. floow understands platform-specific guidelines, components, and interaction patterns to produce native-feeling designs.",
    content: `## True Cross-Platform Design

### iOS (Cupertino)
- SF Symbols and system icons
- Navigation bars with large titles
- Tab bars with proper safe area handling
- Sheets, action sheets, and alerts
- Dynamic Type support

### Android (Material Design 3)
- Material You color system
- Bottom navigation and navigation rail
- FABs, chips, and bottom sheets
- Adaptive layouts for tablets
- Predictive back gesture support

## One Prompt, Two Platforms

Describe your app once and floow generates designs for both iOS and Android. Each version follows its respective platform guidelines while maintaining your brand identity.

## Platform-Aware Components

floow automatically selects the right component variant for each platform:
- iOS switches become Android toggles
- iOS tab bars become Android bottom navigation
- Platform-specific date pickers, dialogs, and form controls`,
    icon: "smartphone",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "Native iOS & Android design in one tool",
      "Material Design 3 and Cupertino components",
      "Platform-aware component selection",
      "One prompt generates both platform designs",
    ],
    keywords: [
      "ios android app design",
      "cross platform app design",
      "mobile app design ios android",
      "material design cupertino",
    ],
    order: 4,
  },
  {
    slug: "multi-screen-app-flows",
    title: "Multi-Screen App Flows",
    headline: "Design complete app flows with navigation and transitions.",
    description:
      "Go beyond single screens. Design entire user journeys with connected flows, navigation patterns, and state transitions — all generated from a single description.",
    content: `## Design Complete User Journeys

### Flow Generation
Describe a user journey like "onboarding flow with email signup, profile setup, and tutorial" and floow generates all connected screens with proper navigation.

### Smart Navigation
floow understands common navigation patterns:
- **Tab-based navigation** — Bottom tabs with proper state management
- **Stack navigation** — Push/pop with back buttons and transitions
- **Drawer navigation** — Side menus with nested sections
- **Modal flows** — Overlay screens for focused tasks

### State Awareness
Generated flows include different states for each screen:
- Loading states with skeleton screens
- Empty states with illustrations
- Error states with recovery actions
- Success states with confirmation

## Prototype-Ready Output

Every flow is generated with proper screen connections, making it easy to create interactive prototypes for user testing and stakeholder reviews.`,
    icon: "git-branch",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "Complete user journeys from one description",
      "Smart navigation pattern selection",
      "Loading, empty, and error states included",
      "Prototype-ready connected screens",
    ],
    keywords: [
      "multi screen app design",
      "mobile app flow design",
      "ai prototyping",
      "app user flow generator",
    ],
    order: 5,
  },
  {
    slug: "custom-design-themes",
    title: "Custom Design Themes",
    headline: "Design with your brand colors, fonts, and design tokens.",
    description:
      "Apply your brand identity to every AI-generated design. Create custom themes with your colors, typography, spacing, and component styles — then reuse across all projects.",
    content: `## Brand-Consistent AI Design

### Theme Builder
Create themes with your exact brand specifications:
- **Colors** — Primary, secondary, surface, error, and custom palette
- **Typography** — Font families, sizes, weights, and line heights
- **Spacing** — Consistent spacing scale across all components
- **Border radius** — From sharp to fully rounded
- **Shadows** — Elevation system for depth

### Design Tokens
Export your theme as design tokens compatible with:
- Tailwind CSS configuration
- Flutter ThemeData
- React Native StyleSheet
- CSS custom properties

### Theme Switching
Preview your designs in light mode, dark mode, or any custom color scheme. Switch between themes instantly to see how your app looks across different appearances.

## Reusable Across Projects

Create a theme once and apply it to every project. Your team always designs with the correct brand guidelines, automatically enforced by the AI.`,
    icon: "palette",
    videoUrl: null,
    imageUrl: null,
    benefits: [
      "Full brand customization — colors, fonts, spacing",
      "Export as design tokens for any framework",
      "Light & dark mode support built-in",
      "Reusable themes across all projects",
    ],
    keywords: [
      "custom design themes",
      "design system for mobile apps",
      "mobile app design system",
      "design tokens generator",
    ],
    order: 6,
  },
];
