"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const PIN_SALT = "!Bk#";

type Props = { email: string; isSuperAdmin: boolean };

export function LoginForm({ email, isSuperAdmin }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("next") ?? "/panel";

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  async function submit(pin: string) {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: pin + PIN_SALT,
    });

    if (authError) {
      setError("PIN incorrecto. Intenta de nuevo.");
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setDigits(["", "", "", ""]);
        setTimeout(() => inputs.current[0]?.focus(), 30);
      }, 550);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value) {
      if (index < 3) {
        inputs.current[index + 1]?.focus();
      } else {
        // 4th digit — submit
        const pin = [...digits.slice(0, 3), value].join("");
        submit(pin);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const prev = [...digits];
      prev[index - 1] = "";
      setDigits(prev);
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      setDigits(text.split(""));
      submit(text);
    }
  }

  const filled = (i: number) => !!digits[i];
  const boxClass = (i: number) => {
    if (error && !loading)
      return "border-red-500/40 bg-red-500/[0.06] text-white";
    if (filled(i))
      return isSuperAdmin
        ? "border-amber-400/50 bg-amber-400/[0.09] text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.2)]"
        : "border-[#14F195]/50 bg-[#14F195]/[0.09] text-[#14F195] shadow-[0_0_14px_rgba(20,241,149,0.2)]";
    return "border-white/[0.09] bg-ink-950 text-white focus:border-white/20 focus:bg-white/[0.03]";
  };

  return (
    <div className="space-y-7">
      {/* Role badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${
          isSuperAdmin
            ? "border-amber-400/25 bg-amber-400/[0.08] text-amber-300"
            : "border-[#14F195]/25 bg-[#14F195]/[0.08] text-[#14F195]"
        }`}>
          {isSuperAdmin ? "👑 Superadmin" : "🏪 Tu negocio"}
        </div>
      </div>

      {/* PIN prompt */}
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        Ingresa tu PIN
      </p>

      {/* 4 boxes */}
      <div
        className="flex justify-center gap-3.5"
        style={{ animation: shake ? "shake 0.5s ease-in-out" : "none" }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={loading}
            className={`h-16 w-14 rounded-2xl border text-center text-3xl font-bold outline-none transition-all duration-150 disabled:opacity-40 ${boxClass(i)}`}
          />
        ))}
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="flex justify-center gap-1.5 pt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${isSuperAdmin ? "bg-amber-400" : "bg-[#14F195]"}`}
              style={{ animation: `bounce 0.8s ${i * 0.15}s ease-in-out infinite` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-7px); }
          30%      { transform: translateX(7px); }
          45%      { transform: translateX(-5px); }
          60%      { transform: translateX(5px); }
          75%      { transform: translateX(-2px); }
          90%      { transform: translateX(2px); }
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); opacity: .5; }
          50%     { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
