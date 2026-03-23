export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  author: string;
  image: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "introducing-floow-design",
    title: "Introducing floow.design: AI-Powered Mobile App Design",
    excerpt:
      "Describe your app idea and get beautiful, high-fidelity mobile designs in seconds.",
    date: "Mar 15, 2026",
    category: "Announcement",
    readTime: "4 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/CwGQkERZQIadMhpEphW3k58HmhCs02NQRYpR9L_GIhU7qHIDfQlJp-ykadYDGA-x6_Bkq_Ea2r-fFr3rv4kW8Xw9A1DgJuD9hlE5Fw",
    content: `We're excited to announce floow.design — a platform that turns your app ideas into beautiful, high-fidelity mobile designs in seconds.

## The Problem

Designing mobile apps is slow and expensive. Creating pixel-perfect mockups requires skilled designers, expensive tools, and weeks of iteration. Most teams struggle to go from idea to polished design quickly.

## Our Solution

floow.design changes everything. Describe your app in plain English, and our AI generates complete, high-fidelity mobile designs instantly. No design skills required.

### How It Works

1. **Describe your app** — Type what you want in natural language
2. **AI generates designs** — Complete mobile screens with proper layout, spacing, and typography
3. **Customize & iterate** — Refine colors, layouts, and components to match your vision
4. **Export anywhere** — Export to Figma, share preview links, or send to AI builders

## What Makes Us Different

- **Design-first** — We create pixel-perfect, high-fidelity mobile designs
- **Production-quality** — Proper spacing, typography, theming, and responsive layouts
- **Material & Cupertino** — Support for both iOS and Android design languages
- **Multi-screen flows** — Complete app flows with navigation and transitions

## Getting Started

floow.design is now in public beta. Sign up for free and start designing your next app today.`,
  },
  {
    slug: "design-systems-mobile",
    title: "Building Design Systems for Mobile Apps",
    excerpt:
      "Create consistent, scalable design systems with tokens, components, and patterns for mobile apps.",
    date: "Mar 10, 2026",
    category: "Tutorial",
    readTime: "7 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/-MMEDlQhYVE8CLSReq5dD_9s_mXvDaJUB8HaM-gKSh4LUsgjpQOK3ov7qdaH7hsVFDF0rc3L6Hi1ppWlaWx-rYMhK8IAViAM-Gk",
    content: `A well-crafted design system is the foundation of any scalable mobile application. In this guide, we'll walk through building a design system for mobile apps using floow.design.

## Why Design Systems Matter

Design systems ensure consistency across your app. They define reusable components, color tokens, typography scales, and spacing rules that every screen follows.

## Design Tokens

Design tokens are the smallest pieces of your design system — colors, fonts, spacing values, and border radii.

### Color Tokens

Define your color palette as a set of semantic tokens:

- **Primary** — Your brand's main color
- **Secondary** — Supporting accent color
- **Surface** — Background colors for cards and containers
- **Error** — Validation and error states

### Typography Scale

Establish a clear hierarchy with consistent font sizes and weights. Material Design's type system makes this straightforward.

## Component Library

Build your components on top of your tokens. Start with the basics:

- **Buttons** — Primary, secondary, text, icon
- **Input fields** — Text, search, dropdown
- **Cards** — Content containers with consistent padding
- **Navigation** — Bottom nav, app bar, drawer

## Using floow.design

When you generate screens with floow.design, you can specify your design system. The AI will use your tokens and patterns to generate consistent designs across all screens.`,
  },
  {
    slug: "ai-design-workflow",
    title: "How AI is Changing the Mobile Design Workflow",
    excerpt:
      "From wireframes to high-fidelity mockups, AI tools are transforming how designers work.",
    date: "Mar 5, 2026",
    category: "Insights",
    readTime: "5 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/D6d1SQF0r3pePXE2e02y5nuvncVNFlQTMLmJm8ycWnjxC0Re9wQdvjQWHgcYYpduzGd7_QrfUTjC-OBUjDHOf_vWQ7fkMSRyEwhJ",
    content: `The mobile design workflow is undergoing a fundamental shift. AI tools are no longer just assistants — they're becoming co-creators.

## The Traditional Workflow

1. Research & wireframing (days)
2. High-fidelity mockups in Figma (days)
3. Developer handoff & implementation (weeks)
4. QA & iteration (days)

## The AI-Powered Workflow

1. Describe what you want (minutes)
2. AI generates designs + code (seconds)
3. Review and iterate (minutes)
4. Ship (same day)

## What This Means for Designers

AI doesn't replace designers — it amplifies them. Instead of spending hours on pixel-perfect layouts, designers can focus on:

- **Strategy** — What should we build and why?
- **User research** — Understanding real user needs
- **Creative direction** — Defining the visual language
- **Quality assurance** — Ensuring the AI output meets standards

## The Future

We believe the future of mobile design is collaborative — humans providing creative direction, AI handling the production work. floow.design is built for this future.`,
  },
  {
    slug: "design-export-guide",
    title: "Exporting Your Designs: A Complete Guide",
    excerpt:
      "Step-by-step guide on exporting your mobile designs from floow.design to Figma and beyond.",
    date: "Feb 28, 2026",
    category: "Tutorial",
    readTime: "6 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/7zm0iGoJpEdqqpo4GoqcLdOn0k-s9ZEMVy4MYn6Ia_3_FLlOzKHpb2iLlq7mVaLN7E4_5raueLuya7-MuvUyWFILPxBSdhTTz1XN",
    content: `One of the most powerful features of floow.design is the ability to export your designs anywhere. Here's how to make the most of it.

## Understanding the Export Options

When you export from floow.design, you get:

- **Figma export** — Editable designs ready for your design tool
- **Preview links** — Shareable links for stakeholder review
- **AI builder export** — Send designs to AI coding tools to build your app
- **High-fidelity assets** — Pixel-perfect screens with proper spacing and typography

## Step-by-Step Guide

### 1. Design Your Screens

Use the canvas to design your app screens. The AI will generate the visual design based on your description.

### 2. Review the Design

Check the layout, spacing, typography, and colors. Make sure it matches your expectations.

### 3. Export to Figma

Export your designs to Figma for further refinement or developer handoff.

### 4. Share & Iterate

Share preview links with stakeholders, gather feedback, and iterate on your designs.

## Best Practices

- **Start with a clear description** — The better your prompt, the better the output
- **Use design systems** — Specify your brand colors and typography
- **Iterate** — Generate, review, refine, repeat
- **Combine screens** — Design multiple screens and connect them into complete flows`,
  },
  {
    slug: "mobile-ux-patterns",
    title: "10 Mobile UX Patterns Every Designer Should Know",
    excerpt:
      "Essential mobile UX patterns — from navigation to gestures — that make apps feel intuitive.",
    date: "Feb 20, 2026",
    category: "Design",
    readTime: "8 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/CwGQkERZQIadMhpEphW3k58HmhCs02NQRYpR9L_GIhU7qHIDfQlJp-ykadYDGA-x6_Bkq_Ea2r-fFr3rv4kW8Xw9A1DgJuD9hlE5Fw",
    content: `Great mobile apps feel intuitive because they follow established UX patterns. Here are 10 patterns every designer should know.

## 1. Bottom Navigation

The most common navigation pattern for mobile apps. Keep it to 3-5 items, use clear icons with labels.

## 2. Pull to Refresh

Users expect to pull down on content lists to refresh. Implement this on any scrollable content feed.

## 3. Skeleton Screens

Show placeholder content shapes while loading instead of spinners. This reduces perceived load time.

## 4. Swipe Actions

Let users swipe list items to reveal actions like delete, archive, or share. Keep it discoverable.

## 5. Floating Action Button

A prominent circular button for the primary action on a screen. Use sparingly — one per screen max.

## 6. Search with Filters

Combine a search bar with filter chips. Let users narrow results without navigating to a separate screen.

## 7. Onboarding Carousel

Introduce key features with a swipeable carousel on first launch. Keep it to 3-4 screens.

## 8. Bottom Sheet

Present additional content or actions in a bottom sheet instead of a full-screen modal. Users can dismiss by swiping down.

## 9. Empty States

Design meaningful empty states with illustrations and clear calls to action. Never show a blank screen.

## 10. Gesture Navigation

Support standard gestures — swipe back, pinch to zoom, long press for context menus. Follow platform conventions.`,
  },
  {
    slug: "ai-design-tips",
    title: "AI Mobile Design: Best Practices and Tips",
    excerpt:
      "Tips for getting the most out of floow.design's AI-powered mobile design.",
    date: "Feb 12, 2026",
    category: "Engineering",
    readTime: "6 min",
    author: "Adarsh Kumar",
    image:
      "https://lh3.googleusercontent.com/kpKlgqVM9HpnzkABysl_zNiUI-dgwj1kzHnRnh1qkwyxedx6b7dqHkTnNa8cvACvifn2lIHWb95KStpEgveKsl621OibIwFtkky-Ng=w1200",
    content: `Getting the most out of AI-generated mobile designs requires understanding how to prompt effectively and how to refine the output.

## Writing Effective Prompts

The quality of generated designs depends heavily on your prompt. Here are some tips:

### Be Specific

Instead of "make a login screen", try "a login screen with email and password fields, a Google sign-in button, forgot password link, and dark theme with rounded corners".

### Mention Components

Reference specific UI components: "use a bottom navigation bar with 4 tabs", "include a collapsible header with a hero image".

### Specify Layout

Describe the layout structure: "a header image at the top, title, description below, and a row of action buttons at the bottom".

## Design Quality Tips

### Consistency

The AI generates complete screen designs. Ensure consistent spacing, colors, and typography across all screens.

### Theme Customization

Specify your brand colors, fonts, and design tokens. The AI will apply them consistently across all generated screens.

### Responsive Design

Generated designs follow responsive principles. Review how layouts adapt to different screen sizes.

## Common Screen Types

- **List screens** — Scrollable content with cards or list items
- **Detail screens** — Hero image with collapsible header and content
- **Form screens** — Input fields with validation states
- **Dashboard screens** — Grid-based layout with metric cards`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
