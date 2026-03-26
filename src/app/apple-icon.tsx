import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
        fontSize: 124,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      f
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 36,
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: "#71717a",
        }}
      />
    </div>,
    size,
  );
}
