"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
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

  // 1. Ultra-smooth Scroll Physics with Spring Inertia
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.001,
  });

  // Vertical gliding & perspective floating from above
  const scrollHandY = useTransform(smoothProgress, [0, 0.5, 1], [-110, 0, 95]);
  const scrollHandRotateZ = useTransform(smoothProgress, [0, 0.5, 1], [-4, 0, 3.5]);
  const scrollHandScale = useTransform(smoothProgress, [0, 0.45, 1], [0.93, 1.01, 1.03]);
  const scrollHandPitch = useTransform(smoothProgress, [0, 0.5, 1], [8, 0, -6]);

  // Form parallax offset for multi-planar depth
  const formY = useTransform(smoothProgress, [0, 0.5, 1], [45, 0, -35]);

  // 2. Interactive 3D Cursor Physics (Next-Level Depth)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 24, stiffness: 130 };
  const cursorRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8.5, -8.5]), springConfig);
  const cursorRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-11, 11]), springConfig);
  const cursorTranslateX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), springConfig);
  const cursorTranslateY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-14, 14]), springConfig);

  // Dynamic light reflection sheen across glass face
  const glareOpacity = useSpring(useTransform(mouseX, [-0.5, 0, 0.5], [0.05, 0.22, 0.32]), springConfig);
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-40%", "140%"]), springConfig);
  const glareRotate = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, 25]), springConfig);

  // Dynamic multi-plane contact shadow
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [22, -22]), springConfig);
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [18, -18]), springConfig);
  const shadowScale = useSpring(useTransform(mouseY, [-0.5, 0.5], [0.95, 1.06]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full bg-white text-neutral-900 overflow-hidden font-sans pt-12 sm:pt-16 lg:pt-20 pb-0 select-none"
      style={{ perspective: "1400px" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          
          {/* Left Side: Next-Level 3D Parallax Hand & Phone */}
          <motion.div
            style={{
              y: scrollHandY,
              x: cursorTranslateX,
              rotateZ: scrollHandRotateZ,
              rotateX: cursorRotateX,
              rotateY: cursorRotateY,
              scale: scrollHandScale,
              transformStyle: "preserve-3d",
            }}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start items-end relative -mb-1 cursor-pointer"
          >
            {/* Dynamic ambient bloom that shifts behind the phone */}
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [30, -30]),
                y: useTransform(mouseY, [-0.5, 0.5], [25, -25]),
              }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-red-500/[0.07] rounded-full blur-3xl pointer-events-none"
            />

            {/* Dynamic 3D reactive contact shadow under the device */}
            <motion.div
              style={{
                x: shadowX,
                y: shadowY,
                scale: shadowScale,
              }}
              className="absolute bottom-2 left-1/4 w-[60%] h-14 bg-black/20 rounded-[100%] blur-2xl pointer-events-none"
            />

            {/* Phone & Hand Container with subtle idle float */}
            <motion.div
              animate={{
                y: [0, -7, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-none flex justify-center lg:justify-start group"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Phone image with lens blur edge */}
              <img
                src="/hand-iphone.png?v=8"
                alt="Squibl Mobile Preview"
                className="w-auto max-w-full h-auto max-h-[470px] sm:max-h-[540px] lg:max-h-[630px] xl:max-h-[700px] object-contain select-none pointer-events-none drop-shadow-[0_26px_50px_rgba(0,0,0,0.16)]"
              />

              {/* Dynamic specular glass light reflection passing across phone face */}
              <motion.div
                style={{
                  left: glareX,
                  opacity: glareOpacity,
                  rotate: glareRotate,
                }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/25 to-transparent w-full h-full mix-blend-overlay blur-[1px]"
              />

              {/* Soft lens blur / depth-of-field transition at bottom edge */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
            </motion.div>
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
