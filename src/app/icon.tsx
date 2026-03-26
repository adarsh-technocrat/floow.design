import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#18181b",
        borderRadius: 40,
        color: "#fafafa",
        fontWeight: 700,
        fontSize: 132,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      f
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 40,
          width: 20,
          height: 20,
          borderRadius: 9999,
          background: "#71717a",
        }}
      />
    </div>,
    size,
  );
}
