export function PromptBoxStackedLayers() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-4 top-0 bottom-3 rounded-2xl border border-b-secondary/30 bg-canvas-panel-bg/45 shadow-sm"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl border border-b-secondary/50 bg-canvas-panel-bg/65 shadow-sm"
        aria-hidden
      />
    </>
  );
}
