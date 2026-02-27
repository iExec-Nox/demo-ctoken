import { FeatureCard } from "@/components/feature-card";

const FEATURES = [
  {
    icon: "/feature-icon.svg",
    title: "Wrap Public Tokens",
    description:
      "Convert any ERC-20 into its confidential equivalent. Balances and amounts become encrypted by default.",
  },
  {
    icon: "/feature-icon.svg",
    title: "Transfer Privately",
    description:
      "Send tokens with encrypted balances and transaction values. Composable with existing DeFi infrastructure.",
  },
  {
    icon: "/feature-icon.svg",
    title: "Disclose with Control",
    description:
      "Grant selective viewing rights over balances or transactions. Access can be permissioned and revoked at any time.",
  },
];

export function FeaturesSection() {
  return (
    <section className="flex w-full flex-col items-center gap-10 py-16">
      <div className="flex flex-col items-center gap-5">
        <h2 className="font-anybody text-[32px] font-bold leading-[1.2] text-white">
          The Next Evolution of DeFi Is Confidential
        </h2>
        <p className="font-mulish text-lg leading-[1.6] text-slate-400">
          Built for scalable, compliant and composable finance.
        </p>
      </div>
      <div className="flex w-full gap-10 px-40">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
