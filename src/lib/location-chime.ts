// location-chime.ts
// ח. סבן חומרי בניין (1994) בע״מ
// מנוע צלצול מיקומי וזיהוי סניפים (Web Audio API Synthesizer + Geofencing)

export type BranchId = "haharash" | "hatalmid";

export interface SabanBranch {
  id: BranchId;
  name: string;
  shortName: string;
  warehouseCode: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  description: string;
}

export const SABAN_BRANCHES: Record<BranchId, SabanBranch> = {
  haharash: {
    id: "haharash",
    name: "סניף החרש (מחסן 4 - ראשי)",
    shortName: "החרש (מחסן 4)",
    warehouseCode: "WH4",
    address: "רחוב החרש 8, אזור התעשייה חולון",
    phone: "03-5507000",
    lat: 32.0163,
    lng: 34.7865,
    description: "מרכז אספקה לוגיסטי, מליטה, איטום, בלוקים וחומרי בניין כבדים",
  },
  hatalmid: {
    id: "hatalmid",
    name: "סניף התלמיד (מחסן 1 - אולם תצוגה)",
    shortName: "התלמיד (מחסן 1)",
    warehouseCode: "WH1",
    address: "רחוב התלמיד 4, חולון",
    phone: "03-5507001",
    lat: 32.0125,
    lng: 34.7795,
    description: "אולם תצוגה ראשי, ריצוף, קרמיקה, כלים סניטריים וגמר",
  },
};

// Singleton AudioContext
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("AudioContext could not be initialized:", e);
    return null;
  }
}

/**
 * מנגן צלצול פעמון אקוסטי טהור (ללא תלות בקבצי שמע חיצוניים)
 * @param sound 'arrival' | 'counter_ring' | 'dispatch' | 'detected'
 */
export function playLocationChime(
  sound: "arrival" | "counter_ring" | "dispatch" | "detected" = "counter_ring",
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Haptic feedback on mobile devices
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (sound === "arrival" || sound === "detected") {
        navigator.vibrate([100, 60, 150]);
      } else {
        navigator.vibrate([70, 40, 70]);
      }
    } catch {
      // Ignore vibration errors
    }
  }

  const now = ctx.currentTime;

  if (sound === "counter_ring") {
    // צלצול פעמון דלפק שירות מסורתי (פעמון פליז צלול עם הדהוד)
    const fundamentalFreq = 1174.66; // D6
    const harmonics = [
      { freq: fundamentalFreq, gain: 0.5, decay: 1.8 },
      { freq: fundamentalFreq * 1.5, gain: 0.25, decay: 1.2 },
      { freq: fundamentalFreq * 2.05, gain: 0.2, decay: 0.9 },
      { freq: 2637, gain: 0.15, decay: 0.6 },
    ];

    harmonics.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } else if (sound === "arrival" || sound === "detected") {
    // צלצול כפול של זיהוי הגעה לסניף ("דינג-דונג" מודרני מסביר פנים)
    const tones = [
      { freq: 880, start: 0, duration: 0.9 }, // A5
      { freq: 1174.66, start: 0.22, duration: 1.2 }, // D6
      { freq: 1479.98, start: 0.44, duration: 1.5 }, // F#6
    ];

    tones.forEach(({ freq, start, duration }) => {
      const startTime = now + start;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } else {
    // צלצול שידור הזמנה מוצלחת לדלפק
    const notes = [659.25, 880, 1318.5]; // E5, A5, E6
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }
}

// חישוב מרחק במטרים בין שתי נקודות גיאוגרפיות (Haversine Formula)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface GeolocationResult {
  isSupported: boolean;
  isInsideBranch: boolean;
  nearestBranch: SabanBranch;
  distanceMeters: number;
  accuracyMeters?: number;
  statusText: string;
}

/**
 * בודק מיקום נוכחי מול סניפי ח. סבן
 */
export async function detectBranchProximity(): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return {
      isSupported: false,
      isInsideBranch: false,
      nearestBranch: SABAN_BRANCHES.haharash,
      distanceMeters: 0,
      statusText: "מכשירך אינו תומך בשירותי מיקום GPS",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const distHaharash = calculateDistanceMeters(
          latitude,
          longitude,
          SABAN_BRANCHES.haharash.lat,
          SABAN_BRANCHES.haharash.lng,
        );

        const distHatalmid = calculateDistanceMeters(
          latitude,
          longitude,
          SABAN_BRANCHES.hatalmid.lat,
          SABAN_BRANCHES.hatalmid.lng,
        );

        const isHaharashNearest = distHaharash <= distHatalmid;
        const nearestBranch = isHaharashNearest ? SABAN_BRANCHES.haharash : SABAN_BRANCHES.hatalmid;
        const distanceMeters = isHaharashNearest ? distHaharash : distHatalmid;

        // On-site threshold: 400m
        const isInsideBranch = distanceMeters <= 400;

        let statusText = "";
        if (isInsideBranch) {
          statusText = `הגעת ל${nearestBranch.name}! צלצול מיקומי הופעל לדלפק 🛎️`;
          playLocationChime("arrival");
        } else if (distanceMeters < 1000) {
          statusText = `אתה במרחק ${distanceMeters} מטר מ${nearestBranch.shortName}`;
        } else {
          statusText = `נמצא במרחק ${(distanceMeters / 1000).toFixed(1)} ק״מ מ${nearestBranch.shortName}`;
        }

        resolve({
          isSupported: true,
          isInsideBranch,
          nearestBranch,
          distanceMeters,
          accuracyMeters: accuracy,
          statusText,
        });
      },
      (error) => {
        console.warn("GPS lookup error:", error);
        resolve({
          isSupported: true,
          isInsideBranch: false,
          nearestBranch: SABAN_BRANCHES.haharash,
          distanceMeters: -1,
          statusText: "גישה למיקום נדחתה. ניתן לבחור סניף ידנית.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}
