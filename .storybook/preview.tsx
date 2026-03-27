import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import "../src/app/globals.css";

function ThemeWrapper({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: "light" | "dark" | "side-by-side";
}) {
  useEffect(() => {
    // Keep Storybook's own body background in sync
    document.body.style.backgroundColor =
      theme === "dark" ? "#0a0a0a" : "#ffffff";
  }, [theme]);

  if (theme === "side-by-side") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          minHeight: "100%",
        }}
      >
        <div
          className="light"
          data-theme="light"
          style={{
            backgroundColor: "#ffffff",
            color: "#09090b",
            padding: "2rem",
          }}
        >
          {children}
        </div>
        <div
          className="dark"
          data-theme="dark"
          style={{
            backgroundColor: "#0a0a0a",
            color: "#ededed",
            padding: "2rem",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";
  return (
    <div
      className={isDark ? "dark" : "light"}
      data-theme={isDark ? "dark" : "light"}
      style={{
        backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
        color: isDark ? "#ededed" : "#09090b",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      {children}
    </div>
  );
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme for components",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "side-by-side", title: "Side by Side", icon: "sidebar" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      return (
        <ThemeWrapper theme={theme}>
          <Story />
        </ThemeWrapper>
      );
    },
  ],
};

export default preview;
