import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="dark:border-surface-border dark:bg-surface flex-1 gap-2 rounded-2xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.25)] px-5 py-4 shadow-none backdrop-blur-sm md:gap-3 md:px-10 md:py-5 lg:gap-4 lg:py-8">
      <CardHeader className="p-0">
        <div className="bg-card-icon-bg flex size-10 items-center justify-center rounded-xl md:size-[42px] lg:size-12">
          <Image
            src={icon}
            alt=""
            width={28}
            height={28}
            className="size-[26px] md:size-[30px] lg:size-7"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 md:gap-3 lg:gap-4">
        <h3 className="font-inter text-text-heading text-base leading-7 font-bold">
          {title}
        </h3>
        <p className="font-inter text-text-body text-xs leading-[22px]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
