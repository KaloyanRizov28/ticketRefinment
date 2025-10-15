import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TicketRefine",
  description: "Refine messy Jira tickets into developer-ready tasks."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-neutral-50 text-neutral-900`}> 
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
