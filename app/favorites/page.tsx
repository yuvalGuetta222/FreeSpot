"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Heart,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import CustomerBottomNav from "../../components/customer/CustomerBottomNav";

type FavoriteAppointment = {
  favorite_id: string;
  appointment_id: number;
  favorited_at: string;

  service: string;
  category: string;
  business: string;
  business_id: string | null;

  starts_at: string | null;
  time: string;
  duration: string;

  area: string | null;
  address: string | null;

  price: number;
  old_price: number | null;

  is_available: boolean;
  is_published: boolean;
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    haircut: "מספרה",
    nails: "ציפורניים",
    eyebrows: "גבות וריסים",
    cosmetics: "קוסמטיקה",
  };

  return labels[category] ?? category;
}

function isAppointmentStillAvailable(
  appointment: FavoriteAppointment,
) {
  if (
    !appointment.is_available ||
    !appointment.is_published
  ) {
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

function formatAppointmentDate(
  startsAt: string | null,
) {
  if (!startsAt) {
    return "";
  }

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(startsAt));
}

function formatAppointmentTime(
  appointment: FavoriteAppointment,
) {
  if (!appointment.starts_at) {
    return appointment.time;
  }

  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(appointment.starts_at));
}

export default function FavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] =
    useState<FavoriteAppointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [removingId, setRemovingId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const {
        data: favoriteRows,
        error: favoriteError,
      } = await supabase
        .from("favorites")
        .select(
          "id, appointment_id, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (favoriteError) {
        console.error(
          "Favorite appointments load error:",
          favoriteError,
        );

        setLoading(false);
        return;
      }

      if (
        !favoriteRows ||
        favoriteRows.length === 0
      ) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const appointmentIds = favoriteRows.map(
        (favorite) => favorite.appointment_id,
      );

      const {
        data: appointments,
        error: appointmentsError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          service,
          category,
          business,
          business_id,
          starts_at,
          time,
          duration,
          area,
          address,
          price,
          old_price,
          is_available,
          is_published
        `)
        .in("id", appointmentIds);

      if (appointmentsError) {
        console.error(
          "Favorite appointment details error:",
          appointmentsError,
        );

        setLoading(false);
        return;
      }

      const appointmentMap = new Map(
        (appointments ?? []).map(
          (appointment) => [
            appointment.id,
            appointment,
          ],
        ),
      );

      const mergedFavorites =
        favoriteRows.flatMap((favorite) => {
          const appointment =
            appointmentMap.get(
              favorite.appointment_id,
            );

          if (!appointment) {
            return [];
          }

          return [
            {
              favorite_id: favorite.id,
              appointment_id:
                favorite.appointment_id,
              favorited_at:
                favorite.created_at,
              ...appointment,
            },
          ];
        });

      setFavorites(mergedFavorites);
      setLoading(false);
    }

    loadFavorites();
  }, [router]);

  async function removeFavorite(
    appointmentId: number,
  ) {
    setRemovingId(appointmentId);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRemovingId(null);
      router.replace("/auth");
      return;
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("appointment_id", appointmentId);

    if (error) {
      console.error(
        "Remove appointment favorite error:",
        error,
      );

      setRemovingId(null);
      return;
    }

    setFavorites((current) =>
      current.filter(
        (favorite) =>
          favorite.appointment_id !==
          appointmentId,
      ),
    );

    setRemovingId(null);
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
              onClick={() =>
                router.replace("/")
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              aria-label="חזרה לבית"
            >
              <ArrowRight size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-red-500">
                <Heart
                  size={17}
                  fill="currentColor"
                />

                <p className="text-sm font-black">
                  FreeSpot
                </p>
              </div>

              <h1 className="mt-1 text-3xl font-black">
                התורים המועדפים שלי
              </h1>
            </div>
          </div>

          <p className="mt-3 text-slate-500">
            תורים ששמרת כדי לחזור אליהם
            במהירות.
          </p>
        </header>

        {favorites.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center">
            <Heart
              size={40}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-black">
              עדיין לא שמרת תורים
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              לחץ על הלב בתור שמעניין אותך
              והוא יופיע כאן.
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
            {favorites.map((appointment) => {
              const available =
                isAppointmentStillAvailable(
                  appointment,
                );

              const date =
                formatAppointmentDate(
                  appointment.starts_at,
                );

              const time =
                formatAppointmentTime(
                  appointment,
                );

              return (
                <article
                  key={appointment.favorite_id}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-white"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-blue-600">
                            {getCategoryLabel(
                              appointment.category,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black ${
                              available
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {available
                              ? "זמין"
                              : "לא זמין"}
                          </span>
                        </div>

                        <h2 className="mt-2 text-xl font-black">
                          {appointment.service}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {appointment.business}
                        </p>
                      </div>

                      <button
  type="button"
  onClick={() =>
    removeFavorite(
      appointment.appointment_id,
    )
  }
  disabled={
    removingId ===
    appointment.appointment_id
  }
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
  aria-label="הסר תור מהמועדפים"
>
  {removingId ===
  appointment.appointment_id ? (
    <LoaderCircle
      size={18}
      className="animate-spin"
    />
  ) : (
    <Heart
      size={20}
      fill="currentColor"
    />
  )}
</button>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays
                            size={15}
                            className="text-blue-600"
                          />
                          מועד
                        </div>

                        <p className="mt-1 font-black">
                          {date || "לא צוין"}
                        </p>

                        <p className="mt-0.5 text-sm text-slate-500">
                          {time}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock3
                            size={15}
                            className="text-blue-600"
                          />
                          משך
                        </div>

                        <p className="mt-1 font-black">
                          {appointment.duration}
                        </p>
                      </div>
                    </div>

                    {(appointment.address ||
                      appointment.area) && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <span>
                          {appointment.address}

                          {appointment.address &&
                          appointment.area
                            ? ", "
                            : ""}

                          {appointment.area}
                        </span>
                      </div>
                    )}

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          מחיר
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black">
                            ₪{appointment.price}
                          </span>

                          {appointment.old_price && (
                            <span className="text-sm text-slate-400 line-through">
                              ₪
                              {
                                appointment.old_price
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {available ? (
                        <Link
                          href={`/appointment/${appointment.appointment_id}`}
                          className="flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white"
                        >
                          לפרטי התור
                        </Link>
                      ) : (
                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">
                          התור כבר לא זמין
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
            </div>

      <CustomerBottomNav />
    </main>
  );
}