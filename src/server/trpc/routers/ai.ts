import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { processMemo } from "@/server/services/ai.service";
import { createUploadUrl } from "@/server/services/storage.service";

export const aiRouter = router({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        type: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return createUploadUrl({
        userId: ctx.userId,
        filename: input.filename,
        type: input.type,
      });
    }),

  process: protectedProcedure.input(z.object({ memoId: z.string() })).mutation(({ input }) => {
    return processMemo(input.memoId);
  }),
});
