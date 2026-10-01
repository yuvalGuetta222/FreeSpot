"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Business = {
  business_name: string;
  verification_status: "pending" | "verified" | "rejected";
};

export default function BusinessPendingPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "business") {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("business_name, verification_status")
        .eq("owner_id", user.id)
        .single();

      if (error || !data) {
        console.error("Business loading error:", error);

        setLoading(false);
        return;
      }

      if (data.verification_status === "verified") {
        router.replace("/business");
        return;
      }

      setBusiness(data);
      setLoading(false);
    }

    loadBusiness();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/auth");
    router.refresh();
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle size={28} className="animate-spin text-blue-600" />
      </main>
    );
  }

  if (!business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-black">לא הצלחנו למצוא את העסק</h1>

          <p className="mt-2 text-slate-500">נסה להתחבר מחדש או פנה לתמיכה.</p>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white"
          >
            חזרה להתחברות
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950"
    >
      <div className="mx-auto w-full max-w-md">
        {/* Business icon */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-slate-950 text-white shadow-lg">
            <Building2 size={36} />
          </div>

          <p className="mt-5 text-sm font-black text-blue-600">
            FreeSpot לעסקים
          </p>

          <h1 className="mt-1 text-3xl font-black">{business.business_name}</h1>
        </div>

        {/* Main card */}
        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 size={30} />
          </div>

          <h2 className="mt-5 text-center text-2xl font-black">
            העסק שלך בבדיקה
          </h2>

          <p className="mt-3 text-center leading-7 text-slate-500">
            קיבלנו את פרטי העסק. לפני שתוכל לפרסם תורים ללקוחות, אנחנו צריכים
            לאמת שהעסק אמיתי ושהפרטים תקינים.
          </p>

          {/* Steps */}
          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <p className="font-black">החשבון נוצר</p>

                <p className="text-sm text-slate-500">
                  פרטי ההתחברות נשמרו בהצלחה.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <MailCheck size={21} />
              </div>

              <div>
                <p className="font-black">האימייל אומת</p>

                <p className="text-sm text-slate-500">
                  כתובת האימייל שלך מאושרת.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <ShieldCheck size={21} />
              </div>

              <div>
                <p className="font-black">אימות העסק</p>

                <p className="text-sm text-slate-500">
                  ממתין לבדיקה של FreeSpot.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            לאחר שהעסק יאושר, האפשרות לפרסם תורים ולנהל הזמנות תיפתח אוטומטית.
          </div>
        </section>

        <button
          onClick={handleLogout}
          className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white font-black text-slate-600 transition hover:bg-slate-50"
        >
          <LogOut size={18} />
          התנתק
        </button>
      </div>
    </main>
  );
}
