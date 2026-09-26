import React from "react";

interface NoaAvatarProps {
  className?: string;
  size?: number | string;
  showOnlineStatus?: boolean;
}

export const NoaAvatar: React.FC<NoaAvatarProps> = ({
  className = "",
  size = 56,
  showOnlineStatus = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    >
      {/* SVG Ultra-Sharp Branded Portrait of Noa */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full rounded-full shadow-inner"
      >
        <defs>
          <linearGradient
            id="bgGrad"
            x1="0"
            y1="0"
            x2="120"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0B1320" />
            <stop offset="0.6" stopColor="#1E293B" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient
            id="uniformGrad"
            x1="20"
            y1="90"
            x2="100"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F97316" />
            <stop offset="0.8" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient
            id="skinGrad"
            x1="60"
            y1="25"
            x2="60"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FED7AA" />
            <stop offset="1" stopColor="#FDBA74" />
          </linearGradient>
          <linearGradient
            id="hairGrad"
            x1="25"
            y1="15"
            x2="95"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#451A03" />
            <stop offset="0.7" stopColor="#78350F" />
            <stop offset="1" stopColor="#292524" />
          </linearGradient>
          <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#F97316" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Backdrop circle with deep navy glow */}
        <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" stroke="#F97316" strokeWidth="2.5" />

        {/* Ambient Warm Halo */}
        <circle cx="60" cy="50" r="42" fill="#F97316" fillOpacity="0.15" />

        {/* Hair Back Volume */}
        <path
          d="M32 46C32 24 44 14 60 14C76 14 88 24 88 46C88 64 86 86 86 86C86 86 78 78 60 78C42 78 34 86 34 86C34 86 32 64 32 46Z"
          fill="url(#hairGrad)"
        />

        {/* Torso / Branded Uniform */}
        <path d="M26 120C26 98 42 88 60 88C78 88 94 98 94 120H26Z" fill="url(#uniformGrad)" />
        {/* Navy Collars */}
        <path d="M46 88L60 102L52 120H40L46 88Z" fill="#0B1320" />
        <path d="M74 88L60 102L68 120H80L74 88Z" fill="#0B1320" />
        {/* Saban Badge */}
        <rect
          x="70"
          y="98"
          width="14"
          height="8"
          rx="2"
          fill="#FFFFFF"
          stroke="#0B1320"
          strokeWidth="0.8"
        />
        <text
          x="77"
          y="104.5"
          fontSize="4.5"
          fontWeight="900"
          textAnchor="middle"
          fill="#EA580C"
          fontFamily="sans-serif"
        >
          סבן
        </text>

        {/* Neck */}
        <path d="M52 74H68V88C68 93 52 93 52 88V74Z" fill="url(#skinGrad)" />

        {/* Face */}
        <path
          d="M38 46C38 32 46 25 60 25C74 25 82 32 82 46C82 62 72 75 60 75C48 75 38 62 38 46Z"
          fill="url(#skinGrad)"
        />

        {/* Hair Front Stylized Strands */}
        <path
          d="M38 38C44 26 56 22 68 26C78 30 82 40 82 42C80 34 72 28 60 28C48 28 42 34 38 38Z"
          fill="#451A03"
        />
        <path
          d="M36 44C36 44 42 32 58 32C70 32 82 38 82 48C84 40 76 30 60 30C46 30 38 38 36 44Z"
          fill="#78350F"
        />

        {/* Eyes (Friendly & Sharp) */}
        <ellipse cx="49" cy="48" rx="3" ry="3.5" fill="#1E293B" />
        <circle cx="48" cy="47" r="1.2" fill="#FFFFFF" />
        <ellipse cx="71" cy="48" rx="3" ry="3.5" fill="#1E293B" />
        <circle cx="70" cy="47" r="1.2" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path
          d="M45 42C48 40.5 53 41 54 42.5"
          stroke="#451A03"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M75 42C72 40.5 67 41 66 42.5"
          stroke="#451A03"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Nose */}
        <path
          d="M59 49V55C59 56.5 61 56.5 61 55"
          stroke="#EA580C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />

        {/* Warm Smiling Mouth */}
        <path
          d="M51 60C54 65 66 65 69 60"
          stroke="#991B1B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="#FFFFFF"
        />

        {/* Headset Mic (Customer Advisor Style) */}
        <path
          d="M35 44C33 34 42 22 60 22C78 22 87 34 85 44"
          stroke="#CBD5E1"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Headset earpiece */}
        <rect
          x="32"
          y="42"
          width="6"
          height="12"
          rx="3"
          fill="#0B1320"
          stroke="#F97316"
          strokeWidth="1"
        />
        {/* Headset boom mic */}
        <path
          d="M35 52C35 62 45 66 54 65"
          stroke="#0B1320"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="55" cy="65" r="2.2" fill="#F97316" />
      </svg>

      {/* Online Status Indicator */}
      {showOnlineStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-[#0B1320] shadow-sm animate-pulse"
          style={{
            width: typeof size === "number" ? Math.max(10, size * 0.22) : "12px",
            height: typeof size === "number" ? Math.max(10, size * 0.22) : "12px",
          }}
          title="נועה מחוברת ומלווה את הדלפק בזמן אמת"
        />
      )}
    </div>
  );
};
