import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Mulish, Anybody, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_URL } from "@/lib/config";
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
  metadataBase: new URL(APP_URL),
  title: {
    default: "Nox — Confidential Token Protocol",
    template: "%s | Nox",
  },
  description:
    "Wrap any ERC-20 into encrypted, auditable on-chain assets. Confidential transfers, selective disclosure, and ACL management on Arbitrum.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Nox Confidential Token",
    title: "Nox — Confidential Token Protocol",
    description:
      "Wrap any ERC-20 into encrypted, auditable on-chain assets. Confidential transfers, selective disclosure, and ACL management on Arbitrum.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nox Confidential Token Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nox — Confidential Token Protocol",
    description:
      "Wrap any ERC-20 into encrypted, auditable on-chain assets. Confidential transfers and selective disclosure on Arbitrum.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        className={`${mulish.variable} ${anybody.variable} ${inter.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers cookies={cookieString}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
