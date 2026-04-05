import React, { useState, useEffect } from "react";
import { getTintMode, TINT_MODE_KEY, applyAlbumTint, getTintBrightnessMode } from "./components/AlbumTintManager";
import NavBar from "./components/NavBar";

import { useLocation } from "react-router-dom";

const ALBUM_TINT_KEY = "aespa_album_tint_id";
const SUPABASE_URL = 'https://pgeobkizrwysefxehves.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZW9ia2l6cnd5c2VmeGVodmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjkwMDEsImV4cCI6MjA4OTUwNTAwMX0.zVZpftZ2ifyFcC73yT6aYS4ZdpzpKyzgrLWCUVytV-Q';

export default function Layout({ children }) {
  const location = useLocation();
  const showNavBar = location.pathname !== "/" && location.pathname !== "/Home";
  const [tintMode, setTintModeState] = useState(getTintMode);

  useEffect(() => {
    const handleChange = (e) => setTintModeState(e.detail?.mode || 'aurora');
    window.addEventListener('albumTintModeChange', handleChange);
    return () => window.removeEventListener('albumTintModeChange', handleChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('album-tint', tintMode === 'tint');
  }, [tintMode]);

  // Apply saved album tint on app load
  useEffect(() => {
    const savedAlbumId = localStorage.getItem(ALBUM_TINT_KEY);
    if (!savedAlbumId) return;
    fetch(`${SUPABASE_URL}/rest/v1/albums?id=eq.${savedAlbumId}&select=lightstick_color`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then(r => r.json())
      .then(rows => {
        const color = rows?.[0]?.lightstick_color;
        if (color) {
          const firstColor = color.split(',')[0].trim();
          applyAlbumTint(firstColor, getTintBrightnessMode());
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen bg-black pt-[0px]"
      style={{
        backgroundColor: tintMode === 'tint'
          ? `rgba(var(--album-bg-r, 0), var(--album-bg-g, 0), var(--album-bg-b, 0), 0.20)`
          : undefined,
        transition: 'background-color 1s ease',
      }}
    >
      <style>{`
        :root {
          --background: 0 0% 0%;
          --foreground: 0 0% 100%;
        }
        body {
          background: #000;
          color: #fff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 1s ease;
        }
        /* Album tint on body */
        body.album-tint {
          background-color: rgb(
            var(--album-bg-r, 0),
            var(--album-bg-g, 0),
            var(--album-bg-b, 0)
          );
        }
        /* Hide scrollbar for album filter */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        /* Custom scrollbar for results */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      <NavBar />
      <div className={showNavBar ? "pt-10" : ""}>{children}</div>
    </div>
  );
}