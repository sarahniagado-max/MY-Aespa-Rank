import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Pencil, Trophy, ChevronRight, Swords, RotateCcw, ImageIcon } from "lucide-react";
import ConfirmDeleteModal from "../components/ranking/ConfirmDeleteModal";

const ALL_RANKINGS_KEY = "aespa_all_rankings";
const COMPLETE_KEY = "aespa_ranking_complete";
const STORAGE_KEY = "aespa_ranking_state";

export default function SavedRankings() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // index
  const fileInputRef = React.useRef(null);
  const [imageUploadIdx, setImageUploadIdx] = useState(null);

  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; }
    })();
    setRankings(all.reverse());
  }, []);

  const save = (updated) => {
    localStorage.setItem(ALL_RANKINGS_KEY, JSON.stringify([...updated].reverse()));
    setRankings(updated);
  };

  const handleDelete = (i) => setDeleteConfirm(i);

  const confirmDelete = () => {
    const updated = [...rankings];
    updated.splice(deleteConfirm, 1);
    save(updated);
    setDeleteConfirm(null);
  };

  const handleRankAgain = (r) => {
    // Extract included song titles from the ranking
    const includedTitles = new Set(r.rankings.map(x => x.song?.title).filter(Boolean));
    // Store a "rank again" session stub - we navigate to Battle with the same songs
    // We pass the info via localStorage
    localStorage.setItem("aespa_rank_again", JSON.stringify({
      songTitles: [...includedTitles],
      albumFilter: r.albumFilter || "all",
      songTypeFilter: r.songTypeFilter || "all",
    }));
    localStorage.removeItem(STORAGE_KEY);
    navigate(createPageUrl("Battle"));
  };

  const handleRename = (i) => {
    setEditingIndex(i);
    setEditName(rankings[i].label || `Ranking ${rankings.length - i}`);
  };

  const handleSaveRename = (i) => {
    const updated = [...rankings];
    updated[i] = { ...updated[i], label: editName };
    save(updated);
    setEditingIndex(null);
  };

  const handleOpen = (i) => {
    const r = rankings[i];
    localStorage.setItem(COMPLETE_KEY, JSON.stringify(r));
    navigate(createPageUrl("Results"));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || imageUploadIdx === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = [...rankings];
      updated[imageUploadIdx] = { ...updated[imageUploadIdx], customImage: ev.target.result };
      save(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">SAVED RANKINGS</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-2 pb-24">
        {rankings.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-20">
            <Trophy className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-6">No rankings saved yet</p>
            <Link to={createPageUrl("Battle")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm">
              <Swords className="w-4 h-4" />
              Start Ranking
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {rankings.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden"
              >
                {editingIndex === i ? (
                  <div className="p-4 flex gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveRename(i); if (e.key === "Escape") setEditingIndex(null); }}
                      className="flex-1 bg-white/10 border border-violet-500/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                    />
                    <button onClick={() => handleSaveRename(i)} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold">Save</button>
                    <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/50 text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {/* Cover (custom or default #1 song) */}
                    <div className="w-16 h-16 shrink-0 overflow-hidden relative group">
                      {(r.customImage || r.rankings?.[0]?.song?.cover_url) && (
                        <img src={r.customImage || r.rankings[0].song.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setImageUploadIdx(i); fileInputRef.current?.click(); }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        title="Change image"
                      >
                        <ImageIcon className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                    {/* Info */}
                    <button
                      onClick={() => handleOpen(i)}
                      className="flex-1 text-left px-4 py-3 min-w-0"
                    >
                      <p className="text-white font-semibold text-sm truncate">{r.label || `Ranking ${rankings.length - i}`}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {new Date(r.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        {r.albumFilter && r.albumFilter !== "all" ? ` · ${r.albumFilter}` : ""}
                        {r.titleTracksOnly ? " · Title tracks" : ""}
                      </p>
                      <p className="text-violet-400/60 text-[10px] mt-1 uppercase tracking-wider">
                        #1: {r.rankings?.[0]?.song?.title || "—"}
                      </p>
                    </button>
                    {/* Actions */}
                    <div className="flex items-center gap-1 pr-3">
                      <button onClick={() => handleRankAgain(r)} className="p-2 text-white/20 hover:text-cyan-400 transition-colors" title="Rank these songs again">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRename(i)} className="p-2 text-white/20 hover:text-white/60 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(i)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-white/10" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteConfirm !== null}
        title="Delete Ranking?"
        message="This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}