import type { Meta, StoryObj } from "@storybook/react";
import { FeaturesGrid } from "../FeaturesGrid";

const meta: Meta<typeof FeaturesGrid> = {
  title: "Landing/FeaturesGrid",
  component: FeaturesGrid,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof FeaturesGrid>;

export const Default: Story = {};
