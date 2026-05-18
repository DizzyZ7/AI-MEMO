import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          done: z.boolean().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          userId: ctx.userId,
          done: input?.done,
        },
        orderBy: { createdAt: "desc" },
        include: {
          memo: {
            select: {
              id: true,
              content: true,
              summary: true,
            },
          },
        },
      });
    }),

  toggle: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const task = await ctx.db.task.findFirst({
      where: { id: input.id, userId: ctx.userId },
    });

    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return ctx.db.task.update({
      where: { id: input.id },
      data: { done: !task.done },
    });
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const task = await ctx.db.task.findFirst({
      where: { id: input.id, userId: ctx.userId },
      select: { id: true },
    });

    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return ctx.db.task.delete({
      where: { id: input.id },
    });
  }),
});
