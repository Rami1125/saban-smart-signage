// ============================================================================
// Deposits Engine: 1:1 Big Bags & Wooden Pallet Deposit Matching Rules
// Version: 3.0.0
// ============================================================================

import { DepositBreakdown } from "@/types";

export const DEPOSIT_SKUS = {
  BIG_BAG: "60002",       // בלה פקדון
  WOODEN_PALLET: "60060", // משטח סבן פקדון
  BLOCK_PALLET: "60006"   // משטח בלוקים פקדון
};

export const DEPOSIT_UNIT_PRICE_ILS = 35.0; // 35 ₪ ליחידה
export const VAT_RATE = 0.18; // מע"מ 18%

export function calculateOrderDeposits(params: {
  bigBagCount: number;
  cementBagsCount: number;
  plasterBagsCount: number;
  isFlatbedDirectDump?: boolean;
}): DepositBreakdown {
  if (params.isFlatbedDirectDump) {
    return {
      bigBagsCount: 0,
      bigBagsDepositCost: 0,
      palletsCount: 0,
      palletsDepositCost: 0,
      totalDepositBeforeVat: 0,
      vatAmount: 0,
      totalDepositWithVat: 0,
      isExempt: true,
      exemptionReason: "פטור מפקדונות: הובלת פלטה ללא פריקה (סחורה נפרקת ישירות ללא העמדת משטחים)"
    };
  }

  // חוק 1:1 לבלה פקדון
  const bigBagsCount = Math.max(0, params.bigBagCount);
  const bigBagsDepositCost = bigBagsCount * DEPOSIT_UNIT_PRICE_ILS;

  // חוק משטח סבן: 1 משטח לכל 40 שק מלט/דבק או לכל 20 שק טיח
  const cementPallets = Math.ceil(params.cementBagsCount / 40);
  const plasterPallets = Math.ceil(params.plasterBagsCount / 20);
  const palletsCount = cementPallets + plasterPallets;
  const palletsDepositCost = palletsCount * DEPOSIT_UNIT_PRICE_ILS;

  const totalDepositBeforeVat = bigBagsDepositCost + palletsDepositCost;
  const vatAmount = totalDepositBeforeVat * VAT_RATE;
  const totalDepositWithVat = totalDepositBeforeVat + vatAmount;

  return {
    bigBagsCount,
    bigBagsDepositCost,
    palletsCount,
    palletsDepositCost,
    totalDepositBeforeVat,
    vatAmount: Number(vatAmount.toFixed(2)),
    totalDepositWithVat: Number(totalDepositWithVat.toFixed(2)),
    isExempt: false
  };
}
