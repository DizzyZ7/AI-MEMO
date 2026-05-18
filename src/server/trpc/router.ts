import { memoRouter } from "@/server/trpc/routers/memo";
import { aiRouter } from "@/server/trpc/routers/ai";
import { insightRouter } from "@/server/trpc/routers/insight";
import { taskRouter } from "@/server/trpc/routers/task";
import { createCallerFactory, router } from "@/server/trpc/trpc";

export const appRouter = router({
  memo: memoRouter,
  ai: aiRouter,
  insight: insightRouter,
  task: taskRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
