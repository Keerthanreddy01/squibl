"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/dashboard/RightSidebar";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/notifications";
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.id, (data) => setNotifications(data));
    return () => unsub();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-[#0095F6] border-t-transparent" />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch(type) {
      case "like": return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case "comment": return <MessageCircle className="w-4 h-4 text-blue-400 fill-blue-400" />;
      case "follow": return <UserPlus className="w-4 h-4 text-green-400" />;
      default: return <Bell className="w-4 h-4 text-black dark:text-white/50" />;
    }
  };

  const getMessage = (type: string, actorName: string) => {
    switch(type) {
      case "like": return <><span className="font-bold text-black dark:text-white">{actorName}</span> liked your post.</>;
      case "comment": return <><span className="font-bold text-black dark:text-white">{actorName}</span> replied to you.</>;
      case "follow": return <><span className="font-bold text-black dark:text-white">{actorName}</span> started following you.</>;
      default: return <><span className="font-bold text-black dark:text-white">{actorName}</span> interacted with your profile.</>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans overflow-x-hidden relative selection:bg-blue-500/30 selection:text-black dark:text-white">
      <div className="flex w-full max-w-[1250px] min-h-screen relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 flex justify-center min-h-screen overflow-y-visible relative z-10 min-w-0">
          <div className="w-full max-w-[600px] flex flex-col pt-8 pb-24 mx-auto px-4 border-r border-l border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#050505]">
            
            <div className="flex items-center justify-between mb-8">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2 flex items-center gap-3">
                  <Bell className="w-8 h-8 text-yellow-400" />
                  Alerts
                </h1>
                <p className="text-[#A8A8A8] text-[15px]">
                  You have {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}.
                </p>
              </motion.div>
              {unreadCount > 0 && (
                <button 
                  onClick={() => notifications.forEach(n => !n.read && markNotificationAsRead(n.id))}
                  className="text-xs font-medium text-black dark:text-white/40 hover:text-black dark:text-white flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark all read
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-20">
                  <Bell className="w-12 h-12 text-black dark:text-white/10 mx-auto mb-4" />
                  <h3 className="text-[16px] font-bold text-black dark:text-white mb-1">No alerts yet</h3>
                  <p className="text-[13px] text-[#A8A8A8]">When people interact with you, it will show up here.</p>
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                      notif.read 
                        ? 'bg-white/[0.01] hover:bg-white/[0.03]' 
                        : 'bg-white/[0.04] border border-gray-200 dark:border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={notif.actorAvatar} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/5 bg-black/10 dark:bg-white/10" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#111] flex items-center justify-center border border-[#222]">
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-black dark:text-white/80 leading-snug">
                        {getMessage(notif.type, notif.actorName)}
                      </p>
                      {notif.content && (
                        <p className="text-[13px] text-black dark:text-white/50 mt-1 line-clamp-1 border-l-2 border-gray-200 dark:border-white/10 pl-2">
                          {notif.content}
                        </p>
                      )}
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}
