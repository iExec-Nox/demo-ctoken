import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Mulish, Anybody, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

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
        href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined"
        precedence="default"
      />
      <body
        className={`${mulish.variable} ${anybody.variable} ${inter.variable} antialiased`}
      >
        <Providers cookies={cookieString}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
