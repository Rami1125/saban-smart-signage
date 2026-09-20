import { Download, Share, Smartphone, X } from "lucide-react";
import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "badge" | "button" | "banner";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = "",
  variant = "badge",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop PWA install
  if (isInstallable) {
    if (variant === "button") {
      return (
        <button
          type="button"
          onClick={install}
          className={`inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95 ${className}`}
        >
          <Download className="size-4 shrink-0" />
          <span>התקן אפליקציה</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all ${className}`}
        title="התקן אפליקציה למכשיר"
      >
        <Smartphone className="size-3.5 shrink-0" />
        <span>התקן PWA</span>
      </button>
    );
  }

  // iOS Safari Guide
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-all ${className}`}
          title="הוסף למסך הבית ב-iPhone"
        >
          <Share className="size-3 text-primary shrink-0" />
          <span>הוסף למסך בית</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xs">
                    סבן
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">התקנה ב-iPhone / iPad</h3>
                    <p className="text-[11px] text-muted-foreground">אפליקציית ח. סבן 1994</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="סגור"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2.5 rounded-2xl bg-muted/60 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                    1
                  </span>
                  <p>
                    לחץ על כפתור <strong>השיתוף (Share)</strong> בתחתית דפדפן Safari (האייקון של
                    ריבוע עם חץ עולה).
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl bg-muted/60 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                    2
                  </span>
                  <p>
                    גלול ובחר באפשרות <strong>״הוסף למסך הבית״ (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl bg-muted/60 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                    3
                  </span>
                  <p>
                    האפליקציה תישמר במכשירך עם גישה מלאה לצלצול מיקומי, זיכרון במכשיר ומחשבון
                    כמויות.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
