import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CodeDialog } from "../CodeDialog";

const meta: Meta<typeof CodeDialog> = {
  title: "Components/CodeDialog",
  component: CodeDialog,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CodeDialog>;

const sampleHtml = `<div class="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-md">
  <h1 class="text-2xl font-bold text-gray-900">Hello World</h1>
  <p class="text-gray-600">This is a sample component exported from floow.design</p>
  <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Get Started
  </button>
</div>`;

function CodeDialogDemo({ code = sampleHtml, title = "Screen Code" }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text"
      >
        View Code
      </button>
      <CodeDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        code={code}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <CodeDialogDemo />,
};

export const LongCode: Story = {
  render: () => (
    <CodeDialogDemo
      title="Full Page Code"
      code={`<main class="min-h-screen bg-gray-50">
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200">
    <nav class="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
      <div class="text-xl font-bold">Brand</div>
      <ul class="flex gap-6">
        <li><a href="#" class="text-gray-600 hover:text-gray-900">Home</a></li>
        <li><a href="#" class="text-gray-600 hover:text-gray-900">About</a></li>
        <li><a href="#" class="text-gray-600 hover:text-gray-900">Contact</a></li>
      </ul>
    </nav>
  </header>
  <section class="py-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl font-bold tracking-tight text-gray-900">Build Amazing Apps</h1>
      <p class="mt-6 text-xl text-gray-600">Create beautiful designs with AI</p>
    </div>
  </section>
</main>`}
    />
  ),
};
