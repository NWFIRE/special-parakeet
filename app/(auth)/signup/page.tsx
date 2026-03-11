import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignupForm } from "@/components/forms/signup-form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const invite = params.invite
    ? await db.invite.findUnique({
        where: { token: params.invite }
      })
    : null;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="glass-panel-strong rounded-[2.25rem] p-8 lg:p-10">
        <p className="eyebrow">Workspace setup</p>
        <h1 className="mt-3 balance-text font-display text-5xl font-bold text-slate-950">{invite ? "Join your team workspace" : "Create a polished operating system for your team"}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          {invite
            ? `You were invited as a ${invite.role.toLowerCase()} for ${invite.email}.`
            : "Start with email and password, invite the rest of the team, and layer in Google sign-in and billing when you are ready."}
        </p>
      </section>

      <section className="mx-auto w-full max-w-md lg:max-w-none">
        <Link href="/" className="mb-6 inline-block font-display text-3xl font-bold text-brand-dark">
          TradeWorx
        </Link>
        <SignupForm inviteToken={invite?.token} />
        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-dark">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

