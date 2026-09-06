"use client";

import { motion } from "framer-motion";

interface UniqueEffectsSectionProps {
  panelImage?: string;
}

export function UniqueEffectsSection({}: UniqueEffectsSectionProps) {
  return (
    <section
      id="mobile-app"
      className="relative w-full bg-white text-neutral-900 overflow-hidden font-sans pt-8 sm:pt-12 lg:pt-14 pb-16 sm:pb-24 lg:pb-28"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10 flex flex-col items-center">
        {/* Top Header Row inside Section (matching reference composition) */}
        <div className="w-full flex items-center justify-between mb-6 sm:mb-12">
          {/* Top Left: Editorial Brand Typography */}
          <div className="flex items-center gap-2 select-none">
            <span className="font-serif italic text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 font-display">
              squibl
            </span>
          </div>

          {/* Top Right: "Download now" Pill Button with Apple logo */}
          <a
            href="#download"
            className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 rounded-full bg-white border border-neutral-200/90 text-neutral-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:bg-neutral-50 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <svg
              className="w-4 h-4 fill-current text-neutral-900"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.67-.82 1.13-1.96.99-3.1-.98.04-2.16.66-2.85 1.46-.62.72-1.16 1.88-.99 3.01 1.09.08 2.19-.55 2.85-1.37z" />
            </svg>
            <span>Download now</span>
          </a>
        </div>

        {/* Center Visual: Large Hand holding iPhone */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex items-center justify-center relative py-4 sm:py-8 lg:py-10"
        >
          <img
            src="/hand-iphone.png"
            alt="Squibl Mobile App Preview"
            className="w-auto max-w-full h-auto max-h-[560px] sm:max-h-[680px] lg:max-h-[820px] object-contain select-none pointer-events-none drop-shadow-xl"
          />
        </motion.div>
      </div>
    </section>
  );
}

