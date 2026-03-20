import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTheme } from "./useTheme";

export default function NavBar() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  // Hide on home page since it has its own header with the toggle
  if (location.pathname === "/" || location.pathname === "/Home") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-md border-b border-white/5">
      <Link to="/Home" className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/70 hover:text-violet-300 transition-colors">
        æspa
      </Link>
      <button
        onClick={toggle}
        title={theme === "aurora" ? "Switch to Minimal mode" : "Switch to Aurora mode"}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-semibold uppercase tracking-wider"
      >
        <Sparkles
          className="w-3 h-3"
          style={theme === "aurora" ? { color: "#a78bfa" } : { color: "rgba(255,255,255,0.3)" }}
        />
        <span className="text-white/40">{theme === "aurora" ? "Aurora" : "Minimal"}</span>
      </button>
    </div>
  );
}