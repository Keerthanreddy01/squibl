"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

interface UniqueEffectsSectionProps {
  panelImage?: string;
}

export function UniqueEffectsSection({}: UniqueEffectsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Buttery-smooth scroll parallax driver
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax: hand floats into view smoothly from above with soft tilt
  const handY = useTransform(scrollYProgress, [0, 0.5, 1], [-80, 0, 70]);
  const handRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2.5, 0, 2]);
  const handScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1.02]);

  // Form parallax for multi-layer depth
  const formY = useTransform(scrollYProgress, [0, 0.5, 1], [35, 0, -25]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          platform: "both",
        }),
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Could not complete registration. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="relative w-full bg-white text-neutral-900 overflow-hidden font-sans pt-12 sm:pt-16 lg:pt-20 pb-0"
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          
          {/* Left Side: Hand holding iPhone with buttery smooth Parallax & lens blur */}
          <motion.div
            style={{ y: handY, rotate: handRotate, scale: handScale }}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start items-end relative -mb-1 select-none"
          >
            {/* Ambient soft glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-red-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-none flex justify-center lg:justify-start">
              <img
                src="/hand-iphone.png?v=7"
                alt="Squibl Mobile Preview"
                className="w-auto max-w-full h-auto max-h-[460px] sm:max-h-[530px] lg:max-h-[620px] xl:max-h-[680px] object-contain select-none pointer-events-none drop-shadow-[0_25px_40px_rgba(0,0,0,0.12)]"
              />
            </div>
          </motion.div>

          {/* Right Side: Join the waitlist Form (Matching Reference Screenshot 2) */}
          <motion.div
            style={{ y: formY }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-start pb-16 sm:pb-20 lg:pb-24 xl:pb-28 lg:pl-6 xl:pl-10 w-full max-w-[540px]"
          >
            {/* Headline matching Reference Screenshot */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-950 leading-[1.1] mb-3">
              Join the waitlist
            </h2>

            {/* Subtitle matching Reference Screenshot */}
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8 font-normal">
              No strings attached. Simply reserve your spot and we&apos;ll notify you the moment early access opens.
            </p>

            {/* Form */}
            {status === "success" ? (
              <div className="w-full p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-left flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-neutral-950">You&apos;re on the list!</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Thanks for reserving your spot, {name || "builder"}. We&apos;ll send your early access invite to <span className="font-medium text-neutral-900">{email}</span>.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                {/* 1. Name Field (Matching reference box style) */}
                <div className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all shadow-sm">
                  <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First Name"
                    className="w-full bg-transparent text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none pt-0.5"
                  />
                </div>

                {/* 2. Email Field (Matching reference box style) */}
                <div className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition-all shadow-sm">
                  <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Work Email*
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full bg-transparent text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none pt-0.5"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-600 font-medium px-1">
                    {errorMessage}
                  </p>
                )}

                {/* Center / Pill Join Button (Matching Reference Screenshot style) */}
                <div className="flex justify-center sm:justify-start pt-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#d8e2f8] text-[#1e293b] hover:bg-[#c7d6f5] active:scale-95 font-medium text-sm transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reserving spot...</span>
                      </>
                    ) : (
                      <span>Join now</span>
                    )}
                  </button>
                </div>

                {/* Fine print matching reference screenshot */}
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed mt-2 text-center sm:text-left">
                  By submitting this form you agree to receive email communications from Squibl. You may unsubscribe at any time.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
