"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signInWithGithub, signUpWithEmail, checkPasswordStrength } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Chrome, Github, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Full strength validation before submitting
    const strength = checkPasswordStrength(password);
    if (strength.score < 4) {
      setError(`Password is too weak. Missing: ${strength.errors.join(", ")}.`);
      return;
    }

    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      const { data, error: authError } = await signUpWithEmail(email, password, { full_name: fullName });
      if (authError) {
        setError(authError.message);
      } else {
        router.push("/onboarding");
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

      {/* Right Column (Sign Up Form) */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden no-scrollbar">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
        >
          {/* Header */}
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">Create New Profile</h2>
            <p className="text-black dark:text-white/40 text-sm mt-1.5">Input your basic details to begin the journey.</p>
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

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <InputGroup 
                label="First Name" 
                placeholder="ex. Alex" 
                id="firstName" 
                value={firstName} 
                onChange={(e: any) => setFirstName(e.target.value)} 
                type="text" 
                required 
              />
              <InputGroup 
                label="Last Name" 
                placeholder="ex. Sterling" 
                id="lastName" 
                value={lastName} 
                onChange={(e: any) => setLastName(e.target.value)} 
                type="text" 
                required 
              />
            </div>

            {/* Email Address */}
            <InputGroup 
              label="Email" 
              placeholder="ex. alex.s@aurora.io" 
              id="email" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)} 
              type="email" 
              required 
            />

            {/* Password input group with Lucide Eye toggle icon inside */}
            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="password" className="text-sm font-medium text-black dark:text-white">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Secure your account"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              <p className="text-xs text-black dark:text-white/30 mt-1">Requires at least 8 symbols.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black/90 dark:hover:bg-white/90 active:scale-[0.98] mt-4 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-sm text-black dark:text-white/40">
            Member of the team?{" "}
            <Link href="/login" className="text-black dark:text-white hover:underline transition-colors ml-1">
              Log in
            </Link>
          </p>
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
      className="flex items-center justify-center gap-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl h-12 hover:bg-black/5 dark:bg-white/5 transition-colors cursor-pointer text-sm font-semibold text-black dark:text-white"
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
