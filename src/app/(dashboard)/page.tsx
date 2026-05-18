import { MemoEditor } from "@/components/memo/MemoEditor";
import { MemoList } from "@/components/memo/MemoList";
import { DashboardOverview } from "@/components/memo/DashboardOverview";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Мемо</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Быстрые мысли, задачи, идеи и события в одной живой ленте.
          </p>
        </div>
        <MemoEditor />
        <MemoList />
      </div>
      <DashboardOverview />
    </div>
  );
}
