import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  Cloud,
  Compass,
  Database,
  ExternalLink,
  FileText,
  HardDrive,
  Layers,
  MapPin,
  MessageCircle,
  Package,
  Send,
  Share2,
  ShieldCheck,
  Video,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NoaChat } from "@/components/noa/NoaChat";
import { DeviceMemoryDrawer } from "@/components/pwa/DeviceMemoryDrawer";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { Button } from "@/components/ui/button";
import { dispatchToCounter, whatsappLink } from "@/lib/counter-dispatch";
import { dispatchDualPersistence, getDeviceOrders, type SavedOrderItem } from "@/lib/dual-storage";
import {
  detectBranchProximity,
  playLocationChime,
  SABAN_BRANCHES,
  type BranchId,
  type GeolocationResult,
} from "@/lib/location-chime";
import { effectivePrice, findProduct, type Product } from "@/lib/products";
import {
  checkWeightFeasibility,
  estimateUnitWeightKg,
  TECHNICAL_RULES,
  type TechnicalRule,
} from "@/lib/technicalRules";

type ProductSearch = {
  source?: string;
  warehouse?: string;
  screen_id?: string;
};

export const Route = createFileRoute("/product/$sku")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    source: typeof search.source === "string" ? search.source : undefined,
    warehouse: typeof search.warehouse === "string" ? search.warehouse : undefined,
    screen_id: typeof search.screen_id === "string" ? search.screen_id : undefined,
  }),
  loader: async ({ params }) => {
    try {
      const { getLobbyProductsCached } = await import("@/lib/lobby.server");
      const { products } = await getLobbyProductsCached();
      const { findProduct } = await import("@/lib/products");
      const product = findProduct(products, params.sku) ?? products[0] ?? null;
      return { product, products };
    } catch {
      return { product: null, products: [] };
    }
  },
  component: ProductPage,
});

function toEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("/embed/")) return url;
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  );
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

function ProductPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const rawSku = params.sku;

  // Dynamic product loading from Google Sheet 📦 קטלוג_מוצרים
  const [product, setProduct] = useState<Product | null>(loaderData?.product ?? null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>(loaderData?.products ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!loaderData?.product);

  useEffect(() => {
    let isMounted = true;
    import("@/lib/lobby.functions")
      .then((mod) => mod.getLobbyProducts())
      .then((res) => {
        if (isMounted) {
          const list = res?.products || [];
          setAvailableProducts(list);
          const match = findProduct(list, rawSku);
          setProduct(match || (list.length > 0 ? list[0] : null));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load product from Google Sheets:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [rawSku]);

  // Branch & Warehouse context resolution
  const initialBranch: BranchId = useMemo(() => {
    const w = (search.warehouse || "").toLowerCase();
    if (w.includes("תלמיד") || w === "hatalmid" || w === "wh1") return "hatalmid";
    return "haharash";
  }, [search.warehouse]);

  const [selectedBranch, setSelectedBranch] = useState<BranchId>(initialBranch);
  const currentBranch = SABAN_BRANCHES[selectedBranch];

  // Geolocation & Chime state
  const [geoResult, setGeoResult] = useState<GeolocationResult | null>(null);
  const [isCheckingGeo, setIsCheckingGeo] = useState<boolean>(false);
  const [lastChimed, setLastChimed] = useState<string | null>(null);

  // Device Memory state
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState<boolean>(false);
  const [deviceOrderCount, setDeviceOrderCount] = useState<number>(0);

  // Calculator state
  const [areaM2, setAreaM2] = useState<number>(20);
  const [wastePercent, setWastePercent] = useState<number>(10);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [dualSyncStatus, setDualSyncStatus] = useState<{
    storedLocally: boolean;
    syncedToSheet: boolean;
  } | null>(null);

  // Sync device items count on mount & changes
  const refreshMemoryCount = () => {
    setDeviceOrderCount(getDeviceOrders().length);
  };

  useEffect(() => {
    refreshMemoryCount();
    const handleStorageChange = () => refreshMemoryCount();
    window.addEventListener("saban:storage:change", handleStorageChange);
    return () => window.removeEventListener("saban:storage:change", handleStorageChange);
  }, []);

  // Calculation results with Technical Rules and Weight Feasibility
  const technicalRule: TechnicalRule | undefined = useMemo(() => {
    if (!product) return undefined;
    const normSku = product.sku.replace(/\D/g, "");
    return TECHNICAL_RULES[normSku];
  }, [product]);

  const calculation = useMemo(() => {
    if (!product) {
      return {
        effectiveArea: 0,
        unitsNeeded: 0,
        estimatedCost: 0,
        palletsNeeded: null,
        totalWeightKg: 0,
        weightFeasibility: checkWeightFeasibility(0),
        rule: undefined,
      };
    }
    const coverage = technicalRule?.coveragePerUnitM2 ?? (product.coveragePerUnitM2 || 1);
    const effectiveArea = areaM2 * (1 + wastePercent / 100);
    const unitsNeeded = Math.ceil(effectiveArea / coverage);
    const unitPrice = effectivePrice(product);
    const estimatedCost = unitsNeeded * unitPrice;
    const palletsNeeded = product.unitsPerPallet
      ? Math.ceil(unitsNeeded / product.unitsPerPallet)
      : null;

    const unitWeight = estimateUnitWeightKg(product.sku, product.unitWeight, product.name);
    const totalWeightKg = unitsNeeded * unitWeight;
    const isPalletOrder =
      (palletsNeeded !== null && palletsNeeded >= 1) ||
      (product.unitsPerPallet ? unitsNeeded >= product.unitsPerPallet : false);
    const weightFeasibility = checkWeightFeasibility(totalWeightKg, undefined, isPalletOrder);

    return {
      effectiveArea: Math.round(effectiveArea * 10) / 10,
      unitsNeeded,
      estimatedCost: Math.round(estimatedCost * 10) / 10,
      palletsNeeded,
      totalWeightKg,
      weightFeasibility,
      rule: technicalRule,
    };
  }, [areaM2, wastePercent, product, technicalRule]);

  // בדיקת מיקום וזיהוי סניף
  const handleCheckProximity = async () => {
    setIsCheckingGeo(true);
    try {
      const result = await detectBranchProximity();
      setGeoResult(result);
      if (result.nearestBranch) {
        setSelectedBranch(result.nearestBranch.id);
      }
      toast.info(result.statusText, {
        description: `סניף נבחר: ${result.nearestBranch.shortName}`,
      });
    } catch {
      toast.error("לא ניתן לאתר מיקום נוכחי");
    } finally {
      setIsCheckingGeo(false);
    }
  };

  // הפעלת צלצול מיקומי לדלפק
  const handleRingChime = (sound: "counter_ring" | "arrival") => {
    playLocationChime(sound);
    setLastChimed(new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }));
    if (sound === "counter_ring") {
      toast.success("צלצול פעמון דלפק הופעל 🛎️", {
        description: `נשלח אות קולי לצוות דלפק ${currentBranch.shortName}`,
      });
    } else {
      toast.success("צלצול הגעה לסניף הופעל 📍", {
        description: `ברוך בואך ל${currentBranch.name}!`,
      });
    }
  };

  // שמירה לזיכרון המכשיר בלבד (לחישוב עתידי)
  const handleSaveToDeviceOnly = async () => {
    if (!product) return;
    const unitPrice = effectivePrice(product);
    const saved = await dispatchDualPersistence({
      sku: product.sku,
      productName: product.name,
      quantity: calculation.unitsNeeded,
      unitLabel: product.unitLabel,
      unitPrice,
      estimatedCost: calculation.estimatedCost,
      areaM2,
      wastePercent,
      warehouse: currentBranch.warehouseCode,
      branchName: currentBranch.name,
      source: search.source || "pwa_product_calculator",
      screenId: search.screen_id || "mobile_pwa",
      note: `חישוב שמור בזיכרון: ${areaM2} מ״ר (פחת ${wastePercent}%) | ${currentBranch.shortName}`,
    });

    playLocationChime("dispatch");
    setDualSyncStatus({ storedLocally: true, syncedToSheet: saved.syncedToSheet });
    refreshMemoryCount();
    toast.success("נשמר בזיכרון המכשיר במקביל לגליון! 💾", {
      description: `${calculation.unitsNeeded} ${product.unitLabel} נשמרו בזיכרון הטלפון שלך`,
    });
  };

  // שידור מלא לדלפק עם שמירה כפולה במכשיר ובגליון
  const handleDispatch = async () => {
    if (!product) return;
    const unitPrice = effectivePrice(product);

    // 1. קול פעמון שידור
    playLocationChime("dispatch");

    // 2. שמירה כפולה: מכשיר + גליון Sheets
    const savedItem = await dispatchDualPersistence({
      sku: product.sku,
      productName: product.name,
      quantity: calculation.unitsNeeded,
      unitLabel: product.unitLabel,
      unitPrice,
      estimatedCost: calculation.estimatedCost,
      areaM2,
      wastePercent,
      warehouse: currentBranch.warehouseCode,
      branchName: currentBranch.name,
      source: search.source || "pwa_qr_client",
      screenId: search.screen_id || "lobby_qr",
      note: `חישוב שטח: ${areaM2} מ״ר (כולל ${wastePercent}% פחת) | ${currentBranch.shortName} | יחידה: ${unitPrice} ₪`,
    });

    // 3. תאימות לאחור עם מנגנון הדלפק הקיים
    dispatchToCounter({
      sku: product.sku,
      productName: product.name,
      quantity: calculation.unitsNeeded,
      unitLabel: product.unitLabel,
      estimatedCost: calculation.estimatedCost,
      source: "mobile_qr_scanner",
      screenId: search.screen_id || "lobby_qr",
      note: `חישוב שטח: ${areaM2} מ״ר | ${currentBranch.shortName} | נשמר במכשיר: ${savedItem.id}`,
    });

    setDualSyncStatus({ storedLocally: true, syncedToSheet: savedItem.syncedToSheet });
    setIsDispatched(true);
    refreshMemoryCount();

    toast.success("ההזמנה שודרה וסונכרנה במקביל! 🚀", {
      description: `נשמרה בזיכרון המכשיר ובגליון ההזמנות של ${currentBranch.shortName}`,
    });

    setTimeout(() => setIsDispatched(false), 6000);
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — ח. סבן חומרי בניין`,
          text: `מפרט טכני, מחיר קבלן ומחשבון כמויות עבור ${product.name} (מק״ט ${product.sku}) בח. סבן`,
          url: window.location.href,
        });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.info("קישור הדף הועתק ללוח!");
    }
  };

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4"
      >
        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
          <Package className="size-7" />
        </div>
        <h2 className="text-lg font-bold">טוען מפרט מוצר...</h2>
        <p className="text-xs text-muted-foreground text-center">
          שולף נתוני מוצר ומחירון חי מגיליון 📦 קטלוג_מוצרים של ח. סבן
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4 text-center max-w-md mx-auto"
      >
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Package className="size-7" />
        </div>
        <h2 className="text-lg font-bold">מוצר לא נמצא בקטלוג הפעיל</h2>
        <p className="text-xs text-muted-foreground">
          המק״ט {rawSku} אינו מופיע כרגע בגיליון 📦 קטלוג_מוצרים של ח. סבן.
        </p>
        <Link
          to="/"
          className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm shadow-xs"
        >
          חזרה למסך הלובי
        </Link>
      </div>
    );
  }

  const currentPrice = effectivePrice(product);
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const embedVideoUrl = toEmbedUrl(product.mediaUrl);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground pb-32 selection:bg-primary/30"
    >
      {/* Top Header - Zero-Leak Isolated Micro-Frontend */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
              סבן
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  ח. סבן 1994
                </span>
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600 inline" />
                  מפרט רשמי מאושר
                </span>
              </div>
              <h1 className="text-sm font-semibold truncate max-w-[180px] sm:max-w-xs">
                {product.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsMemoryDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors relative"
              title="פתח זיכרון מכשיר וסנכרון גליון"
            >
              <HardDrive className="size-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline">זיכרון מכשיר</span>
              {deviceOrderCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                  {deviceOrderCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-input bg-card text-muted-foreground hover:text-foreground transition-colors"
              title="שתף דף מוצר"
              aria-label="שתף דף מוצר"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-2xl px-4 py-5 space-y-6">
        {/* Product Visual Card */}
        <div className="overflow-hidden rounded-3xl border bg-card shadow-xs">
          <div className="relative aspect-4/3 sm:aspect-16/10 bg-muted/40 flex items-center justify-center p-6">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes("/assets/product-adhesive-bag.jpg")) {
                  target.src = "/assets/product-adhesive-bag.jpg";
                }
              }}
              className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
            {product.discountTag && (
              <span className="absolute top-4 right-4 rounded-full bg-primary text-primary-foreground font-bold text-xs px-3 py-1 shadow-sm">
                {product.discountTag}
              </span>
            )}
            <div className="absolute bottom-3 left-3 bg-signage/90 backdrop-blur-xs text-signage-foreground text-xs px-2.5 py-1 rounded-lg font-mono">
              מק״ט: {product.sku}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {product.category} • {product.brand}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold mt-0.5 leading-snug">
                  {product.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{product.marketingPhrase}</p>
              </div>

              {/* Price Tag */}
              <div className="text-left shrink-0">
                <div className="text-xl sm:text-2xl font-black text-primary">שאל את הדלפק</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ל{product.unitLabel} {product.unitWeight ? `(${product.unitWeight})` : ""}
                </div>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
              <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
                <span className="text-[11px] text-muted-foreground block">כושר כיסוי</span>
                <span className="text-sm font-bold text-foreground">
                  {product.coveragePerUnitM2} מ״ר
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  ל{product.unitLabel}
                </span>
              </div>

              <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
                <span className="text-[11px] text-muted-foreground block">זמן עבודה / פתוח</span>
                <span className="text-sm font-bold text-foreground truncate block">
                  {product.openTime || product.potLife || "מיידי"}
                </span>
                <span className="text-[10px] text-muted-foreground block">לפי תנאי שטח</span>
              </div>

              <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
                <span className="text-[11px] text-muted-foreground block">זמן ייבוש</span>
                <span className="text-sm font-bold text-foreground truncate block">
                  {product.dryingTime?.split(",")[0] || "24 שעות"}
                </span>
                <span className="text-[10px] text-muted-foreground block">שלב ראשון</span>
              </div>

              <div className="rounded-2xl bg-muted/50 p-2.5 text-center">
                <span className="text-[11px] text-muted-foreground block">משטח מלא</span>
                <span className="text-sm font-bold text-foreground">
                  {product.unitsPerPallet ? `${product.unitsPerPallet} יח׳` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {product.palletDeposit || "ללא פקדון"}
                </span>
              </div>
            </div>

            {/* Spec details row from sheet with prompt to ask desk representative */}
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                <span className="font-bold text-primary">נתוני מוצר מהגליון:</span>
                <span>{product.coverageNote || product.marketingPhrase || product.name}</span>
              </div>
              <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span>שאל את נציג הדלפק</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location-Based Branch Detection & Counter Chime (צלצול מיקומי) */}
        <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                <Bell className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">צלצול מיקומי ודלפק שירות</h3>
                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5">
                    זיהוי סניף
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  בדיקת קרבה לסניפי ח. סבן והפעלת צלצול קולי לדלפק
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckProximity}
              disabled={isCheckingGeo}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Compass className={`size-3.5 ${isCheckingGeo ? "animate-spin" : ""}`} />
              <span>{isCheckingGeo ? "מאתר..." : "אתר ב-GPS"}</span>
            </button>
          </div>

          {/* Branch Selection Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(["haharash", "hatalmid"] as const).map((branchKey) => {
              const b = SABAN_BRANCHES[branchKey];
              const isSelected = selectedBranch === branchKey;
              return (
                <button
                  key={branchKey}
                  type="button"
                  onClick={() => {
                    setSelectedBranch(branchKey);
                    playLocationChime("arrival");
                  }}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                      : "border-input bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{b.shortName}</span>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                      {b.warehouseCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate mt-1">
                    {b.address}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Proximity Radar Banner */}
          {geoResult && (
            <div className="rounded-2xl bg-muted/60 p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{geoResult.statusText}</span>
              </div>
              {geoResult.isInsideBranch && (
                <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                  בתוך הסניף 🎯
                </span>
              )}
            </div>
          )}

          {/* Acoustic Chime Triggers */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t">
            <button
              type="button"
              onClick={() => handleRingChime("counter_ring")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-foreground py-2.5 px-3 text-xs font-bold transition-all active:scale-95"
            >
              <Bell className="size-4 text-amber-500 shrink-0" />
              <span>צלצל פעמון דלפק 🛎️</span>
            </button>

            <button
              type="button"
              onClick={() => handleRingChime("arrival")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-foreground py-2.5 px-3 text-xs font-bold transition-all active:scale-95"
            >
              <Volume2 className="size-4 text-sky-500 shrink-0" />
              <span>צלצול הגעה לסניף 📍</span>
            </button>
          </div>

          {lastChimed && (
            <div className="text-center text-[10px] text-muted-foreground">
              צלצול אחרון הושמע בשעה {lastChimed} • אות שמע סונכרן
            </div>
          )}
        </div>

        {/* Interactive m² Calculator with Dual-Storage & Sheet Sync */}
        <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Calculator className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-base">מחשבון כמויות דיגיטלי</h3>
                <p className="text-xs text-muted-foreground">
                  חישוב שקים/מכלים ועלות מוערכת לפי שטח הפרויקט
                </p>
              </div>
            </div>

            {/* Dual Sync Indicator */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-xl">
              <Database className="size-3 text-emerald-600" />
              <span>מכשיר</span>
              <span>+</span>
              <Cloud className="size-3 text-sky-500" />
              <span>גליון</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Input: Area */}
            <div>
              <label
                htmlFor="area-input"
                className="block text-xs font-semibold mb-1 text-muted-foreground"
              >
                שטח העבודה במ״ר:
              </label>
              <div className="relative">
                <input
                  id="area-input"
                  type="number"
                  min="1"
                  max="10000"
                  value={areaM2}
                  onChange={(e) => setAreaM2(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-lg font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
                <span className="absolute left-3.5 top-3 text-xs font-semibold text-muted-foreground">
                  מ״ר
                </span>
              </div>
            </div>

            {/* Input: Waste Buffer */}
            <div>
              <span className="block text-xs font-semibold mb-1 text-muted-foreground">
                מקדם פחת מומלץ:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setWastePercent(pct)}
                    className={`rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                      wastePercent === pct
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-input hover:bg-muted"
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="rounded-2xl bg-muted/60 p-4 border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">שטח מחושב כולל פחת:</span>
              <span className="font-bold">{calculation.effectiveArea} מ״ר</span>
            </div>

            <div className="flex items-center justify-between text-base border-t pt-2">
              <span className="font-semibold text-foreground">כמות נדרשת להזמנה:</span>
              <span className="text-xl font-black text-primary">
                {calculation.unitsNeeded} {product.unitLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">מחיר ועלות:</span>
              <span className="font-bold text-primary">שאל את הדלפק</span>
            </div>

            {calculation.palletsNeeded && calculation.palletsNeeded > 0 && (
              <div className="text-xs text-muted-foreground bg-card/60 p-2 rounded-xl flex items-center gap-1.5">
                <Package className="size-3.5 shrink-0 text-primary" />
                <span>
                  ההזמנה שווה ערך לכ-
                  <strong>{calculation.palletsNeeded} משטחים</strong> ({product.unitsPerPallet} יח׳
                  במשטח מלא).
                </span>
              </div>
            )}

            {/* בקרת משקל ובטיחות רכב (Weight Feasibility Check) */}
            <div
              className={`rounded-2xl p-3.5 border transition-all ${
                calculation.weightFeasibility.approvedCategory === "truck_trailer"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  : calculation.weightFeasibility.approvedCategory === "pickup_van"
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-900 dark:text-sky-200"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <span>⚖️ בקרת משקל והעמסה:</span>
                  <span className="font-black text-sm">
                    {calculation.totalWeightKg.toLocaleString()} ק״ג
                  </span>
                </span>
                <span className="text-[11px] rounded-full px-2 py-0.5 bg-background/80 border font-semibold">
                  {calculation.weightFeasibility.categoryLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {calculation.weightFeasibility.recommendedVehicleText}
              </p>
              {calculation.totalWeightKg > 300 && (
                <div className="mt-2 pt-2 border-t border-current/20 text-[11px] flex items-center gap-1 font-medium">
                  <span>
                    ⚠️ לא מתאים לרכב פרטי. במידת הצורך מומלץ לפצל איסוף או לתאם הובלת מנוף.
                  </span>
                </div>
              )}
            </div>

            {/* מנוע ידע טכני והמלצות מוצרים משלימים (Technical Rules) */}
            {technicalRule && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                  <span className="text-base">💡</span>
                  <span>דגשים טכניים מומלצים למק״ט {technicalRule.sku}</span>
                </div>

                <div className="space-y-1 text-muted-foreground text-[11px]">
                  {technicalRule.criticalNotes.map((note, nIdx) => (
                    <p key={nIdx} className="leading-snug">
                      • {note}
                    </p>
                  ))}
                </div>

                {technicalRule.mandatoryCompanions.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
                    <span className="font-bold text-foreground text-[11px] block">
                      📌 מוצרים משלימים מחייבים ליישום תקני:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {technicalRule.mandatoryCompanions.map((comp, cIdx) => (
                        <div
                          key={cIdx}
                          className="rounded-xl bg-background/80 border p-2 text-[11px] flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-foreground block">
                              {comp.name} {comp.sku ? `(מק״ט ${comp.sku})` : ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                              {comp.reason}
                            </span>
                          </div>
                          {comp.sku && (
                            <Link
                              to="/product/$sku"
                              params={{ sku: comp.sku }}
                              className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md shrink-0 transition-colors"
                            >
                              למוצר 🔍
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dual Sync Live Feedback */}
            {dualSyncStatus && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>נשמר בזיכרון המכשיר וסונכרן לגליון ההזמנות</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMemoryDrawerOpen(true)}
                  className="underline font-bold text-[11px]"
                >
                  צפה בזיכרון
                </button>
              </div>
            )}

            {/* Dual Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                onClick={handleDispatch}
                className="h-11 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="size-4" />
                <span>שדר לדלפק וסנכרן לגליון</span>
              </Button>

              <button
                type="button"
                onClick={handleSaveToDeviceOnly}
                className="h-11 rounded-2xl font-bold border border-input bg-card text-foreground hover:bg-muted flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <HardDrive className="size-4 text-primary" />
                <span>שמור לזיכרון המכשיר בלבד 💾</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Tutorial Embed (if available) */}
        {embedVideoUrl && (
          <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <Video className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-base">הדרכת וידאו ויישום בשטח</h3>
                <p className="text-xs text-muted-foreground">
                  צפה בטכניקת המריחה הנכונה של המומחים
                </p>
              </div>
            </div>

            <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border bg-black">
              <iframe
                src={embedVideoUrl}
                title={`${product.name} — סרטון הדרכה`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>
          </div>
        )}

        {/* Full Technical Specifications */}
        <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">מפרט טכני והוראות יישום</h3>
              <p className="text-xs text-muted-foreground">נתוני יצרן מחייבים ודרישות תקן</p>
            </div>
          </div>

          <div className="divide-y text-sm">
            {product.standard && (
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-muted-foreground font-medium shrink-0">תקן רשמי:</span>
                <span className="font-bold text-foreground text-left">{product.standard}</span>
              </div>
            )}

            <div className="py-2.5 flex justify-between gap-4">
              <span className="text-muted-foreground font-medium shrink-0">הנחיות כיסוי:</span>
              <span className="font-medium text-foreground text-left">{product.coverageNote}</span>
            </div>

            {product.mixRatio && (
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-muted-foreground font-medium shrink-0">יחס ערבוב:</span>
                <span className="font-medium text-foreground text-left">{product.mixRatio}</span>
              </div>
            )}

            <div className="py-2.5 flex justify-between gap-4">
              <span className="text-muted-foreground font-medium shrink-0">אופן היישום:</span>
              <span className="font-medium text-foreground text-left">
                {product.applicationMethod}
              </span>
            </div>

            {product.dryingTime && (
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-muted-foreground font-medium shrink-0">זמני ייבוש:</span>
                <span className="font-medium text-foreground text-left">{product.dryingTime}</span>
              </div>
            )}

            {product.substrates?.length > 0 && (
              <div className="py-2.5 flex justify-between items-center gap-4">
                <span className="text-muted-foreground font-medium shrink-0">מצעים מאושרים:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {product.substrates.map((sub, i) => (
                    <span
                      key={i}
                      className="bg-muted px-2 py-0.5 rounded-md text-xs font-semibold text-foreground"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {product.tdsUrl && (
            <a
              href={product.tdsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline pt-1"
            >
              <FileText className="size-4" />
              <span>הורד דף מידע טכני רשמי (TDS / PDF)</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {/* Mandatory Companion Products */}
        {product.companions?.length > 0 && (
          <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Layers className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-base">מוצרים משלימים מחייבים</h3>
                <p className="text-xs text-muted-foreground">
                  מוצרים הנדרשים לביצוע לפי התקן של ח. סבן
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {product.companions.map((companion, idx) => (
                <div key={idx} className="rounded-2xl border bg-muted/40 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{companion.name}</span>
                    {companion.sku && (
                      <Link
                        to="/product/$sku"
                        params={{ sku: companion.sku }}
                        className="text-[11px] font-mono text-primary font-bold hover:underline"
                      >
                        מק״ט {companion.sku}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{companion.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Noa AI Chat */}
      <NoaChat product={product} screenId="product_page" />

      {/* Bottom Sticky Action Bar */}
      <nav
        aria-label="פעולות סגירת הזמנה וצלצול"
        className="fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          {/* Quick Desk Chime */}
          <button
            type="button"
            onClick={() => handleRingChime("counter_ring")}
            className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 shrink-0 shadow-xs transition-transform active:scale-95"
            title="צלצל פעמון לדלפק"
          >
            <Bell className="size-5.5" />
          </button>

          {/* Dual Sync Dispatch to Counter & Sheet */}
          <Button
            onClick={handleDispatch}
            disabled={isDispatched}
            className="flex-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center justify-center gap-2"
          >
            {isDispatched ? (
              <>
                <CheckCircle2 className="size-5 text-emerald-400" />
                <span>שודר וסונכרן לגליון! ☁️</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>הזמן לדלפק וסנכרן ({calculation.unitsNeeded} יח׳)</span>
              </>
            )}
          </Button>

          {/* Direct WhatsApp */}
          <a
            href={whatsappLink(
              `שלום, אני באפליקציית PWA של ח. סבן וסרקתי את המוצר ${product.name} (מק״ט ${product.sku}). מעוניין בהצעת מחיר עבור ${calculation.unitsNeeded} ${product.unitLabel} לפרויקט.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shrink-0 shadow-xs transition-transform active:scale-95"
            title="שיחה מהירה בוואטסאפ מול המוקד"
          >
            <MessageCircle className="size-6" />
          </a>
        </div>
      </nav>

      {/* Device Memory Drawer */}
      <DeviceMemoryDrawer
        isOpen={isMemoryDrawerOpen}
        onClose={() => setIsMemoryDrawerOpen(false)}
      />
    </div>
  );
}
