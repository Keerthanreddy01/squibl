"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { 
  subscribeToChats, 
  subscribeToMessages, 
  sendMessage, 
  createChat, 
  markConversationAsRead
} from "@/lib/chats";
import { getAllProfiles } from "@/lib/profiles";
import { 
  Search, SlidersHorizontal, Plus, ArrowLeft, MoreHorizontal,
  Phone, Mic, Send, Smile, Lock, XCircle, Check, Video, ChevronDown
} from "lucide-react";

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  const currentUid = user?.id || (user as any)?.uid || "";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Support opening compose modal via query parameter (?compose=true)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("compose=true")) {
      setIsComposeOpen(true);
      router.replace("/messages");
    }
  }, [router]);

  // Listen for navigation compose events from the main app sidebar
  useEffect(() => {
    const handleOpenCompose = () => setIsComposeOpen(true);
    window.addEventListener("open-compose", handleOpenCompose);
    return () => window.removeEventListener("open-compose", handleOpenCompose);
  }, []);

  useEffect(() => {
    if (!user) return;
    async function loadProfiles() {
      const { data } = await getAllProfiles();
      if (data) {
        const cache: Record<string, any> = {};
        data.forEach((p) => {
          const id = p.id || p.uid || "";
          if (id) cache[id] = { id, ...p };
        });
        setProfiles(cache);
      }
    }
    loadProfiles();
  }, [user]);

  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToChats(currentUid, (data) => setChats(data));
    return () => unsub();
  }, [currentUid]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(activeChatId, (data) => setMessages(data));
    return () => unsub();
  }, [activeChatId]);

  // Scroll to bottom automatically on load and message updates
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, activeChatId]);

  useEffect(() => {
    if (!activeChatId || !currentUid) return;
    markConversationAsRead(activeChatId, currentUid);
  }, [activeChatId, messages, currentUid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUid || !activeChatId) return;
    
    const content = newMessage.trim();
    setNewMessage("");
    
    await sendMessage({
      chatId: activeChatId,
      senderId: currentUid,
      content
    });
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMins < 1) return "Now";
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return "Now";
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherUid = chat.participants.find((p: string) => p !== currentUid);
    const otherProfile = profiles[otherUid] || {};
    const username = (otherProfile.username || "").toLowerCase();
    const fullName = (otherProfile.full_name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return username.includes(q) || fullName.includes(q);
  });

  let activeRecipientProfile: any = null;
  if (activeChatId) {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat) {
      const otherUid = activeChat.participants.find((p: string) => p !== currentUid);
      activeRecipientProfile = profiles[otherUid] || { id: otherUid, username: "Builder" };
    }
  }

  const BlueBadge = () => (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-black dark:text-white shrink-0 ml-1">
      <Check className="w-2.5 h-2.5 stroke-[4]" />
    </span>
  );

  if (loading || !user) {
    return <div className="flex h-screen bg-white dark:bg-black" />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-[#000000] text-black dark:text-white font-sans overflow-hidden selection:bg-[#1d9bf0]/25 selection:text-black dark:text-white relative">
      <div className="flex w-full max-w-[1250px] h-screen relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        
        <main 
          className="flex-1 flex h-full overflow-hidden relative z-10 bg-[#000000] min-w-0"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '15px',
            lineHeight: '1.5'
          }}
        >
          {/* Overall messages page wrapper */}
          <div className="flex w-full h-full bg-[#000000] relative z-10">
          
          {/* COLUMN 1: CHAT THREADS LIST (Responsive) */}
          <div className={`w-full md:w-[350px] md:min-w-[350px] border-r border-[#2f3336] flex-col h-full shrink-0 bg-[#000000] ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
            {/* Header of left sidebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#000000] border-b border-[#2f3336]">
              <div className="flex items-center gap-3">
                <h1 className="text-[20px] font-extrabold text-black dark:text-white tracking-tight">Chat</h1>
                {/* All Filter Pill */}
                <div className="flex items-center gap-1.5 px-4 py-1 border border-[#536471] rounded-full text-[14px] font-bold text-black dark:text-white hover:bg-black/10 dark:bg-white/10 cursor-pointer transition-colors bg-transparent">
                  <span>All</span>
                  <ChevronDown className="w-4 h-4 text-[#71767b]" />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-[#16181c] rounded-full transition-colors text-black dark:text-white" title="Filters">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsComposeOpen(true)}
                  className="p-2 hover:bg-[#16181c] rounded-full transition-colors text-black dark:text-white" 
                  title="New message"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative group px-4 py-2 border-b border-[#2f3336]">
              <input
                type="text"
                placeholder="Search Direct Messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#202327] rounded-full h-11 pl-11 pr-4 text-[15px] text-black dark:text-white placeholder-[#71767b] outline-none border-none focus:ring-1 focus:ring-[#1d9bf0]/50"
              />
              <Search className="w-5 h-5 text-[#71767b] absolute left-8 top-5" />
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-6 bg-[#000000]">
              {filteredChats.map(chat => {
                const otherUid = chat.participants.find((p: string) => p !== currentUid);
                const otherProfile = profiles[otherUid] || {};
                const isActive = activeChatId === chat.id;
                const unreadCount = chat.unreadCount?.[currentUid] || 0;

                return (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex items-center gap-3 px-4 h-[72px] cursor-pointer transition-colors border-none ${
                      isActive 
                        ? 'bg-[#16181c]' 
                        : 'hover:bg-[#080808]'
                    }`}
                  >
                    <div className="relative shrink-0 w-14 h-14">
                      <img 
                        src={otherProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUid}`} 
                        className="w-14 h-14 rounded-full object-cover bg-neutral-800" 
                        alt="" 
                      />
                      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center min-w-0">
                          <span className="text-[15px] font-bold text-black dark:text-white truncate hover:underline tracking-tight">
                            {otherProfile.full_name || otherProfile.username}
                          </span>
                          <BlueBadge />
                        </div>
                        <span className="text-[13px] text-[#71767b] shrink-0 font-normal">
                          {formatMessageTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={`text-[15px] truncate leading-normal ${
                          unreadCount > 0 ? 'text-black dark:text-white font-bold' : 'text-[#71767b]'
                        }`}>
                          {chat.lastMessage || "Started a new conversation..."}
                        </span>
                        {unreadCount > 0 && (
                          <span className="h-4 min-w-4 px-1 rounded-full bg-[#1d9bf0] text-black dark:text-white flex items-center justify-center text-[9px] font-black shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CONVERSATION PANE */}
          <div className={`flex-1 border-r border-[#2f3336] flex-col h-full bg-[#000000] relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
            {!activeChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 pb-20 select-none z-10 bg-[#000000]">
                <h2 className="text-2xl font-extrabold text-black dark:text-white tracking-tight mb-2">Select a message</h2>
                <p className="text-[15px] text-[#71767b] max-w-sm leading-normal">
                  Choose from your existing conversations, start a new one, or just keep swimming.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div 
                  className="h-[60px] flex items-center justify-between px-6 shrink-0 z-10"
                  style={{
                    background: 'rgba(0, 0, 0, 0.72)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setActiveChatId(null)} 
                      className="md:hidden p-2 hover:bg-[#16181c] rounded-full transition-colors text-black dark:text-white mr-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img 
                      src={activeRecipientProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRecipientProfile?.id}`}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-800"
                      alt=""
                    />
                    <div className="flex items-center min-w-0">
                      <span className="text-[15px] font-bold text-black dark:text-white truncate hover:underline tracking-tight">
                        {activeRecipientProfile?.full_name || activeRecipientProfile?.username}
                      </span>
                      <BlueBadge />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#1d9bf0]">
                    <button className="p-2.5 hover:bg-[#16181c] rounded-full transition-all text-[#1d9bf0]" title="Voice call">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-[#16181c] rounded-full transition-all text-[#1d9bf0]" title="Video call">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-[#16181c] rounded-full transition-all text-[#1d9bf0]" title="Conversation info">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Message History Feed */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar bg-transparent z-10 relative">
                  <div className="py-4 text-center flex items-center justify-center select-none text-[13px] text-[#71767b] w-full">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Lock className="w-3.5 h-3.5" />
                      This conversation is end-to-end encrypted
                    </span>
                  </div>

                  {messages.map((msg, i) => {
                    const isSentByMe = (msg.senderId || msg.sender_id) === currentUid;
                    const timeStr = formatMessageTime(msg.timestamp || msg.created_at);

                    return (
                      <div key={msg.id || i} className={`flex flex-col max-w-[70%] ${isSentByMe ? 'items-end self-end' : 'items-start self-start'}`}>
                        <div className={`px-4 py-2.5 text-[15px] leading-normal break-words transition-all ${
                          isSentByMe 
                            ? 'bg-[#1d9bf0] text-black dark:text-white rounded-[18px]' 
                            : 'bg-[#1e2328] text-black dark:text-white rounded-[18px]'
                        }`}>
                          {msg.content || msg.text}
                        </div>
                        
                        <span className="text-[13px] text-[#71767b] mt-1 flex items-center gap-1 select-none">
                          {timeStr}
                          {isSentByMe && (
                            <span className="text-[#71767b] flex items-center">
                              • SEEN ✓
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <div 
                  className="p-4 pb-20 md:pb-4 shrink-0 z-10 bg-[#000000]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.72)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'sticky',
                    bottom: 0
                  }}
                >
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[#1d9bf0] shrink-0">
                      <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors" title="Add media">
                        <Plus className="w-5 h-5 text-[#1d9bf0]" />
                      </button>
                      <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 font-bold text-[13px] leading-none h-9 w-9 flex items-center justify-center rounded-full transition-colors" title="Add GIF">
                        GIF
                      </button>
                      <button type="button" className="p-2 hover:bg-[#1d9bf0]/10 rounded-full transition-colors" title="Add emoji">
                        <Smile className="w-5 h-5 text-[#1d9bf0]" />
                      </button>
                    </div>

                    <div className="flex-1 bg-[#202327] rounded-full px-4 py-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Start a new message"
                        className="bg-transparent text-[15px] text-black dark:text-white placeholder-[#71767b] outline-none w-full border-none focus:ring-0"
                      />
                      <button type="button" className="text-[#1d9bf0] hover:text-[#1a8cd8] p-1 rounded-full transition-colors shrink-0">
                        <Mic className="w-5 h-5" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="text-[#1d9bf0] hover:text-[#1a8cd8] p-1 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
          
        </div>
      </main>

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#000000] border border-[#2f3336] w-full max-w-md rounded-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
              <h2 className="text-xl font-bold text-black dark:text-white">New Message</h2>
              <button 
                onClick={() => setIsComposeOpen(false)}
                className="text-black dark:text-white hover:bg-[#16181c] p-2 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-[#2f3336]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search people"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#202327] rounded-full py-2 pl-11 pr-4 text-[15px] text-black dark:text-white placeholder-[#71767b] outline-none border-none focus:ring-1 focus:ring-[#1d9bf0]/50"
                />
                <Search className="w-4 h-4 text-[#71767b] absolute left-4 top-3.5" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {Object.values(profiles)
                .filter((profile: any) => {
                  if (profile.id === currentUid) return false;
                  const name = (profile.full_name || "").toLowerCase();
                  const username = (profile.username || "").toLowerCase();
                  const query = searchQuery.toLowerCase();
                  return name.includes(query) || username.includes(query);
                })
                .map((profile: any) => (
                  <div
                    key={profile.id}
                    onClick={async () => {
                      setIsComposeOpen(false);
                      const existingChat = chats.find(c => c.participants.includes(profile.id));
                      if (existingChat) {
                        setActiveChatId(existingChat.id);
                      } else {
                        const res = await createChat([currentUid, profile.id]);
                        if (res.data) {
                          setActiveChatId(res.data);
                        }
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#16181c] cursor-pointer transition-colors"
                  >
                    <img
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-800"
                      alt=""
                    />
                    <div>
                      <div className="font-bold text-black dark:text-white text-[15px]">{profile.full_name || profile.username}</div>
                      <div className="text-[13px] text-[#71767b]">@{profile.username || "builder"}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
