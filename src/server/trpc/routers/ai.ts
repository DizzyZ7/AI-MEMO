import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { processMemo } from "@/server/services/ai.service";
import { createUploadUrl } from "@/server/services/storage.service";
import { getMonthlyAiUsage } from "@/server/services/usage.service";

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

  usage: protectedProcedure.query(({ ctx }) => {
    return getMonthlyAiUsage({
      userId: ctx.userId,
      plan: ctx.session?.user.plan,
    });
  }),

  process: protectedProcedure.input(z.object({ memoId: z.string() })).mutation(async ({ ctx, input }) => {
    const result = await processMemo(input.memoId, { userId: ctx.userId });

    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return result;
  }),
});
