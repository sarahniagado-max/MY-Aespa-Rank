const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Smartphone, RotateCcw, MessageSquare, Droplets } from "lucide-react";
import { resetTutorial } from "../components/tutorial/AppTutorial";
import AppTutorial from "../components/tutorial/AppTutorial";
import { AnimatePresence } from "framer-motion";

import { applyAlbumTint, clearAlbumTint } from "../components/AlbumTintManager";

const ALBUM_TINT_KEY = "aespa_album_tint_id";

export default function Settings() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedTintAlbum, setSelectedTintAlbum] = useState(() => localStorage.getItem(ALBUM_TINT_KEY) || "");

  useEffect(() => {
    db.entities.Album.list("release_date", 100).then(a => setAlbums(a || [])).catch(() => {});
  }, []);

  // Apply tint on mount from saved preference
  useEffect(() => {
    if (selectedTintAlbum) {
      const album = albums.find(a => a.id === selectedTintAlbum);
      if (album?.lightstick_color) {
        const firstColor = album.lightstick_color.split(",")[0].trim();
        applyAlbumTint(firstColor);
      }
    }
  }, [albums, selectedTintAlbum]);

  const handleTintSelect = (albumId) => {
    if (albumId === selectedTintAlbum) {
      // Deselect
      setSelectedTintAlbum("");
      localStorage.removeItem(ALBUM_TINT_KEY);
      clearAlbumTint();
      return;
    }
    setSelectedTintAlbum(albumId);
    localStorage.setItem(ALBUM_TINT_KEY, albumId);
    const album = albums.find(a => a.id === albumId);
    if (album?.lightstick_color) {
      const firstColor = album.lightstick_color.split(",")[0].trim();
      applyAlbumTint(firstColor);
    }
  };

  const handleReplayWalkthrough = () => {
    resetTutorial();
    setShowTutorial(true);
  };

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
          {albums.length === 0 ? (
            <p className="text-white/20 text-xs">Loading albums…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {albums.filter(a => a.lightstick_color).map(album => {
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
          {selectedTintAlbum && (
            <button
              onClick={() => { setSelectedTintAlbum(""); localStorage.removeItem(ALBUM_TINT_KEY); clearAlbumTint(); }}
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