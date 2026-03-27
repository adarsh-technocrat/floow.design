import type { Meta, StoryObj } from "@storybook/react";
import { SelectionToast } from "../custom-toast/selection-toast";
import { fn } from "@storybook/test";

const meta: Meta<typeof SelectionToast> = {
  title: "Components/SelectionToast",
  component: SelectionToast,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SelectionToast>;

export const Default: Story = {
  args: {
    message: "1 screen selected",
    onCopy: fn(),
    onDelete: fn(),
  },
};

export const MultipleSelected: Story = {
  args: {
    message: "3 screens selected",
    onCopy: fn(),
    onDelete: fn(),
  },
};

export const CopyOnly: Story = {
  args: {
    message: "1 element selected",
    onCopy: fn(),
  },
};
