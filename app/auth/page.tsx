"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("יש למלא אימייל וסיסמה.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("Login error:", error);

      setMessage(
        "לא הצלחנו להתחבר. בדוק שהאימייל והסיסמה נכונים ושהחשבון אומת.",
      );

      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);

    // נותן לאנימציית ההצלחה להופיע לפני המעבר
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 850);
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10 text-slate-950"
    >
      <style>{`
        @keyframes freeSpotLogoIn {
          0% {
            opacity: 0;
            transform: translateY(-18px) scale(0.82);
          }

          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.06);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes freeSpotDot {
          0% {
            transform: scale(0);
            opacity: 0;
          }

          55% {
            transform: scale(1.35);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes freeSpotSuccess {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }

          55% {
            transform: scale(1.16);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes freeSpotExit {
          0% {
            opacity: 1;
            transform: translateY(0);
          }

          100% {
            opacity: 0;
            transform: translateY(-14px);
          }
        }

        .freespot-logo-in {
          animation: freeSpotLogoIn 650ms cubic-bezier(.2,.8,.2,1) both;
        }

        .freespot-dot {
          animation: freeSpotDot 500ms 280ms cubic-bezier(.2,.8,.2,1) both;
        }

        .freespot-success {
          animation: freeSpotSuccess 420ms cubic-bezier(.2,.8,.2,1) both;
        }

        .freespot-exit {
          animation: freeSpotExit 700ms 180ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .freespot-logo-in,
          .freespot-dot,
          .freespot-success,
          .freespot-exit {
            animation: none;
          }
        }
      `}</style>

      <section
        className={`w-full max-w-md ${
          success ? "freespot-exit pointer-events-none" : ""
        }`}
      >
        {/* Logo */}
        <div className="freespot-logo-in mb-8 text-center">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin size={40} strokeWidth={2.5} />

            <span className="freespot-dot absolute right-6.25 top-6.25 h-3 w-3 rounded-full bg-white" />
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Free<span className="text-blue-600">Spot</span>
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            מוצאים לך תור פנוי, ברגע הנכון
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-black text-blue-600">ברוכים הבאים</p>

            <h2 className="mt-1 text-2xl font-black">טוב לראות אותך שוב</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              התחבר כדי לראות תורים, הזמנות ומועדפים.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                אימייל
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                disabled={loading || success}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                סיסמה
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="הכנס סיסמה"
                  disabled={loading || success}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-14 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading || success}
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {message && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {message}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-black transition ${
                success
                  ? "bg-green-500 text-white"
                  : loading
                    ? "cursor-wait bg-blue-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {success ? (
                <span className="freespot-success flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-500">
                    <Check size={18} strokeWidth={3} />
                  </span>
                  התחברת!
                </span>
              ) : loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  מתחבר...
                </>
              ) : (
                <>
                  התחבר
                  <ArrowLeft size={19} />
                </>
              )}
            </button>
          </form>

          {/* Signup */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">עדיין אין לך חשבון?</p>

            <Link
              href="/auth/signup"
              className="mt-2 inline-flex min-h-11 items-center justify-center font-black text-blue-600 transition hover:text-blue-700"
            >
              הירשם ל־FreeSpot
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          בהתחברות ל־FreeSpot אתה מסכים לתנאי השימוש ולמדיניות הפרטיות.
        </p>
      </section>
    </main>
  );
}
