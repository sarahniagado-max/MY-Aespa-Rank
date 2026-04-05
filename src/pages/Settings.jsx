import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Smartphone, RotateCcw, MessageSquare, Droplets } from "lucide-react";
import { resetTutorial } from "../components/tutorial/AppTutorial";
import AppTutorial from "../components/tutorial/AppTutorial";
import { AnimatePresence } from "framer-motion";
import { applyAlbumTint, clearAlbumTint, setTintMode, getTintBrightnessMode, setTintBrightnessMode } from "../components/AlbumTintManager";
import { useSongs } from "../components/ranking/useSongs";

const ALBUM_TINT_KEY = "aespa_album_tint_id";

function getBrightestColor(lightstickColorStr) {
  if (!lightstickColorStr) return null;
  const colors = lightstickColorStr.split(",").map(c => c.trim()).filter(c => c.startsWith('#'));
  if (colors.length === 0) return null;
  let best = colors[0];
  let bestLum = -1;
  for (const hex of colors) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) continue;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > bestLum) { bestLum = lum; best = hex; }
  }
  return best;
}

function getColorForMode(album, mode) {
  if (!album?.lightstick_color) return null;
  if (mode === 'auto') return getBrightestColor(album.lightstick_color);
  return album.lightstick_color.split(",")[0].trim();
}

export default function Settings() {
  const [showTutorial, setShowTutorial] = useState(false);
  const { albums: dbAlbums } = useSongs();
  const [selectedTintAlbum, setSelectedTintAlbum] = useState(() => localStorage.getItem(ALBUM_TINT_KEY) || "");
  const [brightnessMode, setBrightnessMode] = useState(() => getTintBrightnessMode());

  // Apply tint on mount from saved preference
  useEffect(() => {
    if (selectedTintAlbum && dbAlbums.length > 0) {
      const album = dbAlbums.find(a => a.id === selectedTintAlbum);
      if (album?.lightstick_color) {
        const color = getColorForMode(album, brightnessMode);
        if (color) applyAlbumTint(color, brightnessMode);
        setTintMode('tint');
      }
    }
  }, [dbAlbums, selectedTintAlbum]);

  const handleTintSelect = (albumId) => {
    if (albumId === selectedTintAlbum) {
      setSelectedTintAlbum("");
      localStorage.removeItem(ALBUM_TINT_KEY);
      clearAlbumTint();
      setTintMode('aurora');
      return;
    }
    setSelectedTintAlbum(albumId);
    localStorage.setItem(ALBUM_TINT_KEY, albumId);
    const album = dbAlbums.find(a => a.id === albumId);
    if (album?.lightstick_color) {
      const color = getColorForMode(album, brightnessMode);
      if (color) applyAlbumTint(color, brightnessMode);
      setTintMode('tint');
    }
  };

  const handleBrightnessMode = (mode) => {
    setBrightnessMode(mode);
    setTintBrightnessMode(mode);
    if (selectedTintAlbum) {
      const album = dbAlbums.find(a => a.id === selectedTintAlbum);
      if (album?.lightstick_color) {
        const color = getColorForMode(album, mode);
        if (color) applyAlbumTint(color, mode);
      }
    }
  };

  const handleReplayWalkthrough = () => {
    resetTutorial();
    setShowTutorial(true);
  };

  const BRIGHTNESS_OPTIONS = [
    { id: 'normal', label: 'Normal', desc: 'First color as-is' },
    { id: 'auto',   label: 'Auto',   desc: 'Brightest color' },
    { id: 'boost',  label: 'Boost',  desc: '1.6× brighter' },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatePresence>
        {showTutorial && <AppTutorial onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">SETTINGS & HELP</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-24 max-w-sm mx-auto space-y-5">

        {/* Replay Walkthrough */}
        <div className="bg-white/5 border border-white/12 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-1">App Walkthrough</h2>
          <p className="text-white/40 text-xs mb-4 leading-relaxed">
            Replay the interactive walkthrough that explains all features of the app. You can always come back here to replay it anytime.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleReplayWalkthrough}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(8,145,178,0.8))", border: "1px solid rgba(167,139,250,0.3)" }}
            >
              <RotateCcw className="w-4 h-4" />
              Replay Main Walkthrough
            </button>
            <Link
              to="/MoodRanking?walkthrough=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(103,232,249,0.2))", border: "1px solid rgba(167,139,250,0.3)" }}
            >
              <RotateCcw className="w-4 h-4" />
              View Mood Ranking Guide
            </Link>
          </div>
        </div>

        {/* Add to Home Screen */}
        <div className="bg-white/5 border border-white/12 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-bold text-sm">Add to Home Screen</h2>
          </div>
          <p className="text-white/40 text-xs mb-5 leading-relaxed">
            Install this app on your device home screen for a native app experience — no app store required.
          </p>

          {/* iOS */}
          <div className="mb-5">
            <p className="text-violet-300 text-[11px] font-bold uppercase tracking-wider mb-2.5">📱 iPhone / iPad (Safari)</p>
            <div className="space-y-2">
              {[
                "Open this website in Safari",
                "Tap the Share button (□ with an arrow pointing up) at the bottom of the screen",
                "Scroll down and tap \"Add to Home Screen\"",
                "Tap \"Add\" in the top-right corner",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-violet-400/80 text-[10px] font-bold w-5 shrink-0 mt-0.5 text-center">{i + 1}.</span>
                  <span className="text-white/60 text-xs leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Android */}
          <div>
            <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-2.5">🤖 Android (Chrome)</p>
            <div className="space-y-2">
              {[
                "Open this website in Chrome",
                "Tap the three-dot menu (⋮) in the top-right corner",
                "Tap \"Add to Home Screen\" or \"Install App\"",
                "Tap \"Add\" to confirm",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-cyan-400/80 text-[10px] font-bold w-5 shrink-0 mt-0.5 text-center">{i + 1}.</span>
                  <span className="text-white/60 text-xs leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Album Tint */}
        <div className="bg-white/5 border border-white/12 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-bold text-sm">App Background Tint</h2>
          </div>
          <p className="text-white/40 text-xs mb-4 leading-relaxed">
            Select an album to apply a subtle color tint to the entire app background. Tap again to remove.
          </p>
          {dbAlbums.length === 0 ? (
            <p className="text-white/20 text-xs">Loading albums…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dbAlbums.filter(a => a.lightstick_color).map(album => {
                const firstColor = album.lightstick_color.split(",")[0].trim();
                const isSelected = selectedTintAlbum === album.id;
                return (
                  <button
                    key={album.id}
                    onClick={() => handleTintSelect(album.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
                    style={{
                      borderColor: isSelected ? firstColor : `${firstColor}44`,
                      backgroundColor: isSelected ? `${firstColor}22` : "transparent",
                      color: isSelected ? firstColor : "rgba(255,255,255,0.45)",
                      boxShadow: isSelected ? `0 0 10px ${firstColor}55` : "none",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: firstColor }}
                    />
                    {album.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Brightness mode — only shown when an album is selected */}
          {selectedTintAlbum && (
            <div className="mt-4">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Color brightness</p>
              <div className="flex gap-2">
                {BRIGHTNESS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleBrightnessMode(opt.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      borderColor: brightnessMode === opt.id ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.08)',
                      backgroundColor: brightnessMode === opt.id ? 'rgba(167,139,250,0.12)' : 'transparent',
                      color: brightnessMode === opt.id ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] font-normal normal-case tracking-normal opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTintAlbum && (
            <button
              onClick={() => { setSelectedTintAlbum(""); localStorage.removeItem(ALBUM_TINT_KEY); clearAlbumTint(); setTintMode('aurora'); }}
              className="mt-3 text-white/25 text-[11px] underline underline-offset-2 hover:text-white/50 transition-colors"
            >
              Remove tint
            </button>
          )}
        </div>

        {/* Feedback link */}
        <div className="bg-white/5 border border-white/12 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h2 className="text-white font-bold text-sm">Feedback & Suggestions</h2>
          </div>
          <p className="text-white/40 text-xs mb-4 leading-relaxed">
            Have an idea, found a bug, or want to suggest a new feature? Send a message directly to the developer.
          </p>
          <Link
            to={createPageUrl("Feedback")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white/70 hover:text-white font-semibold text-sm transition-colors"
          >
            Open Feedback →
          </Link>
        </div>
      </div>
    </div>
  );
}
