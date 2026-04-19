import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddings = { sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ raised, padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[16px] border border-[rgba(255,255,255,0.08)]",
        raised ? "bg-[#1C1C2A]" : "bg-[#14141F]",
        paddings[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
