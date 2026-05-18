"use client";

import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoCard } from "@/components/memo/MemoCard";
import { useMemos } from "@/hooks/useMemo";
import { useSearch } from "@/hooks/useSearch";

export function MemoList() {
  const memos = useMemos();
  const { activeTag, setActiveTag } = useSearch();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Лента мемо</h2>
          <p className="text-sm text-muted-foreground">{memos.length} записей в текущем фильтре</p>
        </div>
        {activeTag ? (
          <Button variant="outline" size="sm" onClick={() => setActiveTag(undefined)}>
            <FilterX />
            Сбросить #{activeTag}
          </Button>
        ) : null}
      </div>

      {memos.length > 0 ? (
        <div className="grid gap-4">
          {memos.map((memo) => (
            <MemoCard key={memo.id} memo={memo} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center">
          <p className="font-medium">Ничего не найдено</p>
          <p className="mt-1 text-sm text-muted-foreground">Измени поиск или убери фильтр по тегу.</p>
        </div>
      )}
    </section>
  );
}
