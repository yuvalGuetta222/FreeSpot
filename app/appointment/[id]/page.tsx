"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Appointment = {
  id: number;
  service: string;
  category: string;
  business: string;
  rating: number;
  reviews: number;
  time: string;
  duration: string;
  distance: string | null;
  area: string | null;
  address: string | null;
  price: number;
  old_price: number | null;
  urgency: string | null;
  description: string | null;
  is_available: boolean;
};

export default function AppointmentPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);

  const [loading, setLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAppointment() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          service,
          category,
          business,
          rating,
          reviews,
          time,
          duration,
          distance,
          area,
          address,
          price,
          old_price,
          urgency,
          description,
          is_available
          `
        )
        .eq("id", Number(id))
        .single();

      if (error) {
        console.error("Error loading appointment:", error);
        setLoading(false);
        return;
      }

      setAppointment(data);
      setLoading(false);
    }

    loadAppointment();
  }, [id]);

  async function confirmBooking() {
    if (!appointment || !acceptedTerms || bookingLoading) {
      return;
    }

    setBookingLoading(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setBookingLoading(false);
      router.push("/auth");
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .insert({
        appointment_id: appointment.id,
      });

    if (error) {
      console.error("Booking error:", error);

      if (error.code === "23505") {
        setMessage("מישהו כבר הזמין את התור הזה.");
        setAppointment((current) =>
          current
            ? {
                ...current,
                is_available: false,
              }
            : current
        );
      } else {
        setMessage("לא הצלחנו לבצע את ההזמנה. נסה שוב.");
      }

      setBookingLoading(false);
      return;
    }

    router.push(`/appointment/${appointment.id}/success`);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fb]"
      >
        <p className="font-black">טוען את התור...</p>
      </main>
    );
  }

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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] pb-40 text-slate-950"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          >
            <ArrowRight size={20} />
          </button>

          <span className="font-black">פרטי התור</span>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Heart size={19} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {/* Hero */}
        <section className="relative mt-4 overflow-hidden rounded-[28px] bg-linear-to-br from-blue-950 via-blue-800 to-blue-500 p-6 text-white sm:p-8">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            {appointment.urgency && (
              <div className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
                {appointment.urgency}
              </div>
            )}

            <p className="mt-8 text-sm font-bold text-blue-100">
              היום
            </p>

            <div className="mt-1 text-6xl font-black tracking-tight sm:text-7xl">
              {appointment.time}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-100">
              <Clock3 size={17} />
              {appointment.duration}
            </div>
          </div>
        </section>

        {/* Service */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black text-blue-600">
            {appointment.category}
          </p>

          <h1 className="mt-1 text-2xl font-black">
            {appointment.service}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold text-slate-600">
              {appointment.business}
            </span>

            <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black">
              <Star
                size={14}
                className="fill-amber-400 text-amber-400"
              />
              {appointment.rating}
            </span>

            <span className="text-xs text-slate-400">
              {appointment.reviews} ביקורות
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <CalendarDays size={19} className="text-blue-600" />

              <p className="mt-2 text-xs text-slate-500">מועד</p>

              <p className="font-black">
                היום, {appointment.time}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3 size={19} className="text-blue-600" />

              <p className="mt-2 text-xs text-slate-500">משך</p>

              <p className="font-black">
                {appointment.duration}
              </p>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MapPin size={20} />
            </div>

            <div className="flex-1">
              <h2 className="font-black">מיקום</h2>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {appointment.address}
              </p>

              {appointment.distance && (
                <p className="mt-1 text-sm text-slate-500">
                  {appointment.distance} מהמיקום שלך
                </p>
              )}
            </div>
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black transition hover:bg-slate-50">
            <Navigation size={17} className="text-blue-600" />
            פתח ניווט
          </button>
        </section>

        {/* Business */}
        {appointment.description && (
          <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">על העסק</h2>

            <p className="mt-2 leading-7 text-slate-600">
              {appointment.description}
            </p>
          </section>
        )}

        {/* Cancellation policy */}
        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-black">
                מדיניות הזמנה וביטול
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                כרגע לא מתבצע חיוב כספי אמיתי. בהמשך נציג כאן את תנאי
                הפיקדון, הביטול ואי-הגעה.
              </p>
            </div>
          </div>
        </section>

        {/* Terms */}
        {appointment.is_available && (
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
        )}

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}
      </div>

      {/* Bottom booking bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              מחיר לתור
            </p>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black">
                ₪{appointment.price}
              </span>

              {appointment.old_price && (
                <span className="text-sm text-slate-400 line-through">
                  ₪{appointment.old_price}
                </span>
              )}
            </div>
          </div>

          {appointment.is_available ? (
            <button
              onClick={confirmBooking}
              disabled={!acceptedTerms || bookingLoading}
              className={`flex-1 rounded-2xl px-6 py-4 text-center text-base font-black transition sm:max-w-xs ${
                acceptedTerms && !bookingLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              {bookingLoading ? "מבצע הזמנה..." : "הזמן עכשיו"}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl bg-slate-200 px-6 py-4 text-center text-base font-black text-slate-500 sm:max-w-xs">
              התור כבר נתפס
            </div>
          )}
        </div>
      </div>
    </main>
  );
}