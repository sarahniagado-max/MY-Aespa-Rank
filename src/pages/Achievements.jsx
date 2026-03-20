import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Lock, Sparkles } from "lucide-react";

const ACHIEVEMENTS_KEY = "aespa_achievements";

const ALL_ACHIEVEMENTS = [
  { id: "first_battle", icon: "⚔️", title: "First Battle", desc: "Complete your first song battle", secret: false },
  { id: "first_ranking", icon: "🏆", title: "Ranked!", desc: "Complete a full ranking", secret: false },
  { id: "savage_fan", icon: "🐍", title: "Savage Fan", desc: "Rank a Savage era song #1", secret: false },
  { id: "girls_fan", icon: "👑", title: "Girls Fan", desc: "Rank a Girls era song #1", secret: false },
  { id: "myworld_fan", icon: "🌍", title: "MY WORLD Fan", desc: "Rank a MY WORLD era song #1", secret: false },
  { id: "drama_fan", icon: "🎭", title: "Drama Fan", desc: "Rank a Drama era song #1", secret: false },
  { id: "armageddon_fan", icon: "💫", title: "Armageddon Fan", desc: "Rank an Armageddon era song #1", secret: false },
  { id: "whiplash_fan", icon: "⚡", title: "Whiplash Fan", desc: "Rank a Whiplash era song #1", secret: false },
  { id: "black_mamba_no1", icon: "🐍", title: "Debut Queen", desc: "Rank Black Mamba as #1", secret: true },
  { id: "next_level_no1", icon: "🚀", title: "Next Level Stan", desc: "Rank Next Level as #1", secret: true },
  { id: "supernova_no1", icon: "🌟", title: "Supernova", desc: "Rank Supernova as #1", secret: true },
  { id: "whiplash_no1", icon: "⚡", title: "Whiplash Lover", desc: "Rank Whiplash as #1", secret: true },
  { id: "five_rankings", icon: "📊", title: "Dedicated Fan", desc: "Complete 5 full rankings", secret: false },
  { id: "solo_ranking", icon: "⭐", title: "Solo Lover", desc: "Complete a Solo-only ranking", secret: false },
  { id: "album_ranking", icon: "💿", title: "Deep Dive", desc: "Complete an album-only ranking", secret: false },
  { id: "title_only", icon: "🎯", title: "Title Track Purist", desc: "Complete a title tracks only ranking", secret: false },
  // 14 new achievements
  { id: "rich_man_fan", icon: "💎", title: "Rich Man Era", desc: "Rank a Rich Man era song #1", secret: false },
  { id: "ten_rankings", icon: "🔟", title: "Obsessed", desc: "Complete 10 full rankings", secret: false },
  { id: "spicy_no1", icon: "🌶️", title: "Spicy Queen", desc: "Rank Spicy as #1", secret: true },
  { id: "drama_no1", icon: "🎭", title: "Drama Queen", desc: "Rank Drama as #1", secret: true },
  { id: "girls_no1", icon: "👑", title: "Girls on Top", desc: "Rank Girls as #1", secret: true },
  { id: "savage_no1", icon: "💀", title: "Utterly Savage", desc: "Rank Savage as #1", secret: true },
  { id: "b_side_ranking", icon: "🎵", title: "B-Side Believer", desc: "Complete a B-Sides only ranking", secret: false },
  { id: "collab_fan", icon: "🤝", title: "Collab Collector", desc: "Rank a collaboration song #1", secret: false },
  { id: "all_eras", icon: "🌈", title: "Era Hopper", desc: "Rank #1 in 4 different eras", secret: false },
  { id: "exclude_master", icon: "🚫", title: "Selective Listener", desc: "Complete a ranking with songs excluded", secret: false },
  { id: "saved_five", icon: "💾", title: "Archive Keeper", desc: "Save 5 rankings", secret: false },
  { id: "preview_user", icon: "🎧", title: "Preview Mode", desc: "Use the preview feature (just explore!)", secret: false },
  { id: "keychain_no1", icon: "🔑", title: "Keychain Queen", desc: "Rank Keychain as #1", secret: true },
  { id: "ost_fan", icon: "🎬", title: "OST Devotee", desc: "Rank an OST song #1", secret: false },
];

function checkAchievements(rankingData, allRankings) {
  const unlocked = new Set((() => { try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || "[]"); } catch { return []; } })());
  const newlyUnlocked = [];

  const add = (id) => { if (!unlocked.has(id)) { unlocked.add(id); newlyUnlocked.push(id); } };

  if (!rankingData) return newlyUnlocked;

  const { rankings, albumFilter, songTypeFilter } = rankingData;
  const top1 = rankings?.[0]?.song;

  add("first_ranking");

  // Era-based fan achievements
  const eraMap = {
    "Savage Era": "savage_fan",
    "Girls Era": "girls_fan",
    "MY WORLD Era": "myworld_fan",
    "Drama Era": "drama_fan",
    "Armageddon Era": "armageddon_fan",
    "Whiplash Era": "whiplash_fan",
    "Rich Man Era": "rich_man_fan",
  };
  if (top1?.era && eraMap[top1.era]) add(eraMap[top1.era]);

  // Secret #1 songs
  const secretMap = {
    "Black Mamba": "black_mamba_no1",
    "Next Level": "next_level_no1",
    "Supernova": "supernova_no1",
    "Whiplash": "whiplash_no1",
    "Spicy": "spicy_no1",
    "Drama": "drama_no1",
    "Girls": "girls_no1",
    "Savage": "savage_no1",
    "Keychain": "keychain_no1",
  };
  if (top1?.title && secretMap[top1.title]) add(secretMap[top1.title]);

  // Song type based
  if (top1?.song_type === "collaboration" || top1?.song_type === "ost") {
    if (top1.song_type === "collaboration") add("collab_fan");
    if (top1.song_type === "ost") add("ost_fan");
  }

  // Count milestones
  if (allRankings.length >= 5) add("five_rankings");
  if (allRankings.length >= 10) add("ten_rankings");

  // Mode-based
  if (songTypeFilter === "solo") add("solo_ranking");
  if (songTypeFilter === "b_side") add("b_side_ranking");
  if (albumFilter && albumFilter !== "all") add("album_ranking");
  if (songTypeFilter === "title_track") add("title_only");

  // All eras — check across all rankings
  const erasSeen = new Set(allRankings.map(r => r.rankings?.[0]?.song?.era).filter(Boolean));
  if (erasSeen.size >= 4) add("all_eras");

  // Saved 5
  if (allRankings.length >= 5) add("saved_five");

  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...unlocked]));
  return newlyUnlocked;
}

export { checkAchievements };

export default function Achievements() {
  const [unlocked, setUnlocked] = useState(new Set());
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const saved = (() => { try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || "[]"); } catch { return []; } })();
    setUnlocked(new Set(saved));
  }, []);

  const unlockedList = ALL_ACHIEVEMENTS.filter(a => unlocked.has(a.id));
  const lockedList = ALL_ACHIEVEMENTS.filter(a => !unlocked.has(a.id));

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        .aurora-ach { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: ach-shift 4s ease infinite; }
        @keyframes ach-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-ach font-bold text-sm tracking-wider">ACHIEVEMENTS</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-2 pb-2 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-violet-400" />
        <span className="text-white/40 text-xs">{unlockedList.length} / {ALL_ACHIEVEMENTS.length} unlocked</span>
      </div>

      {/* Unlocked */}
      {unlockedList.length > 0 && (
        <div className="relative z-10 px-4 pb-4">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-3">Unlocked</p>
          <div className="space-y-2">
            {unlockedList.map(a => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"
              >
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{a.title}</p>
                  <p className="text-white/40 text-xs">{a.desc}</p>
                </div>
                <Sparkles className="w-4 h-4 text-violet-400 ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div className="relative z-10 px-4 pb-24">
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold mb-3">Locked</p>
        <div className="space-y-2">
          {lockedList.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-50">
              {a.secret
                ? <Lock className="w-5 h-5 text-white/20 shrink-0" />
                : <span className="text-2xl shrink-0 grayscale">{a.icon}</span>
              }
              <div>
                <p className="text-white/40 font-semibold text-sm">{a.secret ? "???" : a.title}</p>
                <p className="text-white/20 text-xs">{a.secret ? "Secret achievement" : a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}