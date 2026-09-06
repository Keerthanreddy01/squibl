"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/profiles";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { BuilderFolioSection } from "@/components/landing/builder-folio-section";
import { HeroFolioTransition } from "@/components/landing/hero-folio-transition";
import { SquiblSmashSection } from "@/components/landing/squibl/squibl-smash-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { UniqueEffectsSection } from "@/components/landing/unique-effects-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ScrollingRevealSection } from "@/components/landing/scrolling-reveal-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { useTheme } from "next-themes";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    if (loading) return; // wait for auth to resolve
    if (!user) return;  // not logged in → show landing page

    // Logged in → check onboarding then redirect
    const redirect = async () => {
      try {
        const userId = user.id || (user as any).uid;
        const { data: profile } = await getProfile(userId);
        if (profile && profile.onboarding_completed) {
          router.replace("/dashboard/home");
        } else {
          router.replace("/onboarding");
        }
      } catch {
        router.replace("/dashboard/home");
      }
    };
    redirect();
  }, [user, loading, router]);

  // While checking auth, show a minimal dark loader so there's no flash
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 selection:text-white relative overflow-hidden">
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <HeroFolioTransition />
        <BuilderFolioSection />
        <SquiblSmashSection />
        <FeaturesSection />
        <HowItWorksSection />
        <IntegrationsSection />
        <UniqueEffectsSection />
        <TestimonialsSection />
        <ScrollingRevealSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
