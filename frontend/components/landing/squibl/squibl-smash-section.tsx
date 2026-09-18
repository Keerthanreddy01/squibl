"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function SquiblSmashSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Ultimate Parallax for the main image
  const imageY = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1.1]);
  const imageRotateX = useTransform(scrollYProgress, [0, 1], [10, -5]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.5]);
  // Multi-layered scroll animations for text, description, and button
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const descY = useTransform(scrollYProgress, [0, 1], [20, -140]);
  const btnY = useTransform(scrollYProgress, [0, 1], [40, -180]);
  
  // Interactive button scroll-reactive properties
  const btnGlowScale = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.8, 1.25, 0.9]);
  const btnGlowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.3, 0.9, 0.4]);
  


  return (
    <section
      ref={containerRef}
      className="folio-to-smash relative w-full overflow-hidden pt-28 sm:pt-32 pb-20 flex flex-col items-center"
      style={{ perspective: "1000px" }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,500&display=swap');
        .wise-section {
          --color-forest-ink: #163300;
          --color-lime-voltage: #9fe870;
        }
        .font-elegant {
          font-family: var(--font-fraunces), serif;
          font-weight: 500;
          letter-spacing: -0.02em;
        }
        .font-playfair-italic {
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }
        .folio-to-smash {
          background: #ffffff;
        }
        .folio-to-smash::before {
          content: '';
          position: absolute;
          z-index: 1;
          top: 0;
          right: 0;
          left: 0;
          height: 28px;
          pointer-events: none;
          background: linear-gradient(180deg, #151515 0%, rgba(21,21,21,.55) 42%, rgba(255,255,255,0) 100%);
        }
      `}} />

      {/* 4k crisp grid background lines - fades in below the text */}
      <div
        className="absolute inset-0 z-0 pointer-events-none top-[30vh]"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: 'center top',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
        }}
      />

      {/* Text Section */}
      <div className="wise-section mx-auto flex max-w-[1200px] flex-col items-center px-4 text-center relative z-20 mb-4 sm:mb-8">
        
        {/* Layer 1: Headline */}
        <motion.div style={{ y: textY }} className="relative w-full max-w-[900px] mx-auto">
          <h1 className="font-elegant text-[clamp(48px,8vw,100px)] leading-[0.95] text-[#0e0f0c]">
            Collaborate here,<br className="hidden sm:block" />
            there and <span className="text-[#dc2626] font-playfair-italic font-normal">everywhere.</span>
          </h1>
        </motion.div>

        {/* Layer 2: Description */}
        <motion.p 
          style={{ y: descY }}
          className="mt-8 max-w-[600px] text-[18px] leading-[1.5] text-[#454745] font-sans px-4 relative z-20"
        >
          The platform built to scale your vision across the globe. Join the network today.
        </motion.p>

        {/* Layer 3: Button */}
        <motion.div 
          style={{ y: btnY }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 relative z-30"
        >
          <Link href="/pre-register">
            <button className="rounded-full bg-[#dc2626] hover:bg-[#991b1b] px-10 py-[16px] text-[18px] font-black text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.4)] border border-red-500/20">
              JOIN NOW
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Main Image Container */}
      <motion.div
        style={{
          y: imageY,
          scale: imageScale,
          rotateX: imageRotateX,
          opacity: imageOpacity,
          transformStyle: "preserve-3d"
        }}
        className="relative z-10 w-full max-w-[1400px] flex items-center justify-center overflow-visible origin-top"
      >
        <img
          src="/website-image-1.png"
          alt="Squibl Smash" 
          className="w-full md:w-[110%] h-auto object-cover object-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]" 
          style={{
            maskImage: 'linear-gradient(to right, black 92%, transparent 99%)',
            WebkitMaskImage: 'linear-gradient(to right, black 92%, transparent 99%)'
          }}
        />
      </motion.div>
    </section>
  );
}
