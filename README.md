# Adaptive Layout Engine for Multi-Surface Ads

A constraint-based layout engine that takes a single declarative ad spec and
resolves it into a correct, non-overlapping layout for any surface profile
(mobile, broadcast, kiosk, etc.) — without per-surface hardcoded layouts.

## Setup Instructions

1. Clone this repository
2. Install dependencies:

npm install

3. Run the dev server:

npm run dev

4. Open the local URL shown in the terminal (typically `http://localhost:5173`)

## Running the Demo

The demo shows a single ad spec (headline, product image, CTA button, price,
logo) resolved live across 4 surface profiles. Use the dropdown at the top of
the page to switch surfaces — the layout re-resolves and re-renders
immediately on each change.

## Layout Algorithm

The resolver (`src/resolver.ts`) works in these steps:

1. **Pick an arrangement mode** based on the surface's aspect ratio:
   - Wide surfaces (width > 1.3x height) → elements arranged left-to-right (`row`)
   - Tall surfaces (height > 1.3x width) → elements arranged top-to-bottom (`stack`)
   - Near-square surfaces → a distinct composition (`grid`): hero image banner,
     headline below it, action/secondary elements side-by-side beneath that,
     branding last. This avoids kiosk surfaces looking like a scaled-down
     mobile stack.
2. **Sort elements by priority** (1 = highest, never dropped first).
3. **Enforce hard constraints** — buttons on touch surfaces respect
   `minTapTarget`; text on far-viewing surfaces (e.g. broadcast) respects
   `minTextSize`.
4. **Place elements one at a time**, tracking remaining space along the main
   axis (width for row/grid rows, height for stack).
5. **Degradation**: if an element doesn't fit —
   - Priority 3 elements, or any element with less than 24px of remaining
     space, are dropped entirely (`visible: false`).
   - Priority 1-2 elements are shrunk to fit the remaining space instead of
     being dropped, down to a 20px floor.
6. This ensures priority 1 elements (headline, image) are never compromised
   before priority 2 (CTA, price), which are never compromised before
   priority 3 (logo/branding) — matching the assignment's degradation order.

## TypeScript Design

- `ElementType`, `ElementRole`, and `Priority` are union types — only valid
  literal values are accepted at compile time.
- `defineAd()` and `defineSurface()` perform runtime validation on top of
  compile-time types: duplicate element IDs, invalid roles/priorities, and
  invalid surface constraint combinations (e.g. `touchOnly: true` without a
  `minTapTarget`) throw clear errors immediately.
- `ResolvedLayout` types the resolver's output precisely (`x`, `y`, `width`,
  `height`, `visible` per element ID), so the renderer never has to guess
  the shape of the data it consumes.

## Resolution Flow

Ad Spec + Surface Profile → resolveLayout() → ResolvedLayout → renderDom()


- `spec.ts` — content definition, independent of any surface
- `surfaces.ts` — surface profiles with real constraints (tap targets, text
  size, safe areas)
- `resolver.ts` — the constraint-resolution algorithm (framework-agnostic,
  no React/DOM dependencies)
- `render-dom.tsx` — pure rendering: takes a resolved layout and returns DOM
  elements, with zero knowledge of how the layout was computed
- `App.tsx` — orchestration only (surface picker state, wiring resolver to
  renderer)

## Known Limitations

- No text-measurement-aware wrapping — text truncation/sizing uses fixed
  estimates, not actual rendered text metrics.
- No animated transition between surfaces when switching in the demo.
- Fixed element role set (`primary`, `hero`, `action`, `secondary`,
  `branding`) — adding a genuinely new role requires updating `BASE_SIZE` in
  `resolver.ts`.
- The `grid` arrangement's internal composition (image-top, headline,
  side-by-side row, branding-last) is itself a fixed pattern — it adapts to
  available space via shrinking/dropping, but does not restructure its
  internal ordering for very unusual aspect ratios near the row/stack/grid
  thresholds.
- No persistence or backend — this is a pure client-side layout demo.

## Time Spent

Approximately 2 days, including the resolver algorithm design, surface
constraint definitions, degradation-logic debugging (clipping/overflow
edge cases), and documentation.


## Bonus Features Implemented

- **Unknown surface resolution**: a live input lets you enter any custom width/height, which the resolver processes using the exact same `resolveLayout()` function — no code changes needed, demonstrating the algorithm generalizes beyond the 4 predefined surfaces.
- **Smooth animated transitions**: CSS transitions on position/size changes in `render-dom.tsx` make surface switching visually smooth rather than an instant snap.
- **Text-measurement-aware sizing**: `measureTextWidth()` uses a hidden canvas and the browser's `measureText()` API to size text elements based on actual rendered content width, replacing fixed estimates.
- **Canvas rendering backend**: `render-canvas.tsx` provides an alternative renderer using `<canvas>` drawing commands instead of DOM elements, consuming the exact same `ResolvedLayout` output as `render-dom.tsx` — proving the resolver is fully decoupled from rendering technology. Toggle between them via the DOM/Canvas buttons in the demo.
- **Basic accessibility as a first-class constraint**: `hasEnoughContrast()` performs a simplified luminance-ratio contrast check and gates branding placement on it — a logo isn't placed if it wouldn't have adequate contrast against the surface background, in addition to the existing tap-target-size enforcement (`minTapTarget`) for touch surfaces.