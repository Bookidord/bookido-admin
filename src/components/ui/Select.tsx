import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className = "", children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-[500] uppercase tracking-wider text-[#71717A]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={[
          "h-9 w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#14141F] px-3",
          "text-[13px] text-[#F5F5F7] outline-none transition-all duration-[80ms] ease-out",
          "focus:border-[rgba(255,255,255,0.2)] cursor-pointer",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </select>
      {hint && <p className="text-[11px] text-[#71717A]">{hint}</p>}
    </div>
  )
);
Select.displayName = "Select";
