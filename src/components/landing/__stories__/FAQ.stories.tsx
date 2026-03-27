import type { Meta, StoryObj } from "@storybook/react";
import { FAQ } from "../FAQ";

const meta: Meta<typeof FAQ> = {
  title: "Landing/FAQ",
  component: FAQ,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};

export default meta;
type Story = StoryObj<typeof FAQ>;

export const Default: Story = {};
