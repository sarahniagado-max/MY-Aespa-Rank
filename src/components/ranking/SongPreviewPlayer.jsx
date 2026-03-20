import React, { useEffect, useRef, useState, useMemo } from "react";
import { Play, Square } from "lucide-react";
import { extractYtId } from "./useSongs";
import { getSongColor } from "./colorUtils";

// Global audio state — only one preview plays at a time
let currentStopFn = null;

export function stopAllPreviews() {
  if (currentStopFn) {
    currentStopFn();
    currentStopFn = null;
  }
}

const PLAY_COUNT_KEY = "aespa_preview_counts";
function getPlayCounts() {
  try { return JSON.parse(localStorage.getItem(PLAY_COUNT_KEY) || "{}"); } catch { return {}; }
}
function incrementPlayCount(title) {
  const counts = getPlayCounts();
  counts[title] = (counts[title] || 0) + 1;
  localStorage.setItem(PLAY_COUNT_KEY, JSON.stringify(counts));
}
export function getPlayCount(title) { return getPlayCounts()[title] || 0; }
export function getAllPlayCounts() { return getPlayCounts(); }

// SVG sweep ring — draws a rounded-rect stroke outside the pill, sweeping clockwise
function SweepBorder({ progress, color, pillRef }) {
  const [dims, setDims] = useState(null);
  const PAD = 3;    // px gap outside pill
  const SW = 2.5;   // stroke width

  useEffect(() => {
    if (!pillRef.current) return;
    const update = () => {
      const r = pillRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(pillRef.current);
    return () => ro.disconnect();
  }, [pillRef]);

  if (!dims || progress <= 0) return null;

  // SVG canvas is pill size + PAD on all sides + half stroke-width extra
  const extra = PAD + SW / 2;
  const svgW = dims.w + extra * 2;
  const svgH = dims.h + extra * 2;

  // The rounded rect we draw
  const rx = (dims.h / 2) + PAD; // pill corner radius + offset
  const rectX = extra - SW / 2;
  const rectY = extra - SW / 2;
  const rectW = dims.w + SW;
  const rectH = dims.h + SW;

  // Perimeter = 2 * straight segments + full circle circumference
  // straight segments: max(0, w - 2*rx) for top+bottom, max(0, h - 2*rx) for left+right
  const straightH = Math.max(0, rectH - 2 * rx);
  const straightW = Math.max(0, rectW - 2 * rx);
  const perim = 2 * straightW + 2 * straightH + 2 * Math.PI * rx;
  const dashLen = perim * Math.min(progress, 1);

  return (
    <svg
      style={{
        position: 'absolute',
        left: -(extra),
        top: -(extra),
        width: svgW,
        height: svgH,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
        // Rotate -90deg so the sweep starts from the top-center (12 o'clock)
        transformOrigin: `${svgW / 2}px ${svgH / 2}px`,
        transform: 'rotate(-90deg)',
      }}
    >
      <rect
        x={rectX}
        y={rectY}
        width={rectW}
        height={rectH}
        rx={rx}
        ry={rx}
        fill="none"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeOpacity={0.85}
        strokeDasharray={`${dashLen} ${perim}`}
        strokeDashoffset={0}
      />
    </svg>
  );
}

// Compute mirror color using getSongColor: song at index i gets color of song at (n-1-i)
function getMirrorColor(colorArray, songIndex, totalInAlbum) {
  if (!colorArray || colorArray.length === 0) return '#a78bfa';
  const mirrorIdx = Math.max(0, (totalInAlbum - 1 - songIndex) % Math.max(1, totalInAlbum));
  return getSongColor(colorArray, mirrorIdx, totalInAlbum);
}

export default function SongPreviewPlayer({
  songTitle,
  songData,
  compact = false,
  autoplay = false,
  onEnded,
  lightstickColor,
  songColor,
  songIndex,      // index of this song within its album (0-based)
  totalInAlbum,   // total songs in this album
}) {
  const colorArray = React.useMemo(() => {
    const raw = lightstickColor || songData?.lightstick_color || null;
    if (!raw) return null;
    const arr = raw.split(',').map(c => c.trim()).filter(c => /^#[0-9A-Fa-f]{6}$/.test(c));
    return arr.length > 0 ? arr : null;
  }, [lightstickColor, songData?.lightstick_color]);

  // Mirror color for sweep border
  const sweepColor = React.useMemo(() => {
    const idx = songIndex ?? 0;
    const total = totalInAlbum ?? (colorArray?.length ?? 1);
    return getMirrorColor(colorArray, idx, total);
  }, [colorArray, songIndex, totalInAlbum]);

  // Base color for the pill (first album color or songColor)
  const lsColor = songColor || (colorArray ? colorArray[0] : null) || null;

  const rgbStr = React.useMemo(() => {
    if (!lsColor) return null;
    const m = lsColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return `${m[1]},${m[2]},${m[3]}`;
    const hm = lsColor.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
    if (hm) return `${parseInt(hm[1],16)},${parseInt(hm[2],16)},${parseInt(hm[3],16)}`;
    return null;
  }, [lsColor]);

  const rgba = (a) => rgbStr ? `rgba(${rgbStr},${a})` : `rgba(167,139,250,${a})`;

  const safeId = React.useMemo(() => songTitle.replace(/[^a-zA-Z0-9]/g, '_'), [songTitle]);

  const iframeRef = useRef(null);
  const pillRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [fading, setFading] = useState(false);
  const [playCount, setPlayCount] = useState(() => getPlayCount(songTitle));
  const [sweepProgress, setSweepProgress] = useState(0);
  const stopRef = useRef(null);
  const fadeTimer = useRef(null);
  const halfTimer = useRef(null);
  const fadeIntervalRef = useRef(null);
  const didCountRef = useRef(false);
  const playingRef = useRef(false);
  const sweepRafRef = useRef(null);
  const sweepStartRef = useRef(null);
  const sweepDurationRef = useRef(0);

  const song = songData || null;
  const ytId = extractYtId(song?.youtube_url) || song?.yt_id || null;

  const sendVolume = (vol) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(vol)] }), '*'
      );
    } catch (_) {}
  };

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
  };

  const clearSweepRaf = () => {
    if (sweepRafRef.current) { cancelAnimationFrame(sweepRafRef.current); sweepRafRef.current = null; }
  };

  const startSweep = (duration) => {
    sweepDurationRef.current = duration;
    sweepStartRef.current = Date.now();
    setSweepProgress(0);
    const tick = () => {
      const elapsed = Date.now() - sweepStartRef.current;
      const p = Math.min(1, elapsed / sweepDurationRef.current);
      setSweepProgress(p);
      if (p < 1 && playingRef.current) {
        sweepRafRef.current = requestAnimationFrame(tick);
      }
    };
    sweepRafRef.current = requestAnimationFrame(tick);
  };

  const stop = (instant = false) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (halfTimer.current) clearTimeout(halfTimer.current);
    clearFadeInterval();
    clearSweepRaf();
    setSweepProgress(0);
    didCountRef.current = false;
    playingRef.current = false;

    if (!instant) {
      setFading(true);
      let vol = 100;
      fadeIntervalRef.current = setInterval(() => {
        vol = Math.max(0, vol - 5);
        sendVolume(vol);
        if (vol <= 0) {
          clearFadeInterval();
          if (iframeRef.current) iframeRef.current.src = "";
          setPlaying(false);
          setFading(false);
          if (onEnded) onEnded();
        }
      }, 75);
    } else {
      if (iframeRef.current) iframeRef.current.src = "";
      setPlaying(false);
      setFading(false);
      if (onEnded) onEnded();
    }
  };

  stopRef.current = stop;

  const buildSrc = () => {
    if (!ytId) return null;
    const start = song?.preview_start ?? song?.yt_start ?? 0;
    const end = song?.preview_end ?? song?.yt_end ?? null;
    let src = `https://www.youtube.com/embed/${ytId}?autoplay=1&start=${start}&mute=0&controls=0&loop=0&modestbranding=1&rel=0&enablejsapi=1`;
    if (end) src += `&end=${end}`;
    return src;
  };

  const handlePlay = () => {
    if (playing || fading) { stop(true); return; }
    stopAllPreviews();
    currentStopFn = () => stopRef.current && stopRef.current(true);

    didCountRef.current = false;
    playingRef.current = true;
    setPlaying(true);
    setFading(false);

    if (iframeRef.current) {
      iframeRef.current.src = buildSrc();
    }

    const start = song?.preview_start ?? song?.yt_start ?? 0;
    const end = song?.preview_end ?? song?.yt_end ?? (song?.yt_shorts ? 30 : 45);
    const duration = Math.max(5, end - start) * 1000;

    startSweep(duration);

    fadeTimer.current = setTimeout(() => {
      if (stopRef.current) stopRef.current(false);
    }, duration - 1500);

    halfTimer.current = setTimeout(() => {
      if (!didCountRef.current) {
        didCountRef.current = true;
        incrementPlayCount(songTitle);
        setPlayCount(getPlayCount(songTitle));
      }
    }, duration * 0.33);
  };

  useEffect(() => {
    if (autoplay) handlePlay();
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      if (halfTimer.current) clearTimeout(halfTimer.current);
      clearFadeInterval();
      clearSweepRaf();
      if (iframeRef.current) iframeRef.current.src = "";
      playingRef.current = false;
    };
  // eslint-disable-next-line
  }, [autoplay]);

  if (!ytId) return null;

  return (
    <div className="relative flex flex-col items-center" style={{ zIndex: 2, isolation: 'isolate' }}>
      <style>{`
        @keyframes pill-glow-${safeId} {
          0%, 100% { box-shadow: 0 0 4px ${rgba(0.25)}; }
          50%       { box-shadow: 0 0 10px ${rgba(0.55)}, 0 0 18px ${rgba(0.2)}; }
        }
        .pill-idle-${safeId} {
          border: 1.5px solid ${rgba(0.4)};
          background: #080808;
          color: ${rgba(0.85)};
          transition: all 0.25s ease;
          animation: pill-glow-${safeId} 3s ease-in-out infinite;
        }
        .pill-idle-${safeId}:hover {
          box-shadow: 0 0 14px ${rgba(0.45)};
          border-color: ${rgba(0.7)};
          color: ${rgba(1)};
        }
        .pill-playing-${safeId} {
          background: ${rgba(0.18)};
          border: 1.5px solid ${rgba(0.5)};
          color: #fff;
          box-shadow: 0 0 14px ${rgba(0.4)};
          transition: all 0.25s ease;
        }
      `}</style>
      <div className="relative" ref={pillRef} style={{ display: 'inline-flex' }}>
        <SweepBorder progress={sweepProgress} color={sweepColor} pillRef={pillRef} />
        <button
          onClick={handlePlay}
          className={`${playing ? `pill-playing-${safeId}` : `pill-idle-${safeId}`} flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider outline-none focus:outline-none ${
            compact ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"
          }`}
          title={playCount > 0 ? `Played ${playCount}×` : "Preview"}
        >
          {playing ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
          {playing ? "Stop" : "Preview"}
          {playCount > 0 && (
            <span className="font-mono text-[8px] ml-0.5" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>{playCount}×</span>
          )}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src=""
        allow="autoplay"
        className="w-0 h-0 pointer-events-none absolute opacity-0 overflow-hidden left-0 top-0 border-0"
        title={`preview-${songTitle}`}
        style={{ display: 'none' }}
      />
    </div>
  );
}