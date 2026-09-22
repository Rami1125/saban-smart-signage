// ============================================================================
// Component: ClientDetailsCard — High-Contrast Client Card with GPS & Primary SKU
// Version: 3.0.0
// ============================================================================

import React from "react";
import { Phone, MapPin, Navigation, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import { ClientRecord } from "@/types";

interface ClientDetailsCardProps {
  client: ClientRecord;
}

export const ClientDetailsCard: React.FC<ClientDetailsCardProps> = ({ client }) => {
  const hasCoords = Boolean(client.coordinates?.lat && client.coordinates?.lng);

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-900 p-4 text-white shadow-2xl transition-all hover:border-amber-400"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">{client.clientName}</h3>
            {client.activeCredit ? (
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                <ShieldCheck className="size-3" />
                אשראי מאושר
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/40">
                <ShieldAlert className="size-3" />
                תשלום מראש
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400 font-mono">מספר לקוח: {client.clientNumber}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Phone className="size-3.5 text-amber-400" />
            טלפון:
          </span>
          <a
            href={`tel:${client.phone}`}
            className="font-bold text-amber-300 hover:underline font-mono"
          >
            {client.phone}
          </a>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="size-3.5 text-amber-400" />
            כתובת אתר:
          </span>
          <span className="font-semibold text-white">
            {client.street}, {client.city}
          </span>
        </div>

        {client.primarySkuFocus && (
          <div className="flex items-center justify-between rounded-xl bg-amber-400/10 p-2 border border-amber-400/30">
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              התמחות לקוח:
            </span>
            <span className="text-[11px] font-black text-white">{client.primarySkuFocus}</span>
          </div>
        )}
      </div>

      {hasCoords && client.coordinates && (
        <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
          <a
            href={`https://waze.com/ul?ll=${client.coordinates.lat},${client.coordinates.lng}&navigate=yes`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 py-2 text-xs font-bold transition-colors"
          >
            <Navigation className="size-3.5" />
            ניווט Waze לאתר
          </a>
        </div>
      )}
    </div>
  );
};
