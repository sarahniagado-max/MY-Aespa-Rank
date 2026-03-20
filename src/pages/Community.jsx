import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Flame } from "lucide-react";

const COMPLETE_KEY = "aespa_ranking_complete";

// Simulated community average rankings (based on popular aespa rankings online)
// Lower = more popular (closer to #1)
const COMMUNITY_AVG = {
  "Black Mamba": 3,
  "Next Level": 4,
  "Savage": 2,
  "Girls": 6,
  "Spicy": 8,
  "Supernova": 1,
  "Armageddon": 9,
  "Whiplash": 5,
  "Drama": 7,
  "Illusion": 14,
  "Lingo": 16,
  "Life's Too Short": 18,
  "YEPPI YEPPI": 22,
  "ICU": 24,
  "ænergy": 20,
  "Thirsty": 26,
  "Salty & Sweet": 28,
  "Kill It": 12,
  "Flights, Not Feelings": 13,
  "Pink Hoodie": 19,
  "Flowers": 21,
  "Just Another Girl": 23,
  "Hot Mess": 30,
  "Live My Life": 25,
  "Melody": 27,
  "Mine": 29,
  "Licorice": 31,
  "BAHAMA": 35,
  "Set The Tone": 32,
  "Prologue": 36,
  "Long Chat (#♥)": 38,
  "BAHAMA": 34,
  "Better Things": 40,
  "YOLO": 42,
  "Hot Air Balloon": 44,
  "Don't Blink": 46,
  "Trick or Trick": 48,
  "You": 50,
  "Welcome to MY World": 52,
  "'Til We Meet Again": 54,
  "I'm Unhappy": 56,
  "I'll Make You Cry": 58,
  "ICONIC": 60,
  "Lucid Dream": 62,
  "Dreams Come True": 64,
  "Forever": 66,
  "Life's Too Short (English Version)": 20,
  "Dirty Work": 10,
  "Rich Man": 11,
  "Drift": 15,
  "Bubble": 17,
  "Count On Me": 33,
  "Angel #48": 37,
  "To The Girls": 39,
  "Supernova": 1,
  "Whiplash": 5,
};

function getDeviation(userRank, communityRank) {
  return communityRank - userRank; // positive = user ranks it higher than community
}

function getControversy(deviation) {
  const abs = Math.abs(deviation);
  if (abs >= 15) return "🔥🔥 Extremely uncommon ranking";
  if (abs >= 8) return "🔥 Uncommon ranking";
  return null;
}

export default function Community() {
  const [rankingData, setRankingData] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPLETE_KEY);
      if (saved) setRankingData(JSON.parse(saved));
    } catch {}
  }, []);

  if (!rankingData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <p className="text-white/40 text-sm mb-4">No ranking completed yet</p>
        <Link to={createPageUrl("Battle")} className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm">Start Ranking</Link>
      </div>
    );
  }

  const { rankings } = rankingData;

  const compared = rankings
    .filter(r => r.song?.title && COMMUNITY_AVG[r.song.title] !== undefined)
    .map((r, i) => {
      const userRank = i + 1;
      const communityRank = COMMUNITY_AVG[r.song.title];
      const dev = getDeviation(userRank, communityRank);
      return { song: r.song, userRank, communityRank, deviation: dev };
    })
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  const highlyDeviant = compared.filter(c => Math.abs(c.deviation) >= 8);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        .aurora-com { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: com-shift 4s ease infinite; }
        @keyframes com-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Results")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-com font-bold text-sm tracking-wider">COMMUNITY COMPARE</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-1 pb-3">
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Users className="w-3.5 h-3.5" />
          <span>Comparing your ranking vs community average</span>
        </div>
      </div>

      {/* Controversy banner */}
      {highlyDeviant.length > 0 && (
        <div className="relative z-10 mx-4 mb-4 p-3 rounded-xl bg-orange-950/40 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Your ranking is controversial!</span>
          </div>
          <p className="text-orange-200/60 text-[11px]">You have {highlyDeviant.length} song(s) ranked very differently from the community average.</p>
        </div>
      )}

      <div className="relative z-10 px-4 pb-24 space-y-2">
        {compared.map(({ song, userRank, communityRank, deviation }) => {
          const controversy = getControversy(deviation);
          return (
            <motion.div
              key={song.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl border ${controversy ? "border-orange-500/25 bg-orange-950/20" : "border-white/5 bg-white/[0.02]"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                  <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium truncate">{song.title}</p>
                  {controversy && <p className="text-orange-400 text-[10px]">{controversy}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/50">You: <span className="text-white font-bold">#{userRank}</span></span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/50">Avg: <span className="text-cyan-300 font-bold">#{communityRank}</span></span>
                  </div>
                  {deviation !== 0 && (
                    <p className={`text-[10px] mt-0.5 ${deviation > 0 ? "text-green-400" : "text-red-400"}`}>
                      {deviation > 0
                        ? `You ranked it ${deviation} spots higher`
                        : `You ranked it ${Math.abs(deviation)} spots lower`}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {compared.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/30 text-sm">No community data available for your ranked songs.</p>
          </div>
        )}
      </div>
    </div>
  );
}