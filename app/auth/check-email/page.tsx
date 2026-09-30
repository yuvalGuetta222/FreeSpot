"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  MailCheck,
  MapPin,
} from "lucide-react";

export default function CheckEmailPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    setEmail(searchParams.get("email") ?? "");
  }, []);

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10 text-slate-950"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin size={32} strokeWidth={2.5} />

            <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-white" />
          </div>

          <h1 className="mt-3 text-3xl font-black">
            Free<span className="text-blue-600">Spot</span>
          </h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            מוצאים לך תור פנוי, ברגע הנכון
          </p>
        </div>

        {/* Card */}
        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MailCheck size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-black">
            שלחנו לך מייל
          </h2>

          <p className="mt-3 leading-7 text-slate-500">
            שלחנו קישור לאימות החשבון שלך
            {email ? " לכתובת:" : "."}
          </p>

          {email && (
            <p
              dir="ltr"
              className="mt-2 break-all font-black text-slate-800"
            >
              {email}
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            פתח את המייל ולחץ על{" "}
            <strong>Confirm email address</strong>.
            <br />
            מיד לאחר האישור נחזיר אותך אוטומטית ל־FreeSpot.
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            לא מצאת את המייל? בדוק גם בתיקיית הספאם.
          </p>

          <Link
            href="/auth"
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowRight size={18} />
            חזרה להתחברות
          </Link>
        </section>
      </div>
    </main>
  );
}