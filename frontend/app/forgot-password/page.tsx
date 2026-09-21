"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // ── Resend cooldown timer ──────────────────────────────────────────────────
  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const validateEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Please enter your email address.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Please enter a valid email address.";
    return null;
  };

  const handleResetRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/update-password`
        : "https://squibl.online/update-password";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      // To prevent email enumeration attacks, do not reveal whether the account exists.
      // If a severe network or client error occurred, surface user-friendly message.
      if (resetError) {
        const lower = resetError.message?.toLowerCase() || "";
        if (lower.includes("network") || lower.includes("fetch")) {
          setError("Network error. Please check your internet connection and try again.");
          setLoading(false);
          return;
        }
        if (lower.includes("rate limit") || lower.includes("too many")) {
          setError("Too many requests. Please wait a moment before trying again.");
          setLoading(false);
          return;
        }
      }

      setIsSubmitted(true);
      startResendCooldown();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/update-password`
        : "https://squibl.online/update-password";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (resetError) {
        const lower = resetError.message?.toLowerCase() || "";
        if (lower.includes("rate limit") || lower.includes("too many")) {
          setError("Too many requests. Please wait a moment before trying again.");
          setResendLoading(false);
          return;
        }
      }

      setResendSuccess(true);
      startResendCooldown();
    } catch {
      setError("Failed to resend reset link. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-white dark:bg-black selection:bg-white/30 p-2 transition-all duration-300 lg:h-screen lg:overflow-hidden lg:p-4">
      {/* Left Column (Hero & Background Video) */}
      <div className="relative hidden lg:flex flex-col items-center justify-center px-12 rounded-3xl overflow-hidden shadow-2xl h-full w-[52%] shrink-0">
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

      {/* Right Column */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden no-scrollbar">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
        >
          {/* Back to Log In */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to log in</span>
          </Link>

          {!isSubmitted ? (
            /* ─── REQUEST PASSWORD RESET FORM ─── */
            <>
              <div>
                <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">
                  Reset Password
                </h2>
                <p className="text-black dark:text-white/40 text-sm mt-1.5">
                  Enter your email address and we will send you instructions to reset your password.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs text-center font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetRequest} className="space-y-5">
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="email" className="text-sm font-medium text-black dark:text-white">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ex. alex.s@aurora.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full bg-gray-100 dark:bg-brand-gray border-none rounded-xl h-11 px-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 outline-none transition-all duration-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ─── SUCCESS STATE ─── */
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">
                  Check your email
                </h2>
                <p className="text-black dark:text-white/60 text-sm mt-2 leading-relaxed">
                  If an account exists for this email, we've sent instructions to reset your password.
                </p>
              </div>

              {/* Submitted Email Pill */}
              <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-brand-gray border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white">
                <Mail className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0" />
                <span className="font-medium truncate flex-1">{email.trim().toLowerCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setError(null);
                    setResendSuccess(false);
                  }}
                  className="text-xs font-semibold text-black dark:text-white hover:underline cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Resend Confirmation Banner */}
              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>A fresh password reset link has been sent.</span>
                </div>
              )}

              {/* Error Banner in Success State */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs text-center font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-black/60 dark:text-white/50 space-y-1.5 leading-relaxed">
                <p>• Check your spam or promotions folder if you don't see the email within 2 minutes.</p>
                <p>• The reset link is single-use and will expire shortly for security.</p>
              </div>

              {/* Resend Action */}
              <div className="flex flex-col items-center gap-2 pt-2 text-sm text-black/60 dark:text-white/60">
                <div className="flex items-center gap-1.5">
                  <span>Didn't receive the email?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-black dark:text-white">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="font-semibold text-black dark:text-white hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {resendLoading ? "Sending..." : "Resend instructions"}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer text-sm"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
