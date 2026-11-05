"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const inner = (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );

  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (pk) {
    return (
      <ClerkProvider publishableKey={pk} afterSignOutUrl="/login">
        {inner}
      </ClerkProvider>
    );
  }

  return inner;
}
