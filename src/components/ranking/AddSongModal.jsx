import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Youtube } from "lucide-react";
import { getAlbumColor, getCustomAlbumColors, saveCustomAlbumColor, isColorTaken, hexToRgb } from "./albumColors";
import TimeInput from "./TimeInput";
import FormPreviewButton from "./FormPreviewButton";

import { useQueryClient } from "@tanstack/react-query";

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

export default function AddSongModal({ onClose, onAdd, customSongs = [], dbSongs = [], dbAlbums = [] }) {
  const [step, setStep] = useState("form");
  const qc = useQueryClient();
  const allSongs = [...customSongs, ...dbSongs];
  // Use dbAlbums if available; fallback to deriving from songs
  const albumOptions = dbAlbums.length > 0
    ? dbAlbums
    : [...new Set(allSongs.map(s => s.album))].map(name => {
        const s = allSongs.find(x => x.album === name);
        return { name, cover_url: s?.cover_url || "", release_date: s?.release_date || "" };
      });
  const uniqueAlbums = albumOptions.map(a => a.name);

  const [form, setForm] = useState({
    title: "",
    artist: "aespa",
    albumMode: "existing",
    album: uniqueAlbums[0] || "",
    newAlbum: "",
    song_type: "single",
    release_date: "",
    track_number: "",
    yt_url: "",
    preview_start: "",
    preview_end: "",
    cover_url: "",
    member: "",
    collab_info: "",
    collab_artist: "",
    ost_source: "",
    original_title: "",
    original_artist: "",
    is_japanese: false,
    lyrics_language: "",
    notes: "",
  });
  const [albumColor, setAlbumColor] = useState("#3D1A5C");
  const [colorError, setColorError] = useState("");
  const [error, setError] = useState("");

  // Prefill album info when existing album is selected
  const handleAlbumSelect = (albumName) => {
    const albumRecord = albumOptions.find(a => a.name === albumName);
    const songFallback = allSongs.find(s => s.album === albumName);
    setForm(f => ({
      ...f,
      album: albumName,
      cover_url: albumRecord?.cover_url || songFallback?.cover_url || f.cover_url || "",
      release_date: albumRecord?.release_date || songFallback?.release_date || f.release_date || "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const title = form.title.trim();
    const albumName = form.albumMode === "new" ? form.newAlbum.trim() : form.album;

    const dateOptional = form.song_type === "cover" || form.song_type === "solo";

    if (!title) return setError("Song title is required.");
    if (!albumName) return setError("Album name is required.");
    if (!form.release_date && !dateOptional) return setError("Release date is required.");
    if (!form.cover_url.trim()) return setError("Cover art URL is required.");
    if (!form.yt_url.trim()) return setError("Audio preview link (YouTube URL) is required.");
    if (!extractYouTubeId(form.yt_url)) return setError("Could not extract a valid YouTube video ID from the URL.");
    if (allSongs.some(s => s.title.toLowerCase() === title.toLowerCase())) {
      return setError("A song with this title already exists.");
    }

    // Validate unique track_number within album
    if (form.track_number !== "") {
      const tn = Number(form.track_number);
      const duplicate = allSongs.find(s => s.album === albumName && s.track_number === tn);
      if (duplicate) return setError(`Track number ${tn} is already used by "${duplicate.title}" in this album.`);
    }

    // If new album, validate color and auto-create Album record
    if (form.albumMode === "new") {
      if (isColorTaken(albumColor)) {
        setColorError("This color is already assigned to another album.");
        setStep("new_album_color");
        return;
      }
      const rgb = hexToRgb(albumColor);
      saveCustomAlbumColor(albumName, { hex: albumColor, rgb, label: "Custom" });
      // Auto-create Album entity record so it appears in dropdown immediately
      db.entities.Album.create({
        name: albumName,
        cover_url: form.cover_url.trim() || "",
        release_date: form.release_date || "",
        lightstick_color: albumColor,
      }).then(() => qc.invalidateQueries(['albums'])).catch(() => {});
    }

    const ytId = extractYouTubeId(form.yt_url);

    onAdd({
      title,
      artist: form.artist.trim() || "aespa",
      album: albumName,
      song_type: form.song_type,
      release_date: form.release_date,
      track_number: form.track_number !== "" ? Number(form.track_number) : null,
      cover_url: form.cover_url.trim(),
      yt_id: ytId,
      youtube_url: form.yt_url.trim(),
      preview_start: form.preview_start !== "" ? Number(form.preview_start) : null,
      preview_end: form.preview_end !== "" ? Number(form.preview_end) : null,
      yt_shorts: false,
      is_japanese: form.is_japanese,
      lyrics_language: form.lyrics_language || null,
      notes: form.notes.trim() || null,
      isCustom: true,
      ...(form.member ? { member: form.member } : {}),
      ...(form.song_type === "collaboration" && form.collab_info.trim() ? { collab_info: form.collab_info.trim() } : {}),
      ...(form.collab_artist.trim() ? { collab_artist: form.collab_artist.trim() } : {}),
      ...(form.song_type === "ost" && form.ost_source.trim() ? { ost_source: form.ost_source.trim() } : {}),
      ...(form.song_type === "cover" ? {
        original_title: form.original_title.trim() || null,
        original_artist: form.original_artist.trim() || null,
      } : {}),
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
            <h2 className="text-white font-bold text-base">Add a Song</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <Field label="Song Title *">
              <input
                type="text"
                placeholder="e.g. Forever"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={INPUT}
              />
            </Field>

            {/* Artist */}
            <Field label="Artist">
              <input
                type="text"
                value={form.artist}
                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                className={INPUT}
              />
            </Field>

            {/* Album mode toggle */}
            <Field label="Album *">
              <div className="flex gap-2 mb-2">
                {["existing", "new"].map(mode => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setForm(f => ({ ...f, albumMode: mode }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.albumMode === mode
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-white/50"
                    }`}
                  >
                    {mode === "existing" ? "Existing Album" : "New Album"}
                  </button>
                ))}
              </div>
              {form.albumMode === "existing" ? (
                <select
                  value={form.album}
                  onChange={e => handleAlbumSelect(e.target.value)}
                  className={INPUT}
                >
                  {uniqueAlbums.map(a => (
                    <option key={a} value={a} className="bg-black">{a}</option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New album name"
                    value={form.newAlbum}
                    onChange={e => setForm(f => ({ ...f, newAlbum: e.target.value }))}
                    className={INPUT}
                  />
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Album Color *</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={albumColor}
                        onChange={e => { setAlbumColor(e.target.value); setColorError(""); }}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <div
                        className="flex-1 h-10 rounded-lg border border-white/10"
                        style={{ backgroundColor: albumColor }}
                      />
                    </div>
                    {colorError && <p className="text-red-400 text-xs mt-1">{colorError}</p>}
                    <p className="text-white/25 text-[10px] mt-1">Each album must have a unique color</p>
                  </div>
                </div>
              )}
            </Field>

            {/* Type */}
            <Field label="Type *">
              <select
                value={form.song_type}
                onChange={e => setForm(f => ({ ...f, song_type: e.target.value, member: "", collab_info: "" }))}
                className={INPUT}
              >
                {SONG_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="bg-black">{t.label}</option>
                ))}
              </select>
            </Field>

            {/* Member selection — required for solo, optional for all others */}
            <Field label={form.song_type === "solo" ? "Member *" : "Member (optional)"}>
              <div className="flex gap-2 flex-wrap">
                {form.song_type !== "solo" && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, member: "" }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!form.member ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/40"}`}>
                    All
                  </button>
                )}
                {["Karina", "Giselle", "Winter", "Ningning"].map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setForm(f => ({ ...f, member: m }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.member === m
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {form.song_type === "solo" && !form.member && (
                <p className="text-amber-400/70 text-[10px] mt-1">Select which member's solo this is — it'll appear in the Solos tab under that member.</p>
              )}
              {form.song_type !== "solo" && form.member && (
                <p className="text-white/25 text-[10px] mt-1">Optional: tag this song to a specific member</p>
              )}
            </Field>

            {/* Cover: original song info */}
            {form.song_type === "cover" && (
              <>
                <Field label="Original Song Title *">
                  <input
                    type="text"
                    placeholder="e.g. Chandelier"
                    value={form.original_title}
                    onChange={e => setForm(f => ({ ...f, original_title: e.target.value }))}
                    className={INPUT}
                  />
                </Field>
                <Field label="Original Artist *">
                  <input
                    type="text"
                    placeholder="e.g. Sia"
                    value={form.original_artist}
                    onChange={e => setForm(f => ({ ...f, original_artist: e.target.value }))}
                    className={INPUT}
                  />
                </Field>
              </>
            )}

            {/* Collab: featuring info */}
            {form.song_type === "collaboration" && (
              <Field label="Featuring / With">
                <input
                  type="text"
                  placeholder="e.g. aespa & TOKiMONSTA"
                  value={form.collab_info}
                  onChange={e => setForm(f => ({ ...f, collab_info: e.target.value }))}
                  className={INPUT}
                />
                <p className="text-white/25 text-[10px] mt-1">Shown in song details and lists</p>
              </Field>
            )}

            {/* Release date + Track number */}
            <Field label={`Release Date${(form.song_type === "cover" || form.song_type === "solo") ? " (optional)" : " *"}`}>
              <input
                type="date"
                value={form.release_date}
                onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))}
                className={INPUT}
              />
            </Field>

            <Field label="Track Number (optional)">
              <input
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={form.track_number}
                onChange={e => setForm(f => ({ ...f, track_number: e.target.value }))}
                className={INPUT}
              />
              <p className="text-white/25 text-[10px] mt-1">Track position within the album</p>
            </Field>

            {/* YouTube URL + preview times */}
            <Field label="YouTube URL * (required for audio preview)">
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400/60" />
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.yt_url}
                  onChange={e => setForm(f => ({ ...f, yt_url: e.target.value }))}
                  className={INPUT + " pl-10"}
                />
              </div>
              {form.yt_url && extractYouTubeId(form.yt_url) && (
                <p className="text-green-400/70 text-[10px] mt-1">✓ Video ID: {extractYouTubeId(form.yt_url)}</p>
              )}
              {form.yt_url && !extractYouTubeId(form.yt_url) && (
                <p className="text-red-400/70 text-[10px] mt-1">Could not extract video ID</p>
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

            {/* Cover URL */}
            <Field label="Cover Image URL *">
              <input
                type="url"
                placeholder="https://..."
                value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                className={INPUT}
              />
              {form.cover_url && (
                <img src={form.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover mt-2 border border-white/10" onError={e => e.target.style.display='none'} />
              )}
            </Field>

            {/* OST source */}
            {form.song_type === "ost" && (
              <Field label="OST Source (movie / show / game)">
                <input type="text" placeholder="e.g. PUBG Mobile" value={form.ost_source}
                  onChange={e => setForm(f => ({ ...f, ost_source: e.target.value }))} className={INPUT} />
              </Field>
            )}

            {/* Collab artist */}
            {form.song_type === "collaboration" && (
              <Field label="Collaborating Artist">
                <input type="text" placeholder="e.g. Anderson .Paak" value={form.collab_artist}
                  onChange={e => setForm(f => ({ ...f, collab_artist: e.target.value }))} className={INPUT} />
              </Field>
            )}

            {/* Lyrics language */}
            <Field label="Lyrics Language (optional)">
              <select value={form.lyrics_language} onChange={e => setForm(f => ({ ...f, lyrics_language: e.target.value }))} className={INPUT}>
                <option value="" className="bg-black">— Select —</option>
                {["Korean", "Japanese", "English", "Mixed"].map(l => (
                  <option key={l} value={l} className="bg-black">{l}</option>
                ))}
              </select>
            </Field>

            {/* Japanese toggle */}
            <Field label="Japanese Release">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_japanese: !f.is_japanese }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_japanese ? "bg-violet-600" : "bg-white/10"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_japanese ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-white/50 text-xs">{form.is_japanese ? "Yes — Japanese release" : "No"}</span>
              </div>
            </Field>

            {/* Notes */}
            <Field label="Notes (optional)">
              <textarea rows={2} placeholder="Any extra info..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={INPUT + " resize-none"} />
            </Field>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors mt-2"
            >
              Add Song
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";