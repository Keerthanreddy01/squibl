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

  // Parallax: hand floats in smoothly from above into view
  const handY = useTransform(scrollYProgress, [0, 0.5, 1], [-75, 0, 65]);
  const handRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-3, 0, 2]);
  const handScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.02]);

  // Content subtle depth motion
  const contentY = useTransform(scrollYProgress, [0, 0.5, 1], [35, 0, -30]);

  return (
    <section
      ref={sectionRef}
      id="mobile-app"
      className="relative w-full bg-white text-neutral-900 overflow-hidden font-sans pt-14 sm:pt-20 lg:pt-24 pb-0"
    >
      {/* Load Footer font: Anton */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        .font-anton {
          font-family: 'Anton', sans-serif;
        }
      `}} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          
          {/* Left Side: Hand holding iPhone with smooth Parallax */}
          <motion.div
            style={{ y: handY, rotate: handRotate, scale: handScale }}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start items-end relative -mb-1 select-none"
          >
            {/* Ambient soft background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-red-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-none flex justify-center lg:justify-start">
              <img
                src="/hand-iphone.png?v=6"
                alt="Squibl Mobile App Preview"
                className="w-auto max-w-full h-auto max-h-[460px] sm:max-h-[530px] lg:max-h-[620px] xl:max-h-[680px] object-contain select-none pointer-events-none drop-shadow-[0_25px_40px_rgba(0,0,0,0.12)]"
              />
            </div>
          </motion.div>

          {/* Right Side: Clean, Professional Typography using Footer Anton Font */}
          <motion.div
            style={{ y: contentY }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center items-start pb-16 sm:pb-20 lg:pb-24 xl:pb-28 lg:pl-6 xl:pl-10"
          >
            {/* Section Tag */}
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-[#E83526] mb-3 select-none">
              Mobile Application
            </span>

            {/* Headline using Anton font (Footer style) */}
            <h2 className="font-anton text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight uppercase text-neutral-950 leading-[0.92] mb-6">
              Download the <span className="text-[#E83526]">app</span>
            </h2>

            {/* Clean, professional description */}
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-[480px] mb-9 font-normal">
              Find teammates, follow live builds, and collaborate with creators wherever you are. Built for shipping software on the go.
            </p>

            {/* App Store & Google Play Store Buttons (Clean & Minimal, No Emojis) */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {/* Apple App Store */}
              <a
                href="#download-ios"
                className="inline-flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group border border-black"
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
                className="inline-flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group border border-black"
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

            {/* Clean, professional metadata footer */}
            <div className="flex items-center gap-5 mt-9 pt-6 border-t border-neutral-200/80 text-xs font-mono uppercase tracking-wider text-neutral-400 select-none">
              <span className="flex items-center gap-2 text-neutral-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                iOS 16+ &amp; Android 10+
              </span>
              <span>•</span>
              <span>Free Download</span>
              <span>•</span>
              <span>Instant Sync</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
