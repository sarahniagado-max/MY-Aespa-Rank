const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { getTintMode, TINT_MODE_KEY, applyAlbumTint } from "./components/AlbumTintManager";
import NavBar from "./components/NavBar";

import { useLocation } from "react-router-dom";

const ALBUM_TINT_KEY = "aespa_album_tint_id";

export default function Layout({ children }) {
  const location = useLocation();
  const showNavBar = location.pathname !== "/" && location.pathname !== "/Home";
  const [tintMode, setTintModeState] = useState(getTintMode);

  useEffect(() => {
    const handleChange = (e) => setTintModeState(e.detail?.mode || 'aurora');
    window.addEventListener('albumTintModeChange', handleChange);
    return () => window.removeEventListener('albumTintModeChange', handleChange);
  }, []);

  // Apply saved album tint on app load
  useEffect(() => {
    const savedAlbumId = localStorage.getItem(ALBUM_TINT_KEY);
    if (!savedAlbumId) return;
    db.entities.Album.list("release_date", 100).then(albums => {
      const album = (albums || []).find(a => a.id === savedAlbumId);
      if (album?.lightstick_color) {
        const firstColor = album.lightstick_color.split(",")[0].trim();
        applyAlbumTint(firstColor);
      }
    }).catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen bg-black pt-[0px]"
      style={{
        backgroundColor: tintMode === 'tint'
          ? `rgba(var(--album-bg-r, 0), var(--album-bg-g, 0), var(--album-bg-b, 0), 0.04)`
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