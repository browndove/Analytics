import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Helix Analytics",
  description: "Helix Analytics — facility usage and analytics.",
  icons: {
    icon: [{ url: "/assets/images/helix-logo.png", type: "image/png" }],
    apple: "/assets/images/helix-logo.png",
    shortcut: "/assets/images/helix-logo.png",
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
