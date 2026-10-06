"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  BadgeCheck,
  Bookmark,
  Clock3,
  LoaderCircle,
  MapPin,
  ArrowRight,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  address: string;
  description: string | null;
  instagram_url: string | null;
};

type BusinessService = {
  id: string;
  duration_minutes: number;
  price: number;
  service_template_id: string;
};

type ServiceTemplate = {
  id: string;
  name: string;
  service_group: string;
};

type Appointment = {
  id: number;
  service: string;
  starts_at: string;
  duration_minutes: number | null;
  price: number;
  old_price: number | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    haircut: "מספרה",
    nails: "ציפורניים",
    eyebrows: "גבות וריסים",
    cosmetics: "קוסמטיקה",
    makeup: "איפור",
    massage: "עיסוי",
  };

  return labels[category.trim().toLowerCase()] ?? category;
}

function getDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return date.toISOString().slice(0, 10);
}

function formatDateKeyCard(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return {
    weekday: new Intl.DateTimeFormat("he-IL", {
      timeZone: "UTC",
      weekday: "short",
    }).format(date),

    day: new Intl.DateTimeFormat("he-IL", {
      timeZone: "UTC",
      day: "numeric",
    }).format(date),

    month: new Intl.DateTimeFormat("he-IL", {
      timeZone: "UTC",
      month: "short",
    }).format(date),
  };
}

export default function PublicBusinessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const businessId = params.id;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<
    Array<
      BusinessService & {
        name: string;
        group: string;
      }
    >
  >([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekStartIndex, setWeekStartIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);

  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const supabase = createClient();

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(
          `
            id,
            business_name,
            category,
            city,
            address,
            description,
            instagram_url
            `,
        )
        .eq("id", businessId)
        .eq("verification_status", "verified")
        .maybeSingle();

      if (businessError || !businessData) {
        console.error("Business page load error:", businessError);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      const [
        { data: serviceRows, error: serviceError },
        { data: appointmentRows, error: appointmentError },
        {
          data: { user },
        },
      ] = await Promise.all([
        supabase
          .from("business_services")
          .select("id, duration_minutes, price, service_template_id")
          .eq("business_id", businessId)
          .eq("is_active", true),

        supabase
          .from("appointments")
          .select("id, service, starts_at, duration_minutes, price, old_price")
          .eq("business_id", businessId)
          .eq("is_available", true)
          .eq("is_published", true)
          .not("starts_at", "is", null)
          .gt("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(6),

        supabase.auth.getUser(),
      ]);

      if (serviceError) {
        console.error("Business services load error:", serviceError);
      }

      if (appointmentError) {
        console.error("Business appointments load error:", appointmentError);
      }

      const rows = (serviceRows ?? []) as BusinessService[];

      if (rows.length > 0) {
        const templateIds = rows.map((service) => service.service_template_id);

        const { data: templates } = await supabase
          .from("service_templates")
          .select("id, name, service_group")
          .in("id", templateIds);

        const templateMap = new Map(
          ((templates ?? []) as ServiceTemplate[]).map((template) => [
            template.id,
            template,
          ]),
        );

        setServices(
          rows
            .map((service) => {
              const template = templateMap.get(service.service_template_id);

              if (!template) {
                return null;
              }

              return {
                ...service,
                name: template.name,
                group: template.service_group,
              };
            })
            .filter(
              (
                service,
              ): service is BusinessService & {
                name: string;
                group: string;
              } => service !== null,
            ),
        );
      }

      setAppointments((appointmentRows ?? []) as Appointment[]);

      if (user) {
        const { data: favoriteData } = await supabase
          .from("business_favorites")
          .select("business_id")
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .maybeSingle();

        setFavorite(Boolean(favoriteData));
      }

      setLoading(false);
    }

    loadPage();
  }, [businessId]);

  const groupedServices = useMemo(() => {
    const groups = new Map<string, typeof services>();

    services.forEach((service) => {
      const current = groups.get(service.group) ?? [];

      groups.set(service.group, [...current, service]);
    });

    return Array.from(groups.entries());
  }, [services]);
  const availableDates = useMemo(() => {
    return Array.from(
      new Map(
        appointments.map((appointment) => [
          getDateKey(appointment.starts_at),
          appointment.starts_at,
        ]),
      ).entries(),
    );
  }, [appointments]);
  const calendarDates = useMemo(() => {
    if (availableDates.length === 0) {
      return [];
    }
    const firstDate = availableDates[0][0];
    const lastDate = availableDates[availableDates.length - 1][0];

    const dates: string[] = [];
    let currentDate = firstDate;

    while (currentDate <= lastDate) {
      dates.push(currentDate);
      currentDate = addDaysToDateKey(currentDate, 1);
    }

    return dates;
  }, [availableDates]);
  const visibleCalendarDates = calendarDates.slice(
    weekStartIndex,
    weekStartIndex + 7,
  );

  const canGoToPreviousWeek = weekStartIndex > 0;

  const canGoToNextWeek = weekStartIndex + 7 < calendarDates.length;
  const activeDate =
    selectedDate && availableDates.some(([dateKey]) => dateKey === selectedDate)
      ? selectedDate
      : (availableDates[0]?.[0] ?? null);

  const appointmentsForSelectedDate = useMemo(() => {
    if (!activeDate) {
      return [];
    }

    return appointments.filter(
      (appointment) => getDateKey(appointment.starts_at) === activeDate,
    );
  }, [appointments, activeDate]);

  function changeWeek(direction: "next" | "previous") {
    const nextStartIndex =
      direction === "next"
        ? Math.min(weekStartIndex + 7, Math.max(calendarDates.length - 1, 0))
        : Math.max(weekStartIndex - 7, 0);

    const nextWeekDates = calendarDates.slice(
      nextStartIndex,
      nextStartIndex + 7,
    );

    const firstAvailableDate = nextWeekDates.find((dateKey) =>
      availableDates.some(([availableDateKey]) => availableDateKey === dateKey),
    );

    setWeekStartIndex(nextStartIndex);
    setSelectedDate(firstAvailableDate ?? null);
  }

  async function toggleFavorite() {
    if (!business || favoriteLoading) {
      return;
    }

    const businessId = business.id;

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

    if (favorite) {
      const { error } = await supabase
        .from("business_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", businessId);

      if (!error) {
        setFavorite(false);
      }
    } else {
      const { error } = await supabase.from("business_favorites").insert({
        user_id: user.id,
        business_id: businessId,
      });

      if (!error || error.code === "23505") {
        setFavorite(true);
      }
    }

    setFavoriteLoading(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <LoaderCircle size={30} className="animate-spin text-blue-600" />
      </main>
    );
  }

  if (notFound || !business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6"
      >
        <div className="text-center">
          <h1 className="text-xl font-black">העסק לא נמצא</h1>

          <Link
            href="/"
            className="mt-4 inline-block text-sm font-black text-blue-600"
          >
            חזרה לבית
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-md bg-[#f6f8fc] pb-10 text-slate-950"
    >
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <ArrowRight size={18} />
          חזרה
        </button>
      </div>
      <section className="bg-slate-950 px-5 pb-7 pt-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-black">
                {business.business_name}
              </h1>

              <BadgeCheck size={19} className="shrink-0 text-blue-400" />
            </div>

            <p className="mt-2 text-sm font-bold text-slate-300">
              {getCategoryLabel(business.category)}
            </p>
          </div>

          <button
            type="button"
            disabled={favoriteLoading}
            onClick={toggleFavorite}
            aria-label="שמור עסק"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition active:scale-95"
          >
            <Bookmark
              size={21}
              fill={favorite ? "currentColor" : "none"}
              className={favorite ? "text-white" : "text-slate-300"}
            />
          </button>
        </div>

        {business.description && (
          <p className="mt-5 text-sm leading-7 text-slate-200">
            {business.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold">
            <MapPin size={14} />

            {business.address}
            {business.city ? `, ${business.city}` : ""}
          </div>

          {business.instagram_url && (
            <a
              href={business.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold"
            >
              <AtSign size={14} />
              Instagram
            </a>
          )}
        </div>
      </section>

      <div className="space-y-7 px-4 py-6">
        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black">שירותים</h2>

            <p className="mt-1 text-sm text-slate-500">
              השירותים והמחירים הרגילים של העסק
            </p>
          </div>

          {groupedServices.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
              העסק עדיין לא פרסם שירותים.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedServices.map(([group, groupServices]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-black text-slate-400">
                    {group}
                  </p>

                  <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
                    {groupServices.map((service, index) => (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between gap-4 p-4 ${
                          index > 0 ? "border-t border-slate-100" : ""
                        }`}
                      >
                        <div>
                          <p className="font-black">{service.name}</p>

                          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
                            <Clock3 size={13} />
                            {service.duration_minutes} דק׳
                          </div>
                        </div>

                        <span className="text-base font-black">
                          ₪{service.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black">תורים פנויים</h2>

            <p className="mt-1 text-sm text-slate-500">
              תורים שאפשר להזמין עכשיו
            </p>
          </div>
          {appointments.length === 0 ? (
            <div className="rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200/70">
              <p className="font-black">אין כרגע תורים פנויים</p>

              <p className="mt-2 text-sm text-slate-500">
                אפשר לשמור את העסק ולחזור לבדוק בהמשך.
              </p>
            </div>
          ) : availableDates.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!canGoToPreviousWeek}
                  onClick={() => changeWeek("previous")}
                  className="text-sm font-black text-blue-600 disabled:text-slate-300"
                >
                  שבוע קודם
                </button>

                <span className="text-xs font-bold text-slate-400">7 ימים</span>

                <button
                  type="button"
                  disabled={!canGoToNextWeek}
                  onClick={() => changeWeek("next")}
                  className="text-sm font-black text-blue-600 disabled:text-slate-300"
                >
                  שבוע הבא
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3">
                {visibleCalendarDates.map((dateKey) => {
                  const hasAppointments = availableDates.some(
                    ([availableDateKey]) => availableDateKey === dateKey,
                  );

                  const active = activeDate === dateKey;
                  const dateCard = formatDateKeyCard(dateKey);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={!hasAppointments}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`shrink-0 rounded-2xl px-3 py-3 transition ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : hasAppointments
                            ? "bg-white text-slate-800 ring-1 ring-slate-200"
                            : "cursor-not-allowed bg-slate-100 text-slate-300 ring-1 ring-slate-200"
                      }`}
                    >
                      <div className="flex min-w-13 flex-col items-center">
                        <span
                          className={`text-xs font-bold ${
                            active
                              ? "text-blue-100"
                              : hasAppointments
                                ? "text-slate-400"
                                : "text-slate-300"
                          }`}
                        >
                          {dateCard.weekday}
                        </span>

                        <span className="mt-1 text-xl font-black">
                          {dateCard.day}
                        </span>

                        <span
                          className={`mt-0.5 text-[11px] font-bold ${
                            active
                              ? "text-blue-100"
                              : hasAppointments
                                ? "text-slate-400"
                                : "text-slate-300"
                          }`}
                        >
                          {dateCard.month}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mb-3 mt-2 text-sm font-black text-slate-700">
                בחר שעה
              </p>

              <div className="grid grid-cols-2 gap-3">
                {appointmentsForSelectedDate.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/appointment/${appointment.id}`}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xl font-black text-slate-950">
                        {formatTime(appointment.starts_at)}
                      </span>

                      <div className="text-left">
                        <p className="text-sm font-black text-blue-600">
                          ₪{appointment.price}
                        </p>

                        {appointment.old_price &&
                          appointment.old_price > appointment.price && (
                            <p className="mt-1 text-[11px] font-bold text-slate-400">
                              במקום{" "}
                              <span className="line-through">
                                ₪{appointment.old_price}
                              </span>
                            </p>
                          )}
                      </div>
                    </div>

                    <p className="mt-2 truncate text-sm font-bold text-slate-700">
                      {appointment.service}
                    </p>

                    {appointment.duration_minutes && (
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {appointment.duration_minutes} דק׳
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/appointment/${appointment.id}`}
                  className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition active:scale-[0.99]"
                >
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white">
                      לצפייה והזמנה
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black">{appointment.service}</p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Clock3 size={14} />

                        {formatDate(appointment.starts_at)}

                        {" • "}

                        {formatTime(appointment.starts_at)}
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-lg font-black">₪{appointment.price}</p>

                      {appointment.old_price &&
                        appointment.old_price > appointment.price && (
                          <p className="text-xs font-bold text-slate-400 line-through">
                            ₪{appointment.old_price}
                          </p>
                        )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
