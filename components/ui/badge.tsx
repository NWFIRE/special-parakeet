import { cn } from "@/lib/utils";

const styles = {
  OWNER: "bg-amber-100 text-amber-900 border border-amber-200",
  ADMIN: "bg-sky-100 text-sky-900 border border-sky-200",
  MEMBER: "bg-slate-100 text-slate-700 border border-slate-200",
  ACTIVE: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  TRIALING: "bg-violet-100 text-violet-900 border border-violet-200",
  PAST_DUE: "bg-rose-100 text-rose-800 border border-rose-200",
  CANCELED: "bg-slate-200 text-slate-700 border border-slate-300",
  TODO: "bg-slate-200 text-slate-700 border border-slate-300",
  IN_PROGRESS: "bg-sky-100 text-sky-800 border border-sky-200",
  IN_REVIEW: "bg-amber-100 text-amber-800 border border-amber-200",
  DONE: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  LOW: "bg-slate-100 text-slate-600 border border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border border-orange-200",
  URGENT: "bg-rose-100 text-rose-800 border border-rose-200"
};

export function Badge({ value, className }: { value: keyof typeof styles | string; className?: string }) {
  const style = styles[value as keyof typeof styles] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide", style, className)}>{value.replaceAll("_", " ")}</span>;
}
