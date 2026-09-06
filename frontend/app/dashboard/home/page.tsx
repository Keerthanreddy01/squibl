// Complete replacement for frontend/app/dashboard/home/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal,
  Zap,
  MessageCircle,
  Rocket,
  Eye,
  Bookmark,
  Search,
  Smile,
  Image,
  Mic,
  X,
  Lock,
  Flag,
  Calendar,
  MapPin,
  Share2,
  Megaphone,
  Handshake,
  Trophy,
  Globe,
  ChevronDown,
  Trash2,
  Play,
  Pause,
  Sparkles,
  LayoutDashboard,
  Telescope,
  MessageSquare,
  User,
  Pencil
} from "lucide-react";
import { createPost, likePost, addComment, getComments, getAllPosts } from "@/lib/posts";
import PreRegisterMobilePromo from "@/components/PreRegisterMobilePromo";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import RightSidebar from "@/components/dashboard/RightSidebar";
import { usePostViewTracker } from "@/hooks/usePostViewTracker";
import ClickSpark from "@/components/ClickSpark";
import { Toaster, toast } from "sonner";

// Helper to render post content text and color hashtags lime green
const renderContentWithHashtags = (text: string) => {
  if (!text) return "";
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <span key={index} className="text-[#D4F842] hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
};

function PostCard({
  post,
  user,
  handleLikeClick,
  handleCollabClick
}: {
  post: any,
  user: any,
  handleLikeClick: (id: string) => void,
  handleCollabClick: (post: any) => void
}) {
  const ref = usePostViewTracker(post.id);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const userId = user.id;
  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const isLiked = Array.isArray(post.likes) && post.likes.includes(userId);
  const isTruncated = post.content?.length > 280;
  const displayContent = isExpanded || !isTruncated ? post.content : post.content?.slice(0, 280) + "…";

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch { return "1d ago"; }
  };

  const handleFetchComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      const { data } = await getComments(post.id);
      if (data) setComments(data);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    setIsCommenting(true);
    const commentData = {
      uid: userId,
      author_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || "Builder",
      author_avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      author_username: user.user_metadata?.username || user.email?.split('@')[0] || "builder",
      content: newComment.trim(),
    };
    setComments(prev => [...prev, { ...commentData, id: Date.now().toString() }]);
    setNewComment("");
    await addComment(post.id, commentData);
    setIsCommenting(false);
  };

  const isCollab = post.post_type === 'looking_for';
  const isMilestone = post.post_type === 'build_log';

  const theme = isCollab
    ? { text: 'text-[#00f2fe]', bg: 'bg-[#00f2fe]/10', border: 'border-[#00f2fe]/20', icon: Handshake, label: 'Collab' }
    : isMilestone
      ? { text: 'text-[#D4F842]', bg: 'bg-[#D4F842]/10', border: 'border-[#D4F842]/20', icon: Trophy, label: 'Milestone' }
      : { text: 'text-gray-500 dark:text-neutral-400', bg: 'bg-white dark:bg-white/5', border: 'border-gray-200 dark:border-white/10', icon: Megaphone, label: 'Update' };

  return (
    <article
      ref={ref}
      className="group/post relative w-full bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/[0.08] transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-[#121212] overflow-hidden sm:rounded-2xl sm:border sm:mb-4 sm:hover:shadow-sm"
    >
      {/* Optional Top Accent Line for special posts */}
      {(isCollab || isMilestone) && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${theme.bg}`} />
      )}

      <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
        {/* ── Left Column: Avatar ── */}
        <div className="shrink-0 pt-1">
          <div className="w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/50 cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src={post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.uid}`}
              alt={post.author_name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* ── Right Column: Content ── */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[15px] sm:text-[16px] text-black dark:text-white hover:underline cursor-pointer truncate max-w-[200px] sm:max-w-none leading-none">
                  {post.author_name || "Builder"}
                </span>
                <span className="text-gray-500 dark:text-neutral-500 font-medium text-[14px] sm:text-[15px] truncate max-w-[120px] sm:max-w-none leading-none">
                  @{post.author_username || "builder"}
                </span>
                <span className="text-gray-400 dark:text-neutral-600 text-[13px] leading-none">·</span>
                <span className="text-[13px] sm:text-[14px] text-gray-500 dark:text-neutral-500 leading-none hover:underline cursor-pointer whitespace-nowrap">
                  {timeAgo(post.created_at)}
                </span>
              </div>
              
              {/* Badges Row */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.text} ${theme.bg}`}>
                  <theme.icon className="w-3 h-3" />
                  {theme.label}
                </div>
                {post.project && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-neutral-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5">
                    <Sparkles className="w-3 h-3" />
                    {post.project}
                  </span>
                )}
                {post.visibility === 'collabs' && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    Collabs Only
                  </span>
                )}
              </div>
            </div>

            {/* More Menu */}
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-neutral-500 hover:text-[#1d9bf0] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer bg-transparent border-none shrink-0 -mt-1 -mr-2 relative z-10">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Main Content wrapper */}
          <div className="block mt-2 text-[15px] sm:text-[16px] leading-snug sm:leading-normal font-normal text-[#0f1419] dark:text-[#e7e9ea] whitespace-pre-wrap break-words no-underline">
            <div className={!isExpanded ? 'line-clamp-4 sm:line-clamp-none' : ''}>
              {renderContentWithHashtags(displayContent)}
            </div>
            {isTruncated && !isExpanded && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(true); }}
                className="text-[#1d9bf0] hover:underline mt-1 text-[15px] font-medium bg-transparent border-none outline-none cursor-pointer p-0 inline-block"
              >
                Show more
              </button>
            )}

            {/* Attached Media */}
            {post.mediaUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 relative bg-gray-50 dark:bg-white/5">
                {post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.webm') ? (
                  <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain" onClick={(e) => e.stopPropagation()} />
                ) : post.mediaUrl.endsWith('.mp3') || post.mediaUrl.endsWith('.wav') ? (
                  <div className="p-4 flex items-center gap-3">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                      <Play className="w-5 h-5 ml-1" />
                    </button>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-black dark:bg-white w-1/3" />
                    </div>
                  </div>
                ) : (
                  <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[500px] object-cover" />
                )}
              </div>
            )}
          </div>

          {/* Tech Stack Tags */}
          {Array.isArray(post.stack_tags) && post.stack_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.stack_tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="text-[13px] sm:text-[14px] text-[#1d9bf0] hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Collab Apply Action Block */}
          {isCollab && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-4 transition-all hover:bg-gray-100 dark:hover:bg-neutral-900 cursor-pointer group/apply" onClick={(e) => { e.stopPropagation(); handleCollabClick(post); }}>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-black dark:text-white leading-tight group-hover/apply:text-[#1d9bf0] transition-colors">Open to Collaborators</span>
                <span className="text-[14px] text-gray-500 dark:text-neutral-400 mt-0.5">The author is looking for team members.</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCollabClick(post); }}
                className="w-full sm:w-auto px-5 py-2 rounded-full text-[14px] font-bold transition-all active:scale-95 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 cursor-pointer border-none shrink-0"
              >
                Apply Now
              </button>
            </div>
          )}

          {/* Actions Dock */}
          <div className="flex items-center justify-between w-full max-w-[425px] mt-3 relative z-10">
            {/* Comment */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFetchComments(); }}
              className="flex items-center gap-1.5 group cursor-pointer border-none bg-transparent outline-none"
            >
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
                <MessageCircle className="w-[18px] h-[18px] text-gray-500 dark:text-neutral-500 group-hover:text-[#1d9bf0] transition-colors" strokeWidth={1.75} />
              </div>
              <span className={`text-[13px] transition-colors ${post.comments_count > 0 ? 'text-gray-500 dark:text-neutral-500 group-hover:text-[#1d9bf0]' : 'text-transparent'}`}>
                {post.comments_count || 0}
              </span>
            </button>

            {/* Boost (Retweet equivalent) */}
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex items-center gap-1.5 group cursor-pointer border-none bg-transparent outline-none">
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center group-hover:bg-[#00ba7c]/10 transition-colors">
                <Rocket className="w-[18px] h-[18px] text-gray-500 dark:text-neutral-500 group-hover:text-[#00ba7c] transition-colors" strokeWidth={1.75} />
              </div>
              <span className="text-[13px] text-transparent transition-colors group-hover:text-[#00ba7c]">0</span>
            </button>

            {/* Like */}
            <ClickSpark sparkColor="#f91880" sparkSize={4} sparkRadius={12} sparkCount={6} duration={300}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleLikeClick(post.id); }}
                className="flex items-center gap-1.5 group cursor-pointer border-none bg-transparent outline-none"
              >
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors ${isLiked ? '' : 'group-hover:bg-[#f91880]/10'}`}>
                  <Zap className={`w-[18px] h-[18px] transition-colors ${isLiked ? 'text-[#f91880]' : 'text-gray-500 dark:text-neutral-500 group-hover:text-[#f91880]'}`} fill={isLiked ? "#f91880" : "none"} strokeWidth={1.75} />
                </div>
                <span className={`text-[13px] transition-colors ${isLiked ? 'text-[#f91880]' : 'text-gray-500 dark:text-neutral-500 group-hover:text-[#f91880]'}`}>
                  {likesCount > 0 ? likesCount : ''}
                </span>
              </button>
            </ClickSpark>

            {/* Views */}
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex items-center gap-1.5 group cursor-pointer border-none bg-transparent outline-none">
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
                <Eye className="w-[18px] h-[18px] text-gray-500 dark:text-neutral-500 group-hover:text-[#1d9bf0] transition-colors" strokeWidth={1.75} />
              </div>
              <span className="text-[13px] text-transparent transition-colors group-hover:text-[#1d9bf0]">0</span>
            </button>

            {/* Bookmark & Share */}
            <div className="flex items-center">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-[34px] h-[34px] rounded-full flex items-center justify-center group cursor-pointer border-none bg-transparent hover:bg-[#1d9bf0]/10 transition-colors outline-none">
                <Bookmark className="w-[18px] h-[18px] text-gray-500 dark:text-neutral-500 group-hover:text-[#1d9bf0] transition-colors" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.08] flex flex-col gap-4 relative z-20">
              <div className="flex gap-3">
                <img
                  src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100 dark:bg-neutral-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 flex flex-col sm:flex-row gap-2 border border-gray-200 dark:border-white/[0.1] rounded-xl p-2 focus-within:border-[#1d9bf0] transition-colors bg-white dark:bg-black">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submitComment(); }}
                    placeholder="Post your reply"
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-black dark:text-white px-2 focus:ring-0 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); submitComment(); }}
                    disabled={!newComment.trim() || isCommenting}
                    className="shrink-0 bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] disabled:opacity-50 rounded-lg px-4 py-1.5 text-[13px] font-bold transition-all cursor-pointer border-none"
                  >
                    Reply
                  </button>
                </div>
              </div>

              {comments.length > 0 && (
                <div className="flex flex-col gap-0 mt-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 items-start py-3 border-t border-gray-100 dark:border-neutral-800">
                      <img
                        src={comment.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.uid}`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100 dark:bg-neutral-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[14px] text-black dark:text-white hover:underline cursor-pointer">{comment.author_name}</span>
                          <span className="text-[14px] text-gray-500 dark:text-neutral-500">@{comment.author_username}</span>
                          <span className="text-[14px] text-gray-500 dark:text-neutral-500">· {timeAgo(comment.created_at || new Date().toISOString())}</span>
                        </div>
                        <p className="text-[15px] text-[#0f1419] dark:text-[#e7e9ea] break-words mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [content, setContent] = useState("");
  const [stackTags, setStackTags] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'collabs'>('all');
  const [selectedPostType, setSelectedPostType] = useState<'update' | 'looking_for' | 'build_log'>('update');
  const [isFocused, setIsFocused] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [postVisibility, setPostVisibility] = useState<'public' | 'collabs'>('public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowVisibilityMenu(false);
      setShowProjectMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const handleCollabClick = (post: any) => {
    toast.success(`Collab request sent to @${post.author_username}!`, {
      description: `They will receive your request for "${post.content.slice(0, 30)}..."`,
    });
  };

  const filteredPosts = activeTab === 'all'
    ? posts
    : posts.filter(post => post.post_type === 'looking_for');

  // Support opening compose modal via query parameter (?compose=true)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("compose=true")) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
      router.replace("/dashboard/home");
    }
  }, [router]);

  const fetchFeedPosts = React.useCallback(async () => {
    const { data } = await getAllPosts(50);
    if (data) setPosts(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchFeedPosts();
  }, [user, fetchFeedPosts]);

  const toggleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAudioBlob(null);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (err: any) {
        setMicError('Could not access microphone.');
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const submitPost = async () => {
    const trimmed = content.trim();
    if (!trimmed || isPosting || !user) return;
    setIsPosting(true);
    const tags = stackTags
      .split(" ")
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const userId = user.id;
    const authorName = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split("@")[0] || "Builder";
    const authorAvatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    const authorUsername = user.user_metadata?.username || user.email?.split("@")[0] || "builder";

    const result = await createPost({
      uid: userId,
      author_name: authorName,
      author_avatar: authorAvatar,
      author_username: authorUsername,
      content: trimmed,
      stack_tags: tags,
      post_type: selectedPostType,
      visibility: postVisibility,
      project: selectedProject,
    });

    setIsPosting(false);
    if (!result.error) {
      setContent("");
      setStackTags("");
      setAudioBlob(null);
      setPostVisibility('public');
      setSelectedProject(null);
      await fetchFeedPosts();
    }
  };

  const handleLikeClick = async (postId: string) => {
    if (!user) return;
    const userId = user.id;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const isLiked = likes.includes(userId);
    const newLikes = isLiked ? likes.filter((id: string) => id !== userId) : [...likes, userId];

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    
    // Server update
    const { error } = await likePost(postId, userId);
    if (error) {
      const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : "Failed to update like status";
      toast.error(msg);
      // Revert optimistic update on failure
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: likes } : p));
    }
  };

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at top-left, #0f0c29 0%, #17113f 40%, #08051a 100%)"
        }}
      >
        <div
          className="w-8 h-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{
            borderColor: "#6366f1",
            borderTopColor: "transparent"
          }}
        />
      </div>
    );
  }

  const userId = user.id;
  const avatarSrc = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  return (
    <div className="flex justify-center min-h-screen bg-[#F8F9FA] dark:bg-[#000000] text-black dark:text-white font-sans overflow-x-hidden overflow-y-hidden selection:bg-blue-500/30 selection:text-black dark:text-white relative">
      <div className="flex w-full max-w-[1440px] mx-auto h-screen relative overflow-x-hidden">
        <PreRegisterMobilePromo />
        <div className="hidden md:flex shrink-0">
          <LeftSidebar isSidebarOpen={false} setIsSidebarOpen={() => { }} />
        </div>

        <main
          className="flex-1 flex h-full overflow-hidden overflow-x-hidden relative z-10 bg-[#F8F9FA] dark:bg-[#000000] min-w-0 text-[14px] leading-[1.4] sm:text-[15px] sm:leading-[1.5]"
          style={{
            fontFamily: 'var(--font-instrument), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Flat Dark Background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#F8F9FA] dark:bg-[#000000]"></div>

          <div className="flex w-full h-full relative z-10 justify-start gap-4 lg:gap-8 xl:gap-12 pl-0 md:pl-[180px] lg:pl-[190px] xl:pl-[200px] pr-4">

            {/* COLUMN 1: FEED */}
            <div className="w-full md:w-[680px] md:max-w-[680px] flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative pt-0 pb-[80px] md:pb-32">

              {/* Premium Sticky Tab Selector with Glass Fade */}
              <div className="sticky top-0 z-40 flex justify-center w-full shrink-0 pt-[28px] sm:pt-[36px] pb-[12px] bg-[#F8F9FA]/90 dark:bg-[#000000]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.05] mb-4">
                
                {/* Pill */}
                <div className="inline-flex items-center bg-gray-200 dark:bg-[#111111] border border-gray-300 dark:border-[#222222] rounded-full p-1 gap-1 sm:gap-2 w-fit mx-auto shadow-sm dark:shadow-lg relative z-10">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`relative rounded-full px-5 py-1.5 sm:py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer border-none outline-none ${activeTab === 'all' ? 'bg-white text-black dark:bg-[#2a2a2a] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'bg-transparent text-gray-500 hover:text-black dark:text-[#999999] dark:hover:text-white'}`}
                  >
                    All Builds
                  </button>
                  <button
                    onClick={() => setActiveTab('collabs')}
                    className={`relative rounded-full px-5 py-1.5 sm:py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer border-none outline-none ${activeTab === 'collabs' ? 'bg-white text-black dark:bg-[#2a2a2a] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]' : 'bg-transparent text-gray-500 hover:text-black dark:text-[#999999] dark:hover:text-white'}`}
                  >
                    Collab Board
                  </button>
                </div>
              </div>

              {/* Premium Minimal Composer */}
              {(() => {
                const theme = selectedPostType === 'looking_for'
                  ? {
                    accent: 'text-[#00f2fe]',
                    button: 'bg-[#00f2fe] hover:bg-[#00d8e4] text-white dark:text-black font-bold',
                    btnText: 'Find Teammates',
                    hint: 'Find co-builders, designers, or cofounders'
                  }
                  : selectedPostType === 'build_log'
                    ? {
                      accent: 'text-[#D4F842]',
                      button: 'bg-[#D4F842] hover:bg-[#c5ec2d] text-white dark:text-black font-bold',
                      btnText: 'Log Milestone',
                      hint: 'Document a major project launch or milestone'
                    }
                    : {
                      accent: 'text-black dark:text-white',
                      button: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 font-bold',
                      btnText: 'Ship',
                      hint: 'Log a quick dev update'
                    };

                return (
                  <div className={`flex flex-col p-4 relative shrink-0 transition-all duration-300 ease-out mx-0 sm:mx-4 mb-2 sm:mb-8 rounded-none sm:rounded-[24px] overflow-hidden border-y sm:border border-gray-200 dark:border-white/[0.08] ${isFocused ? 'bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-white/[0.15] shadow-xl max-h-none' : 'bg-white dark:bg-[#0a0a0a] max-h-[140px] sm:max-h-none shadow-none dark:shadow-none border-gray-200'}`}>
                    {/* Removed ambient glow for cleaner aesthetic */}

                    {/* Top Controls: Post Type & Metadata */}
                    <div className="flex items-center justify-between gap-3 mb-3">

                      <div className="flex items-center bg-gray-100 dark:bg-gray-100/80 dark:bg-neutral-950/80 p-1 rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-inner overflow-x-auto no-scrollbar shrink-0">
                        <button
                          onClick={() => setSelectedPostType('update')}
                          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] rounded-lg transition-colors font-semibold cursor-pointer border-none bg-transparent ${selectedPostType === 'update' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:text-neutral-300'}`}
                        >
                          {selectedPostType === 'update' && <motion.div layoutId="composerPostType" className="absolute inset-0 bg-white shadow-none dark:shadow-none dark:bg-neutral-700/60 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                          <span className="relative z-10 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Update</span>
                        </button>
                        <button
                          onClick={() => setSelectedPostType('looking_for')}
                          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] rounded-lg transition-colors font-semibold cursor-pointer border-none bg-transparent ${selectedPostType === 'looking_for' ? 'text-[#00f2fe]' : 'text-gray-500 dark:text-neutral-400 hover:text-[#00f2fe]/70'}`}
                        >
                          {selectedPostType === 'looking_for' && <motion.div layoutId="composerPostType" className="absolute inset-0 bg-white shadow-none dark:shadow-none dark:bg-[#00f2fe]/15 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                          <span className="relative z-10 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" /> Collab</span>
                        </button>
                        <button
                          onClick={() => setSelectedPostType('build_log')}
                          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-[11.5px] rounded-lg transition-colors font-semibold cursor-pointer border-none bg-transparent ${selectedPostType === 'build_log' ? 'text-[#D4F842]' : 'text-gray-500 dark:text-neutral-400 hover:text-[#D4F842]/70'}`}
                        >
                          {selectedPostType === 'build_log' && <motion.div layoutId="composerPostType" className="absolute inset-0 bg-white shadow-none dark:shadow-none dark:bg-[#D4F842]/15 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                          <span className="relative z-10 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Milestone</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Visibility Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowVisibilityMenu(!showVisibilityMenu); setShowProjectMenu(false); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white dark:bg-white/5 text-[11px] text-gray-500 dark:text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer font-medium border-none bg-transparent"
                          >
                            {postVisibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{postVisibility === 'public' ? 'Public' : 'Collabs'}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                          </button>
                          {showVisibilityMenu && (
                            <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-1 z-50 shadow-xl">
                              <button
                                onClick={() => { setPostVisibility('public'); setShowVisibilityMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-[11px] rounded-lg hover:bg-white dark:bg-white/5 transition-colors flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-white dark:text-black dark:hover:text-black dark:text-white bg-transparent border-none cursor-pointer"
                              >
                                <Globe className="w-3 h-3" /> Public Feed
                              </button>
                              <button
                                onClick={() => { setPostVisibility('collabs'); setShowVisibilityMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-[11px] rounded-lg hover:bg-white dark:bg-white/5 transition-colors flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-white dark:text-black dark:hover:text-black dark:text-white bg-transparent border-none cursor-pointer"
                              >
                                <Lock className="w-3 h-3 text-amber-500" /> Collabs Only
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Project Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowProjectMenu(!showProjectMenu); setShowVisibilityMenu(false); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white dark:bg-white/5 text-[11px] text-gray-500 dark:text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer font-medium border-none bg-transparent"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>{selectedProject ? selectedProject : 'No Project'}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                          </button>
                          {showProjectMenu && (
                            <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-1 z-50 shadow-xl">
                              <button
                                onClick={() => { setSelectedProject(null); setShowProjectMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-[11px] rounded-lg hover:bg-white dark:bg-white/5 transition-colors text-gray-500 dark:text-neutral-400 hover:text-white dark:text-black dark:hover:text-black dark:text-white bg-transparent border-none cursor-pointer"
                              >
                                None (General Post)
                              </button>
                              <button
                                onClick={() => { setSelectedProject('Squibl'); setShowProjectMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-[11px] rounded-lg hover:bg-white dark:bg-white/5 transition-colors text-gray-600 dark:text-neutral-300 hover:text-white dark:text-black dark:hover:text-black dark:text-white flex items-center gap-2 bg-transparent border-none cursor-pointer"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Squibl
                              </button>
                              <button
                                onClick={() => { setSelectedProject('SaaS Dashboard'); setShowProjectMenu(false); }}
                                className="w-full text-left px-2.5 py-2 text-[11px] rounded-lg hover:bg-white dark:bg-white/5 transition-colors text-gray-600 dark:text-neutral-300 hover:text-white dark:text-black dark:hover:text-black dark:text-white flex items-center gap-2 bg-transparent border-none cursor-pointer"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                SaaS Dashboard
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex gap-2 sm:gap-3 items-start">
                      <img
                        src={avatarSrc}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={handleInput}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder={
                            selectedPostType === 'looking_for'
                              ? "What roles, skills, or collaborators do you need?..."
                              : selectedPostType === 'build_log'
                                ? "What milestone did you unlock? (e.g. launched v1.0)..."
                                : "What are you shipping?"
                          }
                          className="w-full bg-transparent text-black dark:text-white text-[16px] sm:text-[17px] placeholder-neutral-400 outline-none resize-none pt-1 pb-1 border-none focus:ring-0 leading-relaxed font-sans transition-all"
                          style={{ minHeight: '40px' }}
                        />
                      </div>
                    </div>

                    {/* Voice Recording / Audio Preview Blocks */}
                    {isRecording && (
                      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl mt-2 ml-0 sm:ml-[52px]">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="text-[12px] font-mono text-red-500 font-bold shrink-0">
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>

                        <div className="flex items-center gap-1 h-4 overflow-hidden flex-1 px-4">
                          {[...Array(16)].map((_, i) => (
                            <span
                              key={i}
                              className="w-[2px] bg-red-500 rounded-full transition-all duration-150"
                              style={{
                                height: `${Math.floor(Math.random() * 10) + 4}px`,
                                animation: `bounce 0.8s ease-in-out infinite alternate`,
                                animationDelay: `${i * 100}ms`
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAudioRecording()}
                          className="px-3 py-1 rounded-lg bg-red-500 text-white dark:text-black hover:bg-red-400 transition-colors cursor-pointer text-[11px] font-bold border-none"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {audioBlob && (
                      <div className="flex items-center justify-between gap-3 bg-neutral-900 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl mt-2 ml-0 sm:ml-[52px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (audioPreviewRef.current) {
                                if (isPlayingAudio) {
                                  audioPreviewRef.current.pause();
                                  setIsPlayingAudio(false);
                                } else {
                                  audioPreviewRef.current.play();
                                  setIsPlayingAudio(true);
                                }
                              }
                            }}
                            className="w-7 h-7 rounded-full bg-white text-white dark:text-black flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer border-none"
                          >
                            {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                          </button>
                          <span className="text-[12px] font-medium text-gray-600 dark:text-neutral-300">Voice devlog attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setAudioBlob(null); setIsPlayingAudio(false); }}
                          className="w-7 h-7 rounded-lg text-gray-400 dark:text-neutral-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <audio ref={audioPreviewRef} src={URL.createObjectURL(audioBlob)} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                      </div>
                    )}

                    {/* Tags Quick Suggestions */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap mt-3 ml-0 sm:ml-[52px] pb-1 pr-4 sm:pr-0">
                      {['nextjs', 'react', 'tailwind', 'typescript', 'ai'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const trimmedStack = stackTags.trim();
                            const words = trimmedStack.split(/\s+/).filter(Boolean);
                            if (!words.includes(tag)) {
                              setStackTags(trimmedStack ? `${trimmedStack} ${tag}` : tag);
                            }
                          }}
                          className="text-[11px] shrink-0 whitespace-nowrap font-mono bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-neutral-300 hover:text-white dark:text-black dark:hover:text-black dark:text-white hover:bg-gray-100 dark:hover:bg-black/10 dark:bg-white/10 hover:border-gray-200 dark:border-white/20 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 mt-2 sm:mt-3 ml-0 sm:ml-[52px]">
                      {/* Left: Stack tags input + Media Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-black/10 dark:bg-white/10 text-gray-500 dark:text-neutral-400 hover:text-white dark:text-black dark:hover:text-black dark:text-white transition-colors cursor-pointer bg-transparent border-none" title="Attach Media">
                          <Image className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAudioRecording(); }}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer border-none bg-transparent ${isRecording ? "text-red-500 bg-red-500/10" : "text-gray-500 dark:text-neutral-400 hover:text-white dark:text-black dark:hover:text-black dark:text-white hover:bg-gray-100 dark:hover:bg-black/10 dark:bg-white/10"}`}
                          title="Record Voice"
                        >
                          <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
                        </button>

                        <div className="w-[1px] h-4 bg-white dark:bg-black/10 dark:bg-white/10 mx-1"></div>

                        <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-600 dark:text-neutral-300 font-mono text-[12px] focus-within:border-gray-200 dark:border-white/30 focus-within:bg-white dark:bg-black/10 dark:bg-white/10 transition-all">
                          <span className="mr-1 opacity-50">#</span>
                          <input
                            type="text"
                            value={stackTags}
                            onChange={(e) => setStackTags(e.target.value)}
                            placeholder="stack"
                            className="w-[120px] bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-neutral-500 text-black dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Right: Submit Button */}
                      <div className="flex items-center gap-3">
                        {/* Character Count Progress Ring */}
                        {content.length > 0 && (
                          <div className="flex items-center justify-center w-6 h-6 select-none relative">
                            <svg className="w-5 h-5 transform -rotate-90">
                              <circle cx="10" cy="10" r="8" className="stroke-neutral-800 fill-none" strokeWidth="2" />
                              <circle
                                cx="10" cy="10" r="8"
                                className={`fill-none transition-all duration-300 ${content.length > 250 ? 'stroke-red-500' : content.length > 200 ? 'stroke-amber-500' : 'stroke-[#1d9bf0]'
                                  }`}
                                strokeWidth="2"
                                strokeDasharray={`${2 * Math.PI * 8}`}
                                strokeDashoffset={`${2 * Math.PI * 8 * (1 - Math.min(content.length, 280) / 280)}`}
                              />
                            </svg>
                          </div>
                        )}

                        <button
                          onClick={submitPost}
                          disabled={(!content.trim() && !audioBlob) || isPosting}
                          className={`relative group/submit rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] transition-all active:scale-95 cursor-pointer border-none ml-auto ${(!content.trim() && !audioBlob) || isPosting
                            ? "bg-black/20 dark:bg-white/20 text-black dark:text-white/50 cursor-not-allowed pointer-events-none"
                            : theme.button
                            }`}
                        >
                          {isPosting ? "Posting..." : theme.btnText}
                          {/* Button Hover Glow */}
                          {!((!content.trim() && !audioBlob) || isPosting) && (
                            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover/submit:opacity-20 blur-md transition-opacity duration-300 -z-10" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mic Error */}
                    {micError && (
                      <div className="absolute top-2 right-4 text-red-400 text-[12px] bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">
                        {micError}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Feed Posts */}
              <div className="flex flex-col pb-[80px] md:pb-24 px-3 sm:px-4 mt-0 pt-[12px] relative">
                {filteredPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-gray-200 dark:border-white/5 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-neutral-600" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-black dark:text-white mb-1">No posts yet</h3>
                    <p className="text-[13px] text-neutral-600">Be the first to ship something today.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <PostCard post={post} user={user} handleLikeClick={handleLikeClick} handleCollabClick={handleCollabClick} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* COLUMN 2: RIGHT SIDEBAR */}
            <RightSidebar />

          </div>
        </main>


        <Toaster theme="dark" position="bottom-right" richColors />
      </div>
    </div>
  );
}