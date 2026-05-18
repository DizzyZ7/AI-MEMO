"use client";

import { useMemoStore } from "@/store/memo-store";

export function useSearch() {
  const search = useMemoStore((state) => state.search);
  const activeTag = useMemoStore((state) => state.activeTag);
  const setSearch = useMemoStore((state) => state.setSearch);
  const setActiveTag = useMemoStore((state) => state.setActiveTag);

  return { search, activeTag, setSearch, setActiveTag };
}
