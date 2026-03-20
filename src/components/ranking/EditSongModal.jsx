import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Youtube } from "lucide-react";
import TimeInput from "./TimeInput";
import FormPreviewButton from "./FormPreviewButton";

const SONG_TYPES = [
  { value: "single", label: "Single" },
  { value: "title_track", label: "Title Track" },
  { value: "b_side", label: "B-side" },
  { value: "pre_release", label: "Pre-release" },
  { value: "ost", label: "OST" },
  { value: "collaboration", label: "Collab" },
  { value: "solo", label: "Solo" },
  { value: "cover", label: "Cover" },
];

const MEMBERS = ["Karina", "Giselle", "Winter", "Ningning"];

const MEMBER_COLORS = {
  Karina:   "#3B82F6",
  Giselle:  "#EC4899",
  Winter:   "#EF4444",
  Ningning: "#A855F7",
};

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default function EditSongModal({ song, onClose, onSave, allSongs = [] }) {
  const [form, setForm] = useState({
    title: song.title || "",
    artist: song.artist || "aespa",
    album: song.album || "",
    song_type: song.song_type || "single",
    release_date: song.release_date || "",
    track_number: song.track_number ?? "",
    yt_url: song.youtube_url || (song.yt_id ? `https://youtube.com/watch?v=${song.yt_id}` : ""),
    preview_start: song.preview_start ?? song.yt_start ?? "",
    preview_end: song.preview_end ?? song.yt_end ?? "",
    cover_url: song.cover_url || "",
    member: song.member || "",
    member_color: song.member_color || MEMBER_COLORS[song.member] || "",
    collab_info: song.collab_info || "",
    collab_artist: song.collab_artist || "",
    ost_source: song.ost_source || "",
    original_title: song.original_title || "",
    original_artist: song.original_artist || "",
    is_japanese: song.is_japanese || false,
    lyrics_language: song.lyrics_language || "",
    notes: song.notes || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const title = form.title.trim();
    if (!title) return setError("Title is required.");

    // Validate unique track_number within album (excluding current song)
    if (form.track_number !== "" && form.track_number !== null) {
      const tn = Number(form.track_number);
      const albumName = form.album.trim() || song.album;
      const duplicate = allSongs.find(s => s.album === albumName && s.track_number === tn && s.title !== song.title);
      if (duplicate) return setError(`Track number ${tn} is already used by "${duplicate.title}" in this album.`);
    }

    const ytId = extractYouTubeId(form.yt_url);
    onSave({
      ...song,
      title,
      artist: form.artist.trim() || "aespa",
      album: form.album.trim() || song.album,
      song_type: form.song_type,
      release_date: form.release_date,
      track_number: form.track_number !== "" ? Number(form.track_number) : null,
      cover_url: form.cover_url.trim() || null,
      yt_id: ytId || song.yt_id || null,
      youtube_url: form.yt_url.trim() || null,
      preview_start: form.preview_start !== "" ? Number(form.preview_start) : null,
      preview_end: form.preview_end !== "" ? Number(form.preview_end) : null,
      member: form.member || null,
      member_color: form.member ? (form.member_color || MEMBER_COLORS[form.member] || null) : null,
      collab_info: form.collab_info.trim() || null,
      collab_artist: form.collab_artist.trim() || null,
      ost_source: form.ost_source.trim() || null,
      original_title: form.original_title.trim() || null,
      original_artist: form.original_artist.trim() || null,
      is_japanese: form.is_japanese,
      lyrics_language: form.lyrics_language || null,
      notes: form.notes.trim() || null,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">Edit Song</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Song Title *">
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT} />
            </Field>

            <Field label="Artist">
              <input type="text" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} className={INPUT} />
            </Field>

            <Field label="Album">
              <input type="text" value={form.album} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} className={INPUT} />
            </Field>

            <Field label="Type *">
              <select value={form.song_type} onChange={e => setForm(f => ({ ...f, song_type: e.target.value }))} className={INPUT}>
                {SONG_TYPES.map(t => <option key={t.value} value={t.value} className="bg-black">{t.label}</option>)}
              </select>
            </Field>

            {/* Member selection for all types */}
            <Field label="Member (optional)">
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => setForm(f => ({ ...f, member: "", member_color: "" }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!form.member ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/40"}`}>
                  All
                </button>
                {MEMBERS.map(m => (
                  <button type="button" key={m} onClick={() => setForm(f => ({ ...f, member: m, member_color: f.member_color || MEMBER_COLORS[m] }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.member === m ? "text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"}`}
                    style={form.member === m ? { background: MEMBER_COLORS[m] + "33", borderColor: MEMBER_COLORS[m] + "88", color: "white" } : {}}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            {/* Member color override */}
            {form.member && (
              <Field label="Member Color">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.member_color || MEMBER_COLORS[form.member] || "#7c3aed"}
                    onChange={e => setForm(f => ({ ...f, member_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <div className="flex-1 h-10 rounded-lg border border-white/10 flex items-center px-3">
                    <span className="text-white/50 text-xs">{form.member_color || MEMBER_COLORS[form.member]}</span>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, member_color: MEMBER_COLORS[f.member] || "" }))}
                    className="text-white/30 hover:text-white/70 text-xs border border-white/10 rounded-lg px-2 py-1">Reset</button>
                </div>
              </Field>
            )}

            {form.song_type === "collaboration" && (
              <Field label="Collab Info">
                <input type="text" placeholder="e.g. aespa & TOKiMONSTA" value={form.collab_info}
                  onChange={e => setForm(f => ({ ...f, collab_info: e.target.value }))} className={INPUT} />
              </Field>
            )}

            {form.song_type === "cover" && (
              <>
                <Field label="Original Title">
                  <input type="text" value={form.original_title} onChange={e => setForm(f => ({ ...f, original_title: e.target.value }))} className={INPUT} />
                </Field>
                <Field label="Original Artist">
                  <input type="text" value={form.original_artist} onChange={e => setForm(f => ({ ...f, original_artist: e.target.value }))} className={INPUT} />
                </Field>
              </>
            )}

            <Field label="Release Date">
              <input type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} className={INPUT} />
            </Field>

            <Field label="Track Number (optional)">
              <input type="number" min="1" placeholder="e.g. 3" value={form.track_number}
                onChange={e => setForm(f => ({ ...f, track_number: e.target.value }))} className={INPUT} />
            </Field>

            <Field label="YouTube URL">
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400/60" />
                <input type="url" placeholder="https://youtube.com/watch?v=..." value={form.yt_url}
                  onChange={e => setForm(f => ({ ...f, yt_url: e.target.value }))} className={INPUT + " pl-10"} />
              </div>
              {form.yt_url && extractYouTubeId(form.yt_url) && (
                <p className="text-green-400/70 text-[10px] mt-1">✓ ID: {extractYouTubeId(form.yt_url)}</p>
              )}
            </Field>

            <div className="flex gap-2">
              <TimeInput label="Preview Start (MM:SS)"
                value={form.preview_start}
                onChange={v => setForm(f => ({ ...f, preview_start: v ?? "" }))} />
              <TimeInput label="Preview End (MM:SS)"
                value={form.preview_end}
                onChange={v => setForm(f => ({ ...f, preview_end: v ?? "" }))} />
            </div>
            <FormPreviewButton
              ytId={extractYouTubeId(form.yt_url)}
              startSec={form.preview_start}
              endSec={form.preview_end}
            />

            <Field label="Cover Image URL">
              <input type="url" placeholder="https://..." value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className={INPUT} />
              {form.cover_url && (
                <img src={form.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover mt-2 border border-white/10" onError={e => e.target.style.display='none'} />
              )}
            </Field>

            {form.song_type === "ost" && (
              <Field label="OST Source">
                <input type="text" placeholder="e.g. PUBG Mobile" value={form.ost_source}
                  onChange={e => setForm(f => ({ ...f, ost_source: e.target.value }))} className={INPUT} />
              </Field>
            )}

            {form.song_type === "collaboration" && (
              <Field label="Collaborating Artist">
                <input type="text" placeholder="e.g. Anderson .Paak" value={form.collab_artist}
                  onChange={e => setForm(f => ({ ...f, collab_artist: e.target.value }))} className={INPUT} />
              </Field>
            )}

            <Field label="Lyrics Language (optional)">
              <select value={form.lyrics_language} onChange={e => setForm(f => ({ ...f, lyrics_language: e.target.value }))} className={INPUT}>
                <option value="" className="bg-black">— Select —</option>
                {["Korean", "Japanese", "English", "Mixed"].map(l => (
                  <option key={l} value={l} className="bg-black">{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Japanese Release">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, is_japanese: !f.is_japanese }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_japanese ? "bg-violet-600" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_japanese ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-white/50 text-xs">{form.is_japanese ? "Yes" : "No"}</span>
              </div>
            </Field>

            <Field label="Notes (optional)">
              <textarea rows={2} placeholder="Any extra info..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={INPUT + " resize-none"} />
            </Field>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button type="submit" className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors mt-2">
              Save Changes
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}