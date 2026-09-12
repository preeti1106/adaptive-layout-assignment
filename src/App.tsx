import { useState } from "react";
import { sampleAdSpec } from "./spec";
import { allSurfaces } from "./surfaces";
import type { SurfaceProfile } from "./surfaces";
import { resolveLayout } from "./resolver";
import { renderDom } from "./render-dom";

function App() {
  const [surfaceId, setSurfaceId] = useState(allSurfaces[0].id);
  const surface = allSurfaces.find((s) => s.id === surfaceId) as SurfaceProfile;
  const layout = resolveLayout(sampleAdSpec, surface);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Adaptive Layout Engine</h2>

      <select
        value={surfaceId}
        onChange={(e) => setSurfaceId(e.target.value)}
        style={{ marginBottom: 20, padding: 8, fontSize: 16 }}
      >
        {allSurfaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.id} ({s.width}x{s.height})
          </option>
        ))}
      </select>

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
    </div>
  );
}

export default App;