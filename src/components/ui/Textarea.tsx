import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-[500] uppercase tracking-wider text-[#71717A]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={[
          "w-full rounded-[10px] border bg-[#14141F] px-3 py-2 text-[13px] text-[#F5F5F7]",
          "placeholder:text-[#71717A] outline-none transition-all duration-[80ms] ease-out resize-none",
          error
            ? "border-[rgba(248,113,113,0.4)] focus:border-[#F87171]"
            : "border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.2)]",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-[11px] text-[#F87171]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[#71717A]">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
