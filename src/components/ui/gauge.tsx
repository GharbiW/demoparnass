"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type GaugeProps = {
  value: number;
  size?: "small" | "medium" | "large";
  showValue?: boolean;
  className?: string;
  label?: string;
};

const Gauge = ({ value, size = "medium", showValue = true, className, label }: GaugeProps) => {
  const radius = size === "large" ? 60 : size === "medium" ? 45 : 30;
  const strokeWidth = radius / 8;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;
  const arc = circumference * (1 - value / 100);

  let colorVar = "hsl(var(--chart-1))"; // OK (Green-ish from theme)
  if (value < 35) colorVar = "hsl(var(--destructive))"; // Bad (Red)
  else if (value < 75) colorVar = "hsl(var(--chart-4))"; // Warn (Yellow/Amber)

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center gap-1", className)}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: radius * 2,
          height: radius * 2,
        }}
      >
        <svg className="absolute -rotate-90" width={radius * 2} height={radius * 2}>
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="transparent"
            stroke={colorVar}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={arc}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500 ease-in-out"
          />
        </svg>
        {showValue && (
          <span
            className={cn("font-bold text-foreground", {
              "text-3xl": size === "large",
              "text-xl": size === "medium",
              "text-base": size === "small",
            })}
          >
            {Math.round(value)}
            <span className={cn({
              "text-lg": size === "large",
              "text-sm": size === "medium",
              "text-xs": size === "small",
            })}>%</span>
          </span>
        )}
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};

export { Gauge };
