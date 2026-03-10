"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState = { error: "" };

export function SignupForm({ inviteToken }: { inviteToken?: string }) {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <Card className="bg-white shadow-card">
      <form action={formAction} className="space-y-4">
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
          <Input name="name" placeholder="Alex Johnson" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Workspace name</label>
          <Input name="workspaceName" placeholder="Acme Studio" required={!inviteToken} disabled={Boolean(inviteToken)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <Input name="email" type="email" placeholder="you@company.com" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <Input name="password" type="password" placeholder="Minimum 8 characters" required />
        </div>
        {state?.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating workspace..." : inviteToken ? "Create account and join team" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
