"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface UniqueEffectsSectionProps {
  panelImage?: string;
}

export function UniqueEffectsSection({}: UniqueEffectsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Parallax scroll driver
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax for the hand/phone: floats in smoothly from above, subtle perspective tilt
  const handY = useTransform(scrollYProgress, [0, 0.5, 1], [-90, 0, 75]);
  const handRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-3.5, 0, 2.5]);
  const handScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 1.02]);

  // Content parallax moves at a distinct rate for natural multi-plane depth
  const contentY = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -40]);

  return (
    <section
      ref={sectionRef}
      id="mobile-app"
      className="relative w-full bg-white text-neutral-900 overflow-hidden font-sans pt-14 sm:pt-20 lg:pt-24 pb-4 sm:pb-8"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,500;1,600&display=swap');
        .font-playfair-italic {
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }
      `}} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          
          {/* Left Side: Hand holding iPhone with smooth Parallax */}
          <motion.div
            style={{ y: handY, rotate: handRotate, scale: handScale }}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start items-end relative -mb-2 select-none"
          >
            {/* Ambient soft glow behind phone */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-red-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-none flex justify-center lg:justify-start">
              <img
                src="/hand-iphone.png?v=5"
                alt="Squibl Mobile App Preview"
                className="w-auto max-w-full h-auto max-h-[480px] sm:max-h-[550px] lg:max-h-[640px] xl:max-h-[700px] object-contain select-none pointer-events-none drop-shadow-[0_25px_40px_rgba(0,0,0,0.12)]"
              />
            </div>
          </motion.div>

          {/* Right Side: Editorial Headline, Reference-style Quote & Minimal Store Buttons */}
          <motion.div
            style={{ y: contentY }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-start pb-14 sm:pb-18 lg:pb-24 xl:pb-28 lg:pl-4 xl:pl-8"
          >
            {/* 1. Reference Screenshot Quote / Social Proof */}
            <div className="flex items-center gap-3.5 mb-7">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  src="/img-1.webp"
                  alt="Builder"
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                />
                <img
                  src="/img-2.webp"
                  alt="Builder"
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                />
                <img
                  src="/img-3.webp"
                  alt="Builder"
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                />
              </div>
              <div className="flex flex-col text-left">
                <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-tight">
                  <strong className="font-semibold text-neutral-950">12,400+ builders</strong> already shipping together.
                </p>
                <div className="relative inline-block w-fit mt-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                    Join them!
                  </span>
                  {/* Hand-drawn doodle accent underline matching reference */}
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2 text-[#dc2626]"
                    viewBox="0 0 70 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5.5C12 2.5 24 6.5 35 3.5C46 0.5 58 5.5 69 2.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Editorial Headline (Styled like Reference Screenshot 2) */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-neutral-950 leading-[1.05] mb-5">
              Your new <span className="font-playfair-italic font-normal text-[#dc2626]">favorite</span> developer app
            </h2>

            {/* 3. Subtitle */}
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-[460px] mb-8 font-normal">
              Find teammates, follow live builds, and collaborate with creators wherever you are. It&apos;s that simple.
            </p>

            {/* 4. App Store & Google Play Store Buttons (Clean, Minimal, No Emojis) */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
              {/* Apple App Store */}
              <a
                href="#download-ios"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group border border-black"
              >
                <svg
                  className="w-6 h-6 fill-current text-white shrink-0 group-hover:scale-105 transition-transform"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.67-.82 1.13-1.96.99-3.1-.98.04-2.16.66-2.85 1.46-.62.72-1.16 1.88-.99 3.01 1.09.08 2.19-.55 2.85-1.37z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-medium tracking-wider text-neutral-400 leading-none">
                    Download on the
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-white leading-tight mt-0.5">
                    App Store
                  </span>
                </div>
              </a>

              {/* Google Play Store */}
              <a
                href="#download-android"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group border border-black"
              >
                <svg
                  className="w-5 h-5 fill-current text-white shrink-0 group-hover:scale-105 transition-transform"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.37-.367-.61-.91-.61-1.533V3.347c0-.623.24-1.166.609-1.533zM15.207 13.414l2.772 2.772-12.87 7.43 10.098-10.202zm0-2.828L5.109.384l12.87 7.43-2.772 2.772zm1.414 1.414l3.87 2.235c.95.549.95 1.447 0 1.996l-3.87 2.235-2.071-2.071 2.071-2.395z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-medium tracking-wider text-neutral-400 leading-none">
                    Get it on
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-white leading-tight mt-0.5">
                    Google Play
                  </span>
                </div>
              </a>
            </div>

            {/* 5. Minimal Ecosystem Row (Inspired by Reference Screenshot 2 bottom row) */}
            <div className="flex items-center gap-6 mt-9 pt-6 border-t border-neutral-200/80 text-neutral-400 select-none text-xs font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                iOS 16+ &amp; Android 10+
              </span>
              <span className="text-neutral-300">•</span>
              <span>Free to download</span>
              <span className="text-neutral-300">•</span>
              <span>Instant Sync</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
