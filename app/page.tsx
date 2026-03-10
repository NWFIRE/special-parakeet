import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutPanelLeft, ShieldCheck, Users, BarChart3, Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: 19,
    description: "For early-stage teams managing a handful of active projects.",
    features: ["Up to 5 members", "Unlimited tasks", "Kanban board", "Basic analytics"]
  },
  {
    name: "Growth",
    price: 49,
    description: "For teams that need collaboration, roles, and billing in one place.",
    features: ["Up to 20 members", "Google login", "Team invites", "Stripe billing portal"]
  },
  {
    name: "Scale",
    price: 99,
    description: "For operators who want visibility across multiple teams and launches.",
    features: ["Unlimited members", "Client report portal", "Priority onboarding", "Usage reviews"]
  }
];

const faqs = [
  {
    question: "Can clients log in to see inspection reports?",
    answer: "Yes. TaskFlow includes a dedicated customer portal where client accounts can securely review previously published inspection reports."
  },
  {
    question: "Does billing start immediately?",
    answer: "Billing begins when the owner starts a Stripe Checkout session and the webhook confirms the subscription."
  },
  {
    question: "Is TaskFlow mobile-friendly?",
    answer: "Yes. The dashboard, board, and customer report views are designed to work cleanly on phones and tablets."
  }
];

const highlights = [
  { icon: Users, label: "Role-based teamwork", text: "Owners, admins, members, and clients all get views that match their job." },
  { icon: LayoutPanelLeft, label: "Board-first execution", text: "Move work through a clean Kanban flow without losing project context." },
  { icon: ShieldCheck, label: "Server-side controls", text: "Workspace and customer access checks happen on the server, not just in the UI." }
];

export default async function MarketingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/dashboard" : "/signup";
  const ctaLabel = session?.user ? "Open dashboard" : "Start free";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
      <header className="glass-panel-strong mb-10 flex flex-col gap-4 rounded-[2rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-brand-dark">
          TaskFlow
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
          <Link href="/portal/login" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-brand-dark">
            Client portal
          </Link>
          <Link href="/#pricing" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-brand-dark">
            Pricing
          </Link>
          <Link href="/#faq" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-brand-dark">
            FAQ
          </Link>
          <ButtonLink href={session?.user ? "/dashboard" : "/login"} variant="secondary" className="ml-auto sm:ml-0">
            {session?.user ? "Dashboard" : "Log in"}
          </ButtonLink>
        </nav>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <div className="glass-panel-strong relative overflow-hidden rounded-[2.25rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.16),transparent_60%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-dark">
              Built for small teams that move fast
            </div>
            <div className="space-y-4">
              <h1 className="balance-text font-display text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-[4.3rem]">
                Team operations software that actually feels composed.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                TaskFlow brings projects, tasks, invites, customer reports, analytics, and billing into one calm workspace your team can trust from day one.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={ctaHref} className="sm:min-w-[170px]">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/portal/login" variant="secondary" className="sm:min-w-[170px]">
                Client report access
              </ButtonLink>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-4">
                <p className="text-sm text-slate-500">Weekly velocity</p>
                <p className="mt-2 font-display text-3xl font-bold text-slate-950">28</p>
                <p className="mt-1 text-sm text-slate-600">tasks completed</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-4">
                <p className="text-sm text-slate-500">Client visibility</p>
                <p className="mt-2 font-display text-3xl font-bold text-slate-950">100%</p>
                <p className="mt-1 text-sm text-slate-600">published reports online</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 p-4">
                <p className="text-sm text-slate-500">Owner controls</p>
                <p className="mt-2 font-display text-3xl font-bold text-slate-950">1</p>
                <p className="mt-1 text-sm text-slate-600">clean billing flow</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="glass-panel-strong overflow-hidden bg-slate-950 p-0 text-white">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-200">Live control center</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">A premium feel without enterprise bloat</h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/10 p-4">
                  <div className="flex items-center gap-3 text-teal-200">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm font-medium">Execution health</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">6 / 7</p>
                  <p className="mt-1 text-sm text-slate-300">projects on track this week</p>
                </div>
                <div className="rounded-[1.5rem] bg-brand-dark p-4">
                  <div className="flex items-center gap-3 text-teal-100">
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Client portal</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">12</p>
                  <p className="mt-1 text-sm text-teal-100/80">published reports available</p>
                </div>
              </div>
              <div className="space-y-3 rounded-[1.5rem] bg-white/8 p-4">
                {[
                  "Launch billing page",
                  "Review mobile board polish",
                  "Client logged 2 report views"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                    <CheckCircle2 className="h-4 w-4 text-teal-200" />
                    <span className="text-sm text-slate-100">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {highlights.map(({ icon: Icon, label, text }) => (
              <Card key={label} className="glass-panel-strong min-h-[190px]">
                <div className="inline-flex rounded-2xl bg-brand/10 p-3 text-brand-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mt-24 space-y-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950">Plans that stay simple while the product looks ready for bigger teams.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <Card key={tier.name} className={index === 1 ? "glass-panel-strong border-brand/25 bg-white" : "glass-panel"}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-dark">{tier.name}</p>
                {index === 1 ? <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">Popular</span> : null}
              </div>
              <p className="mt-5 font-display text-4xl font-bold text-slate-950">{formatCurrency(tier.price)}<span className="text-base font-medium text-slate-500">/mo</span></p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{tier.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-dark" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mt-24 grid gap-8 rounded-[2.25rem] bg-white/88 px-6 py-8 shadow-[0_24px_70px_rgba(24,34,58,0.10)] sm:px-8 sm:py-10 lg:grid-cols-[0.75fr_1fr]">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950">Questions teams ask before switching.</h2>
        </div>
        <div className="space-y-5">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-5">
              <h3 className="font-semibold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
