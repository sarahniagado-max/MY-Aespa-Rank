import React, { useState } from "react";
import { X, Plus } from "lucide-react";

const DEFAULT_TAGS = ["comfort song", "hype", "gym", "crying hours", "bop", "underrated"];

const TAG_COLORS = [
  "bg-violet-500/20 border-violet-500/40 text-violet-300",
  "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
  "bg-rose-500/20 border-rose-500/40 text-rose-300",
  "bg-amber-500/20 border-amber-500/40 text-amber-300",
  "bg-green-500/20 border-green-500/40 text-green-300",
  "bg-pink-500/20 border-pink-500/40 text-pink-300",
];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function getTagsForSong(songTitle) {
  const key = `aespa_tags_${songTitle}`;
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    try { return JSON.parse(stored); } catch { return []; }
  }
  // Pre-load defaults on first access
  localStorage.setItem(key, JSON.stringify(DEFAULT_TAGS));
  return [...DEFAULT_TAGS];
}

function saveTagsForSong(songTitle, tags) {
  localStorage.setItem(`aespa_tags_${songTitle}`, JSON.stringify(tags));
}

export default function SongTags({ songTitle }) {
  const [tags, setTags] = useState(() => getTagsForSong(songTitle));
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [newTag, setNewTag] = useState("");
  const [showInput, setShowInput] = useState(false);

  const removeTag = (tag) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    saveTagsForSong(songTitle, updated);
    setConfirmRemove(null);
  };

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) { setNewTag(""); return; }
    const updated = [...tags, trimmed];
    setTags(updated);
    saveTagsForSong(songTitle, updated);
    setNewTag("");
    setShowInput(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    if (e.key === "Escape") { setShowInput(false); setNewTag(""); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTagColor(tag)}`}
          >
            {tag}
            <button
              onClick={() => setConfirmRemove(tag)}
              className="opacity-60 hover:opacity-100 transition-opacity leading-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {showInput ? (
          <input
            autoFocus
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!newTag.trim()) { setShowInput(false); } }}
            placeholder="New tag…"
            className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 border border-white/20 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 w-24"
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
          >
            <Plus className="w-2.5 h-2.5" />
            Add
          </button>
        )}
      </div>

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-xs bg-[#111] border border-white/12 rounded-2xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm">Remove tag?</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Are you sure you want to remove <span className="text-white font-semibold">'{confirmRemove}'</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2 rounded-xl border border-white/15 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removeTag(confirmRemove)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}