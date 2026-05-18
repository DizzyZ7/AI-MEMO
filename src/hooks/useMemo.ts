"use client";

import { useMemo } from "react";
import { useMemoStore } from "@/store/memo-store";

export function useMemos() {
  const memos = useMemoStore((state) => state.memos);
  const search = useMemoStore((state) => state.search);
  const activeTag = useMemoStore((state) => state.activeTag);

  return useMemo(() => {
    const query = search.trim().toLowerCase();

    return memos.filter((memo) => {
      const matchesSearch =
        query.length === 0 ||
        memo.content.toLowerCase().includes(query) ||
        memo.summary?.toLowerCase().includes(query) ||
        memo.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        memo.tasks.some((task) => task.title.toLowerCase().includes(query));
      const matchesTag = !activeTag || memo.tags.includes(activeTag);

      return matchesSearch && matchesTag;
    });
  }, [activeTag, memos, search]);
}
