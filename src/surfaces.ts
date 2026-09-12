export type ViewingDistance = "near" | "far";

export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SurfaceProfile {
  id: string;
  width: number;
  height: number;
  minTapTarget?: number;
  minTextSize?: number;
  viewingDistance?: ViewingDistance;
  touchOnly?: boolean;
  safeArea?: SafeArea;
}

export function defineSurface(profile: SurfaceProfile): SurfaceProfile {
  if (profile.width <= 0 || profile.height <= 0) {
    throw new Error(`Surface "${profile.id}" must have positive width/height`);
  }
  if (profile.touchOnly && !profile.minTapTarget) {
    throw new Error(`Surface "${profile.id}" is touchOnly but has no minTapTarget defined`);
  }
  return profile;
}

export const mobilePortrait: SurfaceProfile = defineSurface({
  id: "mobilePortrait",
  width: 320,
  height: 480,
  minTapTarget: 44,
  safeArea: { top: 20, bottom: 20, left: 8, right: 8 },
});

export const mobileLandscape: SurfaceProfile = defineSurface({
  id: "mobileLandscape",
  width: 480,
  height: 320,
  minTapTarget: 44,
  safeArea: { top: 8, bottom: 8, left: 20, right: 20 },
});

export const broadcastLowerThird: SurfaceProfile = defineSurface({
  id: "broadcastLowerThird",
  width: 1920,
  height: 250,
  minTextSize: 32,
  viewingDistance: "far",
});

export const retailKiosk: SurfaceProfile = defineSurface({
  id: "retailKiosk",
  width: 340,
  height: 320,
  minTapTarget: 60,
  touchOnly: true,
});

export const allSurfaces: SurfaceProfile[] = [
  mobilePortrait,
  mobileLandscape,
  broadcastLowerThird,
  retailKiosk,
];