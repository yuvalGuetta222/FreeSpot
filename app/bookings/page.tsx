"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";

type Booking = {
  booking_id: string;
  appointment_id: number;
  booking_status: string;
  booked_at: string;

  service: string;
  category: string;
  business_name: string;

  starts_at: string | null;
  appointment_time: string;
  duration: string;

  area: string | null;
  address: string | null;

  price: number;
  old_price: number | null;

  description: string | null;
  is_available: boolean;
};

export default function BookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] =
  useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] =
  useState<Booking | null>(null);
  useEffect(() => {
    async function loadBookings() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_my_bookings"
      );

      if (error) {
        console.error("Bookings error:", error);
        setLoading(false);
        return;
      }

      setBookings(data ?? []);
      setLoading(false);
    }

    loadBookings();
  }, [router]);

  function formatDate(startsAt: string | null) {
    if (!startsAt) {
      return null;
    }

    return new Intl.DateTimeFormat("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(startsAt));
  }

  function formatTime(
    startsAt: string | null,
    fallbackTime: string
  ) {
    if (!startsAt) {
      return fallbackTime;
    }

    return new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt));
  }
async function cancelBooking(bookingId: string) {
  setCancellingId(bookingId);

  const supabase = createClient();

  const { error } = await supabase.rpc(
    "cancel_my_booking",
    {
      p_booking_id: bookingId,
    }
  );

  if (error) {
    console.error("Cancel booking error:", error);

    const errorMessage = error.message ?? "";

    if (
      errorMessage.includes(
        "APPOINTMENT_ALREADY_STARTED"
      )
    ) {
      alert(
        "אי אפשר לבטל את ההזמנה כי מועד התור כבר הגיע."
      );
    } else if (
      errorMessage.includes(
        "BOOKING_NOT_CONFIRMED"
      )
    ) {
      alert("ההזמנה הזאת כבר לא פעילה.");
    } else {
      alert(
        "לא הצלחנו לבטל את ההזמנה. נסה שוב."
      );
    }

    setCancellingId(null);
    return;
  }

  setBookings((current) =>
  current.map((booking) =>
    booking.booking_id === bookingId
      ? {
          ...booking,
          booking_status: "cancelled",
          is_available: true,
        }
      : booking
  )
);

setBookingToCancel(null);
setCancellingId(null);
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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] pb-28 text-slate-950"
    >
      <div className="mx-auto max-w-3xl px-4 py-7">
        <header>
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => router.replace("/")}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:bg-slate-50"
      aria-label="חזרה"
    >
      <ArrowRight size={20} />
    </button>

    <div>
      <p className="text-sm font-black text-blue-600">
        FreeSpot
      </p>

      <h1 className="mt-1 text-3xl font-black">
        ההזמנות שלי
      </h1>
    </div>
  </div>

  <p className="mt-3 text-slate-500">
    כל התורים שהזמנת במקום אחד.
  </p>
</header>

        {bookings.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center">
            <CalendarDays
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-black">
              עדיין אין לך הזמנות
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              כשאתה מזמין תור שהתפנה, הוא יופיע כאן.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 font-black text-white"
            >
              מצא תור
            </Link>
          </section>
        ) : (
          <div className="mt-7 space-y-4">
            {bookings.map((booking) => {
              const date = formatDate(
                booking.starts_at
              );

              const time = formatTime(
                booking.starts_at,
                booking.appointment_time
              );

              return (
                <article
                  key={booking.booking_id}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-white"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            booking.booking_status ===
                            "confirmed"
                              ? "bg-green-50 text-green-700"
                              : booking.booking_status ===
                                  "cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {booking.booking_status ===
                          "confirmed"
                            ? "מאושר"
                            : booking.booking_status ===
                                "cancelled"
                              ? "בוטל"
                              : booking.booking_status}
                        </span>

                        <h2 className="mt-3 text-xl font-black">
                          {booking.service}
                        </h2>

                        <p className="mt-1 font-bold text-slate-500">
                          {booking.business_name}
                        </p>
                      </div>

                      <div className="shrink-0 text-left">
                        <p className="text-2xl font-black">
                          ₪{booking.price}
                        </p>

                        {booking.old_price && (
                          <p className="text-sm text-slate-400 line-through">
                            ₪{booking.old_price}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <CalendarDays
                          size={17}
                          className="text-blue-600"
                        />

                        <p className="mt-2 text-xs text-slate-400">
                          מועד
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {date ?? "מועד התור"}{" "}
                          {time}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <Clock3
                          size={17}
                          className="text-blue-600"
                        />

                        <p className="mt-2 text-xs text-slate-400">
                          משך
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {booking.duration}
                        </p>
                      </div>
                    </div>

                    {(booking.address ||
                      booking.area) && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <span>
                          {booking.address}
                          {booking.address &&
                          booking.area
                            ? ", "
                            : ""}
                          {booking.area}
                        </span>
                      </div>
                    )}
{booking.booking_status === "confirmed" &&
  booking.starts_at &&
  new Date(booking.starts_at) > new Date() && (
    <button
      type="button"
      onClick={() =>
  setBookingToCancel(booking)
}
      disabled={
        cancellingId === booking.booking_id
      }
      className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-red-50 font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
    >
      {cancellingId === booking.booking_id
        ? "מבטל..."
        : "ביטול הזמנה"}
    </button>
  )}
                    <Link
                      href={`/appointment/${booking.appointment_id}`}
                      className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      פרטי התור
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {bookingToCancel && (
  <div className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
    <div
      dir="rtl"
      className="w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <CalendarDays size={26} />
      </div>

      <div className="mt-5 text-center">
        <h2 className="text-2xl font-black">
          לבטל את ההזמנה?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          אתה עומד לבטל את התור ל־
          <span className="font-black text-slate-700">
            {" "}
            {bookingToCancel.service}
          </span>
          .
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          אם מועד התור עדיין בעתיד, הוא יחזור להיות
          זמין ללקוחות אחרים.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setBookingToCancel(null)
          }
          disabled={
            cancellingId ===
            bookingToCancel.booking_id
          }
          className="h-13 rounded-2xl border border-slate-200 bg-white font-black text-slate-700"
        >
          חזרה
        </button>

        <button
          type="button"
          onClick={() =>
            cancelBooking(
              bookingToCancel.booking_id
            )
          }
          disabled={
            cancellingId ===
            bookingToCancel.booking_id
          }
          className="flex h-13 items-center justify-center rounded-2xl bg-red-600 font-black text-white disabled:opacity-60"
        >
          {cancellingId ===
          bookingToCancel.booking_id
            ? "מבטל..."
            : "כן, בטל את התור"}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}