import {
  Bell,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Database,
  HardDrive,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  clearAllDeviceOrders,
  deleteDeviceOrder,
  getContractorProfile,
  getDeviceOrders,
  getOfflinePendingCount,
  saveContractorProfile,
  syncItemToSheet,
  type ContractorProfile,
  type SavedOrderItem,
} from "@/lib/dual-storage";
import { playLocationChime } from "@/lib/location-chime";
import { ORDER_WHATSAPP, whatsappLink } from "@/lib/counter-dispatch";

interface DeviceMemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (order: SavedOrderItem) => void;
}

export const DeviceMemoryDrawer: React.FC<DeviceMemoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const [orders, setOrders] = useState<SavedOrderItem[]>([]);
  const [profile, setProfile] = useState<ContractorProfile>({
    name: "",
    phone: "",
    preferredBranch: "haharash",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOffline, setPendingOffline] = useState(0);
  const [sheetHealth, setSheetHealth] = useState<{
    status: "checking" | "connected" | "offline";
    catalogCount?: number;
  }>({ status: "checking" });

  const loadData = () => {
    setOrders(getDeviceOrders());
    setProfile(getContractorProfile());
    setPendingOffline(getOfflinePendingCount());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      fetch("/api/sheets-sync")
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "connected") {
            setSheetHealth({ status: "connected", catalogCount: data.catalogCount });
          } else {
            setSheetHealth({ status: "offline" });
          }
        })
        .catch(() => setSheetHealth({ status: "offline" }));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener("saban:storage:change", handleStorageChange);
    return () => window.removeEventListener("saban:storage:change", handleStorageChange);
  }, []);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    let synced = 0;
    for (const item of orders) {
      if (!item.syncedToSheet) {
        const ok = await syncItemToSheet(item);
        if (ok) synced++;
      }
    }
    loadData();
    setIsSyncing(false);
    playLocationChime("dispatch");
    toast.success("סנכרון לגליון סבן הושלם!", {
      description: `${synced} פריטים סונכרנו בהצלחה`,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveContractorProfile(profile);
    setIsEditingProfile(false);
    toast.success("פרטי קבלן נשמרו בזיכרון המכשיר");
  };

  const handleRingArrival = () => {
    playLocationChime("arrival");
    toast.success("צלצול הגעה לסניף הופעל!", {
      description: "הדלפק קיבל התראה קולית על נוכחותך בסניף",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HardDrive className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-foreground">זיכרון מכשיר וסנכרון גליון</h2>
                <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full">
                  PWA Dual-Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                נשמר בטלפון שלך לגישה ללא קליטה + מסונכרן לדלפק סבן
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="סגור חלון"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="px-5 py-3 border-b bg-primary/5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Database className="size-3.5 text-primary" />
              <span>{orders.length} פריטים במכשיר</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cloud className="size-3.5 text-sky-500" />
              <span>{orders.filter((o) => o.syncedToSheet).length} סונכרנו לגליון</span>
            </div>
            {sheetHealth.status === "connected" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                חיבור גליון פעיל
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "מסנכרן..." : "סנכרן הכל לגליון"}</span>
          </button>
        </div>

        {/* Quick Action: Location Bell */}
        <div className="p-4 bg-muted/20 border-b">
          <div className="flex items-center justify-between gap-3 bg-card border rounded-2xl p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Bell className="size-4.5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">צלצול הגעה לדלפק</h4>
                <p className="text-[11px] text-muted-foreground">
                  משמיע צלצול מיקומי ומתריע לצוות הדלפק
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRingArrival}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-2 shadow-xs active:scale-95 transition-all"
            >
              <span>צלצל עכשיו 🛎️</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <HardDrive className="size-7" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">זיכרון המכשיר ריק כרגע</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                כל חישוב כמויות או שידור הזמנה לדלפק יישמר כאן אוטומטית בזיכרון המכשיר ויסונכרן
                במקביל לגליון ההזמנות של ח. סבן.
              </p>
            </div>
          ) : (
            orders.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/50 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-primary font-mono">{item.sku}</span>
                      <span className="text-xs font-bold text-foreground">{item.productName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.branchName || "ח. סבן"} • מקור: {item.source}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.syncedToSheet ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"
                        title="סונכרן לגליון Google Sheets"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>בגליון</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600"
                        title="נשמר במכשיר, ממתין לסנכרון גליון"
                      >
                        <Clock className="size-3" />
                        <span>במכשיר</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteDeviceOrder(item.id)}
                      className="p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="מחק מזיכרון המכשיר"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs">
                  <span className="font-semibold text-foreground">
                    {item.quantity} {item.unitLabel}
                  </span>
                  <span className="font-black text-foreground">
                    ₪{item.estimatedCost.toLocaleString()}
                  </span>
                </div>

                {item.note && (
                  <p className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-2 leading-relaxed">
                    {item.note}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <a
                    href={whatsappLink(
                      `שלום לח. סבן, שולח הזמנה מזיכרון המכשיר:\nמוצר: ${item.productName} (מק״ט ${item.sku})\nכמות: ${item.quantity} ${item.unitLabel}\nעלות משוערת: ₪${item.estimatedCost}\nסניף: ${item.branchName}`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Send className="size-3" />
                    <span>שדר בוואטסאפ</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t p-4 bg-muted/20 flex items-center justify-between">
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("האם לאפס את כל הפריטים השמורים בזיכרון המכשיר?")) {
                  clearAllDeviceOrders();
                  loadData();
                }
              }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <Trash2 className="size-3.5" />
              <span>נקה זיכרון</span>
            </button>
          )}

          <div className="mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-secondary text-secondary-foreground px-4 py-2 text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
