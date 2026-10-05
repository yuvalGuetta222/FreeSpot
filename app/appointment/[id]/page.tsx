"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  LoaderCircle,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Appointment = {
  id: number;
  service: string;
  category: string;
  business: string;
business_id: string | null;
  rating: number | null;
  reviews: number | null;

  time: string;
  duration: string;
  duration_minutes: number | null;
  starts_at: string | null;

  distance: string | null;
  area: string | null;
  address: string | null;

  price: number;
  old_price: number | null;

  urgency: string | null;
  description: string | null;

  is_available: boolean;
};

export default function AppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const appointmentId = Number(params.id);

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);

  const [loading, setLoading] = useState(true);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [message, setMessage] = useState("");

  const [isFavorite, setIsFavorite] =
    useState(false);

  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  const [alreadyBookedByMe, setAlreadyBookedByMe] =
    useState(false);

  useEffect(() => {
    async function loadAppointment() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          service,
          category,
          business,
          business_id,
          rating,
          reviews,
          time,
          duration,
          duration_minutes,
          starts_at,
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
        .eq("id", appointmentId)
        .single();

      if (error || !data) {
        console.error(
          "Error loading appointment:",
          error
        );

        setLoading(false);
        return;
      }

      setAppointment(data);

  if (user) {
  const { data: favoriteData, error: favoriteError } =
    await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("appointment_id", appointmentId)
      .maybeSingle();

  if (favoriteError) {
    console.error(
      "Appointment favorite load error:",
      favoriteError,
    );
  }

  setIsFavorite(Boolean(favoriteData));

  const { data: bookingData, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", user.id)
      .eq("appointment_id", appointmentId)
      .eq("status", "confirmed")
      .maybeSingle();

  if (bookingError) {
    console.error(
      "Appointment booking check error:",
      bookingError,
    );
  }

  setAlreadyBookedByMe(Boolean(bookingData));
}

setLoading(false);
}

loadAppointment();
  }, [appointmentId]);

  function isAppointmentAvailable() {
    if (!appointment) {
      return false;
    }

    if (!appointment.is_available) {
      return false;
    }

    if (
      appointment.starts_at &&
      new Date(appointment.starts_at) <= new Date()
    ) {
      return false;
    }

    return true;
  }

  function formatDate() {
    if (!appointment?.starts_at) {
      return "היום";
    }

    return new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(appointment.starts_at));
  }

  function formatTime() {
    if (!appointment) {
      return "";
    }

    if (!appointment.starts_at) {
      return appointment.time;
    }

    return new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(appointment.starts_at));
  }

async function toggleFavorite() {
  if (!appointment || favoriteLoading) {
    return;
  }

  setFavoriteLoading(true);

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setFavoriteLoading(false);
    router.push("/auth");
    return;
  }

  if (isFavorite) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("appointment_id", appointment.id);

    if (error) {
      console.error(
        "Remove appointment favorite error:",
        error,
      );

      setFavoriteLoading(false);
      return;
    }

    setIsFavorite(false);
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        appointment_id: appointment.id,
      });

    if (error && error.code !== "23505") {
      console.error(
        "Add appointment favorite error:",
        error,
      );

      setFavoriteLoading(false);
      return;
    }

    setIsFavorite(true);
  }

  setFavoriteLoading(false);
}

  async function confirmBooking() {
    if (
      !appointment ||
      !acceptedTerms ||
      bookingLoading
    ) {
      return;
    }

    if (!isAppointmentAvailable()) {
      setMessage(
        "התור הזה כבר לא זמין להזמנה."
      );
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

  const { error } = await supabase.rpc(
  "book_appointment",
  {
    p_appointment_id: appointment.id,
  }
);

if (error) {
  console.error("Booking error:", error);

  const errorMessage = error.message ?? "";

  if (
    errorMessage.includes("APPOINTMENT_EXPIRED")
  ) {
    setMessage(
      "המועד של התור כבר עבר ולכן אי אפשר להזמין אותו."
    );

    setAppointment((current) =>
      current
        ? {
            ...current,
            is_available: false,
          }
        : current
    );
  } else if (
    errorMessage.includes(
      "APPOINTMENT_NOT_AVAILABLE"
    ) ||
    errorMessage.includes(
      "APPOINTMENT_ALREADY_BOOKED"
    )
  ) {
    setMessage(
      "מישהו כבר הזמין את התור הזה."
    );

    setAppointment((current) =>
      current
        ? {
            ...current,
            is_available: false,
          }
        : current
    );
  } else if (
    errorMessage.includes(
      "APPOINTMENT_NOT_FOUND"
    )
  ) {
    setMessage(
      "התור הזה כבר לא קיים."
    );
  } else {
    setMessage(
      "לא הצלחנו לבצע את ההזמנה. נסה שוב."
    );
  }

  setBookingLoading(false);
  return;
}

   router.replace(
  `/appointment/${appointment.id}/success`
);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-600"
        />
      </main>
    );
  }

  if (!appointment) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-black">
            התור לא נמצא
          </h1>

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

  const available = isAppointmentAvailable();
  const appointmentDate = formatDate();
  const appointmentTime = formatTime();

  const mapsQuery = encodeURIComponent(
    [appointment.address, appointment.area]
      .filter(Boolean)
      .join(", ")
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] pb-40 text-slate-950"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            aria-label="חזרה"
          >
            <ArrowRight size={20} />
          </button>

          <span className="font-black">
            פרטי התור
          </span>

          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              isFavorite
                ? "border-red-100 bg-red-50 text-red-500"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            aria-label={
              isFavorite
                ? "הסר מהמועדפים"
                : "הוסף למועדפים"
            }
          >
            {favoriteLoading ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <Heart
                size={19}
                fill={
                  isFavorite
                    ? "currentColor"
                    : "none"
                }
              />
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {/* Hero */}
        <section className="relative mt-4 overflow-hidden rounded-[28px] bg-linear-to-br from-blue-950 via-blue-800 to-blue-500 p-6 text-white sm:p-8">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            {available && appointment.urgency && (
              <div className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
                {appointment.urgency}
              </div>
            )}

            {!available && (
              <div className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
                התור כבר לא זמין
              </div>
            )}

            <p className="mt-8 text-sm font-bold text-blue-100">
              {appointmentDate}
            </p>

            <div className="mt-1 text-6xl font-black tracking-tight sm:text-7xl">
              {appointmentTime}
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

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600">
              {appointment.business}
            </span>

            {appointment.rating !== null && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black">
                <Star
                  size={14}
                  className="fill-amber-400 text-amber-400"
                />

                {appointment.rating}
              </span>
            )}

            {appointment.reviews !== null && (
              <span className="text-xs text-slate-400">
                {appointment.reviews} ביקורות
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <CalendarDays
                size={19}
                className="text-blue-600"
              />

              <p className="mt-2 text-xs text-slate-500">
                מועד
              </p>

              <p className="font-black">
                {appointmentDate}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {appointmentTime}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3
                size={19}
                className="text-blue-600"
              />

              <p className="mt-2 text-xs text-slate-500">
                משך
              </p>

              <p className="font-black">
                {appointment.duration}
              </p>
            </div>
          </div>
        </section>

        {/* Location */}
        {(appointment.address ||
          appointment.area) && (
          <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MapPin size={20} />
              </div>

              <div className="flex-1">
                <h2 className="font-black">
                  מיקום
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  {appointment.address}
                  {appointment.address &&
                  appointment.area
                    ? ", "
                    : ""}
                  {appointment.area}
                </p>

                {appointment.distance && (
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.distance} מהמיקום שלך
                  </p>
                )}
              </div>
            </div>

            {mapsQuery && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black transition hover:bg-slate-50"
              >
                <Navigation
                  size={17}
                  className="text-blue-600"
                />
                פתח ניווט
              </a>
            )}
          </section>
        )}

        {/* Description */}
        {appointment.description && (
          <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">
              פרטים נוספים
            </h2>

            <p className="mt-2 leading-7 text-slate-600">
              {appointment.description}
            </p>
          </section>
        )}

        {/* Policy */}
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
                כרגע לא מתבצע חיוב כספי דרך FreeSpot.
                בהמשך נוסיף כאן את תנאי הפיקדון,
                הביטול ואי-ההגעה.
              </p>
            </div>
          </div>
        </section>

        {/* Already booked */}
        {alreadyBookedByMe && (
          <section className="mt-4 rounded-[22px] bg-green-50 p-4">
            <p className="font-black text-green-800">
              התור הזה כבר הוזמן על ידך ✓
            </p>

            <Link
              href="/bookings"
              className="mt-2 inline-block text-sm font-black text-green-700"
            >
              מעבר להזמנות שלי
            </Link>
          </section>
        )}

        {/* Terms */}
        {available && !alreadyBookedByMe && (
          <button
            type="button"
            onClick={() =>
              setAcceptedTerms((current) => !current)
            }
            className="mt-4 flex w-full items-start gap-3 rounded-[22px] border border-slate-200 bg-white p-4 text-right"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                acceptedTerms
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {acceptedTerms && (
                <Check
                  size={15}
                  strokeWidth={3}
                />
              )}
            </span>

            <span className="text-sm leading-6 text-slate-600">
              קראתי ואני מאשר את פרטי התור ואת
              מדיניות הביטול.
            </span>
          </button>
        )}

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}
      </div>

      {/* Booking bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              מחיר התור
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

          {alreadyBookedByMe ? (
  <div className="flex flex-1 flex-col gap-2 sm:max-w-xs">
    <div className="rounded-2xl bg-green-100 px-6 py-3 text-center font-black text-green-700">
      ✓ התור הוזמן
    </div>

    <Link
      href="/bookings"
      replace
      className="text-center text-sm font-black text-blue-600"
    >
      חזרה להזמנות שלי
    </Link>
  </div>
          ) : available ? (
            <button
              type="button"
              onClick={confirmBooking}
              disabled={
                !acceptedTerms || bookingLoading
              }
              className={`flex-1 rounded-2xl px-6 py-4 text-center text-base font-black transition sm:max-w-xs ${
                acceptedTerms && !bookingLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              {bookingLoading
                ? "מבצע הזמנה..."
                : "הזמן עכשיו"}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl bg-slate-200 px-6 py-4 text-center font-black text-slate-500 sm:max-w-xs">
              התור כבר לא זמין
            </div>
          )}
        </div>
      </div>
    </main>
  );
}