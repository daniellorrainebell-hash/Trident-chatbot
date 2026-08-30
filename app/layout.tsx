import type { ReactNode } from "react";

export const metadata = {
  title: "Nexus IQ LinkedIn Content Engine",
  description:
    "A persistent content operating system that turns a rough idea into a strategically structured first draft.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
