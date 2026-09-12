import type { AdSpec } from "./spec";
import type { ResolvedLayout } from "./resolver";

// Pure rendering concern: takes a resolved layout + the spec's content,
// returns React elements. Knows nothing about surfaces or the resolution
// algorithm — swapping this for a Canvas renderer would not require
// touching resolver.ts or spec.ts.
export function renderDom(spec: AdSpec, layout: ResolvedLayout) {
  return spec.elements.map((el) => {
    const pos = layout[el.id];
    if (!pos.visible) return null;
    return (
      <div
        key={el.id}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: pos.width,
          height: pos.height,
          background: el.type === "button" ? "#4a90d9" : "#ddd",
          border: "1px solid #999",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
                   overflow: "hidden",
          color: el.type === "button" ? "white" : "black",
          transition: "left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease",
        }}
      >
        {el.content}
      </div>
    );
  });
}