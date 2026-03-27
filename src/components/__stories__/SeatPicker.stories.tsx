import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SeatPicker } from "../SeatPicker";

const meta: Meta<typeof SeatPicker> = {
  title: "Components/SeatPicker",
  component: SeatPicker,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SeatPicker>;

function SeatPickerDemo(
  props: Partial<React.ComponentProps<typeof SeatPicker>>,
) {
  const [seats, setSeats] = useState(props.seats ?? 3);
  return <SeatPicker seats={seats} onSeatsChange={setSeats} {...props} />;
}

export const Default: Story = {
  render: () => <SeatPickerDemo />,
};

export const MinReached: Story = {
  render: () => <SeatPickerDemo seats={1} min={1} />,
};

export const MaxReached: Story = {
  render: () => <SeatPickerDemo seats={50} max={50} />,
};

export const CustomRange: Story = {
  render: () => <SeatPickerDemo seats={5} min={2} max={10} />,
};
