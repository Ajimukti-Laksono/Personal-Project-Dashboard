import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://personal-project-dashboard-xi.vercel.app"),
  title: {
    default: "Personal Project Dashboard | Real-Time GitHub Tracker",
    template: "%s | Personal Project Dashboard",
  },
  description:
    "Dashboard personal terhubung langsung ke GitHub secara real-time via Webhook dan Server-Sent Events (SSE). Pantau aktivitas commit, pull request, dan status CI/CD secara langsung.",
  keywords: [
    "GitHub Dashboard",
    "Real-Time GitHub Tracker",
    "Portfolio Dashboard",
    "Ajimukti Laksono",
    "Commit Heatmap",
    "Developer Dashboard",
    "Next.js",
  ],
  authors: [{ name: "Ajimukti Laksono", url: "https://github.com/Ajimukti-Laksono" }],
  creator: "Ajimukti Laksono",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://personal-project-dashboard-xi.vercel.app",
    siteName: "Personal Project Dashboard",
    title: "Personal Project Dashboard | Real-Time GitHub Tracker",
    description:
      "Dashboard personal terhubung langsung ke GitHub secara real-time via Webhook dan Server-Sent Events (SSE). Pantau aktivitas commit, pull request, dan status CI/CD secara langsung.",
    images: [
      {
        url: "https://personal-project-dashboard-xi.vercel.app/og-image.jpg",
        secureUrl: "https://personal-project-dashboard-xi.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Personal Project Dashboard - Real-Time GitHub Insights & Live Activity Feed",
      },
      {
        url: "https://personal-project-dashboard-xi.vercel.app/og-image.png",
        secureUrl: "https://personal-project-dashboard-xi.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Personal Project Dashboard - Real-Time GitHub Insights & Live Activity Feed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Project Dashboard | Real-Time GitHub Tracker",
    description:
      "Dashboard personal terhubung langsung ke GitHub secara real-time via Webhook dan Server-Sent Events (SSE).",
    images: ["https://personal-project-dashboard-xi.vercel.app/og-image.jpg"],
    creator: "@ajimukti",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
