"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { appointments } from "../../../../data/appointments";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ConfirmAppointmentPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const appointment = appointments.find(
    (item) => item.id === Number(id)
  );

  if (!appointment) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-black">התור לא נמצא</h1>

          <Link
            href="/"
            className="mt-4 inline-block font-black text-blue-600"
          >
            חזרה לעמוד הבית
          </Link>
        </div>
      </main>
    );
  }

  const selectedAppointment = appointment;

  function confirmBooking() {
    const savedBookings = localStorage.getItem("freespot-bookings");

    const existingBookings = savedBookings
      ? JSON.parse(savedBookings)
      : [];

    const newBooking = {
      bookingId: Date.now(),
      appointmentId: selectedAppointment.id,
      service: selectedAppointment.service,
      business: selectedAppointment.business,
      category: selectedAppointment.category,
      time: selectedAppointment.time,
      duration: selectedAppointment.duration,
      address: selectedAppointment.address,
      area: selectedAppointment.area,
      price: selectedAppointment.price,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "freespot-bookings",
      JSON.stringify([...existingBookings, newBooking])
    );

    router.push(`/appointment/${selectedAppointment.id}/success`);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] pb-32 text-slate-950"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          >
            <ArrowRight size={20} />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 font-black">
            אישור הזמנה
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-5">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black text-blue-600">
            {selectedAppointment.category}
          </p>

          <h2 className="mt-1 text-2xl font-black">
            {selectedAppointment.service}
          </h2>

          <p className="mt-1 font-bold text-slate-500">
            {selectedAppointment.business}
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <CalendarDays size={19} className="text-blue-600" />

              <div>
                <p className="text-xs text-slate-500">תאריך</p>
                <p className="font-black">היום</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <Clock3 size={19} className="text-blue-600" />

              <div>
                <p className="text-xs text-slate-500">שעה ומשך</p>

                <p className="font-black">
                  {selectedAppointment.time} · {selectedAppointment.duration}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <MapPin size={19} className="text-blue-600" />

              <div>
                <p className="text-xs text-slate-500">מיקום</p>

                <p className="font-black">
                  {selectedAppointment.address}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <h2 className="font-black">מחיר</h2>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">
              מחיר התור
            </span>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black">
                ₪{selectedAppointment.price}
              </span>

              {selectedAppointment.oldPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ₪{selectedAppointment.oldPrice}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            כרגע זו גרסת פיתוח בלבד ולא מתבצע חיוב אמיתי.
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-black">מדיניות ביטול</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                כרגע לא מתבצע חיוב אמיתי. בהמשך נציג כאן את תנאי הפיקדון,
                הביטול ואי-הגעה לפני אישור ההזמנה.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <button
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex w-full items-start gap-3 rounded-[22px] border border-slate-200 bg-white p-4 text-right"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                acceptedTerms
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {acceptedTerms && <Check size={15} />}
            </span>

            <span className="text-sm leading-6 text-slate-600">
              קראתי ואני מאשר את פרטי התור ואת מדיניות הביטול.
            </span>
          </button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={confirmBooking}
            disabled={!acceptedTerms}
            className={`w-full rounded-2xl py-4 text-base font-black transition ${
              acceptedTerms
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            אשר הזמנה
          </button>
        </div>
      </div>
    </main>
  );
}