import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { format } from "date-fns";

const COMPLETE_KEY = "aespa_ranking_complete";

const AURORA_CSS = `
  .aurora-card-text {
    background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: aurora-card 4s ease infinite;
  }
  @keyframes aurora-card { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
`;

// Group consecutive same-rating items as ties, build display rows
function buildRankedRows(rankings, limit = 10) {
  if (!rankings || rankings.length === 0) return [];

  // Determine display limit: top 10, but include all tied at boundary
  const displayCount = rankings.length <= limit ? rankings.length : limit;

  // Find all items we must include (top 10 + ties at boundary)
  const boundaryRating = rankings[displayCount - 1]?.rating;
  const items = rankings.filter((item, i) => i < displayCount || item.rating === boundaryRating);

  // Build rows grouping ties
  const rows = [];
  let i = 0;
  let rankNumber = 1;
  while (i < items.length) {
    const rating = items[i].rating;
    const tied = [];
    while (i < items.length && items[i].rating === rating) {
      tied.push(items[i]);
      i++;
    }
    rows.push({ rank: rankNumber, items: tied, isTie: tied.length > 1 });
    rankNumber += tied.length;
  }
  return rows;
}

export default function ShareCard() {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const saved = (() => { try { return JSON.parse(localStorage.getItem(COMPLETE_KEY) || "null"); } catch { return null; } })();
  const rows = buildRankedRows(saved?.rankings || []);
  const top1Row = rows[0];
  const top1 = top1Row?.items[0];
  const date = saved?.completedAt ? format(new Date(saved.completedAt), "MMM d, yyyy") : "";

  const handleDownload = async () => {
    setDownloading(true);
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#000", useCORS: true, scale: 2 });
    const link = document.createElement("a");
    link.download = "my-aespa-rank.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloading(false);
  };

  if (!saved) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">No ranking found. <Link to={createPageUrl("Battle")} className="text-violet-400 underline">Start ranking</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 relative overflow-hidden">
      <style>{AURORA_CSS}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to={createPageUrl("Results")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">Shareable Card</h1>
        <div className="w-9" />
      </div>

      {/* Card preview */}
      <div className="flex justify-center mb-6">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0a0010 0%, #0d0020 40%, #000d1a 100%)",
            border: "1px solid rgba(167,139,250,0.2)",
            boxShadow: "0 0 80px rgba(167,139,250,0.15)",
            padding: "32px 24px",
          }}
        >
          {/* Aurora glow bg */}
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Title */}
          <div className="text-center mb-6 relative z-10">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-bold mb-1">MY AESPA RANK</p>
            <p className="aurora-card-text text-[11px] font-semibold">{date}</p>
          </div>

          {/* #1 spotlight — handles ties at #1 */}
          {top1Row && (
            <div className="flex flex-col items-center mb-6 relative z-10">
              <div className="aurora-card-text text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
                {top1Row.isTie ? "#1 · TIE" : "#1"}
              </div>
              {top1Row.isTie ? (
                // Tied #1 — show side by side
                <div className="flex gap-3 mb-2 justify-center">
                  {top1Row.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-violet-400/50 mb-1">
                        <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-white font-bold text-xs text-center leading-tight max-w-[80px] truncate">{item.song?.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ position: "relative", width: 120, height: 120, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: -5, borderRadius: 20, border: "3px solid transparent", background: "linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399) border-box", WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                    <div style={{ position: "absolute", inset: -8, borderRadius: 24, boxShadow: "0 0 20px rgba(167,139,250,0.5), 0 0 40px rgba(103,232,249,0.25)", pointerEvents: "none" }} />
                    <div className="w-28 h-28 rounded-2xl overflow-hidden relative z-10">
                      <img src={top1?.song?.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <p className="text-white font-black text-xl text-center leading-tight">{top1?.song?.title}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wider mt-1">{top1?.song?.album}</p>
                </>
              )}
            </div>
          )}

          {/* Rest of top 10 */}
          <div className="space-y-2 relative z-10">
            {rows.slice(1).map((row) => (
              row.isTie ? (
                // Tied row — group them with TIE badge
                <div key={row.rank} className="rounded-xl border border-violet-400/20 bg-violet-900/10 overflow-hidden">
                  <div className="flex items-center gap-1 px-2 pt-1.5">
                    <span className="text-violet-400 text-[9px] font-bold uppercase tracking-widest">#{row.rank} · TIE</span>
                  </div>
                  {row.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2">
                      <span className="text-white/20 text-xs font-bold w-4 text-center">—</span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-xs font-semibold truncate">{item.song?.title}</p>
                        <p className="text-white/30 text-[10px] truncate">{item.song?.album}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div key={row.rank} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-white/30 text-xs font-bold w-4 text-center">#{row.rank}</span>
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <img src={row.items[0].song?.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-xs font-semibold truncate">{row.items[0].song?.title}</p>
                    <p className="text-white/30 text-[10px] truncate">{row.items[0].song?.album}</p>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 relative z-10">
            <p className="aurora-card-text text-[10px] font-bold uppercase tracking-[0.3em]">æspa</p>
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-colors text-white"
          style={{ background: "linear-gradient(135deg, #0070f3, #00b4ff)", boxShadow: "0 0 24px rgba(0,112,243,0.5)" }}
        >
          <Download className="w-5 h-5" />
          {downloading ? "Downloading..." : "Download Image"}
        </button>
        <button
          onClick={async () => {
            if (navigator.share) {
              navigator.share({ title: "MY Aespa Rank", text: `My #1 aespa song is ${top1?.song?.title}!`, url: window.location.href });
            } else {
              await navigator.clipboard.writeText(`MY Aespa Rank — My #1 is ${top1?.song?.title}! 🎵`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 text-white/60 hover:text-white font-semibold text-sm transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}