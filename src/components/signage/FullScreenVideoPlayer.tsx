import React, { useEffect, useRef, useState } from "react";
import { LobbyVideoItem, VideoLibrarySettings } from "../../types/video";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Sparkles,
  Tv,
  ArrowRight,
  Maximize2,
  CheckCircle2,
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
  const [duration, setDuration] = useState<number>(video.durationSec || 7);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = isMuted;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(() => {
          // If browser blocked unmuted autoplay, retry with mute
          el.muted = true;
          setIsMuted(true);
          el.play()
            .then(() => {
              setIsPlaying(true);
              setHasStarted(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
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
      setVideoError(true);
      // Fallback timer if video cannot load
      const t = setTimeout(() => {
        onFinished();
      }, 5000);
      return () => clearTimeout(t);
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [video.videoSrc, settings.autoSkipWhenEnded, onFinished, isMuted]);

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
      className="fixed inset-0 z-50 w-screen h-screen bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Background Video Element */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={video.videoSrc}
          poster={video.posterSrc}
          playsInline
          autoPlay
          muted={isMuted}
          className={`w-full h-full ${
            settings.aspectMode === "contain" ? "object-contain" : "object-cover"
          }`}
        />
        {/* Subtle cinematic vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/70 pointer-events-none" />
      </div>

      {/* Top Header Overlay: Saban TV & Exit */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-lg border border-amber-400">
            ח.ס
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white drop-shadow-md">
                ח. סבן חומרי בניין (1994) בע״מ
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-slate-950 px-3 py-0.5 text-xs font-black shadow-xs">
                <Sparkles className="size-3" />
                שידור וידאו תדמיתי
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium drop-shadow-xs">
              {video.branch} • שילוט מסכים לובי מרכזי
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all shadow-md"
            title={isMuted ? "הפעל סאונד" : "השתק סאונד"}
          >
            {isMuted ? (
              <>
                <VolumeX className="size-4 text-amber-400" />
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
            className="flex items-center justify-center size-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all shadow-md"
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-transform active:scale-95 shadow-lg"
          >
            <span>דלג לקטלוג מוצרים</span>
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
            className="size-20 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 mb-4"
          >
            <Play className="size-10 fill-slate-950 mr-1" />
          </button>
          <span className="text-sm font-bold bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-700">
            הקש להמשך ניגון
          </span>
        </div>
      )}

      {/* Bottom Information Panel & Progress Bar */}
      <footer className="relative z-10 w-full px-8 py-5 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent space-y-3">
        {/* Top Progress Line */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xs">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Video Metadata Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold">
                {video.category}
              </span>
              <h3 className="text-2xl font-black text-white drop-shadow-md">
                {video.title}
              </h3>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              {video.subtitle}
            </p>
          </div>

          {/* Time Countdown & Return Notice */}
          <div className="flex items-center gap-3">
            <div className="text-left font-mono bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-1.5 shadow-md">
              <span className="text-xs text-slate-400 block font-sans">זמן נותר:</span>
              <span className="text-sm font-black text-amber-400">
                00:0{secondsLeft} / 00:0{Math.ceil(duration)}
              </span>
            </div>

            <div className="text-xs text-slate-400 hidden sm:block max-w-[200px] text-right font-medium">
              חזרה אוטומטית לקטלוג מוצרי סבן עם סיום הסרטון
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
