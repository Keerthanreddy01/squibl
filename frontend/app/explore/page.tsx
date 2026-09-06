"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/dashboard/RightSidebar";
import { getAllProfiles, getProfile, connectToBuilder, disconnectFromBuilder } from "@/lib/profiles";
import { getAllPosts } from "@/lib/posts";
import {
  Search, TrendingUp, Users, Sparkles, Heart, MessageCircle,
  Repeat2, Share, Verified, Flame, Zap, Code2, Globe, Rocket,
  ChevronRight, MoreHorizontal, BookmarkPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Static demo data ──────────────────────────────────────────────────────────
const TRENDING_TOPICS = [
  { tag: "react", posts: "24.3K", category: "Technology", hot: true },
  { tag: "nextjs", posts: "18.1K", category: "Framework", hot: true },
  { tag: "rust", posts: "15.7K", category: "Language", hot: false },
  { tag: "ai", posts: "89.2K", category: "Trending", hot: true },
  { tag: "web3", posts: "12.4K", category: "Blockchain", hot: false },
  { tag: "indiehackers", posts: "9.8K", category: "Community", hot: false },
  { tag: "typescript", posts: "31.5K", category: "Language", hot: false },
  { tag: "opensource", posts: "44.1K", category: "Community", hot: true },
];

const CATEGORIES = [
  { label: "For You", icon: Sparkles, active: true },
  { label: "Trending", icon: TrendingUp, active: false },
  { label: "Builders", icon: Users, active: false },
  { label: "Open Source", icon: Code2, active: false },
  { label: "Global", icon: Globe, active: false },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } },
};

export default function ExplorePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("For You");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedBuilders, setSuggestedBuilders] = useState<any[]>([]);
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data: meData } = await getProfile(user.id);
        const myFollowing = meData?.following || [];
        const initialMap: Record<string, boolean> = {};
        myFollowing.forEach((id: string) => {
          initialMap[id] = true;
        });
        setFollowed(initialMap);

        const { data: allBuilders } = await getAllProfiles();
        const loadedBuilders = (allBuilders || [])
          .filter(b => b.id !== user.id && b.uid !== user.id)
          .slice(0, 3);
        
        setSuggestedBuilders(loadedBuilders);
      } catch (error) {
        console.error("Error loading builders:", error);
      }
    }
    loadData();
  }, [user]);

  const handleToggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!user) return;
    setFollowed(prev => ({ ...prev, [targetUserId]: !isFollowing }));
    try {
      if (isFollowing) {
        await disconnectFromBuilder(user.id, targetUserId);
      } else {
        await connectToBuilder(user.id, targetUserId);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      setFollowed(prev => ({ ...prev, [targetUserId]: isFollowing }));
    }
  };

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await getAllPosts(15);
      if (data) setTrendingPosts(data);
    }
    fetchPosts();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-white animate-spin" />
          <span className="text-black dark:text-white/30 text-base">Loading explore…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-white text-black dark:bg-[#050505] dark:text-white font-sans overflow-x-hidden relative selection:bg-black/20 dark:selection:bg-white/20 selection:text-black dark:selection:text-black">
      <div className="flex w-full max-w-[1250px] min-h-screen relative lg:h-[calc(100dvh-2rem)] lg:overflow-hidden lg:my-4">
        {/* Ambient background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
          <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0,transparent_60%)]" />
          <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08)_0,transparent_60%)]" />
        </div>

        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 flex justify-center min-h-screen lg:min-h-0 lg:h-full overflow-visible lg:overflow-y-auto relative z-10 min-w-0 scrollbar-hide">
          <div className="w-full max-w-[640px] flex flex-col pb-[96px] md:pb-0 overflow-x-hidden border-r border-l border-gray-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#08090c]/95 backdrop-blur-xl lg:min-h-full">

            <div className="px-6 pt-7 pb-5 border-b border-gray-200/80 dark:border-white/[0.06]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-black/35 dark:text-white/35">Discover</p>
                  <h1 className="mt-3 text-[32px] md:text-[40px] font-semibold tracking-tight text-black dark:text-white leading-[0.95] max-w-[10ch]">
                    Find the builders, topics, and ships worth following.
                  </h1>
                  <p className="mt-4 max-w-[46rem] text-[15px] leading-6 text-black/55 dark:text-white/42">
                    A tighter feed for what is active right now: trends, people to follow, and posts from builders who are actually shipping.
                  </p>
                </div>

                <div className="hidden md:grid grid-cols-3 gap-3 shrink-0">
                  <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-4 py-3 min-w-[110px] shadow-sm">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/35 dark:text-white/30">Live</div>
                    <div className="mt-2 text-[22px] font-semibold text-black dark:text-white">24</div>
                    <div className="text-[12px] text-black/45 dark:text-white/35">fresh posts</div>
                  </div>
                  <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-4 py-3 min-w-[110px] shadow-sm">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/35 dark:text-white/30">Hot</div>
                    <div className="mt-2 text-[22px] font-semibold text-black dark:text-white">8</div>
                    <div className="text-[12px] text-black/45 dark:text-white/35">topics now</div>
                  </div>
                  <div className="rounded-[20px] border border-gray-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-4 py-3 min-w-[110px] shadow-sm">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/35 dark:text-white/30">Builders</div>
                    <div className="mt-2 text-[22px] font-semibold text-black dark:text-white">3</div>
                    <div className="text-[12px] text-black/45 dark:text-white/35">suggestions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sticky Search + Category Header ─────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06]">

              {/* Search bar */}
              <div className="px-6 pt-5 pb-4">
                <motion.div
                  animate={{ scale: searchFocused ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-4 bg-[#f4f5f7] dark:bg-[#15171a] border border-gray-200 dark:border-white/[0.04] rounded-[16px] px-5 h-[46px] transition-all duration-200 ${searchFocused ? "bg-white dark:bg-black border-[#6366f1]/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "focus-within:bg-[#f8f8f8] dark:focus-within:bg-[#000]"}`}
                >
                  <Search className={`w-5 h-5 shrink-0 transition-colors duration-200 ${searchFocused ? "text-[#6366f1]" : "text-black/45 dark:text-white/40"}`} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search builders, projects, topics…"
                    className="flex-1 bg-transparent text-[14px] text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 outline-none h-full"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery("")}
                        className="text-black dark:text-white/30 hover:text-black dark:text-white text-sm transition-colors"
                      >✕</motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Category pills */}
              <div className="flex items-center w-full overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-white/[0.06]">
                {CATEGORIES.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setActiveCategory(label)}
                    className={`relative flex-1 flex items-center justify-center h-[53px] px-4 text-[15px] font-bold whitespace-nowrap transition-colors duration-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] outline-none border-none cursor-pointer bg-transparent ${activeCategory === label
                      ? "text-black dark:text-white"
                      : "text-[#71767b]"
                    }`}
                  >
                    <div className="relative flex items-center gap-2 h-full">
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{label}</span>
                      {activeCategory === label && (
                        <motion.div 
                          layoutId="exploreTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-[4px] bg-black dark:bg-white rounded-t-full"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────────── */}
            <motion.div
              variants={stagger.container}
              initial="initial"
              animate="animate"
              className="flex flex-col"
            >

              {/* ── Trending Topics ── */}
              <motion.section variants={stagger.item} className="border-b border-gray-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-[18px] font-bold text-black dark:text-white">Trending in Dev</span>
                  </div>
                  <button className="text-[15px] text-blue-400 hover:text-blue-300 transition-colors">See all</button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {TRENDING_TOPICS.slice(0, 5).map((topic, i) => (
                    <motion.button
                      key={topic.tag}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                      className="w-full px-6 py-4 flex items-center justify-between group text-left transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-black dark:text-white/30">{i + 1} · {topic.category}</span>
                          {topic.hot && (
                            <span className="text-[11px] font-bold text-orange-400/80 bg-orange-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" /> HOT
                            </span>
                          )}
                        </div>
                        <span className="text-[16px] font-bold text-black dark:text-white group-hover:text-black dark:text-white/90">#{topic.tag}</span>
                        <span className="text-[14px] text-black dark:text-white/30">{topic.posts} posts</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-black dark:text-white/20 group-hover:text-black dark:text-white/40 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.section>

              {/* ── Suggested Builders ── */}
              <motion.section variants={stagger.item} className="border-b border-gray-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-[18px] font-bold text-black dark:text-white">Who to Follow</span>
                  </div>
                  <button className="text-[15px] text-blue-400 hover:text-blue-300 transition-colors">See all</button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {suggestedBuilders.map((builder) => {
                    const bId = builder.id || builder.uid;
                    return (
                      <motion.div
                        key={bId}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                        className="px-6 py-4 flex items-center gap-4 transition-colors"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={builder.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bId}`}
                            alt={builder.full_name || "Builder"}
                            className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 object-cover"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3px] border-black" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[16px] font-bold text-black dark:text-white truncate">{builder.full_name || "Builder"}</span>
                            {builder.verified && <Verified className="w-4 h-4 text-blue-400 shrink-0 fill-blue-400" />}
                          </div>
                          <p className="text-[14px] text-black dark:text-white/40 truncate">@{builder.username || bId.substring(0,8)} · {builder.followers?.length || 0} followers</p>
                          <p className="text-[14px] text-black dark:text-white/50 mt-1 flex items-center gap-1.5">
                            <Rocket className="w-3.5 h-3.5 text-purple-400" />
                            Role: {builder.role || "Builder"}
                          </p>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleFollow(bId, !!followed[bId])}
                          className={`shrink-0 px-5 py-2 rounded-full text-[14px] font-bold transition-all duration-200 border ${followed[bId]
                              ? "bg-transparent border-gray-200 dark:border-white/20 text-black dark:text-white/60 hover:border-red-500/40 hover:text-red-400"
                              : "bg-black text-white border-black/20 dark:bg-white dark:text-black dark:border-white hover:bg-black/90 dark:hover:bg-white/90"
                            }`}
                        >
                          {followed[bId] ? "Following" : "Follow"}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>

              {/* ── Popular Discussions ── */}
              <motion.section variants={stagger.item}>
                <div className="flex items-center gap-2.5 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-white/[0.06]">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-[18px] font-bold text-black dark:text-white">Popular Discussions</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {trendingPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-5">
                      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-black dark:text-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-black dark:text-white font-bold text-[18px]">Nothing here yet</p>
                        <p className="text-black dark:text-white/30 text-[15px] mt-1.5">Be the first to start a discussion.</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/create")}
                        className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black text-[15px] font-bold rounded-full hover:bg-black/90 dark:hover:bg-white/90 transition-colors"
                      >
                        Post something
                      </motion.button>
                    </div>
                  ) : (
                    trendingPosts.map((post, i) => (
                      <PostCard key={post.id} post={post} index={i} />
                    ))
                  )}
                </div>
              </motion.section>

            </motion.div>

            {/* Bottom spacer */}
            <div className="h-32" />
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: any; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Array.isArray(post.likes) ? post.likes.length : 5);
  const [bookmarked, setBookmarked] = useState(false);

  const timeAgo = (dateStr: any) => {
    if (!dateStr) return "now";
    try {
      const date = new Date(dateStr);
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 60) return `${secs}s`;
      if (secs < 3600) return `${Math.floor(secs / 60)}m`;
      if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
      return `${Math.floor(secs / 86400)}d`;
    } catch {
      return "now";
    }
  };

  const avatar = post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_username || "user"}`;
  const replies = post.comments_count || 0;
  const reposts = 0;
  const views = post.views_count || 0;

  const TYPE_COLORS: Record<string, string> = {
    update: "text-green-400",
    looking_for: "text-blue-400",
    build_log: "text-purple-400",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: EASE }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      className="px-6 py-5 flex gap-4 cursor-pointer group transition-colors"
    >
      {/* Avatar column */}
      <div className="shrink-0">
        <img src={avatar} alt={post.author_username} className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10" />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[16px] font-bold text-black dark:text-white hover:underline cursor-pointer">
            {post.author_name || post.author_username || "builder"}
          </span>
          <span className="text-[15px] text-black dark:text-white/30">·</span>
          <span className="text-[15px] text-black dark:text-white/30">{timeAgo(post.created_at)}</span>
          {post.post_type && (
            <span className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.05] ${TYPE_COLORS[post.post_type] || "text-black dark:text-white/50"}`}>
              {post.post_type.replace(/_/g, " ")}
            </span>
          )}
          <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-black dark:text-white/30 hover:text-black dark:text-white hover:bg-black/10 dark:bg-white/10 rounded-full p-1.5">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Post content */}
        <p className="text-[17px] leading-[1.6] text-black dark:text-white/90 mb-4 break-words">
          {post.content}
        </p>

        {/* Action bar */}
        <div className="flex items-center justify-between max-w-[400px] -ml-2">
          {/* Reply */}
          <ActionButton
            icon={<MessageCircle className="w-[20px] h-[20px]" />}
            count={replies}
            color="group-hover/btn:text-blue-400"
            hoverBg="group-hover/btn:bg-blue-400/10"
          />

          {/* Repost */}
          <ActionButton
            icon={<Repeat2 className="w-[20px] h-[20px]" />}
            count={reposts}
            color="group-hover/btn:text-green-400"
            hoverBg="group-hover/btn:bg-green-400/10"
          />

          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              setLiked((p: boolean) => !p);
              setLikeCount((p: number) => liked ? p - 1 : p + 1);
            }}
            className="flex items-center gap-1.5 group/btn"
          >
            <span className={`p-2 rounded-full transition-colors ${liked ? "bg-red-500/10" : "group-hover/btn:bg-red-500/10"}`}>
              <Heart className={`w-[20px] h-[20px] transition-all ${liked ? "text-red-500 fill-red-500 scale-110" : "text-black dark:text-white/40 group-hover/btn:text-red-400"}`} />
            </span>
            <span className={`text-[14px] transition-colors ${liked ? "text-red-500" : "text-black dark:text-white/40 group-hover/btn:text-red-400"}`}>
              {likeCount}
            </span>
          </motion.button>

          {/* Bookmark */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              setBookmarked((p: boolean) => !p);
            }}
            className="group/btn"
          >
            <span className={`p-2 rounded-full block transition-colors ${bookmarked ? "bg-blue-400/10" : "group-hover/btn:bg-blue-400/10"}`}>
              <BookmarkPlus className={`w-[20px] h-[20px] transition-all ${bookmarked ? "text-blue-400 fill-blue-400" : "text-black dark:text-white/40 group-hover/btn:text-blue-400"}`} />
            </span>
          </motion.button>

          {/* Views */}
          <div className="flex items-center gap-1.5 text-black dark:text-white/25">
            <Share className="w-[18px] h-[18px]" />
            <span className="text-[13px]">{views > 999 ? `${(views / 1000).toFixed(1)}K` : views}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ActionButton({ icon, count, color, hoverBg }: {
  icon: React.ReactNode; count: number; color: string; hoverBg: string;
}) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} className={`flex items-center gap-1.5 group/btn`}>
      <span className={`p-2 rounded-full block transition-colors ${hoverBg}`}>
        <span className={`block text-black dark:text-white/40 transition-colors ${color}`}>{icon}</span>
      </span>
      <span className={`text-[14px] text-black dark:text-white/40 transition-colors ${color}`}>{count}</span>
    </motion.button>
  );
}
