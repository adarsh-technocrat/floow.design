import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { fn } from "@storybook/test";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

function ConfirmDialogDemo(
  props: Partial<React.ComponentProps<typeof ConfirmDialog>>,
) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text"
      >
        Open Dialog
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project?"
        description="This action cannot be undone. All screens and data will be permanently removed."
        onConfirm={fn()}
        {...props}
      />
    </>
  );
}

export const Danger: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Delete project?"
      description="This action cannot be undone. All screens and data will be permanently removed."
      confirmLabel="Delete"
    />
  ),
};

export const Warning: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="warning"
      title="Move to trash?"
      description="You can restore this project from the trash within 30 days."
      confirmLabel="Move to Trash"
    />
  ),
};

export const Info: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="info"
      title="Duplicate project?"
      description="A copy of this project will be created in your workspace."
      confirmLabel="Duplicate"
    />
  ),
};

export const WithAcknowledgment: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Delete all projects?"
      description="This will permanently delete all your projects and cannot be undone."
      confirmLabel="Delete All"
      requireAcknowledgment
      acknowledgmentLabel="I understand this will delete everything"
    />
  ),
};
