import type { Metadata } from "next";
import "./globals.css";
import AppEntry from "@/components/app-entry";
export const metadata: Metadata = {
  title: "Our Wedding · A little closer to your big day",
  description:
    "A calm, private place to plan your wedding. Keep your checklist, guests, budget and suppliers together.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <AppEntry />
        {children}
      </body>
    </html>
  );
}
