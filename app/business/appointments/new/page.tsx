"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
} from "lucide-react";

import { createClient } from "../../../../lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  address: string;
  verification_status: "pending" | "verified" | "rejected";
};

export default function NewAppointmentPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);

  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [description, setDescription] = useState("");

  const [checkingBusiness, setCheckingBusiness] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
          id,
          business_name,
          category,
          city,
          address,
          verification_status
          `,
        )
        .eq("owner_id", user.id)
        .single();

      if (error || !data) {
        console.error("Business loading error:", error);
        router.replace("/business/pending");
        return;
      }

      if (data.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      setBusiness(data);
      setCheckingBusiness(false);
    }

    loadBusiness();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!business || !service.trim() || !date || !time || !duration || !price) {
      setMessage("יש למלא את כל שדות החובה.");
      return;
    }

    const durationMinutes = Number(duration);
    const appointmentPrice = Number(price);

    if (durationMinutes <= 0 || appointmentPrice <= 0) {
      setMessage("משך התור והמחיר חייבים להיות גדולים מאפס.");
      return;
    }

    if (oldPrice && Number(oldPrice) <= appointmentPrice) {
      setMessage("אם הוזן מחיר קודם, הוא צריך להיות גבוה מהמחיר החדש.");
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);

    if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      setMessage("יש לבחור מועד עתידי לתור.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
  "create_my_appointment",
  {
    p_business_id: business.id,
    p_service: service.trim(),
    p_starts_at: startsAt.toISOString(),
    p_duration_minutes: durationMinutes,
    p_price: appointmentPrice,
    p_old_price: oldPrice
      ? Number(oldPrice)
      : null,
    p_description: description.trim()
      ? description.trim()
      : null,
  }
);

   if (error) {
  console.error(
    "Create appointment error:",
    error
  );

  const errorMessage = error.message ?? "";

  if (
    errorMessage.includes(
      "BUSINESS_NOT_VERIFIED_OR_FORBIDDEN"
    )
  ) {
    setMessage(
      "לא ניתן לפרסם תור מהעסק הזה."
    );
  } else if (
    errorMessage.includes(
      "INVALID_APPOINTMENT_TIME"
    )
  ) {
    setMessage(
      "מועד התור חייב להיות בעתיד."
    );
  } else if (
    errorMessage.includes(
      "INVALID_DURATION"
    )
  ) {
    setMessage(
      "משך התור אינו תקין."
    );
  } else if (
    errorMessage.includes(
      "INVALID_PRICE"
    )
  ) {
    setMessage(
      "מחיר התור אינו תקין."
    );
  } else if (
    errorMessage.includes(
      "INVALID_OLD_PRICE"
    )
  ) {
    setMessage(
      "המחיר הקודם חייב להיות גבוה מהמחיר החדש."
    );
  } else {
    setMessage(
      "לא הצלחנו לפרסם את התור. נסה שוב."
    );
  }

  setLoading(false);
  return;
}

    router.replace("/business");
    router.refresh();
  }

  function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (checkingBusiness || !business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle size={30} className="animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950"
    >
      <div className="mx-auto w-full max-w-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
          aria-label="חזרה"
        >
          <ArrowRight size={20} />
        </button>

        <section className="mt-6">
          <p className="text-sm font-black text-blue-600">FreeSpot לעסקים</p>

          <h1 className="mt-1 text-3xl font-black">פרסם תור שהתפנה</h1>

          <p className="mt-2 leading-7 text-slate-500">
            כמה פרטים והתור יוכל להופיע ללקוחות שמחפשים באזור שלך.
          </p>
        </section>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Building2 size={20} />
          </div>

          <div>
            <p className="font-black">{business.business_name}</p>

            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} />

              {business.address}
              {business.city ? `, ${business.city}` : ""}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <label className="block text-sm font-black">איזה שירות התפנה?</label>

          <input
            value={service}
            onChange={(event) => setService(event.target.value)}
            placeholder="לדוגמה: תספורת גברים"
            className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-black">תאריך</label>

              <div className="relative mt-2">
                <input
                  type="date"
                  min={getToday()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-500"
                />

                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black">שעה</label>

              <div className="relative mt-2">
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-500"
                />

                <Clock3
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-black">משך התור</label>

            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500"
            >
              <option value="15">15 דקות</option>
              <option value="30">30 דקות</option>
              <option value="45">45 דקות</option>
              <option value="60">שעה</option>
              <option value="90">שעה וחצי</option>
              <option value="120">שעתיים</option>
            </select>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-black">מחיר</label>

              <div className="relative mt-2">
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="80"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-10 outline-none focus:border-blue-500"
                />

                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₪
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black">
                מחיר קודם
                <span className="mr-1 font-normal text-slate-400">
                  אופציונלי
                </span>
              </label>

              <div className="relative mt-2">
                <input
                  type="number"
                  min="1"
                  value={oldPrice}
                  onChange={(event) => setOldPrice(event.target.value)}
                  placeholder="100"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-10 outline-none focus:border-blue-500"
                />

                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₪
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-black">
              הערה ללקוחות
              <span className="mr-1 font-normal text-slate-400">אופציונלי</span>
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="לדוגמה: התור התפנה בעקבות ביטול של הרגע האחרון."
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <LoaderCircle size={20} className="animate-spin" />
                מפרסם תור...
              </>
            ) : (
              <>
                <Plus size={20} />
                פרסם את התור
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
