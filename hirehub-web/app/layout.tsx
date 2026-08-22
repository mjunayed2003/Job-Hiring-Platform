import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import Providers from "./providers";
import { NotificationProvider } from "@/component/providers/NotificationProvider";
import NotificationBootstrap from "@/component/notifications/NotificationBootstrap";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import ConditionalLayout from "@/component/layout/ConditionalLayout";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


/* ===============================
   Fonts
================================ */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ===============================
   Client Components (NO ssr:false)
================================ */
const Navbar = dynamic(
  () => import("@/component/layout/Navber")
);

const Footer = dynamic(
  () => import("@/component/layout/Footer")
);

/* ===============================
   Metadata
================================ */
export const metadata: Metadata = {
  title: {
    default: "HireHubJA | Job Portal & Hiring Platform",
    template: "%s | HireHubJA",
  },
  description:
    "HireHubJA connects talented job seekers with top employers. Post jobs, apply instantly, and grow your career with our modern hiring platform.",
  keywords: [
    "HireHubJA",
    "job portal",
    "job website",
    "hiring platform",
    "find jobs",
    "post jobs",
    "career opportunities",
  ],
  authors: [{ name: "HireHubJA Team" }],
  creator: "HireHubJA",
  metadataBase: new URL("https://hirehubja.com/"),
  openGraph: {
    title: "HireHubJA | Job Portal & Hiring Platform",
    description: "Connect with top employers and find your dream job.",
    url: "https://hirehubja.com/",
    siteName: "HireHubJA",
    images: [
      {
        url: "/image/og.png",
        width: 1200,
        height: 630,
        alt: "HireHubJA Og Image",
      },
    ],
    type: "website",
  },
};

/* ===============================
   Root Layout
================================ */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* GLOBAL PROVIDERS */}
        <Providers>
          {/* NOTIFICATIONS */}
          <NotificationProvider />
          <NotificationBootstrap />
            <ConditionalLayout>
            {children}
          </ConditionalLayout>

        </Providers>
      </body>
    </html>
  );
}