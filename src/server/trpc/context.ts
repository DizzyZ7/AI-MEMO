import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createTRPCContext() {
  const session = await auth();

  return {
    db,
    session,
    userId: session?.user?.id ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
