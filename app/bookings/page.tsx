"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import { appointments } from "../../data/appointments";
import { createClient } from "../../lib/supabase/client";

type BookingRow = {
  id: string;
  appointment_id: number;
  status: string;
  created_at: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from("bookings")
        .select("id, appointment_id, status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading bookings:", error);
        setLoading(false);
        return;
      }

      setBookings(data ?? []);
      setLoading(false);
    }

    loadBookings();
  }, []);

  const bookingsWithDetails = useMemo(() => {
    return bookings
      .map((booking) => {
        const appointment = appointments.find(
          (item) => item.id === Number(booking.appointment_id)
        );

        if (!appointment) {
          return null;
        }

        return {
          ...booking,
          appointment,
        };
      })
      .filter(
        (
          booking
        ): booking is BookingRow & {
          appointment: (typeof appointments)[number];
        } => booking !== null
      );
  }, [bookings]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] pb-10 text-slate-950"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          >
            <ArrowRight size={20} />
          </Link>

          <h1 className="absolute left-1/2 -translate-x-1/2 font-black">
            ההזמנות שלי
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {loading ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <p className="font-black">טוען הזמנות...</p>
          </section>
        ) : !isLoggedIn ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <CalendarDays
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-black">
              צריך להתחבר כדי לראות הזמנות
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              ההזמנות שלך נשמרות בחשבון וזמינות מכל מכשיר.
            </p>

            <Link
              href="/auth"
              className="mt-5 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
            >
              התחבר
            </Link>
          </section>
        ) : bookingsWithDetails.length === 0 ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <CalendarDays
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-black">
              עדיין אין לך הזמנות
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              כשתזמין תור דרך FreeSpot, הוא יופיע כאן.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
            >
              מצא תור
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {bookingsWithDetails.map((booking) => (
              <article
                key={booking.id}
                className="rounded-[26px] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-blue-600">
                      {booking.appointment.category}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {booking.appointment.service}
                    </h2>

                    <p className="mt-1 font-bold text-slate-500">
                      {booking.appointment.business}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                    מאושר
                  </span>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Clock3
                      size={18}
                      className="text-blue-600"
                    />

                    <span className="font-bold">
                      היום, {booking.appointment.time} ·{" "}
                      {booking.appointment.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin
                      size={18}
                      className="text-blue-600"
                    />

                    <span className="text-sm font-bold text-slate-600">
                      {booking.appointment.address}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-black">
                    ₪{booking.appointment.price}
                  </span>

                  <Link
                    href={`/appointment/${booking.appointment.id}`}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                  >
                    פרטי התור
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}