"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getAllProfiles } from "@/lib/profiles";
import { getUserProjects } from "@/lib/projects";
import { 
  Search, Cpu, Flame, Users, Star, 
  ArrowUpRight, Volume2, ShieldCheck,
  Smartphone
} from "lucide-react";

type Builder = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  tagline: string;
  stack?: string[];
};

type Project = {
  id: string;
  name?: string;
  description?: string;
  tech_stack?: string[] | string;
  created_at?: string;
};

export default function RightSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const [suggestedUsers, setSuggestedUsers] = useState<Builder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const userId = user?.id || (user as any)?.uid || "";

  useEffect(() => {
    async function fetchWaitlistCount() {
      try {
        const { count } = await supabase
          .from("app_waitlist")
          .select("*", { count: "exact", head: true });
        setWaitlistCount(count || 0);
      } catch (err) {
        console.error("Error fetching waitlist count:", err);
      }
    }
    fetchWaitlistCount();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: allProfiles } = await getAllProfiles();
        const mockStacks = [
          ["Rust", "WASM", "Go"],
          ["Next.js", "React", "TypeScript"],
          ["Python", "PyTorch", "MLOps"],
          ["Solidity", "Ethereum", "Ethers"],
          ["Docker", "K8s", "AWS"]
        ];
        
        const users: Builder[] = (allProfiles || [])
          .filter(p => p.id !== userId && p.uid !== userId)
          .slice(0, 5)
          .map((p, idx) => ({
            id: p.id || p.uid || "",
            username: p.username || "user",
            name: p.full_name || p.username || "Builder",
            avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id || idx}`,
            tagline: p.availability || p.bio || "Building in public",
            stack: p.stack && p.stack.length > 0 ? p.stack : mockStacks[idx % mockStacks.length]
          }));

        setSuggestedUsers(users);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [userId]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }

      try {
        const { data } = await getUserProjects(userId);
        setProjects((data || []).slice(0, 3) as Project[]);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [userId]);

  return (
    <div className="hidden lg:flex w-[350px] min-w-[350px] flex-col h-full bg-transparent p-4 gap-5 overflow-y-auto no-scrollbar relative z-10">
      
      {/* 1. Neon Glow Search Bar */}
      <div className="relative group w-full flex items-center">
        <input
          type="text"
          placeholder="Search projects, builders, agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[46px] pl-12 pr-12 text-[14px] text-black dark:text-white placeholder-gray-500 dark:placeholder-white/30 bg-gray-100 dark:bg-[#15171a] rounded-[16px] outline-none border border-gray-200 dark:border-white/[0.04] focus:bg-white dark:focus:bg-[#000] focus:border-[#6366f1]/50 focus:shadow-[0_4px_20px_rgba(99,102,241,0.1)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300"
        />
        <Search className="w-4 h-4 text-gray-400 dark:text-white/40 absolute left-4.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#6366f1] transition-colors" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-[6px] bg-white dark:bg-[#22242a] border border-gray-200 border-b-[2px] dark:border-white/5 text-[10px] font-bold text-gray-500 dark:text-white/40 tracking-widest font-mono pointer-events-none group-focus-within:opacity-0 transition-opacity duration-200 shadow-sm">
          ⌘K
        </div>
      </div>

      {/* Mobile App Pre-registration Card */}
      <section 
        className="relative overflow-hidden w-full shrink-0 rounded-[24px] cursor-pointer flex flex-col items-center pt-8 pb-6 px-4 bg-white dark:bg-black border border-gray-200 dark:border-white/10 group shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        onClick={() => window.open("/pre-register", "_blank")}
        style={{
          backgroundImage: `repeating-radial-gradient(circle at 50% 100%, transparent 0, transparent 6px, rgba(255,255,255,0.1) 6px, rgba(255,255,255,0.1) 7px)`
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Syncopate:wght@400;700&display=swap');
          .font-syne { font-family: 'Syne', sans-serif; }
          .font-syncopate { font-family: 'Syncopate', sans-serif; }
        `}} />

        <h3 className="font-syncopate text-black dark:text-white text-[13px] uppercase tracking-widest mb-3 relative z-10 font-bold">
          Squibl
        </h3>
        
        <div className="border border-[#D4F842] rounded-full px-4 py-1 mb-8 relative z-10 bg-white dark:bg-black">
          <span className="font-syne text-black dark:text-white text-[10px] uppercase tracking-[0.2em] font-bold">
            Official Mobile Launch
          </span>
        </div>

        <div className="w-[88%] bg-[#D4F842] rounded-t-[70px] rounded-b-md relative z-10 pt-10 pb-8 px-4 flex flex-col items-center shadow-[0_0_30px_rgba(212,248,66,0.1)] group-hover:shadow-[0_0_50px_rgba(212,248,66,0.25)] transition-shadow duration-500">
          
          <div className="absolute top-6 right-6 bg-[#063CB9] w-9 h-4.5 rounded-full p-[2px] flex items-center justify-end">
            <div className="bg-white w-3.5 h-3.5 rounded-full" />
          </div>

          <div className="font-syne text-[#063CB9] text-[56px] leading-none font-extrabold tracking-tighter mt-1">
            {waitlistCount === null ? "..." : (waitlistCount < 10 ? `0${waitlistCount}` : waitlistCount)}
          </div>
          
          <div className="font-syncopate text-white dark:text-black text-[22px] leading-none font-bold tracking-tight mt-2 uppercase w-full text-center">
            Builders
          </div>
          <div className="font-syncopate text-[#063CB9] text-[22px] leading-none font-bold tracking-tight mt-1 uppercase w-full text-center">
            Waiting
          </div>

          <div className="mt-8 text-center flex flex-col items-center">
            <div className="text-white dark:text-black text-[12px] font-medium mb-1 font-sans">Join the wait list</div>
            <div className="text-[#063CB9] text-[10px] font-medium font-sans border-b border-[#063CB9]/40 pb-[1px] hover:border-[#063CB9] transition-colors">
              squibl.app/mobile
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 w-full overflow-hidden flex flex-col items-center justify-end pointer-events-none">
          <div className="font-syncopate text-[#D4F842] opacity-[0.08] text-[40px] font-bold uppercase tracking-tighter transform translate-y-4 italic whitespace-nowrap">
            The App Is Coming
          </div>
        </div>
      </section>

      {/* 3. AI Co-builder Matchmaker Card */}
      <section className="relative flex flex-col rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a] shrink-0 group hover:border-gray-200 dark:border-white/[0.12] transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        <div className="relative h-[160px] w-full overflow-hidden flex flex-col p-5">
          <div className="absolute inset-0 bg-gray-100 dark:bg-[#050505] z-0"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.22)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0"></div>
          
          <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(150, 150, 150, 0.4) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="h-9 w-9 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-indigo-500 dark:text-indigo-300 shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-colors group-hover:text-indigo-200">
               <Cpu className="w-4 h-4" />
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] text-[9px] uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-100/70 font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              Matchmaking
            </div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <h3 className="text-[21px] font-semibold text-black dark:text-white tracking-tight leading-[1.15]">
              Find your next<br/><span className="text-black dark:text-white/50">AI Co-builder</span>
            </h3>
          </div>
        </div>

        <div className="relative z-10 flex flex-col p-5 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.04]">
          <div className="flex flex-col gap-0.5 mb-4">
            <span className="text-black dark:text-white/95 font-medium text-[14px]">AI Co-builder Matches</span>
            <span className="text-black dark:text-white/40 text-[12px]">squibl.app/match</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {loadingUsers ? (
              <div className="text-[12px] text-black dark:text-white/30 font-mono py-1">Calculating matches...</div>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.slice(0, 2).map((u) => (
                 <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-[16px] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.03] hover:border-gray-200 dark:border-white/[0.08] transition-all duration-300 cursor-pointer group/item">
                   <img src={u.avatar} alt={u.username} className="h-9 w-9 rounded-full object-cover bg-neutral-900 border border-gray-200 dark:border-white/5 flex-shrink-0" referrerPolicy="no-referrer" />
                   <div className="min-w-0 flex flex-col">
                     <span className="text-[13px] font-medium text-black dark:text-white/80 truncate leading-tight flex items-center gap-1.5 group-hover/item:text-black dark:text-white transition-colors">
                       {u.name}
                       <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                     </span>
                     <span className="text-[11px] text-black dark:text-white/40 truncate mt-0.5 group-hover/item:text-black dark:text-white/60 transition-colors">@{u.username}</span>
                   </div>
                 </div>
              ))
            ) : (
              <div className="text-[12px] text-black dark:text-white/30">Searching for builders...</div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Live Collab Rooms */}
      <section className="relative flex flex-col rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a] shrink-0 group hover:border-gray-200 dark:border-white/[0.12] transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        <div className="relative h-[160px] w-full overflow-hidden flex flex-col p-5">
          <div className="absolute inset-0 bg-gray-100 dark:bg-[#050505] z-0"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.12)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0"></div>
          <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(150, 150, 150, 0.4) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="h-9 w-9 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-colors group-hover:text-emerald-300">
               <Volume2 className="w-4 h-4" />
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] flex items-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              <span className="relative flex h-1.5 w-1.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-100/70 font-semibold">8 online</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <h3 className="text-[21px] font-semibold text-black dark:text-white tracking-tight leading-[1.15]">
              Join live coding<br/><span className="text-black dark:text-white/50">Sessions</span>
            </h3>
          </div>
        </div>

        <div className="relative z-10 flex flex-col p-5 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.04]">
          <div className="flex flex-col gap-0.5 mb-4">
            <span className="text-black dark:text-white/95 font-medium text-[14px]">Collab Live Rooms</span>
            <span className="text-black dark:text-white/40 text-[12px]">squibl.app/live</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3 rounded-[16px] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.03] hover:border-gray-200 dark:border-white/[0.08] transition-all duration-300 cursor-pointer group/item">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[13px] font-medium text-black dark:text-white/80 truncate group-hover/item:text-black dark:text-white transition-colors">Rust Agent Compiler</span>
                <span className="text-[11px] text-black dark:text-white/40 group-hover/item:text-black dark:text-white/60 transition-colors">3 builders · Live session</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-black dark:text-white/20 group-hover/item:text-black dark:text-white/80 transition-colors" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-[16px] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.03] hover:border-gray-200 dark:border-white/[0.08] transition-all duration-300 cursor-pointer group/item">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[13px] font-medium text-black dark:text-white/80 truncate group-hover/item:text-black dark:text-white transition-colors">React Server Actions</span>
                <span className="text-[11px] text-black dark:text-white/40 group-hover/item:text-black dark:text-white/60 transition-colors">2 builders · General Q&A</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-black dark:text-white/20 group-hover/item:text-black dark:text-white/80 transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Top Ships of the Week */}
      <section className="relative flex flex-col rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a] shrink-0 group hover:border-gray-200 dark:border-white/[0.12] transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        <div className="relative h-[160px] w-full overflow-hidden flex flex-col p-5">
          <div className="absolute inset-0 bg-gray-100 dark:bg-[#050505] z-0"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.18)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12)_0%,rgba(0,0,0,0)_60%)] blur-[30px] z-0"></div>
          <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(150, 150, 150, 0.4) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="h-9 w-9 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-colors group-hover:text-orange-300">
               <Flame className="w-4 h-4" />
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-gray-200 dark:border-white/[0.08] text-[9px] uppercase tracking-[0.15em] text-orange-600 dark:text-orange-100/70 font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              Weekly Top
            </div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <h3 className="text-[21px] font-semibold text-black dark:text-white tracking-tight leading-[1.15]">
              Discover trending<br/><span className="text-black dark:text-white/50">Projects</span>
            </h3>
          </div>
        </div>

        <div className="relative z-10 flex flex-col p-5 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/[0.04]">
          <div className="flex flex-col gap-0.5 mb-4">
            <span className="text-black dark:text-white/95 font-medium text-[14px]">Top Ships of the Week</span>
            <span className="text-black dark:text-white/40 text-[12px]">squibl.app/ships</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center p-2.5 rounded-[16px] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.03] hover:border-gray-200 dark:border-white/[0.08] transition-all duration-300 cursor-pointer group/item">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-orange-400 font-semibold text-[11px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] group-hover/item:bg-white/[0.05] transition-colors">1</div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[13px] font-medium text-black dark:text-white/80 truncate group-hover/item:text-black dark:text-white transition-colors">cyber-core-dashboard</span>
                  <span className="text-[11px] text-black dark:text-white/40 flex items-center gap-1 font-mono group-hover/item:text-black dark:text-white/60 transition-colors">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" /> 184
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-[16px] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.03] hover:border-gray-200 dark:border-white/[0.08] transition-all duration-300 cursor-pointer group/item">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-orange-400/80 font-semibold text-[11px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] group-hover/item:bg-white/[0.05] transition-colors">2</div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[13px] font-medium text-black dark:text-white/80 truncate group-hover/item:text-black dark:text-white transition-colors">nova-protocol-api</span>
                  <span className="text-[11px] text-black dark:text-white/40 flex items-center gap-1 font-mono group-hover/item:text-black dark:text-white/60 transition-colors">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" /> 122
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="px-4 text-[12px] text-[#71767b] flex flex-wrap gap-x-3 gap-y-1.5 leading-normal select-none mb-6 mt-2">
        <span className="hover:underline cursor-pointer transition-colors">Terms of Service</span>
        <span className="hover:underline cursor-pointer transition-colors">Privacy Policy</span>
        <span className="hover:underline cursor-pointer transition-colors">Cookie Policy</span>
        <span className="hover:underline cursor-pointer transition-colors">Developer Rules</span>
        <span className="w-full mt-1">© 2026 Squibl Corp.</span>
      </div>

    </div>
  );
}
