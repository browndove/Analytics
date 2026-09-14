import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Insights — Clinical Operations",
	description: "Clinical Operations insights dashboard",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${montserrat.variable} antialiased bg-secondary`}>
				<ThemeProvider>
					<div className="flex w-full min-h-screen px-[15px]">{children}</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
