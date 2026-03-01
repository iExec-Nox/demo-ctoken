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
    <section className="flex w-full flex-col items-center gap-10 py-10 md:py-[60px] lg:py-16">
      <div className="flex flex-col items-start gap-5 px-10 md:items-center md:px-20 lg:px-40">
        <h2 className="font-mulish text-[28px] font-bold leading-normal text-text-heading md:font-anybody md:text-[32px] md:leading-[1.2]">
          The Next Evolution of DeFi Is Confidential
        </h2>
        <p className="font-mulish text-base leading-[1.6] text-text-body md:text-lg">
          Confidential Token removes transparency as a barrier to institutional adoption.
        </p>
      </div>
      <div className="flex w-full flex-col gap-10 px-[30px] md:flex-row md:px-10 lg:px-40">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
