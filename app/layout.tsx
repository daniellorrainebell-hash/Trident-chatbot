import type { ReactNode } from "react";
import Image from "next/image";
import "./globals.css";
import { NavLinks } from "./components/NavLinks";
import { StatusBadge } from "./components/StatusBadge";

export const metadata = {
  title: "Socrates | Nexus IQ",
  description:
    "Turn a rough idea into a strong LinkedIn first draft, in your own voice.",
};

/**
 * The wordmark sits above the navigation rather than inside it.
 *
 * It scrolls away and the navigation stays, so the product is named on arrival
 * and the chrome stays out of the way once you are working.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <div className="brandbar">
          <Image
            src="/socrates-logo.png"
            alt="Socrates"
            width={2560}
            height={312}
            className="wordmark"
            priority
          />
          <p className="brand-sub">
            LinkedIn Content Engine
            <span className="sep" aria-hidden />
            Nexus IQ Systems
          </p>
        </div>

        <nav className="navbar">
          <div className="navbar-inner">
            <div className="nav-links">
              <NavLinks />
            </div>
            <div className="nav-right">
              <StatusBadge />
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
