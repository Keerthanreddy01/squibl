"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function WelcomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If no user after loading, redirect to login
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="h-screen w-full bg-white dark:bg-black flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="relative w-full h-screen bg-white dark:bg-black overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold text-black dark:text-white mb-4 animate-fade-in">
          Welcome to Squibl
        </h1>
        <p className="text-[#A8A8A8] text-xl">
          {user.user_metadata?.full_name || "Builder"}, your ID card is ready.
        </p>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <button 
          onClick={() => router.push("/dashboard/home")}
          className="px-8 py-4 bg-white text-white dark:text-black font-bold rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          Enter Workspace
        </button>
      </div>
    </div>
  );
}
