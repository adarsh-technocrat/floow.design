import type { Meta, StoryObj } from "@storybook/react";
import { Testimonials } from "../Testimonials";

const meta: Meta<typeof Testimonials> = {
  title: "Landing/Testimonials",
  component: Testimonials,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};

export default meta;
type Story = StoryObj<typeof Testimonials>;

export const Default: Story = {};
