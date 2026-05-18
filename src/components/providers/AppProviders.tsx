"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import superjson from "superjson";
import { useTaskReminders } from "@/hooks/useTaskReminders";
import { trpc } from "@/lib/trpc/client";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function ClientEffects() {
  useTaskReminders();

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ClientEffects />
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
