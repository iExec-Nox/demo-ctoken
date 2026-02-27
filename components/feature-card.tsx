import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="flex-1 gap-4 rounded-2xl border-surface-border bg-surface px-10 py-8 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="flex size-12 items-center justify-center rounded-xl bg-card-icon-bg">
          <Image src={icon} alt="" width={28} height={28} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0">
        <h3 className="font-inter text-xl font-bold leading-7 text-text-heading">
          {title}
        </h3>
        <p className="font-inter text-sm leading-[22px] text-text-body">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
