"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

type Booking = {
  bookingId: number;
  appointmentId: number;
  service: string;
  business: string;
  category: string;
  time: string;
  duration: string;
  address: string;
  area: string;
  price: number;
  createdAt: string;
};

function subscribeToBookings(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getBookingsSnapshot() {
  return localStorage.getItem("freespot-bookings") ?? "[]";
}

function getServerBookingsSnapshot() {
  return "[]";
}

export default function BookingsPage() {
  const bookingsString = useSyncExternalStore(
    subscribeToBookings,
    getBookingsSnapshot,
    getServerBookingsSnapshot
  );

  const bookings = useMemo<Booking[]>(() => {
    try {
      return JSON.parse(bookingsString);
    } catch {
      return [];
    }
  }, [bookingsString]);

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
        {bookings.length === 0 ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <CalendarDays
              size={36}
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
            {bookings
              .slice()
              .reverse()
              .map((booking) => (
                <article
                  key={booking.bookingId}
                  className="rounded-[26px] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-blue-600">
                        {booking.category}
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        {booking.service}
                      </h2>

                      <p className="mt-1 font-bold text-slate-500">
                        {booking.business}
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
                        היום, {booking.time} · {booking.duration}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin
                        size={18}
                        className="text-blue-600"
                      />

                      <span className="text-sm font-bold text-slate-600">
                        {booking.address}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-bold text-slate-500">
                      מחיר
                    </span>

                    <span className="text-xl font-black">
                      ₪{booking.price}
                    </span>
                  </div>
                </article>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}