import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { NavLinks } from "./components/NavLinks";
import { StatusBadge } from "./components/StatusBadge";

export const metadata = {
  title: "Nexus IQ Content Engine",
  description: "Turn a rough idea into a strong LinkedIn first draft.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <header className="app-header">
          <Link href="/" aria-label="Nexus IQ Content Engine home">
            <Image
              src="/nexus-iq-logo.png"
              alt="Nexus IQ Systems"
              width={4096}
              height={900}
              className="logo"
              priority
            />
          </Link>
          <nav className="app-nav">
            <NavLinks />
            <StatusBadge />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
