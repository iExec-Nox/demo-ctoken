import type { Metadata } from "next";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";

export const metadata: Metadata = {
  title: "Home | Nox Confidential Token",
  description: "Try confidential DeFi now — encrypt token balances and experience private on-chain transfers.",
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}
