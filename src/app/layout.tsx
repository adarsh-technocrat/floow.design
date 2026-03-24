import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700"],
});

const siteUrl = "https://www.floow.design";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "floow.design – Design mobile apps with AI",
    template: "%s | floow.design",
  },
  description:
    "Design mobile apps with AI in seconds. Generate pixel-perfect iOS & Android screens and export to Figma. Try free.",
  icons: {
    icon: "/icon.svg",
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "floow.design",
    title: "floow.design – Design mobile apps with AI",
    description:
      "Design mobile apps with AI in seconds. Generate pixel-perfect iOS & Android screens and export to Figma. Try free.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "floow.design – AI Mobile App Design Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "floow.design – Design mobile apps with AI",
    description:
      "Design mobile apps with AI in seconds. Generate pixel-perfect iOS & Android screens and export to Figma.",
    images: [`${siteUrl}/og-image.png`],
  },
  keywords: [
    "AI mobile app design",
    "AI prototype generator",
    "mobile app design tool",
    "AI app mockup",
    "AI UI design",
    "mobile app design AI",
    "app design generator",
    "Figma AI design",
    "iOS app design",
    "Android app design",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "floow.design",
                  url: siteUrl,
                  logo: `${siteUrl}/icon.svg`,
                  description:
                    "AI-powered mobile app design tool. Generate pixel-perfect iOS & Android screens in seconds.",
                },
                {
                  "@type": "WebSite",
                  name: "floow.design",
                  url: siteUrl,
                  potentialAction: {
                    "@type": "SearchAction",
                    target: `${siteUrl}/blog?q={search_term_string}`,
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
