import { useState } from "react";
import { sampleAdSpec } from "./spec";
import { allSurfaces, defineSurface } from "./surfaces";
import type { SurfaceProfile } from "./surfaces";
import { resolveLayout } from "./resolver";
import { renderDom } from "./render-dom";
import { RenderCanvas } from "./render-canvas";

function App() {
  const [surfaceId, setSurfaceId] = useState(allSurfaces[0].id);
  const [customSurface, setCustomSurface] = useState<SurfaceProfile | null>(null);
  const [customWidth, setCustomWidth] = useState("200");
  const [customHeight, setCustomHeight] = useState("200");
  const [customError, setCustomError] = useState("");
  const [renderMode, setRenderMode] = useState<"dom" | "canvas">("dom");

  const presetSurface = allSurfaces.find((s) => s.id === surfaceId) as SurfaceProfile;
  const surface = customSurface ?? presetSurface;
  const layout = resolveLayout(sampleAdSpec, surface);

  const handleResolveCustom = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!w || !h || w <= 0 || h <= 0) {
      setCustomError("Enter valid positive width and height");
      return;
    }
    try {
      const s = defineSurface({ id: "custom", width: w, height: h });
      setCustomSurface(s);
      setCustomError("");
    } catch (e) {
      setCustomError((e as Error).message);
    }
  };

  const handleUsePreset = (id: string) => {
    setSurfaceId(id);
    setCustomSurface(null);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Adaptive Layout Engine</h2>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setRenderMode("dom")}
          style={{ padding: "4px 12px", marginRight: 8, fontWeight: renderMode === "dom" ? "bold" : "normal" }}
        >
          DOM Renderer
        </button>
        <button
          onClick={() => setRenderMode("canvas")}
          style={{ padding: "4px 12px", fontWeight: renderMode === "canvas" ? "bold" : "normal" }}
        >
          Canvas Renderer
        </button>
      </div>

      <select
        value={surfaceId}
        onChange={(e) => handleUsePreset(e.target.value)}
        style={{ marginBottom: 20, padding: 8, fontSize: 16 }}
      >
        {allSurfaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.id} ({s.width}x{s.height})
          </option>
        ))}
      </select>

      <div style={{ marginBottom: 20, padding: 12, border: "1px dashed #999", borderRadius: 4, maxWidth: 400 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: "bold" }}>
          Try an unknown surface (no code change needed):
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            placeholder="width"
            style={{ width: 70, padding: 4 }}
          />
          <span>x</span>
          <input
            type="number"
            value={customHeight}
            onChange={(e) => setCustomHeight(e.target.value)}
            placeholder="height"
            style={{ width: 70, padding: 4 }}
          />
          <button onClick={handleResolveCustom} style={{ padding: "4px 12px" }}>
            Resolve
          </button>
        </div>
        {customError && <p style={{ color: "red", fontSize: 12, margin: "6px 0 0" }}>{customError}</p>}
        {customSurface && (
          <p style={{ fontSize: 12, color: "green", margin: "6px 0 0" }}>
            Showing custom surface: {customSurface.width}x{customSurface.height}
          </p>
        )}
      </div>

      {renderMode === "dom" ? (
        <div
          style={{
            position: "relative",
            width: surface.width,
            height: surface.height,
            border: "2px solid black",
            background: "#f5f5f5",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {renderDom(sampleAdSpec, layout)}
        </div>
      ) : (
        <RenderCanvas spec={sampleAdSpec} layout={layout} width={surface.width} height={surface.height} />
      )}
    </div>
  );
}

export default App;