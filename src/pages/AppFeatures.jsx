import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";

const FEATURES = [
  {
    icon: "🎭",
    title: "Mood Ranking",
    desc: "Rank songs by how well they fit a mood — Sad, Hype, Chill, Nostalgic, or any custom mood you create. Each mood has its own fully independent ELO ranking. Create custom moods with a name and color. A decision timer tracks your hesitation for each battle."
  },
  {
    icon: "🏷️",
    title: "Custom Song Tags",
    desc: "Tag any song with personal labels like 'comfort song', 'hype', 'gym', 'crying hours', 'bop', 'underrated' — or type your own. Tags are displayed as colored pill chips on the Song Detail page. Remove tags with a confirmation prompt."
  },
  {
    icon: "📈",
    title: "Win Rate on Song Cards",
    desc: "Each song card in a battle shows the song's win rate percentage (wins ÷ total battles × 100) in plain white text below the title. Only shown after the song has been in at least one battle."
  },
  {
    icon: "⏱️",
    title: "Decision Timer & Most Indecisive",
    desc: "Every battle records how long you took to decide. The Stats page shows a 'Most Indecisive' section — the top 5 songs by average hesitation time, with a bar chart. The Song Detail page shows your average decision time for that specific song. Battles over 60s are excluded from averages."
  },
  {
    icon: "🎨",
    title: "Album Color Tint",
    desc: "As you scroll through the song list, the app background subtly tints with the current album's lightstick color. Toggle between Aurora mode (the animated gradient) and Album Tint mode from the main screen using the Sparkles button."
  },
  {
    icon: "⚔️",
    title: "Overall Ranking",
    desc: "Battle every aespa song head-to-head using the Elo rating system (the same used in chess). Each matchup adjusts scores based on who wins, ensuring your final ranking reflects your genuine preferences across the whole discography."
  },
  {
    icon: "💿",
    title: "Album Ranking",
    desc: "Select a specific album from the filter bar and rank only the songs within it. Perfect for deep-diving into an era. When ranking within an album you get three mode options: All Tracks, Title Tracks, and B-Sides."
  },
  {
    icon: "🎯",
    title: "Title Track Ranking",
    desc: "Filter to Title Tracks Only and battle only the lead singles. Find out which aespa title track reigns supreme in your personal opinion. Found in Rank Setup → Mode → Titles."
  },
  {
    icon: "⭐",
    title: "Solos Only",
    desc: "Where to find it: Rank Setup → Mode → Solos Only (the ⭐ Solos button).\n\nWhat it does: ranks only member solo tracks. During the ranking you'll battle solo tracks head-to-head just like any other mode.\n\nIn Browse Songs → Solos tab, songs are grouped by member — Karina, Giselle, Winter, Ningning — so you can see who has your favourite solo output at a glance.\n\nImportant: Solos Only creates its own ranking and does NOT replace your other saved rankings. Each ranking is saved separately."
  },
  {
    icon: "🚫",
    title: "Exclude System",
    desc: "Tap 'Exclude' during a battle session to open an exclusion panel. Tap any song pill to remove it from the ranking pool. Songs are colour-coded by album. Great for focusing on your favourites or skipping songs you haven't heard yet."
  },
  {
    icon: "🎨",
    title: "Album Colour Coding",
    desc: "Every album has a unique colour inspired by its visual identity. These colours appear consistently across Browse Songs, the Exclude panel, and Rankings — making it instant to identify which album a song belongs to at a glance. Custom albums you create also get their own unique colour."
  },
  {
    icon: "➕",
    title: "Add Songs",
    desc: "In the Browse tab, tap the + button to add your own songs. Set the title, artist, album (existing or new), type, release date, and optionally a YouTube link for preview. For Solo tracks, pick the member (Karina / Giselle / Winter / Ningning) so it appears correctly in Solos Only mode. For Collabs, add featuring info which shows everywhere the song is displayed. Added songs can be deleted and participate in all ranking modes."
  },
  {
    icon: "💾",
    title: "Save Rankings",
    desc: "Every completed ranking is automatically saved to your device. Access them anytime via Saved Rankings. You can rename, delete, or re-rank any saved session."
  },
  {
    icon: "📊",
    title: "Analytics — Album Bias & Era Breakdown",
    desc: "Where: Stats / Analytics tab (📊 icon on the Results screen).\n\nWhat you see:\n• Most top-ranked album overall\n• Albums with the highest average placement in your rankings\n• Ranking distribution by release period (era breakdown)\n• Charts + top insights about your personal listening bias\n\nGreat for spotting patterns in your taste over time."
  },
  {
    icon: "🔗",
    title: "Share Card — Shareable Ranking Image",
    desc: "Where: Results screen → Share Card (🔗 icon).\n\nWhat it does: generates a shareable image of your ranking that includes your ranking title, top songs (e.g. Top 10), and the aurora styling with the #1 ring.\n\nOutput: a downloadable PNG image you can post anywhere."
  },
  {
    icon: "👥",
    title: "Community Compare — See How You Compare",
    desc: "Where: Community tab (👥 icon on the Results screen).\n\nWhat it does: compare your ranking against a community average or another user's ranking snapshot.\n\nWhat you see: a similarity score and the biggest differences between your picks and the community's."
  },
  {
    icon: "🏆",
    title: "Achievements — Track Your Milestones",
    desc: "Where: Achievements tab (🏆 icon on the Results screen or home page).\n\nExamples of achievements:\n• First completed ranking\n• Ranked within an album\n• Created a Solos Only ranking\n• Used the Tie feature\n• Compared two rankings\n\nWhat it looks like: badges with titles and descriptions, locked badges shown greyed out."
  },
  {
    icon: "📊",
    title: "Compare Rankings",
    desc: "On the Results screen, tap the big blue 'Compare with Past Ranking' button to see how your tastes have shifted. Rankings are compared as a slideshow showing biggest rises, biggest drops, unchanged positions, newly added songs, and excluded songs."
  },
  {
    icon: "🥇",
    title: "#1 Stats Tracker",
    desc: "The #1 Stats tab tracks how many times each song has ranked #1 across all your saved rankings, broken down by mode (Overall, Album, Title Track, Solo). Updates automatically after each ranking."
  },
  {
    icon: "🌌",
    title: "Aurora UI",
    desc: "The app's visual identity is inspired by aespa's colours — aurora shades of violet, cyan, pink, and green. These form the animated Aurora gradient used across all highlights, titles, action buttons, and the iconic animated ring around your #1 song."
  },
  {
    icon: "🎵",
    title: "Audio Preview",
    desc: "Tap 'Preview' on any song during a battle or in Browse Songs to hear a snippet. 🎧 Headphones make it SO much better. Only one preview plays at a time, and always tap-to-play (no autoplay)."
  },
  {
    icon: "🤝",
    title: "Tie System",
    desc: "During a battle, tap 'Tie' if you genuinely can't choose. Both songs receive equal Elo points. In your final Results, tied songs share the same rank number (e.g. both show '#3') with a visual group so it's obvious they're tied."
  },
];

function FeatureCard({ feature, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/5 transition-all text-left"
      >
        <span className="text-xl shrink-0">{feature.icon}</span>
        <span className="text-white/80 font-semibold text-sm flex-1">{feature.title}</span>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-2 text-white/50 text-sm leading-relaxed border-l border-white/10 ml-4 mt-1 whitespace-pre-line">
              {feature.desc}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AppFeatures() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        .aurora-feat { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: feat-shift 4s ease infinite; }
        @keyframes feat-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-feat font-bold text-sm tracking-wider">APP FEATURES</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-1 pb-2">
        <p className="text-white/30 text-xs">Tap any feature to learn more</p>
      </div>

      <div className="relative z-10 px-4 pb-24 space-y-2">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} feature={f} index={i} />
        ))}
      </div>
    </div>
  );
}