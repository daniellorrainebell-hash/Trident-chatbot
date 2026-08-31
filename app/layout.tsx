import type { ReactNode } from "react";
import Image from "next/image";
import "./globals.css";
import { AppNav } from "./components/AppNav";

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
          <a
            className="brandbar-mark"
            href="https://www.nexus-iq.co.uk"
            target="_blank"
            rel="noreferrer"
            aria-label="Nexus IQ Systems"
          >
            <Image
              src="/nexus-iq-logo.png"
              alt="Nexus IQ Systems"
              width={4096}
              height={900}
              className="nexus-mark"
              priority
            />
          </a>

          <Image
            src="/socrates-logo.png"
            alt="Socrates"
            width={2560}
            height={312}
            className="wordmark"
            priority
          />
          <p className="brand-sub">LinkedIn Content Engine</p>
        </div>

        <AppNav />

        {children}
      </body>
    </html>
  );
}
