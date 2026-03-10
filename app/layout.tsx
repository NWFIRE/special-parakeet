import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "TaskFlow is a lightweight SaaS for small teams to plan, assign, and ship work together."
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
