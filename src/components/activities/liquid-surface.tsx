"use client";

import type { CSSProperties, PropsWithChildren } from "react";
import { useState } from "react";

interface LiquidSurfaceProps extends PropsWithChildren {
  className?: string;
  radius?: number;
  depth?: "tile" | "hero" | "rail";
}

export function LiquidSurface({
  children,
  className = "",
  radius = 28,
  depth = "tile",
}: LiquidSurfaceProps) {
  const [pointer, setPointer] = useState({ x: "50%", y: "50%", on: 0 });

  const style = {
    borderRadius: `${radius}px`,
    "--mx": pointer.x,
    "--my": pointer.y,
    "--mo": pointer.on,
  } as CSSProperties;

  return (
    <div
      data-depth={depth}
      className={`surface-slab ${className}`.trim()}
      style={style}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: `${((event.clientX - rect.left) / rect.width) * 100}%`,
          y: `${((event.clientY - rect.top) / rect.height) * 100}%`,
          on: 1,
        });
      }}
      onMouseLeave={() => setPointer((current) => ({ ...current, on: 0 }))}
    >
      <div className="surface-rim" style={{ borderRadius: `${radius}px` }} />
      {children}
    </div>
  );
}
