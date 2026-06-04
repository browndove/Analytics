import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Helix Analytics",
  description: "Helix Analytics — facility usage and analytics.",
  icons: {
    icon: [{ url: "/assets/images/brand-logo.svg", type: "image/svg+xml" }],
    apple: "/assets/images/brand-logo.svg",
    shortcut: "/assets/images/brand-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
