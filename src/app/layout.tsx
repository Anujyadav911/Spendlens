import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: {
    default: "SpendLens — AI Tool Spend Auditor for Startups",
    template: "%s | SpendLens",
  },
  description:
    "Find out if you're overpaying for AI tools. Free instant audit of your Cursor, Claude, ChatGPT, and Copilot spend. See savings in 60 seconds.",
  keywords: [
    "AI tools cost",
    "Cursor pricing",
    "ChatGPT cost reduction",
    "Claude pricing",
    "GitHub Copilot audit",
    "AI spend optimization",
    "startup AI tools",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SpendLens",
    title: "SpendLens — Free AI Tool Spend Audit",
    description:
      "Most startups overpay for AI tools. Find out in 60 seconds.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "SpendLens — AI Spend Audit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendLens — Free AI Tool Spend Audit",
    description:
      "Most startups overpay for AI tools. Find out in 60 seconds.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
