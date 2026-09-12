import { useEffect, useRef } from "react";
import type { AdSpec } from "./spec";
import type { ResolvedLayout } from "./resolver";

interface RenderCanvasProps {
  spec: AdSpec;
  layout: ResolvedLayout;
  width: number;
  height: number;
}

// Alternative renderer sharing the same resolver output as render-dom.tsx.
// Proves the resolver is decoupled from how output gets displayed —
// swapping DOM for Canvas required zero changes to resolver.ts.
export function RenderCanvas({ spec, layout, width, height }: RenderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    for (const el of spec.elements) {
      const pos = layout[el.id];
      if (!pos.visible) continue;

      ctx.fillStyle = el.type === "button" ? "#4a90d9" : "#ddd";
      ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
      ctx.strokeStyle = "#999";
      ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

      ctx.fillStyle = el.type === "button" ? "white" : "black";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = el.content ?? "";
      ctx.fillText(label, pos.x + pos.width / 2, pos.y + pos.height / 2, pos.width - 8);
    }
  }, [spec, layout, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: "2px solid black", maxWidth: "100%" }}
    />
  );
}