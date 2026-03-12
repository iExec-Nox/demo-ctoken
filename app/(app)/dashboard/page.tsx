import { DashboardContent } from '@/components/dashboard/dashboard-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Nox',
  description: 'Your confidential token portfolio',
};

export default function DashboardPage() {
  return (
    <div className="min-h-[60vh]">
      <DashboardContent />
    </div>
  );
}
