"use client";

import { useSession } from "next-auth/react";
import { Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { formatDateTime } from "@/lib/utils";
import { useMemoStore } from "@/store/memo-store";

export function SemanticMatches() {
  const { status } = useSession();
  const query = useMemoStore((state) => state.search.trim());
  const search = trpc.memo.search.useQuery(
    { query },
    {
      enabled: status === "authenticated" && query.length >= 3,
      retry: false,
      staleTime: 20_000,
    },
  );

  if (status !== "authenticated" || query.length < 3) {
    return null;
  }

  if (search.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Ищу похожие мемо в облаке
      </div>
    );
  }

  if (search.error) {
    return (
      <div className="rounded-lg border bg-secondary p-4 text-sm text-secondary-foreground">
        Облачный поиск недоступен: {search.error.message}
      </div>
    );
  }

  if (!search.data?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-primary" />
        <p className="text-sm font-semibold">Похожие мемо в облаке</p>
      </div>
      <div className="mt-3 grid gap-3">
        {search.data.map((memo) => (
          <div key={memo.id} className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDateTime(memo.createdAt)}
              </span>
              <Badge variant="outline">{Math.round(memo.similarity * 100)}%</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6">
              {memo.summary || memo.content}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {memo.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
