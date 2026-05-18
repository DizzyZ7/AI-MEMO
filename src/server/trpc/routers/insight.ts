import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { buildWeeklyDigest } from "@/server/services/digest.service";
import { findSimilarToMemo } from "@/server/services/embedding.service";

export const insightRouter = router({
  patterns: protectedProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d"]).default("7d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const days = input.period === "7d" ? 7 : 30;
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
      const memos = await ctx.db.memo.findMany({
        where: {
          userId: ctx.userId,
          deletedAt: null,
          createdAt: { gte: since },
        },
        select: {
          mood: true,
          tags: true,
          createdAt: true,
        },
      });

      const mood = memos.reduce<Record<string, number>>((acc, memo) => {
        const key = memo.mood ?? "NEUTRAL";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      const tags = memos.reduce<Record<string, number>>((acc, memo) => {
        memo.tags.forEach((tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
        });
        return acc;
      }, {});

      return {
        total: memos.length,
        mood,
        tags: Object.entries(tags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
      };
    }),

  digest: protectedProcedure.query(({ ctx }) => {
    return buildWeeklyDigest(ctx.userId);
  }),

  similar: protectedProcedure.input(z.object({ memoId: z.string() })).query(({ ctx, input }) => {
    return findSimilarToMemo(ctx.userId, input.memoId);
  }),
});
