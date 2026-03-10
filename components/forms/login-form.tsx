"use client";

import { useActionState } from "react";
import { credentialsLoginAction, googleLoginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState = { error: "" };

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState(credentialsLoginAction, initialState);

  return (
    <Card className="glass-panel-strong overflow-hidden p-0">
      <div className="border-b border-slate-200/70 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-dark">Workspace login</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Enter your team workspace</h2>
      </div>
      <div className="px-6 py-6">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <Input name="email" type="email" placeholder="you@company.com" required autoComplete="email" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <Input name="password" type="password" placeholder="Minimum 8 characters" required autoComplete="current-password" />
          </div>
          {state?.error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        {googleEnabled ? (
          <form action={googleLoginAction} className="mt-3">
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
