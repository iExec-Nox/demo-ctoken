import type { Metadata } from "next";
import { PortfolioHeader } from "@/components/portfolio-header";

export const metadata: Metadata = {
  title: "Dashboard | Nox",
  description: "Your confidential token portfolio",
};

export default function DashboardPage() {
  return (
    <main className="min-h-[60vh]">
      <PortfolioHeader />
    </main>
  );
}
