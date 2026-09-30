import { Product } from "../types/index.js";

export const PRODUCT_CATALOG: readonly Product[] = [
  {
    id: "prod_felt_mat",
    slug: "meridian-felt-desk-mat",
    name: "Meridian Merino Wool Desk Mat",
    shortDescription:
      "Dense 4mm Bavarian merino wool felt with natural water repellency and anti-slip silicone underlay.",
    pricePaise: 349900, // ₹3,499.00
    visualType: "felt_mat",
  },
  {
    id: "prod_walnut_stand",
    slug: "sculpted-walnut-keyboard-tray",
    name: "Sculpted Walnut Keyboard Tray",
    shortDescription:
      "CNC-milled solid American walnut with integrated magnetic wrist rest and brushed brass accents.",
    pricePaise: 549900, // ₹5,499.00
    visualType: "walnut_stand",
  },
  {
    id: "prod_aluminum_shelf",
    slug: "linear-aluminum-monitor-shelf",
    name: "Linear Aluminum Monitor Shelf",
    shortDescription:
      "Anodized aerospace aluminum with dual storage compartments and portuguese cork scratch protection.",
    pricePaise: 899900, // ₹8,999.00
    visualType: "aluminum_shelf",
  },
  {
    id: "prod_brass_anchor",
    slug: "weighted-brass-cable-anchor",
    name: "Weighted Solid Brass Cable Anchor",
    shortDescription:
      "Precision turned solid brass anchor with micro-suction silicone base to hold charging cables securely.",
    pricePaise: 199900, // ₹1,999.00
    visualType: "brass_anchor",
  },
  {
    id: "prod_orbit_lamp",
    slug: "orbit-architectural-desk-lamp",
    name: "Orbit Architectural Desk Lamp",
    shortDescription:
      "High-CRI 98 optical LED lamp with stepless rotary touch dimmer and warm tone circadian balancing.",
    pricePaise: 1249900, // ₹12,499.00
    visualType: "orbit_lamp",
  },
  {
    id: "prod_charging_dock",
    slug: "magcharge-triple-dock",
    name: "MagCharge Precision Triple Dock",
    shortDescription:
      "Simultaneous 15W MagSafe charging for phone, watch, and earbuds in matte ceramic composite.",
    pricePaise: 799900, // ₹7,999.00
    visualType: "charging_dock",
  },
] as const;

export function getAllProducts(): readonly Product[] {
  return PRODUCT_CATALOG;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCT_CATALOG.find(p => p.id === id);
}
