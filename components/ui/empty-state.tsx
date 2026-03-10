export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-panel rounded-[1.75rem] border-dashed p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
