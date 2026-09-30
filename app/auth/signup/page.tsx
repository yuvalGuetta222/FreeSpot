"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

export default function SignupTypePage() {
  const router = useRouter();

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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950 sm:py-10"
    >
      <div className="mx-auto w-full max-w-md">
        {/* Back */}
        <Link
          href="/auth"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="חזרה להתחברות"
        >
          <ArrowRight size={20} />
        </Link>

        {/* Logo */}
        <div className="mt-6 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin size={32} strokeWidth={2.5} />

            <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-white" />
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Free<span className="text-blue-600">Spot</span>
          </h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            מוצאים לך תור פנוי, ברגע הנכון
          </p>
        </div>

        {/* Heading */}
        <section className="mt-9">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles size={18} />

            <span className="text-sm font-black">מתחילים מכאן</span>
          </div>

          <h2 className="mt-2 text-3xl font-black">
            איך תרצה להשתמש ב־FreeSpot?
          </h2>

          <p className="mt-2 leading-7 text-slate-500">
            בחר את סוג החשבון שמתאים לך. תמיד נוכל להרחיב את החשבון
            בהמשך.
          </p>
        </section>

        {/* Customer */}
        <Link
          href="/auth/signup/customer"
          className="group mt-7 block rounded-[28px] border-2 border-transparent bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={27} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-black">אני לקוח</h3>

                <ChevronLeft
                  size={21}
                  className="shrink-0 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-blue-600"
                />
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                למצוא תורים שהתפנו, לשמור מועדפים ולהזמין במהירות.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              תורים קרובים
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              מועדפים
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              התראות
            </span>
          </div>
        </Link>

        {/* Business */}
        <Link
          href="/auth/signup/business"
          className="group mt-4 block rounded-[28px] border-2 border-transparent bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Building2 size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-black">אני עסק</h3>

                <ChevronLeft
                  size={21}
                  className="shrink-0 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-blue-600"
                />
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                לפרסם תורים שהתפנו ולמלא חורים ביומן העסק.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              פרסום תורים
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              ניהול הזמנות
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              חשיפה ללקוחות
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            חשבון עסקי יעבור אימות לפני פרסום תורים לציבור.
          </div>
        </Link>

        <div className="mt-7 text-center text-sm text-slate-500">
          כבר יש לך חשבון?{" "}
          <Link href="/auth" className="font-black text-blue-600">
            התחבר
          </Link>
        </div>
      </div>
    </main>
  );
}