"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Telescope, Rocket, MessageSquare, Bell, User, Settings } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, onMobileCreateClick }: any) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = user.id || (user as any).uid;
    async function loadProfile() {
      const { data } = await getProfile(userId);
      if (data) setProfile(data);
    }
    loadProfile();
  }, [user]);

  const navItems = [
    { key: "home",          label: "Home",         icon: LayoutDashboard, route: "/dashboard/home" },
    { key: "explore",       label: "Discover",     icon: Telescope,       route: "/explore" },
    { key: "messages",      label: "Messages",     icon: MessageSquare,   route: "/messages" },
    { key: "notifications", label: "Notifications",icon: Bell,            route: "/notifications" },
    { key: "connect",       label: "Connect",      icon: Rocket,          route: "/connect" },
    { key: "profile",       label: "Your Profile", icon: User,            route: "/profile" },
    { key: "settings",      label: "Settings",     icon: Settings,        route: "/settings" },
  ];

  const userAvatar = profile?.avatar_url || profile?.profilePhotoUrl || user?.user_metadata?.avatar_url || null;

  return (
    <div className="hidden md:flex relative sticky top-4 left-4 z-[60] h-[calc(100dvh-32px)] shrink-0 w-[80px]">
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 250 : 80 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
        className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/[0.08] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden"
      >
        <div className="flex flex-col">

          {/* Logo */}
          <div className={`flex items-center pt-5 pb-3 ${isExpanded ? "px-5" : "px-0 justify-center"}`}>
            <Link
              href="/dashboard/home"
              aria-label="Go to dashboard home"
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer outline-none shrink-0"
            >
              {isExpanded ? (
                <div className="flex items-center">
                  <img src="/newlogo.png" alt="Logo" className="w-8 h-8 mr-3 rounded-xl drop-shadow-sm" />
                  <span className="text-[17px] font-bold text-black dark:text-white tracking-tight whitespace-nowrap">
                    Squibl
                  </span>
                </div>
              ) : (
                <img src="/newlogo.png" alt="Logo" className="w-9 h-9 rounded-xl drop-shadow-sm" />
              )}
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-gray-100 dark:bg-white/[0.06] mb-2" />

          {/* Navigation */}
          <nav className="flex flex-col gap-1 w-full px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.key === "home"
                  ? pathname === "/dashboard/home"
                  : pathname.startsWith(item.route);

              return (
                <Link
                  key={item.key}
                  href={item.route}
                  aria-label={item.label}
                  className="group/nav relative block outline-none"
                >
                  <div
                    className={`
                      relative flex items-center h-[46px] w-full px-4 rounded-[14px] cursor-pointer overflow-hidden
                      ${isActive
                        ? "bg-gray-100 dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.12] shadow-sm"
                        : "bg-transparent border border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      }
                    `}
                  >
                    <div className="relative z-10 flex items-center w-full">
                      <Icon
                        className={`shrink-0 ${
                          isActive
                            ? "text-black dark:text-white"
                            : "text-gray-500 dark:text-neutral-400 group-hover/nav:text-black dark:group-hover/nav:text-white"
                        }`}
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className={`ml-3 text-[14px] whitespace-nowrap ${
                              isActive
                                ? "font-semibold text-black dark:text-white"
                                : "font-medium text-gray-600 dark:text-neutral-300"
                            }`}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Tooltip for collapsed */}
                  {!isExpanded && !isMobile && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 whitespace-nowrap transition-opacity duration-150 shadow-xl z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Divider */}
          <div className="mx-4 h-px bg-gray-100 dark:bg-white/[0.06] mt-3" />

          {/* User Profile at bottom */}
          <div className={`flex items-center py-4 ${isExpanded ? "px-4" : "px-0 justify-center"}`}>
            <Link href="/profile" aria-label="Open your profile" className="flex items-center gap-3 group/avatar outline-none">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-gray-200 dark:ring-white/10 group-hover/avatar:ring-gray-400 dark:group-hover/avatar:ring-white/30 transition-all">
                {userAvatar ? (
                  <img src={userAvatar} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                    <User size={16} className="text-gray-500 dark:text-neutral-400" />
                  </div>
                )}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex flex-col min-w-0"
                  >
                    <span className="text-[13px] font-semibold text-black dark:text-white truncate max-w-[140px]">
                      {profile?.full_name || profile?.name || user?.user_metadata?.full_name || "You"}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-500 truncate max-w-[140px]">
                      {profile?.username ? `@${profile.username}` : user?.email || ""}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

        </div>
      </motion.aside>
    </div>
  );
}
