# Architecture

## Overview

The engine is split into four independent concerns, each with no knowledge
of the others beyond well-typed data passed between them:

Ad Spec + Surface Profile → Constraint Resolver → Resolved Layout → Renderer


## File Responsibilities

### `spec.ts`
Defines *what* content exists in an ad — element type, role, priority, and
content — with zero knowledge of any surface. `defineAd()` validates the
spec at creation time (no duplicate IDs, valid roles/priorities).

### `surfaces.ts`
Defines *where* an ad might be shown — width, height, and real constraints
(minimum tap target size, minimum text size, safe area insets, viewing
distance, touch-only flag). `defineSurface()` validates constraint
combinations (e.g. a touch-only surface must declare a tap target size).

### `resolver.ts`
The core algorithm. Pure TypeScript, no React or DOM dependencies. Given
an `AdSpec` and a `SurfaceProfile`, it:
1. Picks an arrangement mode (`row`, `stack`, or `grid`) from the surface's
   aspect ratio.
2. Sorts elements by priority.
3. Places each element, enforcing hard constraints, shrinking or dropping
   elements when space runs out.
4. Returns a `ResolvedLayout` — a plain object mapping element IDs to
   `{ x, y, width, height, visible }`.

The resolver never renders anything and never imports React.

### `render-dom.tsx`
Pure rendering. Takes an `AdSpec` and a `ResolvedLayout`, returns DOM
elements. It has no knowledge of surfaces, priorities, or how positions
were computed — it only reads the final resolved numbers.

### `App.tsx`
Orchestration only. Holds the currently selected surface as state, calls
`resolveLayout()` on each change, and passes the result to `renderDom()`.
Contains no layout logic of its own.

## Why This Separation Matters

- **Adding a new surface profile** requires only a new entry in
  `surfaces.ts` — no changes to `resolver.ts` or `render-dom.tsx`.
- **Adding a new renderer** (e.g. a Canvas-based one) would only require a
  new `render-canvas.ts` file that accepts the same `ResolvedLayout` shape
  — `resolver.ts` would not need to change.
- **The algorithm is independently testable** — `resolveLayout()` can be
  called directly with any spec/surface pair and inspected without
  rendering anything to a screen.

## Data Flow Example

For `retailKiosk` (a near-square surface):

1. `resolveLayout(sampleAdSpec, retailKiosk)` is called.
2. The resolver computes `aspectRatio ≈ 1.06`, which falls into the `grid`
   arrangement branch (neither wide enough for `row` nor tall enough for
   `stack`).
3. It places the hero image as a top banner, the headline beneath it, the
   CTA and price as a side-by-side row, and attempts to place the logo
   last.
4. If the logo does not fit in the remaining vertical space, it is marked
   `visible: false` in the returned `ResolvedLayout`.
5. `render-dom.tsx` reads this layout and renders only the visible
   elements at their exact computed positions.