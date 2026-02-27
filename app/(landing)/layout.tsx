import { Topbar } from "@/components/topbar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar />
      <Header />
      {children}
      <Footer />
    </>
  );
}
