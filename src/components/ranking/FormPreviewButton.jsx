import React, { useState, useRef, useEffect } from "react";
import { Play, Square } from "lucide-react";

/**
 * FormPreviewButton — plays a YouTube clip from startSec to endSec
 * with a 1.5s volume fade-out at the end.
 * Props: ytId, startSec, endSec (all numbers / "")
 */
export default function FormPreviewButton({ ytId, startSec, endSec }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const stopTimer = useRef(null);
  const fadeTimer = useRef(null);
  const progressInterval = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const startedAt = useRef(null);

  const start = Number(startSec);
  const end = Number(endSec);
  const canPreview =
    ytId &&
    startSec !== "" && startSec !== null && startSec !== undefined &&
    endSec !== "" && endSec !== null && endSec !== undefined &&
    end > start;
  const duration = canPreview ? end - start : 0;

  const cleanup = () => {
    clearTimeout(stopTimer.current);
    clearTimeout(fadeTimer.current);
    clearInterval(progressInterval.current);
    if (playerRef.current) {
      try { playerRef.current.stopVideo(); } catch {}
      playerRef.current = null;
    }
    if (containerRef.current) {
      try { document.body.removeChild(containerRef.current); } catch {}
      containerRef.current = null;
    }
    setPlaying(false);
    setProgress(0);
  };

  useEffect(() => () => cleanup(), []);

  const handlePlay = () => {
    if (playing) { cleanup(); return; }

    setPlaying(true);
    setProgress(0);
    startedAt.current = Date.now();

    // Create off-screen container for the iframe
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:200px;height:150px;";
    const iframeEl = document.createElement("div");
    iframeEl.id = `yt-form-preview-${Date.now()}`;
    container.appendChild(iframeEl);
    document.body.appendChild(container);
    containerRef.current = container;

    const loadPlayer = () => {
      playerRef.current = new window.YT.Player(iframeEl.id, {
        width: 200,
        height: 150,
        videoId: ytId,
        playerVars: {
          autoplay: 1,
          start: Math.floor(start),
          controls: 0,
          rel: 0,
          mute: 0,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(100);
            e.target.playVideo();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      // Load YouTube IFrame API
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          loadPlayer();
        }
      }, 100);
    }

    // Progress bar
    progressInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setProgress(Math.min(elapsed / duration, 1));
    }, 50);

    // Fade-out 1.5s before end
    const fadeDelay = Math.max(0, (duration - 1.5) * 1000);
    fadeTimer.current = setTimeout(() => {
      if (playerRef.current) {
        let vol = 100;
        const fadeStep = setInterval(() => {
          vol -= 100 / (1500 / 50);
          if (vol <= 0) {
            clearInterval(fadeStep);
            return;
          }
          try { playerRef.current.setVolume(Math.max(0, vol)); } catch {}
        }, 50);
      }
    }, fadeDelay);

    // Stop at end
    stopTimer.current = setTimeout(cleanup, duration * 1000);
  };

  if (!canPreview) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handlePlay}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
          playing
            ? "border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-white/15 bg-white/5 text-white/60 hover:border-violet-500/50 hover:text-violet-300"
        }`}
      >
        {playing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        {playing ? "Stop Preview" : `▶ Test Preview (${duration}s)`}
      </button>
      {playing && (
        <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}