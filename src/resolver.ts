import type { AdElement, AdSpec } from "./spec";
import type { SurfaceProfile } from "./surfaces";

export interface ResolvedElement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export type ResolvedLayout = Record<string, ResolvedElement>;

const BASE_SIZE: Record<string, { width: number; height: number }> = {
  primary: { width: 260, height: 40 },
  hero: { width: 260, height: 160 },
  action: { width: 140, height: 44 },
  secondary: { width: 100, height: 24 },
  branding: { width: 60, height: 30 },
};

type Arrangement = "stack" | "row" | "grid";

function pickArrangement(surface: SurfaceProfile): Arrangement {
  const ratio = surface.width / surface.height;
  if (ratio > 1.3) return "row";
  if (ratio < 0.77) return "stack";
  return "grid";
}

function getByRole(spec: AdSpec, role: string): AdElement | undefined {
  return spec.elements.find((e) => e.role === role);
}

export function resolveLayout(spec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  const layout: ResolvedLayout = {};
  const safe = surface.safeArea ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const padTop = 10 + safe.top;
  const padBottom = 10 + safe.bottom;
  const padLeft = 10 + safe.left;
  const padRight = 10 + safe.right;

  const usableWidth = surface.width - padLeft - padRight;
  const usableHeight = surface.height - padTop - padBottom;
  const arrangement = pickArrangement(surface);

  const enforceHard = (el: AdElement, w: number, h: number) => {
    if (surface.minTapTarget && el.type === "button") h = Math.max(h, surface.minTapTarget);
    if (surface.minTextSize && el.type === "text") h = Math.max(h, surface.minTextSize);
    return { w, h };
  };

  const drop = (id: string) => {
    layout[id] = { x: 0, y: 0, width: 0, height: 0, visible: false };
  };

  if (arrangement === "stack" || arrangement === "row") {
    const isWide = arrangement === "row";
    const sorted = [...spec.elements].sort((a, b) => a.priority - b.priority);
    let remainingMain = isWide ? usableWidth : usableHeight;
    let cursorX = padLeft;
    let cursorY = padTop;

    for (const el of sorted) {
      const base = BASE_SIZE[el.role];
      let { w, h } = enforceHard(el, base.width, base.height);
      if (isWide) { h = Math.min(h, usableHeight); w = Math.min(w, 300); }
      else { w = Math.min(w, usableWidth); }

      const neededMain = isWide ? w : h;
      if (neededMain > remainingMain) {
        if (el.priority === 3 || remainingMain < 24) { drop(el.id); continue; }
        const clamped = Math.max(20, remainingMain - 8);
        if (isWide) w = clamped; else h = clamped;
      }

      if (isWide) {
        layout[el.id] = { x: cursorX, y: padTop, width: w, height: h, visible: true };
        cursorX += w + 8; remainingMain -= w + 8;
      } else {
        layout[el.id] = { x: padLeft, y: cursorY, width: w, height: h, visible: true };
        cursorY += h + 8; remainingMain -= h + 8;
      }
    }
    return layout;
  }

  // GRID arrangement (near-square surfaces, e.g. kiosk): hero image on top,
  // headline below it, action+secondary side by side beneath, branding last.
  // This is a structurally different composition from stack/row, not a scaled copy.
  let cursorY = padTop;
  let remainingHeight = usableHeight;

  const hero = getByRole(spec, "hero");
  const primary = getByRole(spec, "primary");
  const action = getByRole(spec, "action");
  const secondary = getByRole(spec, "secondary");
  const branding = getByRole(spec, "branding");

  if (hero) {
    const h = Math.min(BASE_SIZE.hero.height, Math.floor(remainingHeight * 0.55));
    if (h > 20 && remainingHeight - h - 8 > 0) {
      layout[hero.id] = { x: padLeft, y: cursorY, width: usableWidth, height: h, visible: true };
      cursorY += h + 8; remainingHeight -= h + 8;
    } else if (hero.priority === 3) drop(hero.id);
    else {
      const clamped = Math.max(20, remainingHeight - 8);
      layout[hero.id] = { x: padLeft, y: cursorY, width: usableWidth, height: clamped, visible: true };
      cursorY += clamped + 8; remainingHeight -= clamped + 8;
    }
  }

  if (primary) {
    const { h } = enforceHard(primary, BASE_SIZE.primary.width, BASE_SIZE.primary.height);
    if (h <= remainingHeight - 8 && remainingHeight > 24) {
      layout[primary.id] = { x: padLeft, y: cursorY, width: usableWidth, height: h, visible: true };
      cursorY += h + 8; remainingHeight -= h + 8;
    } else if (primary.priority === 3 || remainingHeight < 24) drop(primary.id);
    else {
      const clamped = Math.max(20, remainingHeight - 8);
      layout[primary.id] = { x: padLeft, y: cursorY, width: usableWidth, height: clamped, visible: true };
      cursorY += clamped + 8; remainingHeight -= clamped + 8;
    }
  }

  const rowEls = [action, secondary].filter((e): e is AdElement => Boolean(e));
  if (rowEls.length > 0) {
    const rowH = Math.max(...rowEls.map((e) => (surface.minTapTarget && e.type === "button" ? surface.minTapTarget : BASE_SIZE[e.role].height)));
    if (rowH <= remainingHeight - 8 && remainingHeight > 24) {
      let cx = padLeft;
      const colWidth = Math.floor((usableWidth - 8 * (rowEls.length - 1)) / rowEls.length);
      for (const el of rowEls) {
        const { w, h } = enforceHard(el, colWidth, BASE_SIZE[el.role].height);
        layout[el.id] = { x: cx, y: cursorY, width: w, height: Math.min(h, rowH), visible: true };
        cx += colWidth + 8;
      }
      cursorY += rowH + 8; remainingHeight -= rowH + 8;
    } else {
      for (const el of rowEls) {
        if (el.priority <= 2 && remainingHeight >= 24) {
          const clamped = Math.max(20, remainingHeight - 8);
          layout[el.id] = { x: padLeft, y: cursorY, width: usableWidth, height: clamped, visible: true };
          cursorY += clamped + 8; remainingHeight -= clamped + 8;
        } else drop(el.id);
      }
    }
  }

  if (branding) {
    const base = BASE_SIZE.branding;
    if (base.height <= remainingHeight - 8 && remainingHeight > 24) {
      layout[branding.id] = { x: padLeft, y: cursorY, width: base.width, height: base.height, visible: true };
    } else drop(branding.id);
  }

  return layout;
}