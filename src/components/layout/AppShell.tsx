"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  CheckSquare,
  Cloud,
  CloudOff,
  FileText,
  LogIn,
  LogOut,
  Loader2,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";
import { toClientMemo } from "@/lib/memo-adapters";
import { trpc } from "@/lib/trpc/client";
import { useMemoStore } from "@/store/memo-store";

const navItems = [
  { href: "/", label: "Мемо", icon: FileText },
  { href: "/insights", label: "Инсайты", icon: BarChart3 },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/settings", label: "Настройки", icon: Settings },
] as const;

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2">
      <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sparkles className="size-5" />
      </span>
      <span>
        <span className="block text-base font-semibold leading-tight">AI Memo</span>
        <span className="block text-xs text-muted-foreground">личный дневник с ИИ</span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="mt-8 grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PreviewNote() {
  return (
    <div className="rounded-lg border bg-secondary p-4 text-secondary-foreground">
      <p className="text-sm font-semibold">Free preview</p>
      <p className="mt-1 text-xs leading-5 opacity-80">
        Локальная демо-лента работает сразу. Подключи env, чтобы включить OAuth, БД,
        Whisper и GPT.
      </p>
    </div>
  );
}

function CloudStatus() {
  const { data: session, status } = useSession();
  const upsertMemos = useMemoStore((state) => state.upsertMemos);
  const remoteMemos = trpc.memo.list.useQuery(
    { limit: 50 },
    {
      enabled: status === "authenticated",
      retry: false,
      staleTime: 30_000,
    },
  );

  useEffect(() => {
    if (remoteMemos.data?.items.length) {
      upsertMemos(remoteMemos.data.items.map(toClientMemo));
    }
  }, [remoteMemos.data, upsertMemos]);

  if (status === "loading") {
    return (
      <div className="hidden h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground sm:flex">
        <Loader2 className="size-4 animate-spin" />
        Сессия
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <Button asChild variant="outline" className="hidden sm:inline-flex">
        <Link href="/sign-in">
          <LogIn />
          Войти
        </Link>
      </Button>
    );
  }

  const cloudReady = !remoteMemos.error;

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <div
        className={cn(
          "flex h-10 max-w-[260px] items-center gap-2 rounded-md border px-3 text-sm",
          cloudReady ? "bg-white text-foreground" : "bg-secondary text-secondary-foreground",
        )}
        title={remoteMemos.error?.message}
      >
        {remoteMemos.isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : cloudReady ? (
          <Cloud className="size-4 text-primary" />
        ) : (
          <CloudOff className="size-4" />
        )}
        <span className="truncate">{session.user?.email ?? session.user?.name ?? "Аккаунт"}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Выйти"
        onClick={() => void signOut({ callbackUrl: "/" })}
      >
        <LogOut />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { search, setSearch } = useSearch();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white/90 px-4 py-5 lg:block">
        <Brand />
        <NavLinks pathname={pathname} />

        <div className="absolute inset-x-4 bottom-5">
          <PreviewNote />
        </div>
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(22rem,86vw)] flex-col border-r bg-white px-4 py-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <Brand />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Закрыть меню"
                onClick={() => setMobileNavOpen(false)}
              >
                <X />
              </Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
            <div className="mt-auto pt-6">
              <PreviewNote />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Открыть меню"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по мыслям, тегам и резюме"
                className="pl-9"
              />
            </div>
            <CloudStatus />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
