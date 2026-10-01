"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Building2,
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
import { categories } from "../../../../data/categories";
import { cities } from "../../../../data/cities";

export default function BusinessSignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      !businessName.trim() ||
      !category ||
      !city ||
      !address.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setMessage("יש למלא את כל שדות החובה.");
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
          role: "business",

          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),

          business_name: businessName.trim(),
          business_category: category,
          business_city: city,
          business_address: address.trim(),
          business_phone: phone.trim(),
          business_description: description.trim(),
        },
      },
    });

    if (error) {
      console.error("Business signup error:", error);

      if (
        error.status === 429 ||
        error.message.toLowerCase().includes("rate limit")
      ) {
        setMessage("שלחנו יותר מדי מיילי אימות בזמן קצר. המתן מעט ונסה שוב.");
      } else if (error.message.toLowerCase().includes("already registered")) {
        setMessage("כבר קיים חשבון עם האימייל הזה.");
      } else {
        setMessage("לא הצלחנו ליצור את החשבון העסקי. נסה שוב.");
      }

      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("לא הצלחנו ליצור את החשבון העסקי.");
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
        <Link
          href="/auth/signup"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
        >
          <ArrowRight size={20} />
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-blue-600">
            <Building2 size={19} />
            <span className="text-sm font-black">חשבון עסקי</span>
          </div>

          <h1 className="mt-2 text-3xl font-black">מצטרפים ל־FreeSpot</h1>

          <p className="mt-2 leading-7 text-slate-500">
            פתח חשבון עסקי והתחל למלא תורים שמתפנים ביומן.
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="mt-7 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2 className="flex items-center gap-2 text-lg font-black">
            <UserRound size={19} className="text-blue-600" />
            פרטי בעל העסק
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="שם פרטי"
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
            />

            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="שם משפחה"
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
            />
          </div>

          <h2 className="mt-7 flex items-center gap-2 text-lg font-black">
            <Building2 size={19} className="text-blue-600" />
            פרטי העסק
          </h2>

          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="שם העסק"
            className="mt-4 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
          >
            <option value="">בחר תחום</option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
          >
            <option value="">בחר עיר</option>

            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="relative mt-3">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="כתובת מדויקת, לדוגמה ביאליק 72"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 outline-none focus:border-blue-500"
            />

            <MapPin
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative mt-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-left outline-none focus:border-blue-500"
            />

            <Phone
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="כמה מילים על העסק (אופציונלי)"
            rows={4}
            className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-blue-500"
          />

          <h2 className="mt-7 text-lg font-black">פרטי התחברות</h2>

          <div className="relative mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="business@example.com"
              dir="ltr"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-left outline-none focus:border-blue-500"
            />

            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative mt-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה, לפחות 8 תווים"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-14 outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="אימות סיסמה"
            className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setAcceptedTerms((current) => !current)}
            className="mt-5 flex w-full items-start gap-3 text-right"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                acceptedTerms
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300"
              }`}
            >
              {acceptedTerms && <Check size={15} strokeWidth={3} />}
            </span>

            <span className="text-sm leading-6 text-slate-500">
              אני מאשר את תנאי השימוש ומבין שהעסק יעבור אימות לפני פרסום תורים
              לציבור.
            </span>
          </button>

          {message && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-black text-white disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <LoaderCircle size={20} className="animate-spin" />
                יוצר חשבון עסקי...
              </>
            ) : (
              "פתח חשבון עסקי"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
