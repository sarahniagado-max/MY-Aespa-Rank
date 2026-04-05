import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-white/60">Page not found</p>
      <Link to="/" className="px-6 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
        Go Home
      </Link>
    </div>
  );
}
