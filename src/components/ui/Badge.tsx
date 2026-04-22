import React from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  default:  "bg-[rgba(255,255,255,0.06)] text-[#A1A1AA] border-[rgba(255,255,255,0.08)]",
  success:  "bg-[rgba(20,241,149,0.12)]  text-[#14F195]  border-[rgba(20,241,149,0.2)]",
  danger:   "bg-[rgba(248,113,113,0.12)] text-[#F87171]  border-[rgba(248,113,113,0.2)]",
  warning:  "bg-[rgba(251,191,36,0.12)]  text-[#FBBF24]  border-[rgba(251,191,36,0.2)]",
  accent:   "bg-[rgba(153,69,255,0.12)]  text-[#9945FF]  border-[rgba(153,69,255,0.2)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[#71717A]",
  success: "bg-[#14F195]",
  danger:  "bg-[#F87171]",
  warning: "bg-[#FBBF24]",
  accent:  "bg-[#9945FF]",
};

export function Badge({ variant = "default", dot, children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[11px] font-[500]",
        styles[variant],
        className,
      ].join(" ")}
    >
      {dot && <span className={["h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[variant]].join(" ")} />}
      {children}
    </span>
  );
}
