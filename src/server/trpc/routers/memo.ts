import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { enqueueMemoProcessing } from "@/lib/queue";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { searchSimilarMemos } from "@/server/services/embedding.service";

export const memoRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().trim().min(1),
        audioKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const memo = await ctx.db.memo.create({
        data: {
          userId: ctx.userId,
          content: input.content,
          audioUrl: input.audioKey,
        },
      });

      await enqueueMemoProcessing(memo.id);

      return memo;
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        tag: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.memo.findMany({
        where: {
          userId: ctx.userId,
          deletedAt: null,
          tags: input.tag ? { has: input.tag } : undefined,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        include: {
          tasks: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const nextCursor = items.length > input.limit ? items.pop()?.id : undefined;

      return { items, nextCursor };
    }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const memo = await ctx.db.memo.findFirst({
      where: {
        id: input.id,
        userId: ctx.userId,
        deletedAt: null,
      },
      include: {
        tasks: true,
      },
    });

    if (!memo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return memo;
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const memo = await ctx.db.memo.findFirst({
      where: { id: input.id, userId: ctx.userId },
      select: { id: true },
    });

    if (!memo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return ctx.db.memo.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    });
  }),

  search: protectedProcedure.input(z.object({ query: z.string().trim().min(2) })).query(({ ctx, input }) => {
    return searchSimilarMemos(ctx.userId, input.query);
  }),
});
