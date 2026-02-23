import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Coffee Mate — Calm morning portfolio news",
  description:
    "Start your morning with what actually affects your investments. Personalized to your holdings. Simple explanations. Calm, low-noise alerts.",
  openGraph: {
    title: "Portfolio Coffee Mate",
    description: "Calm, personalized morning portfolio news. Just what matters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
