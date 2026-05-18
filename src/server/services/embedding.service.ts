import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";

export type SimilarMemo = {
  id: string;
  content: string;
  summary: string | null;
  tags: string[];
  similarity: number;
  createdAt: Date;
};

function toVectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

async function lexicalMemoSearch(userId: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const tagQuery = normalizedQuery.replace(/^#/, "");

  const rows = await db.memo.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { content: { contains: normalizedQuery, mode: "insensitive" } },
        { summary: { contains: normalizedQuery, mode: "insensitive" } },
        { tags: { has: tagQuery } },
        {
          tasks: {
            some: {
              title: { contains: normalizedQuery, mode: "insensitive" },
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      content: true,
      summary: true,
      tags: true,
      createdAt: true,
    },
  });

  return rows.map((memo) => {
    const contentHit = memo.content.toLowerCase().includes(normalizedQuery);
    const summaryHit = memo.summary?.toLowerCase().includes(normalizedQuery) ?? false;
    const tagHit = memo.tags.some((tag) => tag.toLowerCase() === tagQuery);

    return {
      ...memo,
      similarity: tagHit ? 0.72 : contentHit || summaryHit ? 0.58 : 0.42,
    };
  });
}

export async function createEmbedding(input: string) {
  if (!openai) {
    return null;
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0]?.embedding ?? null;
}

export async function updateMemoEmbedding(memoId: string, embedding: number[]) {
  const vector = toVectorLiteral(embedding);

  await db.$executeRaw`
    UPDATE "Memo"
    SET "embedding" = ${vector}::vector
    WHERE "id" = ${memoId}
  `;
}

export async function searchSimilarMemos(userId: string, query: string, threshold = 0.75) {
  const embedding = await createEmbedding(query).catch(() => null);
  if (!embedding) {
    return lexicalMemoSearch(userId, query);
  }

  const vector = toVectorLiteral(embedding);

  const semanticRows = await db.$queryRaw<SimilarMemo[]>`
    SELECT "id",
           "content",
           "summary",
           "tags",
           "createdAt",
           1 - ("embedding" <=> ${vector}::vector) AS "similarity"
    FROM "Memo"
    WHERE "userId" = ${userId}
      AND "deletedAt" IS NULL
      AND "embedding" IS NOT NULL
      AND 1 - ("embedding" <=> ${vector}::vector) > ${threshold}
    ORDER BY "similarity" DESC
    LIMIT 10
  `;

  if (semanticRows.length > 0) {
    return semanticRows.map((row) => ({
      ...row,
      similarity: new Prisma.Decimal(row.similarity).toNumber(),
    }));
  }

  return lexicalMemoSearch(userId, query);
}

export async function findSimilarToMemo(userId: string, memoId: string, threshold = 0.72) {
  const rows = await db.$queryRaw<SimilarMemo[]>`
    SELECT other."id",
           other."content",
           other."summary",
           other."tags",
           other."createdAt",
           1 - (other."embedding" <=> source."embedding") AS "similarity"
    FROM "Memo" source
    JOIN "Memo" other ON other."userId" = source."userId"
    WHERE source."id" = ${memoId}
      AND source."userId" = ${userId}
      AND other."id" <> source."id"
      AND other."deletedAt" IS NULL
      AND source."embedding" IS NOT NULL
      AND other."embedding" IS NOT NULL
      AND 1 - (other."embedding" <=> source."embedding") > ${threshold}
    ORDER BY "similarity" DESC
    LIMIT 10
  `;

  return rows.map((row) => ({
    ...row,
    similarity: new Prisma.Decimal(row.similarity).toNumber(),
  }));
}
