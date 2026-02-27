import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Mulish, Anybody, Inter } from "next/font/google";
import { Topbar } from "@/components/topbar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Confidential Token | Nox",
  description: "Manage your confidential assets privately",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return (
    <html lang="en" suppressHydrationWarning>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        precedence="default"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mulish.variable} ${anybody.variable} ${inter.variable} antialiased`}
      >
        <Providers cookies={cookieString}>
          <Topbar />
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
