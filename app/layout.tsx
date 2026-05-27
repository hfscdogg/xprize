import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XPrize · Livewire",
  description: "Internal bounty board for Livewire's OpenAI projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
