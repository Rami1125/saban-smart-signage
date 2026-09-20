import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  MessageCircle,
  Package,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NoaChat } from "@/components/noa/NoaChat";
import { Button } from "@/components/ui/button";
import { dispatchToCounter, whatsappLink } from "@/lib/counter-dispatch";
import { effectivePrice, findProduct, MASTER_PRODUCTS, type Product } from "@/lib/products";

export const Route = createFileRoute("/product/$sku")({
  component: ProductPage,
});

function ProductPage() {
  const params = Route.useParams();
  const rawSku = params.sku;
  const navigate = useNavigate();

  // Find product by SKU with fallback to master product #0 so it never 404s
  const product: Product = useMemo(() => {
    return findProduct(MASTER_PRODUCTS, rawSku) ?? MASTER_PRODUCTS[0]!;
  }, [rawSku]);

  // Calculator state
  const [areaM2, setAreaM2] = useState<number>(20);
  const [wastePercent, setWastePercent] = useState<number>(10);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  // Calculation results
  const calculation = useMemo(() => {
    const coverage = product.coveragePerUnitM2 || 1;
    const effectiveArea = areaM2 * (1 + wastePercent / 100);
    const unitsNeeded = Math.ceil(effectiveArea / coverage);
    const unitPrice = effectivePrice(product);
    const estimatedCost = unitsNeeded * unitPrice;
    const palletsNeeded = product.unitsPerPallet
      ? Math.ceil(unitsNeeded / product.unitsPerPallet)
      : null;

    return {
      effectiveArea: Math.round(effectiveArea * 10) / 10,
      unitsNeeded,
      estimatedCost: Math.round(estimatedCost * 10) / 10,
      palletsNeeded,
    };
  }, [areaM2, wastePercent, product]);

  const handleDispatch = () => {
    const unitPrice = effectivePrice(product);
    dispatchToCounter({
      sku: product.sku,
      productName: product.name,
      quantity: calculation.unitsNeeded,
      unitLabel: product.unitLabel,
      estimatedCost: calculation.estimatedCost,
      source: "mobile_qr_scanner",
      screenId: "lobby_qr",
      note: `חישוב לפי שטח: ${areaM2} מ״ר (כולל ${wastePercent}% פחת). יחידה: ${unitPrice} ₪`,
    });
    setIsDispatched(true);
    toast.success("ההזמנה שודרה בהצלחה לדלפק המכירות!", {
      description: `${calculation.unitsNeeded} ${product.unitLabel} — מחכים לך בדלפק`,
    });
    setTimeout(() => setIsDispatched(false), 5000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — ח. סבן`,
          text: `מפרט טכני ומחיר ל${product.name} (מק״ט ${product.sku}) בח. סבן חומרי בניין`,
          url: window.location.href,
        });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.info("קישור הועתק ללוח!");
    }
  };

  const currentPrice = effectivePrice(product);
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground pb-32 selection:bg-primary/30"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              title="חזרה למסך שילוט"
            >
              <ArrowRight className="size-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  ח. סבן 1994
                </span>
                <span className="text-xs font-medium text-muted-foreground">מפרט רשמי מאושר</span>
              </div>
              <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">
                {product.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex size-9 items-center justify-center rounded-xl border border-input bg-card text-muted-foreground hover:text-foreground transition-colors"
              title="שתף דף מוצר"
            >
              <Share2 className="size-4" />
            </button>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              <Store className="size-3.5" />
              <span>מסך לובי</span>
            </Link>
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
                <div className="text-2xl font-black text-foreground">
                  ₪{currentPrice}
                  <span className="text-xs font-normal text-muted-foreground mr-1">
                    /{product.unitLabel}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="text-xs text-muted-foreground line-through">
                    מחירון: ₪{product.price}
                  </div>
                )}
                {product.unitWeight && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {product.unitWeight}
                  </div>
                )}
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
          </div>
        </div>

        {/* Interactive m² Calculator */}
        <div className="rounded-3xl border bg-card p-5 shadow-xs space-y-4">
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
              <span className="text-muted-foreground">עלות מוערכת (לפני מע״מ):</span>
              <span className="font-bold text-foreground">
                ₪{calculation.estimatedCost.toLocaleString()}
              </span>
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

            <Button
              onClick={handleDispatch}
              className="w-full h-11 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              <span>
                שדר {calculation.unitsNeeded} {product.unitLabel} לדלפק המכירות
              </span>
            </Button>
          </div>
        </div>

        {/* Video Tutorial Embed (if available) */}
        {product.mediaUrl && (
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
                src={product.mediaUrl}
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
        aria-label="פעולות סגירת הזמנה"
        className="fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2.5">
          <Button
            onClick={handleDispatch}
            disabled={isDispatched}
            className="flex-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center justify-center gap-2"
          >
            {isDispatched ? (
              <>
                <CheckCircle2 className="size-5 text-success" />
                <span>שודר לדלפק!</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>הזמן לדלפק ({calculation.unitsNeeded} יח׳)</span>
              </>
            )}
          </Button>

          <a
            href={whatsappLink(
              `שלום, אני באתר של סבן וסרקתי את המוצר ${product.name} (מק״ט ${product.sku}). מעוניין בהצעת מחיר עבור ${calculation.unitsNeeded} ${product.unitLabel} לפרויקט.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-12 items-center justify-center rounded-2xl bg-success text-success-foreground hover:bg-success/90 shrink-0 shadow-xs transition-transform active:scale-95"
            title="שיחה מהירה בוואטסאפ מול המוקד"
          >
            <MessageCircle className="size-6" />
          </a>
        </div>
      </nav>
    </div>
  );
}
