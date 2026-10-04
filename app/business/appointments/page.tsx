"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Appointment = {
  id: number;
  service: string;
  starts_at: string | null;
  duration_minutes: number | null;
  price: number;
  old_price: number | null;
  is_available: boolean;
  is_published: boolean;
};

type Tab = "active" | "booked" | "history";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDayLabel(value: string) {
  const appointmentDate = startOfDay(new Date(value));
  const today = startOfDay(new Date());

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (appointmentDate.getTime() === today.getTime()) {
    return "היום";
  }

  if (appointmentDate.getTime() === tomorrow.getTime()) {
    return "מחר";
  }

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export default function BusinessAppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id, verification_status")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (businessError || !business) {
        console.error("Business load error:", businessError);
        setErrorMessage("לא הצלחנו לטעון את העסק.");
        setLoading(false);
        return;
      }

      if (business.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, service, starts_at, duration_minutes, price, old_price, is_available, is_published",
        )
        .eq("business_id", business.id)
        .not("starts_at", "is", null)
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("Appointments load error:", error);
        setErrorMessage("לא הצלחנו לטעון את התורים.");
        setLoading(false);
        return;
      }

      setAppointments(data ?? []);
      setLoading(false);
    }

    loadAppointments();
  }, [router]);
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);
  const categorizedAppointments = useMemo(() => {
    const active = appointments.filter(
      (appointment) =>
        appointment.starts_at &&
        new Date(appointment.starts_at).getTime() > now &&
        appointment.is_published &&
        appointment.is_available,
    );

    const booked = appointments.filter(
      (appointment) =>
        appointment.starts_at &&
        new Date(appointment.starts_at).getTime() > now &&
        !appointment.is_available,
    );

    const history = appointments
      .filter(
        (appointment) =>
          !appointment.starts_at ||
          new Date(appointment.starts_at).getTime() <= now ||
          !appointment.is_published,
      )
      .sort((a, b) => {
        const aTime = a.starts_at ? new Date(a.starts_at).getTime() : 0;

        const bTime = b.starts_at ? new Date(b.starts_at).getTime() : 0;

        return bTime - aTime;
      });

    return {
      active,
      booked,
      history,
    };
  }, [appointments, now]);

  const visibleAppointments = categorizedAppointments[activeTab];

  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, Appointment[]>();

    visibleAppointments.forEach((appointment) => {
      if (!appointment.starts_at) {
        return;
      }

      const label = getDayLabel(appointment.starts_at);

      const current = groups.get(label) ?? [];

      groups.set(label, [...current, appointment]);
    });

    return Array.from(groups.entries());
  }, [visibleAppointments]);

  async function unpublishAppointment(appointmentId: number) {
    setRemovingId(appointmentId);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.rpc("unpublish_my_appointment", {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error("Unpublish appointment error:", error);

      setErrorMessage("לא הצלחנו להסיר את התור מהפרסום.");

      setRemovingId(null);
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              is_published: false,
            }
          : appointment,
      ),
    );

    setRemovingId(null);
  }

  const tabs: {
    id: Tab;
    label: string;
    count: number;
  }[] = [
    {
      id: "active",
      label: "פעילים",
      count: categorizedAppointments.active.length,
    },
    {
      id: "booked",
      label: "הוזמנו",
      count: categorizedAppointments.booked.length,
    },
    {
      id: "history",
      label: "היסטוריה",
      count: categorizedAppointments.history.length,
    },
  ];

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-md bg-[#f6f8fc] px-4 pb-8 pt-6 text-slate-950"
    >
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-blue-600">FreeSpot לעסקים</p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              התורים שלי
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              כל מה שקורה ביומן שלך במקום אחד
            </p>
          </div>

          <Link
            href="/business/appointments/new"
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition active:scale-95"
          >
            <Plus size={19} strokeWidth={2.5} />
            תור חדש
          </Link>
        </div>
      </header>

      <section className="mb-5 grid grid-cols-3 gap-2 rounded-[22px] bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-[17px] px-2 text-sm font-black transition ${
                selected
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>

              <span
                className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                  selected
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </section>

      {errorMessage && (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-bold text-slate-400">
            טוען את היומן...
          </p>
        </div>
      ) : visibleAppointments.length === 0 ? (
        <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200/70">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            {activeTab === "booked" ? (
              <CheckCircle2 size={27} />
            ) : (
              <CalendarDays size={27} />
            )}
          </div>

          <h2 className="mt-5 text-lg font-black">
            {activeTab === "active" && "אין כרגע תורים פעילים"}

            {activeTab === "booked" && "אין כרגע תורים שהוזמנו"}

            {activeTab === "history" && "עדיין אין היסטוריה"}
          </h2>

          <p className="mx-auto mt-2 max-w-65 text-sm leading-6 text-slate-500">
            {activeTab === "active"
              ? "כשמתפנה לך מקום ביומן, אפשר להעלות אותו ל-FreeSpot תוך כמה שניות."
              : "כשתהיה כאן פעילות, היא תופיע עבורך באופן מסודר."}
          </p>

          {activeTab === "active" && (
            <Link
              href="/business/appointments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              <CalendarPlus size={18} />
              פרסם תור
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {groupedAppointments.map(([groupLabel, groupAppointments]) => (
            <section key={groupLabel}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-black text-slate-800">
                  {groupLabel}
                </h2>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-2.5">
                {groupAppointments.map((appointment) => {
                  const booked = !appointment.is_available;

                  const unpublished = !appointment.is_published;

                  return (
                    <article
                      key={appointment.id}
                      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80"
                    >
                      <div className="flex items-stretch">
                        <div className="flex w-20.5 shrink-0 flex-col items-center justify-center border-l border-slate-100 bg-slate-50/70 px-2 py-5">
                          <span className="text-xl font-black tracking-tight text-slate-950">
                            {appointment.starts_at &&
                              formatTime(appointment.starts_at)}
                          </span>

                          {appointment.starts_at && (
                            <span className="mt-1 text-[11px] font-bold text-slate-400">
                              {formatShortDate(appointment.starts_at)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2">
                                {activeTab === "active" && (
                                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                                    פנוי ומפורסם
                                  </span>
                                )}

                                {activeTab === "booked" && (
                                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                                    הוזמן
                                  </span>
                                )}

                                {activeTab === "history" && (
                                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                                    {unpublished ? "הוסר מהפרסום" : "הסתיים"}
                                  </span>
                                )}
                              </div>

                              <h3 className="truncate text-base font-black">
                                {appointment.service}
                              </h3>
                            </div>

                            <button
                              type="button"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50"
                              aria-label="אפשרויות"
                            >
                              <MoreHorizontal size={20} />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                              <Clock3 size={14} />

                              <span>
                                {appointment.duration_minutes
                                  ? `${appointment.duration_minutes} דק׳`
                                  : "משך לא הוגדר"}
                              </span>
                            </div>

                            <div className="text-left">
                              <span className="text-lg font-black">
                                ₪{appointment.price}
                              </span>

                              {appointment.old_price &&
                                appointment.old_price > appointment.price && (
                                  <span className="mr-1.5 text-xs text-slate-400 line-through">
                                    ₪{appointment.old_price}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {activeTab === "active" &&
                        !booked &&
                        appointment.is_published && (
                          <div className="border-t border-slate-100 px-4 py-3">
                            <button
                              type="button"
                              disabled={removingId === appointment.id}
                              onClick={() =>
                                unpublishAppointment(appointment.id)
                              }
                              className="w-full rounded-xl py-2 text-xs font-black text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              {removingId === appointment.id
                                ? "מסיר מהפרסום..."
                                : "הסר מהפרסום"}
                            </button>
                          </div>
                        )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
