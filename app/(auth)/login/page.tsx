import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="glass-panel-strong rounded-[2.25rem] p-8 lg:p-10">
        <p className="eyebrow">Team access</p>
        <h1 className="mt-3 balance-text font-display text-5xl font-bold text-slate-950">Welcome back to your delivery cockpit.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          Sign in to manage projects, tasks, invites, billing, and client-facing reports with a workspace that feels structured from the first click.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-5">
            <p className="text-sm font-semibold text-slate-900">Internal workspace</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Projects, board views, analytics, invites, and owner-controlled billing.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-5">
            <p className="text-sm font-semibold text-slate-900">Clear handoff to clients</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Published inspection reports stay accessible in the dedicated customer portal.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md lg:max-w-none">
        <Link href="/" className="mb-6 inline-block font-display text-3xl font-bold text-brand-dark">
          TradeWorx
        </Link>
        <LoginForm googleEnabled={googleEnabled} />
        <p className="mt-4 text-sm text-slate-600">
          Need an account? <Link href="/signup" className="font-semibold text-brand-dark">Create one</Link>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Client account? <Link href="/portal/login" className="font-semibold text-brand-dark">Go to the customer portal</Link>
        </p>
      </section>
    </main>
  );
}

