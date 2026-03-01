import type { Metadata } from "next";
import { ExplorerContent } from "@/components/explorer-content";

export const metadata: Metadata = {
  title: "Activity | Nox",
  description: "Monitor your confidential transactions on Arbitrum",
};

export default function ExplorerPage() {
  return (
    <main className="min-h-[60vh]">
      <ExplorerContent />
    </main>
  );
}
