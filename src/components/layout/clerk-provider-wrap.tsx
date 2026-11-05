"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Loads the publishable key from the server so we don't need NEXT_PUBLIC_ for Cursor publish. */
export function ClerkProviderWrap({ children }: { children: React.ReactNode }) {
  const [pk, setPk] = useState<string | null>(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null,
  );
  const [ready, setReady] = useState(Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY));

  useEffect(() => {
    if (pk) {
      setReady(true);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/auth/clerk/config", { cache: "no-store" });
        const json = await res.json();
        if (json.ok && json.data?.publishableKey) {
          setPk(json.data.publishableKey);
        }
      } catch {
        /* ignore */
      } finally {
        setReady(true);
      }
    })();
  }, [pk]);

  if (!ready) return <>{children}</>;
  if (!pk) return <>{children}</>;

  return (
    <ClerkProvider publishableKey={pk} afterSignOutUrl="/login">
      {children}
    </ClerkProvider>
  );
}
