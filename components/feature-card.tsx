import Image from "next/image";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-surface-border bg-surface px-10 py-8 backdrop-blur-sm">
      <div className="flex size-12 items-center justify-center rounded-xl bg-card-icon-bg">
        <Image src={icon} alt="" width={28} height={28} />
      </div>
      <h3 className="font-inter text-xl font-bold leading-7 text-text-heading">
        {title}
      </h3>
      <p className="font-inter text-sm leading-[22px] text-text-body">
        {description}
      </p>
    </div>
  );
}
