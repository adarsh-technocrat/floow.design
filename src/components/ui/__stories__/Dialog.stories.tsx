import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../dialog";

const meta: Meta = {
  title: "UI/Dialog",
  parameters: {
    layout: "centered",
  },
};

export default meta;

function DefaultDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text">
          Open Dialog
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description. It provides context about the action.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-t-secondary">
            Dialog body content goes here.
          </p>
        </div>
        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-b-secondary px-4 py-2 text-sm text-t-primary hover:bg-input-bg"
          >
            Cancel
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text"
          >
            Confirm
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoCloseButtonDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text">
          Open (No Close Button)
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
          <DialogDescription>
            This dialog has no X close button. Users must use the action
            buttons.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text"
          >
            Got it
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Default: StoryObj = {
  render: () => <DefaultDemo />,
};

export const WithoutCloseButton: StoryObj = {
  render: () => <NoCloseButtonDemo />,
};
