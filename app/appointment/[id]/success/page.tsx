"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  MapPin,
  PartyPopper,
} from "lucide-react";

import { createClient } from "../../../../lib/supabase/client";

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

export default function BookingSuccessPage() {
  const params = useParams<{ id: string }>();

  const appointmentId = Number(params.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_my_bookings"
      );

      if (error) {
        console.error("Success page booking error:", error);
        setLoading(false);
        return;
      }

      const currentBooking = (data ?? []).find(
        (item: Booking) =>
          Number(item.appointment_id) === appointmentId &&
          item.booking_status === "confirmed"
      );

      setBooking(currentBooking ?? null);
      setLoading(false);
    }

    loadBooking();
  }, [appointmentId]);

  function formatDate(startsAt: string | null) {
    if (!startsAt) {
      return null;
    }

    return new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
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

  if (!booking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 text-slate-950"
      >
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-black">
            לא מצאנו את ההזמנה
          </h1>

          <p className="mt-2 text-slate-500">
            אפשר לבדוק את כל ההזמנות שלך בעמוד ההזמנות.
          </p>

          <Link
            href="/bookings"
            className="mt-6 inline-flex h-13 items-center justify-center rounded-2xl bg-blue-600 px-6 font-black text-white"
          >
            ההזמנות שלי
          </Link>
        </div>
      </main>
    );
  }

  const date = formatDate(booking.starts_at);

  const time = formatTime(
    booking.starts_at,
    booking.appointment_time
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-10 text-slate-950"
    >
      <style>{`
        @keyframes successPop {
          0% {
            opacity: 0;
            transform: scale(0.55);
          }

          65% {
            opacity: 1;
            transform: scale(1.12);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes successFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-pop {
          animation: successPop 500ms cubic-bezier(.2,.8,.2,1) both;
        }

        .success-fade {
          animation: successFade 500ms 180ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .success-pop,
          .success-fade {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-md">
        {/* Success */}
        <section className="text-center">
          <div className="success-pop mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
            <Check size={48} strokeWidth={3} />
          </div>

          <div className="success-fade">
            <div className="mt-5 flex items-center justify-center gap-2 text-green-600">
              <PartyPopper size={18} />

              <span className="text-sm font-black">
                התור שלך!
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black">
              ההזמנה בוצעה בהצלחה
            </h1>

            <p className="mt-2 leading-7 text-slate-500">
              שמרנו עבורך את התור. כל הפרטים נמצאים גם
              בעמוד ההזמנות שלך.
            </p>
          </div>
        </section>

        {/* Appointment */}
        <section className="success-fade mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 p-5 text-white">
            <p className="text-sm font-bold text-slate-300">
              {booking.business_name}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {booking.service}
            </h2>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <CalendarDays
                  size={19}
                  className="text-blue-600"
                />

                <p className="mt-2 text-xs text-slate-400">
                  תאריך
                </p>

                <p className="mt-1 font-black">
                  {date ?? "היום"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <Clock3
                  size={19}
                  className="text-blue-600"
                />

                <p className="mt-2 text-xs text-slate-400">
                  שעה
                </p>

                <p className="mt-1 font-black">
                  {time}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {booking.duration}
                </p>
              </div>
            </div>

            {(booking.address || booking.area) && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="text-xs font-bold text-blue-500">
                    כתובת
                  </p>

                  <p className="mt-1 font-black text-slate-800">
                    {booking.address}
                    {booking.address && booking.area
                      ? ", "
                      : ""}
                    {booking.area}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
              <div>
               <p className="text-xs font-bold text-slate-400">
  מחיר התור
</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-3xl font-black">
                    ₪{booking.price}
                  </span>

                  {booking.old_price && (
                    <span className="text-sm text-slate-400 line-through">
                      ₪{booking.old_price}
                    </span>
                  )}
                </div>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                מאושר
              </span>
            </div>
          </div>
        </section>

       {/* Actions */}
<div className="mt-5 grid grid-cols-2 gap-3">
  <Link
    href="/"
    replace
    className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-center font-black text-slate-700 transition hover:bg-slate-50"
  >
    חזרה לבית
  </Link>

  <Link
    href="/bookings"
    replace
    className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-3 text-center font-black text-white transition hover:bg-blue-700"
  >
    ההזמנות שלי
  </Link>
</div>
      </div>
    </main>
  );
}