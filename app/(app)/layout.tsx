import { DashboardHeader } from "@/components/dashboard-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
