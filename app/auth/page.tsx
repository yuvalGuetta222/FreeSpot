"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setMessage("");

    if (!email || !password) {
      setMessage("צריך למלא אימייל וסיסמה.");
      return;
    }

    if (password.length < 6) {
      setMessage("הסיסמה צריכה להכיל לפחות 6 תווים.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("ההרשמה הצליחה. בדוק את האימייל שלך אם נדרש אימות.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        router.push("/profile");
        router.refresh();
      }
    } catch {
      setMessage("אירעה שגיאה בחיבור. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-950"
    >
      <div className="mx-auto max-w-md">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
        >
          <ArrowRight size={20} />
        </Link>

        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-black text-white">
              F
            </div>

            <h1 className="mt-4 text-2xl font-black">
              {mode === "login" ? "התחברות ל-FreeSpot" : "יצירת חשבון"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "התחבר כדי לראות את החשבון וההזמנות שלך."
                : "צור חשבון חדש כדי לשמור תורים, מועדפים והתראות."}
            </p>
          </div>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black">אימייל</span>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black">סיסמה</span>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="לפחות 6 תווים"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "טוען..." : mode === "login" ? "התחבר" : "הירשם"}
          </button>

          <button
            onClick={() =>
              setMode((current) => (current === "login" ? "signup" : "login"))
            }
            className="mt-4 w-full text-sm font-black text-blue-600"
          >
            {mode === "login"
              ? "אין לך חשבון? הירשם"
              : "כבר יש לך חשבון? התחבר"}
          </button>
        </section>
      </div>
    </main>
  );
}
