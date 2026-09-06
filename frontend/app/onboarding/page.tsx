"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getProfile, updateProfile } from "@/lib/profiles";
import { uploadAvatar } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import ReflectiveCard from "@/components/ReflectiveCard";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUploadUrl, setAvatarUploadUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
  });

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Mount check: if user already onboarded
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const checkOnboarding = async () => {
      const { data: profile } = await getProfile(user.id);
      if (profile && profile.onboarding_completed) {
        router.push("/dashboard/home");
      } else if (profile) {
        setFormData({
          fullName: profile.full_name || user.user_metadata?.full_name || "",
          username: profile.username || user.email?.split("@")[0] || "",
          bio: profile.bio || "",
        });
      } else {
        setFormData({
          fullName: user.user_metadata?.full_name || "",
          username: user.email?.split("@")[0] || "",
          bio: "",
        });
      }
    };
    checkOnboarding();
  }, [user, authLoading, router]);

  // Username availability check
  useEffect(() => {
    if (!formData.username.trim() || formData.username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      try {
        const { data, error: qError } = await (supabase
          .from("builder_profiles") as any)
          .select("id")
          .eq("username", formData.username.trim().toLowerCase())

        if (qError) throw qError

        let taken = false;
        if (data && data.length > 0) {
          taken = (data as Array<{ id: string }>).some(row => row.id !== user?.id);
        }

        setIsUsernameAvailable(!taken);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.username, user]);

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.fullName.trim() || !formData.username.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (isUsernameAvailable === false) {
      setError("Username is already taken.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const avatarUrl =
        avatarUploadUrl ||
        user.user_metadata?.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80";

      const profilePayload = {
        full_name: formData.fullName || user.user_metadata?.full_name || "Builder",
        username: formData.username.trim().toLowerCase(),
        bio: formData.bio || "",
        avatar_url: avatarUrl,
        location: "",
        skills: [],
        stack: [],
        experience_level: "Mid",
        looking_for: [],
        availability: "Open to collab",
        github_url: "",
        twitter_url: "",
        onboarding_completed: true,
      };

      const { error: saveError } = await (supabase
        .from("builder_profiles") as any)
        .upsert({
          id: user.id,
          email: user.email,
          ...profilePayload,
        }, { onConflict: "id" })

      if (saveError) throw saveError

      router.push("/dashboard/home");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be 2MB or smaller.");
      return;
    }

    setError(null);
    const localUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(localUrl);
    setAvatarUploading(true);

    try {
      const { url, error: uploadErr } = await uploadAvatar(user.id, file);
      if (uploadErr || !url) throw uploadErr || new Error("Failed to get avatar URL");
      setAvatarUploadUrl(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Failed to upload image. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/20 dark:border-white border-t-transparent" />
      </div>
    );
  }

  const displayName = formData.fullName || 'Your Name';
  const displayHandle = formData.username || 'username';
  const displayTitle = formData.bio.trim() || 'Software Engineer';

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans antialiased flex flex-col md:flex-row overflow-hidden selection:bg-white selection:text-white dark:text-black">
      
      {/* LEFT COLUMN: Clean Form */}
      <div className="w-full md:w-1/2 min-h-[50vh] md:min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-8 relative">
        <div className="w-full max-w-[340px]">
          
          <div className="mb-10 flex items-start justify-between gap-4 text-left">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-2">
                Setup Profile
              </h1>
              <p className="text-[#888888] text-sm leading-relaxed">
                Let's create your developer identity.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <label
                htmlFor="avatar-upload"
                title="Optional profile photo"
                aria-label="Optional profile photo upload"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 dark:border-white/30 bg-black/5 dark:bg-white/5 text-sm font-semibold text-black dark:text-white transition hover:border-gray-200 dark:border-white/60 hover:bg-black/10 dark:bg-white/10 ${
                  avatarUploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                +
              </label>
              <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#666666]">
                Optional
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleFinish} className="space-y-4">
            
            <input
              type="text"
              required
              placeholder="Full Name"
              value={formData.fullName}
              onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full bg-transparent border-b border-gray-200 dark:border-white/20 focus:border-black/20 dark:border-white px-1 py-3 text-sm text-black dark:text-white placeholder-[#666666] outline-none transition-all font-medium"
            />

            <div className="relative">
              <span className="absolute left-1 inset-y-0 flex items-center text-[#666666] font-medium text-sm">@</span>
              <input
                type="text"
                required
                placeholder="username"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                className="w-full bg-transparent border-b border-gray-200 dark:border-white/20 focus:border-black/20 dark:border-white pl-6 pr-10 py-3 text-sm text-black dark:text-white placeholder-[#666666] outline-none transition-all font-medium"
              />
              <div className="absolute right-1 inset-y-0 flex items-center">
                {isCheckingUsername && (
                  <div className="h-3 w-3 border-2 border-[#666] border-t-transparent rounded-full animate-spin" />
                )}
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <span className="text-black dark:text-white font-medium text-sm">✓</span>
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <span className="text-black dark:text-white font-medium text-sm">✗</span>
                )}
              </div>
            </div>

            {avatarUploadUrl ? (
              <div className="pt-1 text-xs text-[#8f8f8f]">Upload complete.</div>
            ) : (
              <div className="pt-1 text-xs text-[#666666]">JPG, PNG, or WEBP. Max 2MB.</div>
            )}

            <div>
              <textarea
                maxLength={120}
                placeholder="Short bio (max 120 chars)"
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full resize-none bg-transparent border-b border-gray-200 dark:border-white/20 focus:border-black/20 dark:border-white px-1 py-3 text-sm text-black dark:text-white placeholder-[#666666] outline-none transition-all font-medium"
                rows={2}
              />
            </div>
            
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || isUsernameAvailable === false}
                className="w-full bg-white text-white dark:text-black font-semibold rounded-full py-3.5 hover:bg-gray-200 transition-all text-sm flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Copyright Footer */}
        <div className="absolute bottom-8 left-0 right-0 w-full text-center text-[#444444] text-xs font-medium">
          © Squibl {new Date().getFullYear()}
        </div>
      </div>

      {/* RIGHT COLUMN: ProfileCard Preview */}
      <div className="w-full md:w-1/2 min-h-[50vh] md:min-h-screen bg-white dark:bg-[#050505] border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/5 relative overflow-hidden flex items-center justify-center p-8">
        <div className="w-full max-w-[320px]">
          <ReflectiveCard
            name={displayName}
            title={displayTitle}
            handle={displayHandle}
            status="Online"
            contactText="Contact Me"
            overlayColor="rgba(0, 0, 0, 0.2)"
            blurStrength={12}
            glassDistortion={30}
            metalness={1}
            roughness={0.75}
            displacementStrength={20}
            noiseScale={1}
            specularConstant={5}
            grayscale={0.15}
            color="#ffffff"
            className="mx-auto"
            style={{ height: 500, width: '100%' }}
          />
        </div>
      </div>

    </div>
  );
}
