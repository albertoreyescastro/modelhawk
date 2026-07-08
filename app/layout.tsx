import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModelHawk",
  description:
    "Adversarial examiner for machine learning notebooks, metrics and project defense.",
  icons: {
    icon: "/modelhawk-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}