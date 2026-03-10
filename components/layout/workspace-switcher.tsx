"use client";

import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { setActiveWorkspaceAction } from "@/lib/actions/workspace-selection";

function WorkspaceSubmitState() {
  const { pending } = useFormStatus();
  return <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">{pending ? "Switching" : "Active workspace"}</span>;
}

export function WorkspaceSwitcher({
  memberships,
  activeTeamId
}: {
  memberships: Array<{ teamId: string; teamName: string; role: string }>;
  activeTeamId: string;
}) {
  const pathname = usePathname();

  if (memberships.length <= 1) {
    return null;
  }

  return (
    <form action={setActiveWorkspaceAction} className="mt-6 rounded-[1.25rem] border border-white/10 bg-slate-900/70 p-3">
      <input type="hidden" name="redirectTo" value={pathname || "/dashboard"} />
      <WorkspaceSubmitState />
      <select
        name="teamId"
        defaultValue={activeTeamId}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-teal-300"
        aria-label="Select active workspace"
      >
        {memberships.map((membership) => (
          <option key={membership.teamId} value={membership.teamId} className="text-slate-900">
            {membership.teamName} ({membership.role.toLowerCase()})
          </option>
        ))}
      </select>
    </form>
  );
}
