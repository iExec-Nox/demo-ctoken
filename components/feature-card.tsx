import Image from "next/image";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-10 py-8 backdrop-blur-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-[#748eff]">
        <Image src={icon} alt="" width={28} height={28} />
      </div>
      <h3 className="font-[family-name:var(--font-inter)] text-xl font-bold leading-7 text-white">
        {title}
      </h3>
      <p className="font-[family-name:var(--font-inter)] text-sm leading-[22px] text-slate-400">
        {description}
      </p>
    </div>
  );
}
