import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const TUTORIAL_KEY = "aespa_tutorial_done";

const STEPS = [
  {
    title: "Welcome to MY Aespa Rank 🎵",
    description: "Your ultimate aespa song ranking app. Battle every song, discover your moods, browse the full discography, and share your taste. Let's take a quick tour!",
    emoji: "👋",
  },
  {
    title: "Battle Songs ⚔️",
    description: "Two songs appear at a time. Tap the one you prefer — or hit 🤝 Tie if you love them equally. Every pick is scored using the Elo rating system, just like chess.",
    emoji: "⚔️",
  },
  {
    title: "Preview Before You Pick 🎧",
    description: "Tap the ▶ Preview button on any song to hear a snippet before deciding. A sweeping border shows how much is left. 🎧 Headphones highly recommended! Play count tracks how many times you've previewed each song.",
    emoji: "🎧",
  },
  {
    title: "Undo & Change Your Mind ↩️",
    description: "Regret your last pick? Hit the Back button to undo it instantly. You can go back up to 20 moves — so battle freely without fear.",
    emoji: "↩️",
  },
  {
    title: "Last Battle Confirmation ⏱️",
    description: "The very last battle requires you to hold the button for 2 seconds to confirm. This prevents accidental taps on your most important decision!",
    emoji: "⏱️",
  },
  {
    title: "Filter Your Battle 🎯",
    description: "Use the album filter bar to rank within a specific era only. Or choose Title Tracks Only, B-Sides Only, or Solos Only for a focused session.",
    emoji: "🎯",
  },
  {
    title: "Exclude Songs 🚫",
    description: "Don't want certain songs in your ranking pool? Tap Exclude before starting to remove them. Excluded songs still appear in your results at the bottom.",
    emoji: "🚫",
  },
  {
    title: "Dramatic Ranking Reveal 🎬",
    description: "When all battles are done, enter the Dramatic Reveal — songs appear one by one from last place to #1, with previews auto-playing. The golden ✨ Reveal #1 button drops your top song last.",
    emoji: "🎬",
  },
  {
    title: "See Your Full Results 🏆",
    description: "Your complete ranked list shows Elo scores for every song. Ties are clearly grouped. Excluded songs are listed separately. Switch between Full Ranking, Top 10, and Top 5 views.",
    emoji: "🏆",
  },
  {
    title: "Share Your Ranking 📤",
    description: "Generate a beautiful Top 10 shareable card with your rankings. Download it directly to your device or copy the link — find Share Card on the Results page.",
    emoji: "📤",
  },
  {
    title: "Save & Compare 💾",
    description: "Rankings are saved automatically every time you complete a battle. Complete multiple sessions and compare them to see how your taste changes over time — with a visual rise/drop comparison.",
    emoji: "💾",
  },
  {
    title: "Browse Songs 🎶",
    description: "Explore the full aespa discography grouped by album. Filter by era, song type (title track, B-side, OST, collab, solo), lyrics language, and featured member.",
    emoji: "🎶",
  },
  {
    title: "Favorites ❤️",
    description: "Heart any song to add it to your Favorites list. Access Favorites from the Home screen to revisit all your loved songs in one place.",
    emoji: "❤️",
  },
  {
    title: "Mood Ranking 😊",
    description: "Create custom moods like Hype, Sad, or Cozy and rank which songs fit each vibe. Phase 1 discovers all songs. Phase 2 battles the qualifiers. Each mood gets its own dramatic reveal and saved ranking.",
    emoji: "😊",
  },
  {
    title: "Personal Tags 🏷️",
    description: "Tag any song with custom labels — 'comfort song', 'hype', 'gym' and more are pre-loaded. Tap a song's detail page, type any tag and press Enter. Remove tags with a confirmation tap.",
    emoji: "🏷️",
  },
  {
    title: "Win Rate & Decision Timer ⏱️",
    description: "Every battle card shows the song's current win rate %. Your average decision time per song is tracked. See your Most Indecisive songs and longest streaks on the Stats page.",
    emoji: "📊",
  },
  {
    title: "Aurora & Album Tint 🌈",
    description: "Switch between Aurora mode (glowing purple/teal gradients) and Minimal mode (pure black, no gradients) via the ✨ button on the Home screen. Separately, enable Album Tint from Settings to subtly colour the app background with the current album's lightstick colour.",
    emoji: "🌈",
  },
  {
    title: "Replay This Walkthrough 🔁",
    description: "Want to revisit this guide? Go to Settings from the Home screen and tap Replay Walkthrough. It's always there when you need a refresher.",
    emoji: "🔁",
  },
  {
    title: "You're Ready! 🚀",
    description: "That's everything! Start your first ranking, explore Mood Ranking, or browse the full discography. Have fun discovering your ultimate aespa ranking!",
    emoji: "🚀",
  },
];

export default function AppTutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleFinish = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
    >
      <style>{`
        .aurora-tut {
          background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-tut-shift 4s ease infinite;
        }
        @keyframes aurora-tut-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .aurora-btn-tut {
          border: 1.5px solid transparent;
          background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(103,232,249,0.15)) padding-box,
                      linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399) border-box;
          box-shadow: 0 0 12px rgba(167,139,250,0.4), 0 0 24px rgba(103,232,249,0.2);
        }
      `}</style>

      <motion.div
        key={step}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl overflow-hidden"
      >
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-4 px-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                background: i === step
                  ? "linear-gradient(135deg, #a78bfa, #67e8f9)"
                  : i < step
                    ? "rgba(167,139,250,0.4)"
                    : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="aurora-tut font-black text-lg mb-3 leading-tight">{current.title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/12 text-white/40 hover:text-white text-sm font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? handleFinish() : setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl aurora-btn-tut text-white font-bold text-sm uppercase tracking-wide transition-all"
          >
            {isLast ? "Let's Go! 🚀" : "Next"}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Step counter */}
        <div className="text-center pb-4">
          <span className="text-white/20 text-[10px]">{step + 1} / {STEPS.length}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function shouldShowTutorial() {
  return !localStorage.getItem(TUTORIAL_KEY);
}

export function resetTutorial() {
  localStorage.removeItem(TUTORIAL_KEY);
}