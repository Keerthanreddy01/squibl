"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Settings, User, Bell, Shield, LogOut, Mail, Key, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { signOut, resetPasswordForEmail } from "@/lib/auth";
import { getProfile, updateProfile } from "@/lib/profiles";
import { sanitizeShortText, sanitizeBio } from "@/lib/sanitize";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Profile");
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    role: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await getProfile(user.id);
        if (data) {
          setFormData({
            fullName: data.full_name || user.user_metadata?.full_name || "",
            bio: data.bio || "",
            location: data.location || "",
            role: data.role || "",
          });
        }
      };
      fetchProfile();
    }
  }, [user]);

  // ── Profile Save ────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await updateProfile(user.id, {
        full_name: sanitizeShortText(formData.fullName),
        bio:       sanitizeBio(formData.bio),
        location:  sanitizeShortText(formData.location),
        role:      sanitizeShortText(formData.role),
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Password Reset ──────────────────────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    try {
      const { error } = await resetPasswordForEmail(user.email);
      if (error) throw error;
      setPasswordResetSent(true);
      setMessage({ type: 'success', text: `Password reset email sent to ${user.email}. Check your inbox.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Could not send password reset email. Please try again.' });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch {
      setMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center text-black dark:text-white">Loading...</div>;
  }

  const tabs = [
    { name: "Profile",       icon: User },
    { name: "Account",       icon: Settings },
    { name: "Notifications", icon: Bell },
    { name: "Appearance",    icon: Palette },
    { name: "Security",      icon: Shield },
  ];

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white selection:bg-blue-500/30 selection:text-black dark:text-white font-inter overflow-x-hidden relative">
      <div className="flex w-full max-w-[1250px] min-h-screen relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 min-h-screen overflow-y-visible relative min-w-0">
          <div className="max-w-[800px] mx-auto px-4 py-8 md:px-8 pb-32 border-r border-l border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#050505] min-h-screen">

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">Settings</h1>
            <p className="text-[#A8A8A8] text-[15px]">Manage your account settings and preferences.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Nav */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-64 shrink-0 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.name}
                    onClick={() => { setActiveTab(tab.name); setMessage(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
                      activeTab === tab.name
                        ? "bg-white/[0.08] text-black dark:text-white"
                        : "text-[#888] hover:bg-white/[0.04] hover:text-[#ddd]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/[0.06]">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </motion.div>

            {/* Content Area */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-[24px] p-6 md:p-8 backdrop-blur-[20px]"
            >
              <h2 className="text-xl font-bold text-black dark:text-white mb-6">{activeTab} Settings</h2>

              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              {/* ── Profile Tab ── */}
              {activeTab === "Profile" && (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", key: "fullName", placeholder: "Your full name", max: 100 },
                      { label: "Role",      key: "role",     placeholder: "e.g. Full Stack Developer", max: 100 },
                      { label: "Location",  key: "location", placeholder: "e.g. San Francisco, CA", max: 100 },
                    ].map(({ label, key, placeholder, max }) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-black dark:text-white/80">{label}</label>
                        <input
                          type="text"
                          value={(formData as any)[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          maxLength={max}
                          className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/5 focus:border-[#7e85fe] rounded-xl h-11 px-4 text-black dark:text-white placeholder:text-black dark:text-white/20 outline-none transition-all text-sm font-medium"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-black dark:text-white/80">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        maxLength={500}
                        className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/5 focus:border-[#7e85fe] rounded-xl p-4 text-black dark:text-white placeholder:text-black dark:text-white/20 outline-none transition-all text-sm font-medium resize-none min-h-[100px]"
                        placeholder="Tell us about yourself..."
                      />
                      <p className="text-xs text-black dark:text-white/30 text-right">{formData.bio.length}/500</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-white/[0.06] flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-200 transition-all text-sm flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Account Tab ── */}
              {activeTab === "Account" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-black dark:text-white/50" /> Email Address
                    </h3>
                    <p className="text-sm text-black dark:text-white/50">Your email address is used to sign in to Squibl.</p>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl h-11 px-4 text-black dark:text-white/50 outline-none cursor-not-allowed text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-white/[0.06]">
                    <h3 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-black dark:text-white/50" /> Password
                    </h3>
                    <p className="text-sm text-black dark:text-white/50">
                      We'll send a password reset link to <span className="text-black dark:text-white">{user?.email}</span>.
                    </p>
                    <button
                      type="button"
                      disabled={passwordResetSent || passwordResetLoading}
                      onClick={handlePasswordReset}
                      className="px-6 py-2.5 bg-black/5 dark:bg-white/5 text-black dark:text-white font-semibold rounded-full border border-gray-200 dark:border-white/10 hover:bg-black/10 dark:bg-white/10 transition-all text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {passwordResetLoading ? (
                        <div className="h-4 w-4 border-2 border-gray-200 dark:border-white/50 border-t-transparent rounded-full animate-spin" />
                      ) : passwordResetSent ? (
                        "Reset Email Sent ✓"
                      ) : (
                        "Send Password Reset Email"
                      )}
                    </button>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-red-500/10">
                    <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
                    <p className="text-sm text-black dark:text-white/50">Permanently delete your account and all associated data. This cannot be undone.</p>
                    <button
                      type="button"
                      onClick={() => setMessage({ type: 'error', text: 'To delete your account, please contact support@squibl.dev. We require identity verification before deletion.' })}
                      className="px-6 py-2.5 bg-red-500/10 text-red-400 font-semibold rounded-full border border-red-500/20 hover:bg-red-500/20 transition-all text-sm active:scale-[0.98]"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === "Notifications" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-black dark:text-white mb-2">Notification Preferences</h3>
                  {[
                    { title: "Email Notifications", desc: "Receive weekly digests and updates via email." },
                    { title: "In-App Notifications", desc: "Receive notifications inside Squibl." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-center justify-between p-4 bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-[16px]">
                      <div>
                        <h4 className="text-sm font-medium text-black dark:text-white">{title}</h4>
                        <p className="text-xs text-black dark:text-white/50 mt-1">{desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-black/10 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black/20 dark:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Appearance Tab ── */}
              {activeTab === "Appearance" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-black dark:text-white mb-2">Appearance Settings</h3>
                  <div className="p-4 bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-[16px] space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-black dark:text-white">Theme Preference</h4>
                      <p className="text-xs text-black dark:text-white/50 mt-1 mb-4">Choose how Squibl looks to you. Select light or dark mode.</p>
                      <ThemeToggle inline={true} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Security Tab ── */}
              {activeTab === "Security" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-black dark:text-white mb-2">Security Settings</h3>

                  <div className="p-4 bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-[16px] space-y-3">
                    <h4 className="text-sm font-medium text-black dark:text-white">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-black dark:text-white/50">Add an extra layer of security. When enabled, you'll need both your password and a verification code to sign in.</p>
                    <button
                      onClick={() => setMessage({ type: 'success', text: '2FA setup coming soon! Multi-factor authentication will be available in the next update.' })}
                      className="px-4 py-2 bg-black/10 dark:bg-white/10 text-black dark:text-white text-xs font-semibold rounded-lg hover:bg-black/20 dark:bg-white/20 transition-all"
                    >
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-[16px] space-y-3">
                    <h4 className="text-sm font-medium text-black dark:text-white">Active Sessions</h4>
                    <p className="text-xs text-black dark:text-white/50">
                      Signed in as <span className="text-black dark:text-white font-medium">{user.email}</span>.
                      Supabase manages your session securely with JWT tokens.
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
