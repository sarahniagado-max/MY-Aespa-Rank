import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTintMode } from "./AlbumTintManager";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const tintMode = useTintMode();

  // Hide on home page since it has its own header, and on RankingReveal
  if (location.pathname === "/" || location.pathname === "/Home" || location.pathname === "/RankingReveal") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-md border-b border-white/5">
      <Link to="/Home" className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/70 hover:text-violet-300 transition-colors">
        æspa
      </Link>
      <button
        onClick={() => navigate(createPageUrl('Settings'))}
        className="font-bold leading-none"
        style={{
          fontSize: '16px',
          background: tintMode === 'tint' ? 'none' : 'linear-gradient(135deg, #a78bfa, #67e8f9)',
          WebkitBackgroundClip: tintMode === 'tint' ? 'unset' : 'text',
          WebkitTextFillColor: tintMode === 'tint' ? 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))' : 'transparent',
          backgroundClip: tintMode === 'tint' ? 'unset' : 'text',
          textShadow: tintMode === 'tint'
            ? '0 0 8px rgba(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b),0.8)'
            : '0 0 8px rgba(167,139,250,0.8), 0 0 16px rgba(103,232,249,0.4)',
        }}
      >
        æ
      </button>
    </div>
  );
}
