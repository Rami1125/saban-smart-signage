// ============================================================================
// Pricing Engine: Logistics Pricing, Zone Matrix & Excess KM Calculations
// Origin Point: רחוב החרש 10, הוד השרון (מרכז לוגיסטי סבן)
// ============================================================================

import { PricingQuote } from "@/types";

export const ORIGIN_ADDRESS = "החרש 10, הוד השרון";
export const ORIGIN_COORDINATES = { lat: 32.1558, lng: 34.8932 };
export const VAT_RATE = 0.18; // מע"מ 18%

export const EXCESS_KM_RATES = {
  CRANE: 12,   // 12 ₪ לכל ק"מ חורג למנוף
  FLATBED: 8   // 8 ₪ לכל ק"מ חורג למשאית חלוקה/פלטה
};

export const BASE_ZONES = [
  {
    name: "הוד השרון (אזור מקומי)",
    maxRadiusKm: 5,
    craneSku: "18050",
    craneBasePrice: 350,
    flatbedSku: "818050",
    flatbedBasePrice: 200
  },
  {
    name: "כפר סבא - רעננה - פתח תקווה צפון",
    maxRadiusKm: 12,
    craneSku: "18055",
    craneBasePrice: 420,
    flatbedSku: "818055",
    flatbedBasePrice: 260
  },
  {
    name: "הרצליה - רמת השרון - תל אביב צפון",
    maxRadiusKm: 18,
    craneSku: "18060",
    craneBasePrice: 500,
    flatbedSku: "818060",
    flatbedBasePrice: 320
  },
  {
    name: "עמק חפר - נתניה - שרון רחוק",
    maxRadiusKm: 32,
    craneSku: "18118",
    craneBasePrice: 650,
    flatbedSku: "818118",
    flatbedBasePrice: 450
  }
];

export function calculateDeliveryPrice(
  deliveryType: "CRANE" | "FLATBED",
  distanceKm: number,
  fuelSurchargePercent: number = 0
): PricingQuote {
  const matchedZone =
    BASE_ZONES.find((z) => distanceKm <= z.maxRadiusKm) ||
    BASE_ZONES[BASE_ZONES.length - 1];

  const basePrice = deliveryType === "CRANE" ? matchedZone.craneBasePrice : matchedZone.flatbedBasePrice;
  const deliverySku = deliveryType === "CRANE" ? matchedZone.craneSku : matchedZone.flatbedSku;

  const excessKm = Math.max(0, distanceKm - matchedZone.maxRadiusKm);
  const excessKmRate = deliveryType === "CRANE" ? EXCESS_KM_RATES.CRANE : EXCESS_KM_RATES.FLATBED;
  const excessKmPrice = excessKm * excessKmRate;

  const fuelSurcharge = ((basePrice + excessKmPrice) * fuelSurchargePercent) / 100;
  const subtotal = basePrice + excessKmPrice + fuelSurcharge;
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  return {
    deliverySku,
    deliveryType,
    zoneName: matchedZone.name,
    distanceKm,
    basePrice,
    excessKm: Number(excessKm.toFixed(1)),
    excessKmPrice: Number(excessKmPrice.toFixed(2)),
    fuelSurcharge: Number(fuelSurcharge.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2))
  };
}
