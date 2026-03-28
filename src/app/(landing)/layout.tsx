export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-btn-primary-bg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-btn-primary-text"
      >
        Skip to main content
      </a>
      <main id="main-content">{children}</main>
    </>
  );
}
