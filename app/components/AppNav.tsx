"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NavLinks } from "./NavLinks";
import { StatusBadge } from "./StatusBadge";

/**
 * The navigation bar.
 *
 * Hidden on the login screen, where tabs would only bounce back to login.
 * Sign out appears only when this deployment actually has a passkey, so the
 * local development setup does not show a control that cannot do anything.
 */
export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setAuthEnabled(Boolean(data?.checks?.accessPasskey)))
      .catch(() => setAuthEnabled(false));
  }, []);

  if (pathname === "/login") return null;

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-links">
          <NavLinks />
        </div>
        <div className="nav-right">
          <StatusBadge />
          {authEnabled && (
            <button className="btn btn-ghost btn-sm" onClick={signOut}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
