import React, { useEffect, useRef, useState } from "react";
import { LobbyVideoItem, VideoLibrarySettings } from "../../types/video";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Tv,
  Clock,
  Sparkles,
  Layers,
  CloudDownload,
} from "lucide-react";

interface FullScreenVideoPlayerProps {
  video: LobbyVideoItem;
  settings: VideoLibrarySettings;
  onFinished: () => void;
  onClose?: () => void;
  isManualPreview?: boolean;
}

export const FullScreenVideoPlayer: React.FC<FullScreenVideoPlayerProps> = ({
  video,
  settings,
  onFinished,
  onClose,
  isManualPreview = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(settings.videoAudioMuted);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const defaultDuration = settings.adDurationSeconds || video.durationSec || 12;
  const [duration, setDuration] = useState<number>(defaultDuration);
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    // If Google Drive stream URL is provided, try that first; else use videoSrc
    if (video.driveFileId && video.sourceType === "drive") {
      return `https://lh3.googleusercontent.com/d/${video.driveFileId}`;
    }
    return video.videoSrc;
  });
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Fallback safety timer: guarantees returning to products even if browser blocks video entirely
  useEffect(() => {
    const maxSafetyTimeout = (duration + 3) * 1000;
    const safetyTimer = setTimeout(() => {
      onFinished();
    }, maxSafetyTimeout);

    return () => clearTimeout(safetyTimer);
  }, [duration, onFinished]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = isMuted;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser blocked unmuted autoplay, retry with mute
          el.muted = true;
          setIsMuted(true);
          el.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    }

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };

    const onEnded = () => {
      if (settings.autoSkipWhenEnded) {
        onFinished();
      } else {
        setIsPlaying(false);
      }
    };

    const onError = () => {
      // If primary video source (e.g. Drive) fails, fallback to local file
      if (!isFallbackMode && (video.fallbackSrc || video.videoSrc !== videoSrc)) {
        setIsFallbackMode(true);
        setVideoSrc(video.fallbackSrc || video.videoSrc);
      } else {
        setHasError(true);
        // Fallback return after 3 seconds
        const t = setTimeout(() => {
          onFinished();
        }, 3000);
        return () => clearTimeout(t);
      }
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [
    videoSrc,
    settings.autoSkipWhenEnded,
    onFinished,
    isMuted,
    isFallbackMode,
    video.fallbackSrc,
    video.videoSrc,
  ]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const secondsLeft = Math.max(0, Math.ceil(duration - currentTime));

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 w-screen h-screen bg-[#0B1320] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Background Video Stage with Ken Burns / Hardware Acceleration */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#0B1320] overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={video.posterSrc}
          playsInline
          autoPlay
          muted={isMuted}
          className={`w-full h-full transform scale-102 transition-transform duration-1000 ease-out ${
            settings.aspectMode === "contain" ? "object-contain" : "object-cover"
          }`}
        />

        {/* Ambient Dark Navy & Warning Orange Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/95 via-transparent to-[#0B1320]/75 pointer-events-none" />
        <div className="absolute top-0 right-0 size-96 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Header Overlay: Saban TV & Exit */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between bg-gradient-to-b from-[#0B1320]/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97316] to-[#EA580C] text-[#0B1320] font-black text-xl shadow-lg border border-[#F97316]/40">
            ח.ס
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white drop-shadow-md">
                ח. סבן חומרי בניין (1994) בע״מ
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316] text-[#0B1320] px-3 py-0.5 text-xs font-black shadow-xs">
                <Sparkles className="size-3" />
                מעברון תדמית וסרטוני שטח
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium drop-shadow-xs">
              {video.branch} • שילוט מסכים דיגיטלי
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-md"
            title={isMuted ? "הפעל סאונד" : "השתק סאונד"}
          >
            {isMuted ? (
              <>
                <VolumeX className="size-4 text-[#F97316]" />
                <span>מושתק</span>
              </>
            ) : (
              <>
                <Volume2 className="size-4 text-emerald-400" />
                <span>סאונד פעיל</span>
              </>
            )}
          </button>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center size-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-md"
            title={isPlaying ? "השהה" : "הפעל"}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white" />}
          </button>

          {/* Skip Button: Return to Product Slides */}
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else onFinished();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#F97316] hover:bg-[#EA580C] text-[#0B1320] transition-transform active:scale-95 shadow-lg"
          >
            <span>דלג לקטלוג</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Center Floating Prompt (if paused) */}
      {!isPlaying && (
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center p-6">
          <button
            type="button"
            onClick={togglePlay}
            className="size-20 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-[#0B1320] flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 mb-4"
          >
            <Play className="size-10 fill-[#0B1320] mr-1" />
          </button>
          <span className="text-sm font-bold bg-[#0B1320]/90 px-4 py-1.5 rounded-xl border border-slate-700">
            הקש להמשך ניגון
          </span>
        </div>
      )}

      {/* Interstitial Ad Countdown Banner & Bottom Information Panel */}
      <footer className="relative z-10 w-full px-8 py-5 bg-gradient-to-t from-[#0B1320] via-[#0B1320]/85 to-transparent space-y-3">
        {/* Dynamic Countdown Ribbon ("חוזרים למוצרים בעוד X שניות...") */}
        <div className="flex items-center justify-between gap-4 bg-[#0B1320]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 px-5 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-[#F97316]" />
            </span>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#F97316]" />
              <span className="text-sm font-black text-white">
                חוזרים לקטלוג המוצרים בעוד{" "}
                <span className="text-[#F97316] font-mono text-base">{secondsLeft}</span> שניות...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span>מקור סרטון: {isFallbackMode ? "גיבוי מקומי" : "Google Drive"}</span>
            <button
              type="button"
              onClick={onFinished}
              className="text-white hover:text-[#F97316] underline underline-offset-4 font-bold text-xs"
            >
              המשך עכשיו &larr;
            </button>
          </div>
        </div>

        {/* Top Progress Line */}
        <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden backdrop-blur-xs">
          <div
            className="h-full bg-gradient-to-r from-[#F97316] via-amber-400 to-[#EA580C] transition-all duration-100 ease-linear shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Video Metadata Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30 px-2.5 py-0.5 text-xs font-bold">
                {video.category}
              </span>
              <h3 className="text-2xl font-black text-white drop-shadow-md">{video.title}</h3>
            </div>
            <p className="text-sm text-slate-300 font-medium">{video.subtitle}</p>
          </div>

          {/* Time Countdown Notice */}
          <div className="flex items-center gap-3">
            <div className="text-left font-mono bg-[#0B1320] border border-slate-700/80 rounded-xl px-3.5 py-1.5 shadow-md">
              <span className="text-xs text-slate-400 block font-sans">זמן נותר:</span>
              <span className="text-sm font-black text-[#F97316]">
                00:{secondsLeft.toString().padStart(2, "0")} / 00:
                {Math.ceil(duration).toString().padStart(2, "0")}
              </span>
            </div>

            <div className="text-xs text-slate-400 hidden sm:block max-w-[200px] text-right font-medium">
              ח. סבן (1994) בע״מ • סניף החרש 4 וסניף התלמיד 6 הוד השרון
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
