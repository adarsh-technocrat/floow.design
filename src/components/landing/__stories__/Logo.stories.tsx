import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "Landing/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Small: Story = {
  args: { size: "sm" },
};

export const Medium: Story = {
  args: { size: "md" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
    </div>
  ),
};
