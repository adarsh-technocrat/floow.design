import type { Meta, StoryObj } from "@storybook/react";
import { ProjectCardShimmer } from "../ProjectCardShimmer";

const meta: Meta<typeof ProjectCardShimmer> = {
  title: "Components/ProjectCardShimmer",
  component: ProjectCardShimmer,
  argTypes: {
    count: { control: { type: "range", min: 1, max: 12, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCardShimmer>;

export const Default: Story = {
  args: { count: 6 },
};

export const ThreeCards: Story = {
  args: { count: 3 },
};

export const SingleCard: Story = {
  args: { count: 1 },
};
