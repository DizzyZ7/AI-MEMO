import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const taskPayload = {
  title: z.string().trim().min(1).max(180),
  dueDate: z.string().datetime().nullable().optional(),
};

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

  create: protectedProcedure
    .input(
      z.object({
        ...taskPayload,
        memoId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.memoId) {
        const memo = await ctx.db.memo.findFirst({
          where: {
            id: input.memoId,
            userId: ctx.userId,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!memo) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      return ctx.db.task.create({
        data: {
          userId: ctx.userId,
          memoId: input.memoId,
          title: input.title,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: taskPayload.title.optional(),
        dueDate: taskPayload.dueDate,
        done: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.userId },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          title: input.title,
          dueDate:
            input.dueDate === undefined
              ? undefined
              : input.dueDate
                ? new Date(input.dueDate)
                : null,
          done: input.done,
        },
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
