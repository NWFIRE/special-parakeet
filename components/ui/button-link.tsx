import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-white shadow-[0_12px_30px_rgba(15,118,110,0.28)] hover:-translate-y-0.5 hover:bg-brand-dark",
  secondary: "border border-slate-300/80 bg-white/82 text-slate-900 hover:-translate-y-0.5 hover:bg-white"
};

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
