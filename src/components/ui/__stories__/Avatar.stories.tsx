import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "../Avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: { type: "range", min: 16, max: 128, step: 4 } },
    src: { control: "text" },
    email: { control: "text" },
    name: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    email: "user@example.com",
    name: "John Doe",
    size: 40,
  },
};

export const Small: Story = {
  args: {
    email: "small@example.com",
    name: "Jane",
    size: 24,
  },
};

export const Large: Story = {
  args: {
    email: "large@example.com",
    name: "Big User",
    size: 80,
  },
};

export const WithExternalImage: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=storybook",
    name: "External Avatar",
    size: 48,
  },
};

export const FallbackOnError: Story = {
  args: {
    src: "https://invalid-url.example/broken.jpg",
    email: "fallback@example.com",
    name: "Fallback User",
    size: 48,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {[24, 32, 40, 48, 64, 80].map((size) => (
        <Avatar
          key={size}
          email={`user-${size}@example.com`}
          name={`Size ${size}`}
          size={size}
        />
      ))}
    </div>
  ),
};
