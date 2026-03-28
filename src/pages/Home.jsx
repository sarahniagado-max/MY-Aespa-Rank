const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, List, BookMarked, ImageIcon, RotateCcw, Award, Zap, Star, ChevronDown, HelpCircle, Settings, MessageSquare, Disc3, BarChart3, Sparkles, Heart, Smile, Lock, LockOpen } from "lucide-react";
import { useTheme } from "../components/useTheme";
import { useSongs } from "../components/ranking/useSongs";
import AppTutorial, { shouldShowTutorial } from "../components/tutorial/AppTutorial";

function HowItWorks() {
  const [open, setOpen] = useState(false);
  const sections = [
    {
      label: "⚔️ Ranking Battles",
      items: [
        { icon: "⚔️", text: "Two songs appear — pick your favourite to score them via Elo (like chess)" },
        { icon: "🎵", text: "Tap Preview to hear a snippet before deciding — 🎧 headphones recommended!" },
        { icon: "↩️", text: "Changed your mind? Hit Back to undo your last pick" },
        { icon: "🤝", text: "Can't decide? Choose Tie to score both songs equally" },
        { icon: "⏱️", text: "Last battle requires a hold-to-confirm to prevent accidental taps" },
        { icon: "🚫", text: "Exclude specific songs you don't want in your ranking" },
        { icon: "💿", text: "Filter by album, title tracks, B-sides, or solos" },
        { icon: "📊", text: "Dramatic reveal shows your full ranked list when all battles are done" },
      ]
    },
    {
      label: "😊 Mood Ranking",
      items: [
        { icon: "😊", text: "Create custom moods (e.g. Hype, Sad, Cozy) and rank songs that fit each vibe" },
        { icon: "🔍", text: "Phase 1 — Discovery: battle every song to find which ones fit the mood" },
        { icon: "🏆", text: "Phase 2 — Finals: battle only the qualifying songs to build your mood playlist" },
        { icon: "🐺", text: "Odd song out? A lone wolf screen lets you vote yes/no without a battle" },
        { icon: "✕", text: "None of These — eliminate both songs at once if neither fits the mood" },
        { icon: "💾", text: "Progress is saved automatically — pick up where you left off any time" },
      ]
    },
    {
      label: "📚 Library & Discovery",
      items: [
        { icon: "🎶", text: "Browse every aespa song with cover art, album info, and YouTube previews" },
        { icon: "❤️", text: "Favourite songs and build personal playlists" },
        { icon: "🏷️", text: "Tag songs with custom labels and colours" },
        { icon: "📝", text: "Add personal scores (1–10) and notes to any song" },
        { icon: "📅", text: "Filter by album, era, song type, language, and featured member" },
      ]
    },
    {
      label: "📈 Stats & Achievements",
      items: [
        { icon: "📈", text: "My Stats — see win rates, most-played previews, and decision speed" },
        { icon: "🥇", text: "#1 Stats — track which songs have topped your rankings over time" },
        { icon: "📊", text: "Analytics — album bias, era distribution, and ranking consistency scores" },
        { icon: "🌍", text: "Community — compare your ranking against the global average" },
        { icon: "🏅", text: "Achievements — unlock badges for ranking milestones and streaks" },
        { icon: "📤", text: "Share Card — generate a shareable image of your top rankings" },
      ]
    },
  ];
  return (
    <div className="w-full max-w-sm mb-6 bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <p className="text-white/80 text-[11px] uppercase tracking-[0.3em] font-bold">How it works</p>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-3">
              {sections.map((section, si) => (
                <div key={si}>
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.25em] font-bold mb-2">{section.label}</p>
                  <div className="space-y-2">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-sm mt-0.5 shrink-0">{item.icon}</span>
                        <span className="text-white/70 text-[11px] leading-snug font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DEFAULT_BG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699f6cf843d0d1d18973a726/beaac3f5a_Image137.jpg";
const BG_KEY = "aespa_home_bg";

export default function Home() {
  const { songs: allSongsDb, albums: allAlbumsDb } = useSongs();
  const { theme, toggle: toggleTheme } = useTheme();
  const [userEmail, setUserEmail] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem(BG_KEY) || DEFAULT_BG);
  const [showTutorial, setShowTutorial] = useState(false);
  const fileRef = useRef(null);
  const [adminUnlocked, setAdminUnlocked] = useState(() => localStorage.getItem("aespa_admin") === "1");
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await db.auth.me();
        setUserEmail(u?.email || null);
      } catch (error) {
        setUserEmail(null);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (shouldShowTutorial()) setShowTutorial(true);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }
  const savedRanking = localStorage.getItem("aespa_ranking_complete");
  const allRankings = (() => {
    try { return JSON.parse(localStorage.getItem("aespa_all_rankings") || "[]"); } catch { return []; }
  })();

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setBgUrl(url);
      localStorage.setItem(BG_KEY, url);
    };
    reader.readAsDataURL(file);
  };

  const resetBg = () => {
    setBgUrl(DEFAULT_BG);
    localStorage.removeItem(BG_KEY);
  };

  const handleAdminUnlock = () => {
    if (adminPassword === "DEBE21") {
      localStorage.setItem("aespa_admin", "1");
      setAdminUnlocked(true);
      setShowAdminPopup(false);
      setAdminPassword("");
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <AnimatePresence>
        {showTutorial && <AppTutorial onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: '55vw', maxHeight: 340, minHeight: 200 }}>
        <img
          src={bgUrl}
          alt="aespa"
          className="w-full h-full object-cover object-top"
          style={{ filter: 'brightness(0.55) saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-violet-300/80 bg-black/40 px-3 py-1 rounded-full border border-violet-500/20 backdrop-blur-sm">
            æspa
          </span>
        </div>
        {/* Image controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          <button onClick={() => setShowTutorial(true)} className="p-1.5 rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-violet-300 transition-colors backdrop-blur-sm" title="App guide">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-sm"
            title={theme === 'aurora' ? 'Switch to Minimal theme' : 'Switch to Aurora theme'}
          >
            <Sparkles className="w-3.5 h-3.5" style={theme === 'aurora' ? { color: '#a78bfa' } : {}} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-sm" title="Change photo">
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          {bgUrl !== DEFAULT_BG && (
            <button onClick={resetBg} className="p-1.5 rounded-full bg-black/50 border border-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-sm" title="Reset to default">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex-1 flex flex-col items-center px-6 -mt-8 z-10"
      >
        {/* App title in aurora color */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-center aurora-text">
          MY Aespa Rank
        </h1>
        <style>{`
          .aurora-text {
            background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: aurora-shift 4s ease infinite;
          }
          @keyframes aurora-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .aurora-text-sm {
            background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: aurora-shift 4s ease infinite;
          }
        `}</style>

        <p className="text-white/60 text-sm font-semibold mb-5 max-w-xs mx-auto leading-relaxed text-center">
          Battle every aespa song to find your ultimate ranking
        </p>

        {/* How it works - accordion */}
        <HowItWorks />

        {/* Action buttons */}
        <div className="space-y-3 w-full max-w-sm">
          <Link
            to={createPageUrl("Battle")}
            className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-black text-base uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
          >
            <Swords className="w-6 h-6" />
            Start Ranking
          </Link>

          {savedRanking && (
            <Link
              to={createPageUrl("Results")}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-2 border-white/25 bg-white/8 hover:bg-white/14 text-white/90 hover:text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_16px_rgba(255,255,255,0.06)]"
            >
              <Trophy className="w-5 h-5" />
              View Rankings
            </Link>
          )}

          <Link
            to={createPageUrl("SavedRankings")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/8 text-white/60 hover:text-white/90 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <BookMarked className="w-5 h-5" />
            Saved Rankings
          </Link>

          <Link
            to={createPageUrl("Songs")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/6 text-white/55 hover:text-white/85 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <List className="w-5 h-5" />
            Browse Songs
          </Link>

          <Link
            to={createPageUrl("Favorites")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/6 text-white/55 hover:text-white/85 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Heart className="w-5 h-5" />
            Favorites
          </Link>

          <Link
            to="/MoodRanking"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-white/15 bg-white/[0.03] hover:bg-white/6 text-white/55 hover:text-white/85 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Smile className="w-5 h-5" />
            Mood Ranking
          </Link>

          <Link
            to={createPageUrl("NumberOneStats")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/40 hover:text-white/70 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Zap className="w-4 h-4" />
            #1 Stats
          </Link>

          <Link
            to={createPageUrl("Achievements")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/40 hover:text-white/70 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Award className="w-4 h-4" />
            Achievements
          </Link>

          <Link
            to={createPageUrl("AppFeatures")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Star className="w-4 h-4" />
            App Features
          </Link>

          <Link
            to={createPageUrl("Settings")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
            Settings & Help
          </Link>

          {adminUnlocked && (
            <>
              <Link
                to={createPageUrl("Albums")}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
              >
                <Disc3 className="w-4 h-4" />
                Album Management
              </Link>
              <Link
                to={createPageUrl("AdminSongs")}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                Song Management
              </Link>
            </>
          )}

          <Link
            to={createPageUrl("Feedback")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <MessageSquare className="w-4 h-4" />
            Feedback & Suggestions
          </Link>

          <Link
            to={createPageUrl("Stats")}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border border-white/10 bg-transparent hover:bg-white/5 text-white/35 hover:text-white/65 font-semibold text-sm uppercase tracking-widest transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4" />
            My Stats
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 flex justify-center gap-8"
        >
          {[
            { label: "Songs", value: `${allSongsDb.length || "—"}` },
            { label: "Albums", value: `${allAlbumsDb.length || "—"}` },
            { label: "Years", value: "2020–26" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="aurora-text-sm text-[10px] uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {allRankings.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6">
            <Link
              to={createPageUrl("Results")}
              className="text-white/20 text-xs underline underline-offset-4 hover:text-white/50 transition-colors"
            >
              Compare {allRankings.length} saved rankings →
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Admin lock button — discreet, fixed bottom-right */}
      <button
        onClick={() => {
          if (adminUnlocked) {
            localStorage.removeItem("aespa_admin");
            setAdminUnlocked(false);
          } else {
            setShowAdminPopup(true);
            setAdminPassword("");
            setAdminError(false);
          }
        }}
        className="fixed bottom-5 right-5 p-2 text-white/10 hover:text-white/30 transition-colors z-50"
        aria-label={adminUnlocked ? "Lock admin" : "Admin unlock"}
      >
        {adminUnlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
      </button>

      {/* Admin password popup */}
      <AnimatePresence>
        {showAdminPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAdminPopup(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-72 flex flex-col gap-4"
            >
              <p className="text-white/70 text-sm font-semibold text-center">Admin Access</p>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => { setAdminPassword(e.target.value); setAdminError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleAdminUnlock()}
                placeholder="Password"
                autoFocus
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/30"
              />
              {adminError && <p className="text-red-400 text-xs text-center">Incorrect password</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdminPopup(false)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminUnlock}
                  className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}