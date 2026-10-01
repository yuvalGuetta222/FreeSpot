"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { createClient } from "../../../../lib/supabase/client";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/");
      }
    }

    checkUser();
  }, [router]);

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "");

    return digits.length >= 9 && digits.length <= 15;
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setMessage("יש למלא את כל השדות.");
      return;
    }

    if (!validatePhone(phone)) {
      setMessage("מספר הטלפון שהוזן אינו תקין.");
      return;
    }

    if (password.length < 8) {
      setMessage("הסיסמה צריכה להכיל לפחות 8 תווים.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("הסיסמאות אינן תואמות.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("יש לאשר את תנאי השימוש ומדיניות הפרטיות.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,

        data: {
          role: "customer",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);

      if (
        error.status === 429 ||
        error.message.toLowerCase().includes("rate limit")
      ) {
        setMessage("שלחנו יותר מדי מיילי אימות בזמן קצר. המתן מעט ונסה שוב.");
      } else if (error.message.toLowerCase().includes("already registered")) {
        setMessage("כבר קיים חשבון עם האימייל הזה.");
      } else {
        setMessage("לא הצלחנו ליצור את החשבון. נסה שוב.");
      }

      setLoading(false);
      return;
    }
    if (!data.user) {
      setMessage("לא הצלחנו ליצור את החשבון.");
      setLoading(false);
      return;
    }

    const verifyEmail = encodeURIComponent(email.trim());

    router.push(`/auth/check-email?email=${verifyEmail}`);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950 sm:py-10"
    >
      <div className="mx-auto w-full max-w-md">
        {/* Back */}
        <Link
          href="/auth/signup"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="חזרה לבחירת סוג חשבון"
        >
          <ArrowRight size={20} />
        </Link>

        {/* Brand */}
        <div className="mt-5 text-center">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin size={28} strokeWidth={2.5} />

            <span className="absolute right-4.25 top-4.25 h-2.5 w-2.5 rounded-full bg-white" />
          </div>

          <h1 className="mt-3 text-2xl font-black">
            Free<span className="text-blue-600">Spot</span>
          </h1>
        </div>

        {/* Heading */}
        <section className="mt-7">
          <div className="flex items-center gap-2 text-blue-600">
            <UserRound size={18} />

            <span className="text-sm font-black">חשבון לקוח</span>
          </div>

          <h2 className="mt-2 text-3xl font-black">בוא נכיר</h2>

          <p className="mt-2 leading-7 text-slate-500">
            עוד רגע תוכל להתחיל למצוא תורים שהתפנו קרוב אליך.
          </p>
        </section>

        {/* Form */}
        <form
          onSubmit={handleSignup}
          className="mt-7 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                שם פרטי
              </label>

              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="יובל"
                disabled={loading}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                שם משפחה
              </label>

              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="כהן"
                disabled={loading}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mt-4">
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              מספר טלפון
            </label>

            <div className="relative">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="050-1234567"
                disabled={loading}
                dir="ltr"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-left text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              המספר ישמש ליצירת קשר בנוגע לתורים שהזמנת.
            </p>
          </div>

          {/* Email */}
          <div className="mt-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              אימייל
            </label>

            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                disabled={loading}
                dir="ltr"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-left text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mt-4">
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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="לפחות 8 תווים"
                disabled={loading}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-14 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="mt-4">
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              אימות סיסמה
            </label>

            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="הקלד שוב את הסיסמה"
              disabled={loading}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Terms */}
          <button
            type="button"
            onClick={() => setAcceptedTerms((current) => !current)}
            className="mt-5 flex w-full items-start gap-3 text-right"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                acceptedTerms
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {acceptedTerms && <Check size={15} strokeWidth={3} />}
            </span>

            <span className="text-sm leading-6 text-slate-500">
              קראתי ואני מסכים לתנאי השימוש ולמדיניות הפרטיות של FreeSpot.
            </span>
          </button>

          {/* Error */}
          {message && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <LoaderCircle size={20} className="animate-spin" />
                יוצר חשבון...
              </>
            ) : (
              "המשך לאימות"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          כבר רשום?{" "}
          <Link href="/auth" className="font-black text-blue-600">
            התחבר
          </Link>
        </p>
      </div>
    </main>
  );
}
