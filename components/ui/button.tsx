import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-white shadow-[0_12px_30px_rgba(15,118,110,0.28)] hover:-translate-y-0.5 hover:bg-brand-dark disabled:bg-brand/60",
  secondary: "border border-slate-300/80 bg-white/80 text-slate-900 hover:-translate-y-0.5 hover:bg-white",
  ghost: "text-slate-700 hover:bg-slate-100/80"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:translate-y-0",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
