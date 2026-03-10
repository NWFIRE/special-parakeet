export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
