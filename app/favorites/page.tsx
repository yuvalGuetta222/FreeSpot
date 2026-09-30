"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Heart,
  MapPin,
  Star,
} from "lucide-react";

import { appointments } from "../../data/appointments";
import { createClient } from "../../lib/supabase/client";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
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
        .from("favorites")
        .select("appointment_id");

      if (error) {
        console.error("Error loading favorites:", error);
        setLoading(false);
        return;
      }

      setFavoriteIds(
        data.map((favorite) => Number(favorite.appointment_id))
      );

      setLoading(false);
    }

    loadFavorites();
  }, []);

  const favoriteAppointments = useMemo(() => {
    return appointments.filter((appointment) =>
      favoriteIds.includes(appointment.id)
    );
  }, [favoriteIds]);

  async function removeFavorite(id: number) {
    const supabase = createClient();

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("appointment_id", id);

    if (error) {
      console.error("Error removing favorite:", error);
      return;
    }

    setFavoriteIds((current) =>
      current.filter((favoriteId) => favoriteId !== id)
    );
  }

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
            מועדפים
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {loading ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <p className="font-black">טוען מועדפים...</p>
          </section>
        ) : !isLoggedIn ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <Heart size={38} className="mx-auto text-slate-300" />

            <h2 className="mt-4 text-xl font-black">
              צריך להתחבר כדי לראות מועדפים
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              המועדפים שלך נשמרים בחשבון וזמינים מכל מכשיר.
            </p>

            <Link
              href="/auth"
              className="mt-5 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
            >
              התחבר
            </Link>
          </section>
        ) : favoriteAppointments.length === 0 ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <Heart size={38} className="mx-auto text-slate-300" />

            <h2 className="mt-4 text-xl font-black">
              עדיין אין לך מועדפים
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              תורים שתסמן בלב יופיעו כאן.
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
            {favoriteAppointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-[26px] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-blue-600">
                      {appointment.category}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {appointment.service}
                    </h2>

                    <p className="mt-1 font-bold text-slate-500">
                      {appointment.business}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFavorite(appointment.id)}
                    aria-label="הסר מהמועדפים"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50"
                  >
                    <Heart
                      size={19}
                      className="fill-red-500 text-red-500"
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Star
                    size={15}
                    className="fill-amber-400 text-amber-400"
                  />

                  <span className="text-sm font-black">
                    {appointment.rating}
                  </span>

                  <span className="text-xs text-slate-400">
                    {appointment.reviews} ביקורות
                  </span>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} className="text-blue-600" />

                    <span className="font-bold">
                      היום, {appointment.time} · {appointment.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-blue-600" />

                    <span className="text-sm font-bold text-slate-600">
                      {appointment.address}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-black">
                    ₪{appointment.price}
                  </span>

                  <Link
                    href={`/appointment/${appointment.id}`}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                  >
                    הצג תור
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