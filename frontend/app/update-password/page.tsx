"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { checkPasswordStrength, mapAuthError } from "@/lib/auth";
import { clearAuthCookie } from "@/lib/auth-cookie";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";

type SessionStatus = "checking" | "ready" | "invalid_session" | "success";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 1. Evaluate password requirements ──────────────────────────────────────
  const strength = useMemo(() => checkPasswordStrength(newPassword), [newPassword]);
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = strength.score === 4 && passwordsMatch;

  // ── 2. Handle recovery session initialization ──────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Check URL parameters for explicit errors (e.g. expired link)
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : "";
    const hashParams = new URLSearchParams(hash);

    const errorParam = searchParams.get("error_description") ||
                       hashParams.get("error_description") ||
                       searchParams.get("error") ||
                       hashParams.get("error");
    const errorCode = searchParams.get("error_code") || hashParams.get("error_code");

    if (errorParam || errorCode) {
      if (mounted) {
        setSessionErrorMessage(
          errorParam
            ? decodeURIComponent(errorParam.replace(/\+/g, " "))
            : "This password reset link is invalid or has expired."
        );
        setSessionStatus("invalid_session");
      }
      return;
    }

    // Subscribe to auth events (specifically PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setSessionStatus("ready");
      }
    });

    // Check current session or exchange PKCE code
    async function verifyRecoverySession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session) {
          if (mounted) setSessionStatus("ready");
          return;
        }

        // If PKCE code exists in search query, try exchanging it
        const code = searchParams.get("code");
        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            if (mounted) {
              setSessionErrorMessage(
                exchangeErr.message || "This password reset link has expired or has already been used."
              );
              setSessionStatus("invalid_session");
            }
            return;
          }

          if (data.session && mounted) {
            setSessionStatus("ready");
            return;
          }
        }

        // Allow a small grace period for client auth initialization
        setTimeout(async () => {
          if (!mounted) return;
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (finalSession) {
            setSessionStatus("ready");
          } else {
            setSessionErrorMessage("No active password recovery session found. Please request a new reset link.");
            setSessionStatus("invalid_session");
          }
        }, 1200);
      } catch {
        if (mounted) {
          setSessionErrorMessage("Unable to verify your password reset link. Please try again.");
          setSessionStatus("invalid_session");
        }
      }
    }

    verifyRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── 3. Handle password submission ──────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }

      // Password updated successfully!
      // Sign out the temporary recovery session so the user can log in with new credentials.
      await supabase.auth.signOut();
      clearAuthCookie();

      setSessionStatus("success");
    } catch {
      setError("An unexpected error occurred while updating your password. Please try again.");
    } finally {
      setLoading(false);
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
          {sessionStatus === "checking" && (
            /* ─── CHECKING LINK VALIDITY ─── */
            <div className="text-center py-16 space-y-4">
              <div className="h-8 w-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-black dark:text-white/60">
                Verifying reset link security...
              </p>
            </div>
          )}

          {sessionStatus === "invalid_session" && (
            /* ─── EXPIRED / INVALID LINK STATE ─── */
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">
                  Reset link invalid or expired
                </h2>
                <p className="text-black dark:text-white/60 text-sm mt-2 leading-relaxed">
                  {sessionErrorMessage || "This password reset link is invalid, has expired, or has already been used. Please request a new link to update your password."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/forgot-password"
                  className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer text-sm gap-2"
                >
                  <span>Request new reset link</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full h-12 bg-gray-100 dark:bg-brand-gray text-black dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer text-sm"
                >
                  Return to log in
                </Link>
              </div>
            </div>
          )}

          {sessionStatus === "success" && (
            /* ─── PASSWORD UPDATED SUCCESS STATE ─── */
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">
                  Password updated successfully
                </h2>
                <p className="text-black dark:text-white/60 text-sm mt-2 leading-relaxed">
                  Your Squibl account password has been successfully updated. You can now sign in with your new password.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer text-sm gap-2"
                >
                  <span>Proceed to Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {sessionStatus === "ready" && (
            /* ─── UPDATE PASSWORD FORM ─── */
            <>
              <div>
                <div className="flex items-center gap-2 mb-2 text-black/60 dark:text-white/60 text-xs font-semibold uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  <span>Account Security</span>
                </div>
                <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">
                  Set New Password
                </h2>
                <p className="text-black dark:text-white/40 text-sm mt-1.5">
                  Create a strong new password for your Squibl account.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs text-center font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                {/* New Password */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="new-password" className="text-sm font-medium text-black dark:text-white">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      autoComplete="new-password"
                      autoFocus
                      className="w-full bg-gray-100 dark:bg-brand-gray border-none rounded-xl h-11 px-4 pr-11 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 outline-none transition-all duration-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white/40 hover:text-black dark:text-white transition-colors cursor-pointer"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-black dark:text-white">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      autoComplete="new-password"
                      className="w-full bg-gray-100 dark:bg-brand-gray border-none rounded-xl h-11 px-4 pr-11 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 outline-none transition-all duration-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white/40 hover:text-black dark:text-white transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-brand-gray/50 border border-gray-200 dark:border-white/10 space-y-2.5">
                  <p className="text-xs font-semibold text-black/60 dark:text-white/60">
                    Password requirements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <RequirementItem met={hasMinLength} text="At least 8 characters" />
                    <RequirementItem met={hasUppercase} text="One uppercase letter" />
                    <RequirementItem met={hasNumber} text="One number" />
                    <RequirementItem met={hasSpecial} text="One special character" />
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                      <RequirementItem met={passwordsMatch} text="Passwords match" />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 transition-colors ${met ? "text-emerald-500 dark:text-emerald-400" : "text-black/40 dark:text-white/40"}`}>
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0" />
      )}
      <span className={met ? "font-medium" : ""}>{text}</span>
    </div>
  );
}
