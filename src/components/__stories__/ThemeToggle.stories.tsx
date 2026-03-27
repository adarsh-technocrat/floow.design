import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeToggle, ThemeToggleCompact } from "../ThemeToggle";

const meta: Meta = {
  title: "Components/ThemeToggle",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <NextThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <Story />
      </NextThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Full: Story = {
  render: () => <ThemeToggle />,
};

export const Compact: Story = {
  render: () => <ThemeToggleCompact />,
};

export const BothVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <ThemeToggleCompact />
    </div>
  ),
};
