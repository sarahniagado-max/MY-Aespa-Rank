const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';

export default function PageNotFound() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await db.auth.isAuthenticated();
      if (isAuth) {
        const u = await db.auth.me();
        setUser(u);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-3xl font-bold text-white">Welcome to MY Aespa Rank</h1>
        <p className="text-white/60 text-center max-w-xs">Sign in to start ranking your favorite aespa songs</p>
        <button
          onClick={() => db.auth.redirectToLogin()}
          className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors"
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-white/60">Page not found</p>
      <a href="/" className="px-6 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
        Go Home
      </a>
    </div>
  );
}