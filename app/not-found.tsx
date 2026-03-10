import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">404</p>
      <h1 className="mt-3 font-display text-5xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-sm text-slate-600">The page you requested does not exist or you may not have access to it.</p>
      <Link href="/dashboard" className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
        Back to dashboard
      </Link>
    </main>
  );
}
