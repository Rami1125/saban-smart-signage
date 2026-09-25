// ============================================================================
// Component: ClientOrdersAccordion — Historical Order Tracking from Sheets
// Version: 3.0.0
// ============================================================================

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, CheckCircle2, Clock } from "lucide-react";
import { DeliveryOrder } from "@/types";

interface ClientOrdersAccordionProps {
  orders: DeliveryOrder[];
}

export const ClientOrdersAccordion: React.FC<ClientOrdersAccordionProps> = ({ orders }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center text-xs text-slate-400">
        אין היסטוריית הזמנות פעילה להצגה
      </div>
    );
  }

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div dir="rtl" className="w-full space-y-2">
      <h4 className="text-xs font-black text-slate-300 px-1">היסטוריית הזמנות מטאב דשבורד</h4>
      {orders.map((order) => {
        const isExpanded = expandedId === order.orderId;
        const isDelivered = order.status === "נמסר ונחתם" || order.status === "מוכן בדלפק";

        return (
          <div
            key={order.orderId}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white transition-all shadow-md"
          >
            <button
              type="button"
              onClick={() => toggle(order.orderId)}
              className="flex w-full items-center justify-between p-3 text-right hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDelivered ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : (
                  <Clock className="size-4 text-amber-400" />
                )}
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>הזמנה #{order.orderId}</span>
                    <span className="text-[10px] text-slate-400">({order.deliveryType})</span>
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="size-3" />
                    {order.createdTime
                      ? new Date(order.createdTime).toLocaleDateString("he-IL")
                      : "היום"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                    isDelivered
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/40"
                  }`}
                >
                  {order.status}
                </span>
                {isExpanded ? (
                  <ChevronUp className="size-4 text-slate-400" />
                ) : (
                  <ChevronDown className="size-4 text-slate-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>נהג משוייך: {order.assignedDriver || "איסוף עצמי"}</span>
                  <span>יעד: {order.destinationAddress}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>פקדונות בלות: {order.bigBagDeposits}</span>
                  <span>פקדונות משטחים: {order.palletDeposits}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
