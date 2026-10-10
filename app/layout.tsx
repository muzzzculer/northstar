import type { Metadata } from "next";
import "./globals.css";
import "./northstar.css";
import { PlayerProvider } from "@/components/northstar/player";
import { AppShell } from "@/components/northstar/shell";
import { isOwner } from "@/lib/server";

export const metadata: Metadata = {
  title: { default: "NorthStar — Official Music", template: "%s · NorthStar" },
  description: "Stream the official NorthStar discography. Albums, mixtapes, EPs, singles, and the stories behind the music.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><PlayerProvider><AppShell isOwner={await isOwner()}>{children}</AppShell></PlayerProvider></body>
    </html>
  );
}
