import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle, Upload, X } from "lucide-react";

const CATEGORIES = ["Feedback", "Suggestion", "Bug Report", "Feature Request", "Other"];
const RATE_LIMIT_KEY = "aespa_feedback_last_sent";
const LAST_MSG_KEY = "aespa_feedback_last_msg";
const RATE_LIMIT_MS = 60000;

export default function Feedback() {
  const [form, setForm] = useState({ category: "Feedback", message: "", email: "" });
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotData, setScreenshotData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.message.trim()) {
      setError("Please enter your feedback before submitting.");
      return;
    }

    // Rate limit
    const lastSent = localStorage.getItem(RATE_LIMIT_KEY);
    if (lastSent && Date.now() - parseInt(lastSent) < RATE_LIMIT_MS) {
      setError("Please wait a moment before sending another message.");
      return;
    }

    // Duplicate prevention
    const lastMsg = localStorage.getItem(LAST_MSG_KEY);
    if (lastMsg === form.message.trim()) {
      setError("This message was already sent. Please modify your feedback.");
      return;
    }

    setSubmitting(true);

    let screenshotUrl = null;
    if (screenshotData && fileRef.current?.files?.[0]) {
      const { file_url } = await db.integrations.Core.UploadFile({ file: fileRef.current.files[0] });
      screenshotUrl = file_url;
    }

    await db.entities.Feedback.create({
      category: form.category,
      message: form.message.trim(),
      user_email: form.email.trim() || null,
      screenshot_url: screenshotUrl,
    });

    localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
    localStorage.setItem(LAST_MSG_KEY, form.message.trim());
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-white font-black text-xl mb-2">Thank you!</h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">Your feedback has been sent to the developer.</p>
          <Link to={createPageUrl("Home")} className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm">
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">FEEDBACK & SUGGESTIONS</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-24 max-w-sm mx-auto">
        <p className="text-white/40 text-xs mb-6 leading-relaxed">
          Share your thoughts, report bugs, or suggest new features. All messages go directly to the developer.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.category === cat
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your feedback here..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Optional email */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Your Email (optional — for replies)</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Screenshot upload */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Screenshot (optional, useful for bug reports)</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              {screenshotName || "Upload Screenshot"}
            </button>
            {screenshotName && (
              <button type="button" onClick={() => { setScreenshotName(""); setScreenshotData(null); }} className="mt-1 flex items-center gap-1 text-red-400/60 text-[10px]">
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
          >
            {submitting ? "Sending..." : <><Send className="w-4 h-4" /> Send Feedback</>}
          </button>
        </form>
      </div>
    </div>
  );
}