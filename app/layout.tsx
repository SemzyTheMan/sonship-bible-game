import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LoveSeal Bible Quest",
  description:
    "Test your knowledge of 1 Timothy, 2 Timothy, and Titus in LoveSeal Church's Bible Quest.",
  openGraph: {
    title: "LoveSeal Bible Quest",
    description: "Know the Word. Rise through the ranks.",
    images: [{ url: "/og.png", width: 1792, height: 922, alt: "LoveSeal Bible Quest" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoveSeal Bible Quest",
    description: "Know the Word. Rise through the ranks.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
