import { redis } from "@/lib/redis";
import type { Plan } from "@/types/memo";

export const AI_USAGE_LIMITS = {
  FREE: 10,
  PRO: 300,
  TEAM: null,
} satisfies Record<Plan, number | null>;

type UsagePeriod = {
  id: string;
  start: Date;
  end: Date;
  expiresAtSeconds: number;
};

export type AiUsageStatus = {
  tracked: boolean;
  plan: Plan;
  limit: number | null;
  used: number;
  remaining: number | null;
  exceeded: boolean;
  period: string;
  periodStart: string;
  periodEnd: string;
};

export type AiUsageReservation = {
  allowed: boolean;
  counted: boolean;
  usage: AiUsageStatus;
};

function getCurrentUsagePeriod(now = new Date()): UsagePeriod {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const id = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    id,
    start,
    end,
    expiresAtSeconds: Math.floor(end.getTime() / 1000),
  };
}

function getUsageKey(userId: string, periodId: string) {
  return `ai-memo:usage:${periodId}:${userId}:ai-processing`;
}

function getMemoClaimKey(userId: string, memoId: string, periodId: string) {
  return `ai-memo:usage:${periodId}:${userId}:memo:${memoId}`;
}

function toPlan(value: Plan | string | null | undefined): Plan {
  return value === "PRO" || value === "TEAM" ? value : "FREE";
}

function toUsageStatus(input: {
  tracked: boolean;
  plan: Plan;
  used: number;
  period: UsagePeriod;
}): AiUsageStatus {
  const limit = AI_USAGE_LIMITS[input.plan];
  const remaining = limit === null ? null : Math.max(0, limit - input.used);

  return {
    tracked: input.tracked,
    plan: input.plan,
    limit,
    used: input.used,
    remaining,
    exceeded: limit !== null && input.used >= limit,
    period: input.period.id,
    periodStart: input.period.start.toISOString(),
    periodEnd: input.period.end.toISOString(),
  };
}

function parseUsageCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getMonthlyAiUsage(input: {
  userId: string;
  plan?: Plan | string | null;
  now?: Date;
}): Promise<AiUsageStatus> {
  const period = getCurrentUsagePeriod(input.now);
  const plan = toPlan(input.plan);

  if (!redis) {
    return toUsageStatus({
      tracked: false,
      plan,
      used: 0,
      period,
    });
  }

  const used = parseUsageCount(await redis.get(getUsageKey(input.userId, period.id)));

  return toUsageStatus({
    tracked: true,
    plan,
    used,
    period,
  });
}

export async function reserveAiMemoProcessing(input: {
  userId: string;
  memoId: string;
  plan?: Plan | string | null;
  now?: Date;
}): Promise<AiUsageReservation> {
  const period = getCurrentUsagePeriod(input.now);
  const plan = toPlan(input.plan);
  const usage = await getMonthlyAiUsage({
    userId: input.userId,
    plan,
    now: input.now,
  });

  if (!redis) {
    return { allowed: true, counted: false, usage };
  }

  const usageKey = getUsageKey(input.userId, period.id);
  const claimKey = getMemoClaimKey(input.userId, input.memoId, period.id);
  const claimResult = await redis.set(claimKey, "1", {
    nx: true,
    exat: period.expiresAtSeconds,
  });

  if (claimResult !== "OK") {
    return { allowed: true, counted: false, usage };
  }

  const used = await redis.incr(usageKey);
  await redis.expireat(usageKey, period.expiresAtSeconds);

  const updatedUsage = toUsageStatus({
    tracked: true,
    plan,
    used,
    period,
  });

  if (updatedUsage.limit !== null && used > updatedUsage.limit) {
    await redis.del(claimKey);
    await redis.decr(usageKey);

    return {
      allowed: false,
      counted: false,
      usage: {
        ...updatedUsage,
        used: Math.max(0, used - 1),
        remaining: 0,
        exceeded: true,
      },
    };
  }

  return { allowed: true, counted: true, usage: updatedUsage };
}
