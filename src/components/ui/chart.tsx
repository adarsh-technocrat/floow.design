"use client";

import * as React from "react";

// Minimal shadcn-style chart config
export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
    icon?: React.ComponentType;
  }
>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue>({ config: {} });

export function useChart() {
  return React.useContext(ChartContext);
}

export function ChartContainer({
  config,
  children,
  className,
}: {
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}) {
  // Inject CSS variables for chart colors
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value.color) {
        vars[`--color-${key}`] = value.color;
      }
    }
    return vars;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={className} style={style}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  hideLabel?: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-b-secondary bg-surface-elevated px-3 py-2 shadow-lg">
      {!hideLabel && label && (
        <p className="text-xs font-medium text-t-primary mb-1">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-t-secondary">{entry.name}:</span>
          <span className="text-xs font-semibold text-t-primary">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
