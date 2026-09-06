"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { getAllProfiles, getProfile, connectToBuilder, disconnectFromBuilder } from "@/lib/profiles";
import { UserPlus, UserCheck, Loader2, Menu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ConnectPage() {
  const { user } = useAuth();
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const userId = user.id || (user as any).uid;
        // Fetch current user's profile to get 'following' list
        const { data: meData } = await getProfile(userId);
        
        const myFollowing = meData?.following || [];
        const initialMap: Record<string, boolean> = {};
        myFollowing.forEach((id: string) => {
          initialMap[id] = true;
        });
        setFollowingMap(initialMap);

        // Fetch all builders
        const { data: allBuilders } = await getAllProfiles();
        const loadedBuilders = (allBuilders || []).filter(b => b.id !== userId && b.uid !== userId);
        
        setBuilders(loadedBuilders);
      } catch (error) {
        console.error("Error loading builders:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleToggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!user) return;
    const userId = user.id || (user as any).uid;

    // Security: prevent self-follow
    if (targetUserId === userId) {
      toast.error("You can't follow yourself.");
      return;
    }
    
    // Optimistic UI update
    setFollowingMap(prev => ({
      ...prev,
      [targetUserId]: !isFollowing
    }));

    try {
      if (isFollowing) {
        await disconnectFromBuilder(userId, targetUserId);
        toast.success("Unfollowed.");
      } else {
        await connectToBuilder(userId, targetUserId);
        toast.success("You're now connected!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Something went wrong. Please try again.");
      // Revert optimistic update on error
      setFollowingMap(prev => ({
        ...prev,
        [targetUserId]: isFollowing
      }));
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-[#000000] text-black dark:text-white">
      <div className="flex w-full max-w-[1250px] min-h-screen relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        <main className="flex-1 border-x border-gray-200 dark:border-white/[0.08] min-h-screen bg-[#000000] relative min-w-0">
          <div className="sticky top-0 z-40 bg-white dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08] px-4 sm:px-6 py-4 flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-black/10 dark:bg-white/10" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-black dark:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Connect</h1>
              <p className="text-sm text-gray-400 dark:text-neutral-500">Discover and follow builders</p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#00f2fe]" />
              </div>
            ) : builders.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-neutral-500">
                No other builders found in the network yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {builders.map((builder) => {
                  const bId = builder.id || builder.uid;
                  const isFollowing = !!followingMap[bId];
                  
                  const mockStacks = [
                    ["React", "Node.js"],
                    ["Python", "Django"],
                    ["Rust", "WASM"],
                    ["Solidity", "Web3"],
                    ["UI/UX", "Figma"]
                  ];
                  const seedIdx = bId ? bId.charCodeAt(0) % mockStacks.length : 0;
                  const skills = builder.skills && builder.skills.length > 0 ? builder.skills : mockStacks[seedIdx];

                  return (
                    <div 
                      key={bId} 
                      className="group bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-5 transition-all duration-300 hover:bg-[#0f0f0f] hover:border-gray-200 dark:border-white/[0.15] flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <img 
                          src={builder.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bId}`} 
                          alt={builder.full_name || "Builder"} 
                          className="w-14 h-14 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                        />
                        <button
                          onClick={() => handleToggleFollow(bId, isFollowing)}
                          className={`px-4 py-1.5 rounded-full font-bold text-[13px] transition-all cursor-pointer ${
                            isFollowing 
                              ? "bg-transparent border border-gray-200 dark:border-white/20 text-black dark:text-white hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10" 
                              : "bg-white text-white dark:text-black border border-black/20 dark:border-white hover:bg-neutral-200"
                          }`}
                        >
                          {isFollowing ? "Following" : "Connect"}
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="font-bold text-[16px] text-black dark:text-white leading-tight">{builder.full_name || "Anonymous Builder"}</h3>
                        <p className="text-[14px] text-gray-400 dark:text-neutral-500">@{builder.username || bId.substring(0, 8)}</p>
                      </div>
                      
                      <p className="text-[14px] text-gray-600 dark:text-neutral-300 mb-5 line-clamp-2 min-h-[42px] leading-relaxed">
                        {builder.availability || builder.bio || "Building something awesome in secret."}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-white/[0.04]">
                        {(skills || []).map((skill: string) => (
                          <span key={skill} className="text-[12px] font-medium bg-white/[0.04] text-gray-500 dark:text-neutral-400 px-3 py-1 rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
