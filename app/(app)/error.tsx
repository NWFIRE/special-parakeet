"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-xl font-semibold text-rose-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-rose-700">{error.message || "Please try again."}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
