import { Fraunces, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    display: "swap",
});

const ibmMono = IBM_Plex_Mono({
    weight: ["400", "500", "600"],
    subsets: ["latin"],
    variable: "--font-ibm-mono",
    display: "swap",
});

export default function InternalLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${fraunces.variable} ${ibmMono.variable} min-h-screen`}>{children}</div>;
}
