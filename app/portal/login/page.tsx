import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalLoginForm } from "@/components/forms/portal-login-form";

export default async function PortalLoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/portal/reports");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="glass-panel-strong rounded-[2.25rem] p-8 lg:p-10">
        <p className="eyebrow">Client portal</p>
        <h1 className="mt-3 balance-text font-display text-5xl font-bold text-slate-950">Historical inspection reports, presented cleanly.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          Clients can securely sign in to review previously published inspection reports, notes, and deficiencies without needing access to the internal workspace.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md lg:max-w-none">
        <Link href="/" className="mb-6 inline-block font-display text-3xl font-bold text-brand-dark">
          TradeWorx
        </Link>
        <PortalLoginForm />
        <p className="mt-4 text-sm text-slate-600">
          Team member? <Link href="/login" className="font-semibold text-brand-dark">Use the workspace login</Link>
        </p>
      </section>
    </main>
  );
}

