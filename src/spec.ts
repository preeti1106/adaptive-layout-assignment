export type ElementType = "text" | "image" | "button";
export type ElementRole = "primary" | "hero" | "action" | "secondary" | "branding";
export type Priority = 1 | 2 | 3;

export interface AdElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: Priority;
  content?: string;
}

export interface AdSpec {
  elements: AdElement[];
}

export function defineAd(spec: AdSpec): AdSpec {
  const ids = new Set<string>();
  for (const el of spec.elements) {
    if (ids.has(el.id)) {
      throw new Error(`Duplicate element id: "${el.id}"`);
    }
    ids.add(el.id);
  }
  return spec;
}

export const sampleAdSpec: AdSpec = defineAd({
  elements: [
    { id: "headline", type: "text", role: "primary", priority: 1, content: "Best Mileage in India" },
    { id: "product-image", type: "image", role: "hero", priority: 1, content: "/car.jpg" },
    { id: "cta", type: "button", role: "action", priority: 2, content: "Book Now" },
    { id: "price", type: "text", role: "secondary", priority: 2, content: "₹8 Lakh" },
    { id: "logo", type: "image", role: "branding", priority: 3, content: "/logo.png" },
  ],
});