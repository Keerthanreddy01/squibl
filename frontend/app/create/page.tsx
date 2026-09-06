"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { createProject, ProjectData } from "@/lib/projects";
import { Rocket, Sparkles, Code2, Link as LinkIcon, Github, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    stack: "",
    github_url: "",
    live_url: "",
    status: "SHIPPED" as ProjectData["status"],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    const stackArray = formData.stack.split(",").map(s => s.trim()).filter(Boolean);
    const userId = user.id || (user as any).uid;
    const authorName = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split("@")[0] || "Builder";
    const authorAvatar = user.user_metadata?.avatar_url || (user as any).photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

    const result = await createProject({
      owner_uid: userId,
      name: formData.name,
      tagline: formData.tagline,
      description: formData.description,
      stack: stackArray,
      team: [authorName],
      github_url: formData.github_url,
      live_url: formData.live_url,
      status: formData.status,
      author_name: authorName,
      author_avatar: authorAvatar
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error instanceof Error ? result.error.message : String(result.error));
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/showcase");
      }, 2000);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-[#0095F6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans overflow-hidden relative selection:bg-white/30 selection:text-white dark:text-black">
      <div className="flex w-full max-w-[1250px] min-h-screen relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0,transparent_50%)] blur-[100px]" />
        </div>

        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 h-full overflow-y-auto no-scrollbar relative z-10 min-w-0">
          <div className="w-full max-w-[600px] pt-12 pb-24 mx-auto px-6 border-r border-l border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#050505]">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <Rocket className="w-8 h-8 text-black dark:text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white mb-4">
              Launch Your Project
            </h1>
            <p className="text-[#A8A8A8] text-[16px] max-w-lg mx-auto">
              Showcase what you've built to the Squibl community. Get feedback, find users, and inspire others.
            </p>
          </motion.div>

          <AnimatePresence>
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-[24px] p-10 text-center flex flex-col items-center justify-center"
              >
                <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Project Launched!</h2>
                <p className="text-green-400/80">Taking you to the showcase...</p>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-8 bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 md:p-12 backdrop-blur-xl"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" /> Basic Info
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white/60">Project Name *</label>
                      <input
                        required
                        maxLength={50}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. Squibl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white/60">Tagline *</label>
                      <input
                        required
                        maxLength={100}
                        value={formData.tagline}
                        onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                        className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. Next-gen builder network"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white/60 flex items-center justify-between">
                      Description *
                      <span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded text-black dark:text-white/40">Markdown supported</span>
                    </label>
                    <textarea
                      required
                      maxLength={1000}
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="Tell the community what your project is all about, what problem it solves, and how you built it."
                    />
                  </div>
                </div>

                {/* Tech & Links */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                    <Code2 className="w-5 h-5 text-purple-400" /> Tech & Links
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white/60">Tech Stack *</label>
                    <input
                      required
                      value={formData.stack}
                      onChange={(e) => setFormData({...formData, stack: e.target.value})}
                      className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. Next.js, Tailwind, Supabase (comma separated)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white/60 flex items-center gap-1.5">
                        <Github className="w-4 h-4" /> GitHub Repository
                      </label>
                      <input
                        type="url"
                        value={formData.github_url}
                        onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                        className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white/60 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4" /> Live Website
                      </label>
                      <input
                        type="url"
                        value={formData.live_url}
                        onChange={(e) => setFormData({...formData, live_url: e.target.value})}
                        className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                    <Info className="w-5 h-5 text-green-400" /> Current Status
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["SHIPPED", "LIVE", "BETA", "OPEN SOURCE"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, status: status as any})}
                        className={`py-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                          formData.status === status
                            ? 'bg-white text-white dark:text-black border-black/20 dark:border-white'
                            : 'bg-white/[0.02] text-black dark:text-white/50 border-gray-200 dark:border-white/10 hover:border-gray-200 dark:border-white/30 hover:text-black dark:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.tagline || !formData.description || !formData.stack}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-black dark:text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black/20 dark:border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" /> Launch to Showcase
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}
