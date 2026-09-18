"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from "framer-motion";
import Dither from "@/components/ui/Dither";
import { joinWaitlist } from "@/lib/waitlist";
import { Turnstile } from '@marsidev/react-turnstile';
import emailjs from "@emailjs/browser";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CheckCheck, Copy, Loader2, LogOut } from "lucide-react";
emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!);

const sendConfirmationEmail = async (email: string, platform: string) => {
  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      { to_email: email, user_name: email.split("@")[0], platform },
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
  } catch { /* silent */ }
};

// ── Share helpers ─────────────────────────────────────────────────────────────
function ShareButtons({ refUrl }: { refUrl: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(refUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
  };

  const shareText = encodeURIComponent("I just joined the Squibl waitlist — the social network for developers. Join me:");
  const shareUrl = encodeURIComponent(refUrl);

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-5">
      {/* Referral link */}
      <div className="w-full flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-3">
        <span className="flex-1 text-[13px] text-neutral-400 truncate font-mono">{refUrl}</span>
        <button
          onClick={copy}
          className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/70" />}
        </button>
      </div>

      {/* Or divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-[1px] bg-white/10" />
        <span className="text-neutral-600 text-[12px]">Or</span>
        <div className="flex-1 h-[1px] bg-white/10" />
      </div>

      {/* Share buttons */}
      <div className="flex gap-3 w-full justify-center flex-wrap">
        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}%20${shareUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-neutral-200 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.626L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
          Share
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-[13px] font-semibold hover:bg-[#20c45e] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Share
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1877F2] text-white text-[13px] font-semibold hover:bg-[#1565d8] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          Share
        </a>
      </div>
    </div>
  );
}

function SlideButton({ onComplete, disabled, loading }: { onComplete: () => void, disabled: boolean, loading: boolean }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 100], [0.4, 0]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDragEnd = async (event: any, info: any) => {
    if (info.offset.x > 120 && !disabled) {
      setIsSuccess(true);
      controls.start({ x: 0, width: 242, transition: { type: "spring", stiffness: 200, damping: 20 } });
      onComplete();
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
        controls.start({ x: 0, width: 90 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, isSuccess, controls]);

  return (
    <div className={`w-full max-w-[250px] mx-auto h-[65px] relative rounded-full overflow-hidden backdrop-blur-sm transition-all duration-500 ${disabled ? 'bg-white/5 border border-white/10 opacity-80' : 'bg-white/10 border border-white/30 shadow-[inset_0_4px_20px_rgba(255,255,255,0.05)]'}`}>
      <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center pl-[50px] pointer-events-none">
        <span className="text-white font-medium text-[15px] select-none">Slide to join</span>
      </motion.div>

      <motion.div
        drag={(!disabled && !isSuccess) ? "x" : false}
        dragConstraints={{ left: 0, right: 152 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        initial={{ width: 90 }}
        whileHover={(!disabled && !isSuccess) ? { scale: 1.02 } : {}}
        whileTap={(!disabled && !isSuccess) ? { scale: 0.95 } : {}}
        className={`absolute top-[4px] left-[4px] bottom-[4px] rounded-full flex items-center justify-center z-10 ${disabled ? 'bg-white/20 text-white/60' : 'bg-[#8FFF00] text-black shadow-[0_0_15px_rgba(143,255,0,0.2)] cursor-grab active:cursor-grabbing'}`}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div key="loader" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <Loader2 className="w-6 h-6 animate-spin" />
            </motion.div>
          ) : (
            <motion.svg key="arrow" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
function WaitlistContent() {
  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(0);
  const [refCode, setRefCode] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [focused, setFocused] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('squibl_waitlist');
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.position && data.refCode) {
          setPosition(data.position);
          setRefCode(data.refCode);
          setSuccess(true);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsCheckingStorage(false);
    }
  }, []);

  const refUrl = refCode
    ? `${typeof window !== "undefined" ? window.location.origin : "https://squibl.vercel.app"}/pre-register?ref=${refCode}`
    : "";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || loading || honeypot) return;

    setLoading(true);
    setErrorMsg("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMsg('Please enter a valid email.'); setLoading(false); return; }

    try {
      const res = await joinWaitlist(email, "both", referredBy, turnstileToken);
      if (res.success) {
        await sendConfirmationEmail(email, "both");
        setPosition(res.position);
        setRefCode(res.refCode);
        setSuccess(true);
        try {
          localStorage.setItem('squibl_waitlist', JSON.stringify({
            position: res.position,
            refCode: res.refCode
          }));
        } catch (e) { }
      } else {
        setErrorMsg(res.message);
      }
    } catch { setErrorMsg("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-lg pointer-events-auto">
      <div className="mb-10">
        <img src="/squibl-logo.png" alt="Squibl" className="w-16 h-16 opacity-90 mx-auto" />
      </div>

      {isCheckingStorage ? (
        <div className="w-full h-[300px]" />
      ) : (
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
                  You're on the waitlist
                </h1>
                <p className="text-neutral-400 text-[15px] leading-relaxed">
                  You've successfully secured spot <span className="text-[#8FFF00] font-bold text-lg drop-shadow-[0_0_10px_rgba(143,255,0,0.6)] mx-1">#{position.toLocaleString()}</span>.
                  <br className="hidden sm:block" /> Feel free to refer your friends!
                </p>
              </div>
              <ShareButtons refUrl={refUrl} />
              <Link href="/dashboard/home" className="text-[13px] text-neutral-600 hover:text-white transition-colors mt-2">
                Go to the app →
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center w-full gap-6"
            >
              {/* Minimalistic Title */}
              <div className="mb-4">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
                  Join the waitlist
                </h1>
                <p className="text-neutral-400 text-[15px] leading-relaxed">
                  Be the first to know when we launch.
                </p>
              </div>
              {/* Email form */}
              <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
                <div className={`flex items-center w-full backdrop-blur-sm border rounded-full px-4 py-3 transition-all duration-200 shadow-xl ${focused ? "border-white/40 bg-white/10" : "border-white/20 bg-white/[0.08]"}`}>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder-neutral-400 min-w-0 text-center"
                    placeholder="Enter your email" required
                  />
                </div>

                <SlideButton
                  onComplete={() => handleSubmit()}
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || loading}
                  loading={loading}
                />

                <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                <AnimatePresence>
                  {errorMsg && (
                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[13px] text-red-400">
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-8 flex gap-6 items-center">
                {/* Twitter/X */}
                <a href="https://x.com/squiblhq" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors p-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/keerthan-reddy-71a5b5370/" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors p-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/Keerthanreddy01" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors p-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                {/* GitHub */}
                <a href="https://github.com/Keerthanreddy01/squibl-web" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors p-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                </a>
              </div>

              {/* Turnstile hidden */}
              <div className="absolute opacity-0 pointer-events-none">
                <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onSuccess={t => setTurnstileToken(t)} onError={() => setTurnstileToken(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function PreRegisterPage() {
  const { user, loading, signOutAndClear } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col font-sans overflow-hidden">

      {/* Background Dither */}
      <div className="absolute inset-0 z-0 opacity-25">
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4.3}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.5}
        />
      </div>

      {/* Subtle noise */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Header */}
      <header className="absolute top-0 w-full flex justify-between items-center px-6 sm:px-10 py-6 z-30 pointer-events-none">
        <Link href="/dashboard/home" className="flex items-center gap-2 group pointer-events-auto">
          <img src="/squibl-logo.png" alt="Squibl" className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="text-white/50 text-[13px] group-hover:text-white transition-colors">Squibl</span>
        </Link>
        {user ? (
          <button
            onClick={signOutAndClear}
            className="group relative flex items-center gap-2 text-[13px] font-medium px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-[#8FFF00]/50 text-neutral-400 hover:text-[#8FFF00] transition-all duration-300 pointer-events-auto overflow-hidden shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_0_15px_rgba(143,255,0,0.2)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#8FFF00]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300 relative z-10" />
            <span className="relative z-10">Sign out</span>
          </button>
        ) : (
          <Link href="/login" className="text-[13px] text-neutral-600 hover:text-white transition-colors pointer-events-auto">Sign in →</Link>
        )}
      </header>

      {/* Center content */}
      <main className="flex-1 flex items-center justify-center z-20 pointer-events-none">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8FFF00]" />
            <span className="text-white/50 text-[13px]">Checking session...</span>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-neutral-900/40 border border-white/10 rounded-2xl max-w-sm w-[90%] text-center pointer-events-auto shadow-2xl backdrop-blur-md">
            <img src="/squibl-logo.png" alt="Squibl" className="w-16 h-16 opacity-90 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">Join the Waitlist</h2>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              Please sign in or create an account to pre-register and reserve your spot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Link href="/login" className="flex-1 px-5 py-3 rounded-full bg-white text-black font-semibold text-center hover:bg-neutral-200 transition-all text-sm">
                Sign In
              </Link>
              <Link href="/signup" className="flex-1 px-5 py-3 rounded-full bg-white/10 text-white font-semibold text-center border border-white/20 hover:bg-white/20 transition-all text-sm">
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <Suspense fallback={null}>
            <WaitlistContent />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full flex justify-between items-end px-6 sm:px-10 py-6 z-30 pointer-events-none">
        <span className="text-neutral-800 text-[11px]">© 2026 Squibl</span>
        <a href="https://x.com/squiblhq" target="_blank" rel="noopener noreferrer" className="text-neutral-800 text-[11px] hover:text-white transition-colors pointer-events-auto">@squibl</a>
      </footer>
    </div>
  );
}
