import React from "react";

interface SabanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export const SabanLogo: React.FC<SabanLogoProps> = ({
  className = "",
  size = "md",
  showTagline = true,
}) => {
  const iconSizes = {
    sm: "size-9 text-base",
    md: "size-11 text-xl",
    lg: "size-14 text-2xl",
    xl: "size-16 text-3xl",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  };

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Sleek Architectural Geometric Icon Badge */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97316] via-[#EA580C] to-[#C2410C] text-[#0B1320] font-black shadow-lg border border-[#F97316]/50 shrink-0 ${iconSizes[size]}`}
      >
        {/* Subtle inner grid lines mimicking building scaffolding */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-25 pointer-events-none" />
        <span className="relative z-10 tracking-tighter drop-shadow-xs font-black">ח.ס</span>
        {/* Established marker */}
        <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-[#0B1320] text-[#F97316] px-1 rounded-sm border border-[#F97316]/40">
          94
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className={`font-black tracking-tight text-white leading-none ${titleSizes[size]}`}>
            ח. סבן חומרי בניין (1994) בע״מ
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#F97316]/15 border border-[#F97316]/40 px-2 py-0.5 text-[10px] font-black text-[#F97316]">
            PRO KIOSK 4K
          </span>
        </div>

        {showTagline && (
          <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
            הוד השרון • סניף החרש 4 (מגרש ראשי) | סניף התלמיד 6 (גבס וצבע)
          </p>
        )}
      </div>
    </div>
  );
};
