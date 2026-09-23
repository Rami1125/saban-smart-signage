// ============================================================================
// Types: SabanOS Unified Brain Core Schema Definitions
// Version: 3.0.0
// ============================================================================

export type WarehouseBranch =
  | "סניף החרש (מחסן 4 - ראשי)"
  | "סניף התלמיד (מחסן 1 - גבס וצבע)"
  | "סניף החרש 10 (מרכז לוגיסטי והובלות)";

export interface Product {
  sku: string;
  name: string;
  category:
    | "אגרגטים"
    | "מליטה ודבקים"
    | "בלוקים וברזל"
    | "גבס ופרופילים"
    | "עצים וציוד"
    | "הובלות"
    | "כללי";
  basePrice: number;
  unitLabel: string;
  supplier: string;
  stockQuantity: number;
  warehouseLocation: string;
  preferredWarehouse: WarehouseBranch;
  description: string;
  image?: string;
  unitWeightKg?: number;
  requiresPalletDeposit?: boolean;
  palletCapacity?: number;
}

export interface SelfPickupItem {
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  unitWeightKg?: number;
  requiresPalletDeposit?: boolean;
}

export interface SelfPickupOrder {
  orderType: "SELF_PICKUP";
  branch: string;
  branchAddress: string;
  customerName: string;
  customerPhone: string;
  estimatedArrival: string;
  vehicleType: string;
  totalWeightKg?: number;
  vehicleFeasibility?: string;
  isWeightMismatch?: boolean;
  technicalRecommendations?: string[];
  items: SelfPickupItem[];
  status: string;
}

export interface DeliveryOrder {
  orderId: string;
  clientNumber: string;
  clientName: string;
  phone: string;
  destinationAddress: string;
  coordinates?: { lat: number; lng: number };
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unit: string;
  }>;
  bigBagDeposits: number;
  palletDeposits: number;
  deliveryType: "CRANE" | "FLATBED" | "SELF_PICKUP";
  deliverySku: string;
  assignedDriver?: "חכמת" | "עלי" | "איסוף עצמי";
  vehicleLicensePlate?: string;
  status: "נקלט במערכת" | "שובץ לסידור" | "בהעמסה" | "בחלוקה" | "נמסר ונחתם" | "מוכן בדלפק";
  wazeLink?: string;
  createdTime: string;
}

export interface DepositBreakdown {
  bigBagsCount: number;
  bigBagsDepositCost: number;
  palletsCount: number;
  palletsDepositCost: number;
  totalDepositBeforeVat: number;
  vatAmount: number;
  totalDepositWithVat: number;
  isExempt: boolean;
  exemptionReason?: string;
}

export interface PricingQuote {
  deliverySku: string;
  deliveryType: "CRANE" | "FLATBED";
  zoneName: string;
  distanceKm: number;
  basePrice: number;
  excessKm: number;
  excessKmPrice: number;
  fuelSurcharge: number;
  subtotal: number;
  vat: number;
  grandTotal: number;
}

export interface ClientRecord {
  clientNumber: string;
  clientName: string;
  phone: string;
  city: string;
  street: string;
  coordinates?: { lat: number; lng: number };
  activeCredit: boolean;
  primarySkuFocus?: string;
  lastOrderDate?: string;
}
