import type { Meta, StoryObj } from "@storybook/react";
import { CellProgressLoader } from "../CellProgressLoader";

const meta: Meta<typeof CellProgressLoader> = {
  title: "Components/CellProgressLoader",
  component: CellProgressLoader,
};

export default meta;
type Story = StoryObj<typeof CellProgressLoader>;

export const Default: Story = {};
