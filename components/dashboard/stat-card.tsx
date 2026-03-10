import { Card } from "@/components/ui/card";

export function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="glass-panel-strong overflow-hidden p-0">
      <div className="border-b border-slate-200/70 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      </div>
      <div className="px-6 py-5">
        <p className="font-display text-4xl font-bold text-slate-900">{value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
      </div>
    </Card>
  );
}
