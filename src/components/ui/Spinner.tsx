interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-3.5 w-3.5 border", md: "h-5 w-5 border-2", lg: "h-7 w-7 border-2" };

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      className={[
        "rounded-full border-[#14F195]/30 border-t-[#14F195] animate-spin",
        sizes[size],
        className,
      ].join(" ")}
      aria-label="Cargando"
    />
  );
}
