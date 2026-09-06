"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signInWithEmail, signInWithGithub } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { AlertCircle, Clock, Eye, EyeOff, Chrome, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Rate-limiting constants ──────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Brute-force / rate-limit state
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // ── Countdown timer when locked ────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const checkAndRedirect = useCallback(async (uid: string) => {
    try {
      const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
        .split(',')
        .map(u => u.trim())
        .filter(Boolean);

      if (adminUids.length > 0 && !adminUids.includes(uid)) {
        router.push("/pre-register");
        return;
      }

      const { data: profile } = await getProfile(uid);
      if (profile && profile.onboarding_completed) {
        router.push("/dashboard/home");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      router.push("/onboarding");
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      checkAndRedirect(user.id);
    }
  }, [user, authLoading, checkAndRedirect]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await signInWithEmail(email, password);
      if (authError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockedUntil(until);
          setError(
            `Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`
          );
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(
            `${authError.message}${remaining <= 2 ? ` (${remaining} attempt${remaining === 1 ? "" : "s"} left before lockout)` : ""}`
          );
        }
      } else if (data?.user) {
        setAttempts(0);
        await checkAndRedirect(data.user.id);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError.message || "Failed to sign in with Google.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    try {
      const { error: githubError } = await signInWithGithub();
      if (githubError) {
        setError(githubError.message || "Failed to sign in with GitHub.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with GitHub.");
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-white dark:bg-black selection:bg-white/30 p-2 transition-all duration-300 lg:h-screen lg:overflow-hidden lg:p-4">
      
      {/* Left Column (Hero & Background Video) */}
      <div className="relative hidden lg:flex flex-col items-center justify-center px-12 rounded-3xl overflow-hidden shadow-2xl h-full w-[52%] shrink-0">
        
        {/* Background Video - No overlays or tint masks */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4" 
            type="video/mp4" 
          />
        </video>

        {/* Centered Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center select-none"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center justify-center font-sans">
            Squibl<span className="text-xl font-light relative -top-3 left-0.5 select-none">™</span>
          </h1>
        </motion.div>
      </div>

      {/* Right Column (Sign In Form) */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden no-scrollbar">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
        >
          {/* Header */}
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">Welcome Back</h2>
            <p className="text-black dark:text-white/40 text-sm mt-1.5">Input your credentials to begin the journey.</p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={Chrome} label="Google" onClick={handleGoogleSignIn} />
            <SocialButton icon={Github} label="GitHub" onClick={handleGithubSignIn} />
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            <span className="flex-shrink mx-4 bg-white dark:bg-black px-4 text-xs font-medium text-black dark:text-white/40 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
          </div>

          {/* Error / Lockout Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-3 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-2 border ${
                  isLocked
                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {isLocked ? (
                  <Clock className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{isLocked ? `Locked. Wait ${countdown}s` : error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            {/* Email Address */}
            <InputGroup 
              label="Email" 
              placeholder="ex. name@squibl.io" 
              id="email" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)} 
              type="email" 
              required 
            />

            {/* Password input group with Lucide Eye toggle icon inside and Forgot Link */}
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-black dark:text-white">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-black dark:text-white/40 hover:text-black dark:text-white transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Secure your account"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-gray-100 dark:bg-brand-gray border-none rounded-xl h-11 px-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 outline-none transition-all duration-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white/40 hover:text-black dark:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Footer Links & Contact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p className="text-sm text-black dark:text-white/40">
              First time here?{" "}
              <Link href="/signup" className="text-black dark:text-white hover:underline transition-colors ml-1">
                Sign up for free
              </Link>
            </p>
            <p className="text-[11px] text-black dark:text-white/20">
              Contact: <span className="text-black dark:text-white/40 lowercase tracking-normal">squiblapp@gmail.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function SocialButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className="flex items-center justify-center gap-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl h-12 hover:bg-black/5 dark:bg-white/5 transition-colors cursor-pointer text-sm font-semibold text-black dark:text-white w-full"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function InputGroup({ label, placeholder, type, value, onChange, id, required }: any) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-black dark:text-white">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={id === "email" ? "email" : "off"}
        className="w-full bg-gray-100 dark:bg-brand-gray border-none rounded-xl h-11 px-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 outline-none transition-all duration-300 text-sm"
      />
    </div>
  );
}
