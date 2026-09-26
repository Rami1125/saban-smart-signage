import { useState, useEffect } from "react";

export type DisplayType =
  "ultrawide_21_9" | "tv_16_9" | "kiosk_portrait" | "pos_tablet" | "desktop";

export interface ScreenDimensions {
  width: number;
  height: number;
  aspectRatio: number; // width / height
  aspectRatioLabel: string; // "21:9", "16:9", "9:16", etc.
  displayType: DisplayType;
  orientation: "landscape" | "portrait";
  isUltraWide: boolean; // ratio >= 2.1 (e.g. 21:9, 32:9)
  is4K: boolean; // width >= 3840 or height >= 2160
  scaleFactor: number; // 1.0 at 1920x1080 baseline, scales smoothly on 4K/wide
  isTouchDevice: boolean;
  viewingDistancePreset: "near" | "medium" | "far"; // Far for 3-5m showroom readability
}

function getDimensions(): ScreenDimensions {
  if (typeof window === "undefined") {
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 1.777,
      aspectRatioLabel: "16:9",
      displayType: "tv_16_9",
      orientation: "landscape",
      isUltraWide: false,
      is4K: false,
      scaleFactor: 1.0,
      isTouchDevice: false,
      viewingDistancePreset: "far",
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = height > 0 ? width / height : 1.777;
  const orientation = width >= height ? "landscape" : "portrait";
  const isUltraWide = aspectRatio >= 2.1;
  const is4K = width >= 3840 || height >= 2160;

  let aspectRatioLabel = "16:9";
  let displayType: DisplayType = "tv_16_9";

  if (orientation === "portrait") {
    displayType = "kiosk_portrait";
    aspectRatioLabel = aspectRatio <= 0.6 ? "9:16" : "3:4";
  } else if (isUltraWide) {
    displayType = "ultrawide_21_9";
    aspectRatioLabel = aspectRatio >= 3.0 ? "32:9" : "21:9";
  } else if (width < 1200 && height < 900) {
    displayType = "pos_tablet";
    aspectRatioLabel = "4:3";
  } else {
    displayType = "tv_16_9";
    aspectRatioLabel = "16:9";
  }

  // Baseline is 1920 width. Scale smoothly up for 4K / wide displays, minimum 0.8
  const baseScale = Math.max(0.85, Math.min(2.5, width / 1920));
  const scaleFactor = Number(baseScale.toFixed(2));

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const viewingDistancePreset = width >= 1920 || isUltraWide ? "far" : "near";

  return {
    width,
    height,
    aspectRatio,
    aspectRatioLabel,
    displayType,
    orientation,
    isUltraWide,
    is4K,
    scaleFactor,
    isTouchDevice,
    viewingDistancePreset,
  };
}

export function useScreenDimensions(): ScreenDimensions {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(getDimensions);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Debounce resize slightly for performance
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions(getDimensions());
      }, 60);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return dimensions;
}
