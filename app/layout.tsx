import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "TradeWorx",
  description: "TradeWorx helps teams manage projects, inspections, clients, and billing in one polished workspace."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(bodyFont.variable, displayFont.variable, "min-h-screen bg-background font-sans text-foreground antialiased")}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

