"use client";

import { useEffect, useState, useRef } from "react";
import { usePlatformStats } from "@/hooks/usePlatformStats";

const regions = [
  { name: "North America", nodes: 12, status: "operational" },
  { name: "Europe", nodes: 8, status: "operational" },
  { name: "Asia Pacific", nodes: 6, status: "operational" },
  { name: "South America", nodes: 3, status: "operational" },
];

// Animated counter that counts up from 0 → end on viewport entry
function AnimatedStat({
  end,
  suffix = "",
  loading = false,
  className = "",
}: {
  end: number;
  suffix?: string;
  loading?: boolean;
  className?: string;
}) {
  // Clamp to safe non-negative integer
  const safeEnd = Math.max(0, isFinite(end) ? Math.floor(end) : 0);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const rafRef = useRef<number>(0);

  // Reset when live value changes
  useEffect(() => {
    setHasAnimated(false);
    setCount(0);
  }, [safeEnd]);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2200;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * safeEnd));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
          };
          rafRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [safeEnd, hasAnimated, loading]);

  if (loading) {
    return (
      <span
        className={`inline-block h-[1em] w-28 bg-foreground/10 animate-pulse rounded align-middle ${className}`}
      />
    );
  }

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // ── Live stats from Supabase ──
  const { stats, isLoading } = usePlatformStats();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRegion((prev) => (prev + 1) % regions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="infra" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span
            className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"
              }`}
          >
            <span className="w-12 h-px bg-foreground/20" />
            PROJECT SHOWCASE v5.1 PRODUCTION-READY
          </span>

          <div className="grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-stretch">
            {/* Image globe */}
            <div
              className={`w-48 lg:w-72 xl:w-80 shrink-0 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/world-3i68QNWJwmO7W19ztZWbevAwJQHzYL.png"
                alt="Global network sphere"
                className="w-full h-full object-contain object-center"
              />
            </div>

            {/* Title + description */}
            <div className="flex flex-col justify-center">
              <h2
                className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
              >
                GLOBAL METRICS
                <br />
                <span className="text-muted-foreground">BUILT THROUGH DEEP VISION.</span>
              </h2>

              <p
                className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg transition-all duration-1000 delay-100 ${isVisible ? "opacity-100" : "opacity-0"
                  }`}
              >
                The platform connecting elite builders to ship next-generation projects at scale.
              </p>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Large stat card — Active Builders */}
          <div
            className={`lg:col-span-2 relative p-8 lg:p-12 border border-foreground/10 bg-foreground/[0.02] overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
          >
            {/* Animated dots background with connecting lines */}
            <div className="absolute inset-0 opacity-70">
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
              >
                <defs>
                  <style>{`
                    @keyframes drawLine {
                      0%   { stroke-dashoffset: 1000; opacity: 0; }
                      15%  { opacity: 1; }
                      70%  { opacity: 0.7; }
                      100% { stroke-dashoffset: 0; opacity: 0; }
                    }
                    .connecting-line {
                      stroke: #eca8d6;
                      stroke-width: 1.2;
                      fill: none;
                      stroke-dasharray: 1000;
                      animation: drawLine 3s ease-in-out infinite;
                    }
                  `}</style>
                </defs>
                {[...Array(19)].map((_, i) => {
                  const x1 = 10 + (i % 5) * 20;
                  const y1 = 10 + Math.floor(i / 5) * 25;
                  const x2 = 10 + ((i + 1) % 5) * 20;
                  const y2 = 10 + Math.floor((i + 1) / 5) * 25;
                  return (
                    <line
                      key={`line-${i}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      className="connecting-line"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  );
                })}
              </svg>

              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#eca8d6]"
                  style={{
                    left: `${10 + (i % 5) * 20}%`,
                    top: `${10 + Math.floor(i / 5) * 25}%`,
                    animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline gap-2 mb-4">
                <AnimatedStat
                  end={stats.activeBuilders}
                  suffix="+"
                  loading={isLoading}
                  className="text-8xl lg:text-[10rem] font-display leading-none"
                />
                <span className="text-2xl text-muted-foreground">Active Builders</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                World-class developers and technical founders building the future together.
              </p>
            </div>
          </div>

          {/* Stacked stat cards */}
          <div className="flex flex-col gap-6">
            {/* Projects Launched */}
            <div
              className={`p-8 border border-foreground/10 bg-foreground/[0.02] transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
              <AnimatedStat
                end={stats.projectsLaunched}
                suffix="+"
                loading={isLoading}
                className="text-5xl lg:text-6xl font-display"
              />
              <span className="block text-sm text-muted-foreground mt-2">
                Projects Launched
              </span>
            </div>

            {/* Teams Formed */}
            <div
              className={`p-8 border border-foreground/10 bg-foreground/[0.02] transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            >
              <AnimatedStat
                end={stats.teamsFormed}
                suffix="+"
                loading={isLoading}
                className="text-5xl lg:text-6xl font-display"
              />
              <span className="block text-sm text-muted-foreground mt-2">
                Teams Formed
              </span>
            </div>
          </div>
        </div>

        {/* Region list */}
        <div
          className={`mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
          {regions.map((region, index) => (
            <div
              key={region.name}
              className={`p-6 border transition-all duration-300 cursor-default ${activeRegion === index
                  ? "border-foreground/30 bg-foreground/[0.04]"
                  : "border-foreground/10"
                }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${activeRegion === index ? "bg-[#eca8d6]" : "bg-foreground/20"
                    }`}
                />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {region.status}
                </span>
              </div>
              <span className="font-medium block mb-1">{region.name}</span>
              <span className="text-sm text-muted-foreground">{region.nodes} nodes</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
