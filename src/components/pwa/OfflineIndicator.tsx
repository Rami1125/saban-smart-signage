import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export const OfflineIndicator: React.FC<{ pendingCount?: number }> = ({ pendingCount = 0 }) => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="fixed top-14 inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-2 rounded-2xl bg-amber-600/95 text-white px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs animate-in slide-in-from-top-4 duration-200 pointer-events-auto">
          <WifiOff className="size-4 shrink-0 animate-pulse" />
          <span>עבודה במצב לא מקוון — הנתונים נשמרים בזיכרון המכשיר</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
              {pendingCount} פעולות ממתינות לסנכרון
            </span>
          )}
        </div>
      </div>
    );
  }

  if (showReconnected && pendingCount === 0) {
    return (
      <div className="fixed top-14 inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600/95 text-white px-4 py-1.5 text-xs font-semibold shadow-md backdrop-blur-xs animate-in fade-in duration-200">
          <RefreshCw className="size-3.5 shrink-0 animate-spin" />
          <span>החיבור שוחזר — הנתונים סונכרנו בהצלחה עם הגליון ☁️</span>
        </div>
      </div>
    );
  }

  return null;
};
