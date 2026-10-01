"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock3,
  LoaderCircle,
  LogOut,
  MapPin,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import { categories } from "../../data/categories";

type Business = {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  address: string;
  phone: string;
  verification_status: "pending" | "verified" | "rejected";
};

type Appointment = {
  id: number;
  service: string;
  price: number;
  time: string;
  duration: string;
  starts_at: string | null;
  is_available: boolean;
};
type BusinessBooking = {
  booking_id: string;
  appointment_id: number;
  booking_status: string;
  booked_at: string;

  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_phone: string | null;

  service: string;
  starts_at: string | null;
  price: number;
  business_id: string;
};

export default function BusinessDashboardPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>(
    [],
  );
  const [recentBookings, setRecentBookings] = useState<BusinessBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, first_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Business profile error:", profileError);

        router.replace("/");
        return;
      }

      if (profile.role !== "business") {
        router.replace("/");
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(
          `
            id,
            business_name,
            category,
            city,
            address,
            phone,
            verification_status
            `,
        )
        .eq("owner_id", user.id)
        .single();

      if (businessError || !businessData) {
        console.error("Business dashboard error:", businessError);

        router.replace("/business/pending");
        return;
      }

      if (businessData.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
            id,
            service,
            price,
            time,
            duration,
            starts_at,
            is_available
            `,
          )
          .eq("business_id", businessData.id)
          .eq("is_available", true)
          .gt("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

      if (appointmentsError) {
        console.error("Business appointments error:", appointmentsError);
      }

      const { data: bookingsData, error: bookingsError } = await supabase.rpc(
        "get_my_business_bookings",
      );

      if (bookingsError) {
        console.error("Business bookings error:", bookingsError);
      }

      setOwnerName(profile.first_name ?? "");
      setBusiness(businessData);
      setActiveAppointments(appointmentsData ?? []);
      setRecentBookings((bookingsData ?? []).slice(0, 5));
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/auth");
    router.refresh();
  }

  function formatAppointmentDate(startsAt: string | null) {
    if (!startsAt) {
      return "";
    }

    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
    }).format(new Date(startsAt));
  }

  if (loading || !business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle size={30} className="animate-spin text-blue-600" />
      </main>
    );
  }

  const categoryName =
    categories.find((category) => category.id === business.category)?.name ??
    business.category;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f7fb] pb-28 text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-black text-blue-600">FreeSpot לעסקים</p>

            <h1 className="text-xl font-black">{business.business_name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
              aria-label="הגדרות העסק"
            >
              <Settings size={19} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
              aria-label="התנתק"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4">
        {/* Welcome */}
        <section className="mt-6">
          <p className="text-sm font-bold text-slate-500">
            {ownerName ? `שלום ${ownerName} 👋` : "שלום 👋"}
          </p>

          <h2 className="mt-1 text-3xl font-black">מה קורה היום בעסק?</h2>

          <p className="mt-2 text-slate-500">
            כאן מנהלים את התורים שהתפנו ואת ההזמנות שמגיעות דרך FreeSpot.
          </p>
        </section>

        {/* Main CTA */}
        <button
          type="button"
          onClick={() => router.push("/business/appointments/new")}
          className="mt-6 flex w-full items-center justify-between rounded-[28px] bg-blue-600 p-5 text-right text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Plus size={28} />
            </div>

            <div>
              <p className="text-xl font-black">פרסם תור שהתפנה</p>

              <p className="mt-1 text-sm text-blue-100">
                הוסף תור פנוי והצג אותו ללקוחות באזור.
              </p>
            </div>
          </div>

          <ChevronLeft size={23} />
        </button>

        {/* Quick stats */}
        <section className="mt-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold text-slate-400">תורים פעילים</p>

            <div className="mt-2 flex items-center gap-3">
              <CalendarDays size={24} className="text-blue-600" />

              <span className="text-3xl font-black">
                {activeAppointments.length}
              </span>
            </div>
          </div>
        </section>

        {/* Business details */}
        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Building2 size={22} />
            </div>

            <div>
              <h3 className="font-black">{business.business_name}</h3>

              <p className="text-sm text-slate-500">עסק מאומת ב־FreeSpot</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">תחום</p>

              <p className="mt-1 font-black">{categoryName}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">מיקום</p>

              <p className="mt-1 font-black">
                {business.city
                  ? `${business.address}, ${business.city}`
                  : business.address}
              </p>
            </div>
          </div>
        </section>

        {/* Active appointments */}
        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">תורים פעילים</h3>

              <p className="mt-1 text-sm text-slate-500">
                תורים שפרסמת ועדיין זמינים להזמנה.
              </p>
            </div>

            <CalendarDays size={23} className="text-blue-600" />
          </div>

          {activeAppointments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <Clock3 size={30} className="mx-auto text-slate-300" />

              <p className="mt-3 font-black">עדיין אין תורים פעילים</p>

              <p className="mt-1 text-sm text-slate-500">
                ברגע שתפרסם תור שהתפנה, הוא יופיע כאן.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {activeAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-black">{appointment.service}</h4>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={15} />

                          {formatAppointmentDate(appointment.starts_at)}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock3 size={15} />

                          {appointment.time}
                        </span>

                        <span>{appointment.duration}</span>
                      </div>
                    </div>

                    <div className="font-black">₪{appointment.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent bookings */}
        {/* Recent bookings */}
        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">הזמנות אחרונות</h3>

              <p className="mt-1 text-sm text-slate-500">
                לקוחות שהזמינו תורים דרך העסק.
              </p>
            </div>

            <UserRound size={23} className="text-blue-600" />
          </div>

          {recentBookings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <UserRound size={30} className="mx-auto text-slate-300" />

              <p className="mt-3 font-black">עוד אין הזמנות</p>

              <p className="mt-1 text-sm text-slate-500">
                כשהלקוח הראשון יזמין תור, הוא יופיע כאן.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentBookings.map((booking) => {
                const customerName =
                  [booking.customer_first_name, booking.customer_last_name]
                    .filter(Boolean)
                    .join(" ") || "לקוח FreeSpot";

                return (
                  <div
                    key={booking.booking_id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-black">{customerName}</p>

                        <p className="mt-1 text-sm font-bold text-slate-600">
                          {booking.service}
                        </p>

                        {booking.starts_at && (
                          <p className="mt-2 text-sm text-slate-500">
                            {new Intl.DateTimeFormat("he-IL", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(booking.starts_at))}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-left">
                        <div className="font-black">₪{booking.price}</div>

                        <span
                          className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-black ${
                            booking.booking_status === "confirmed"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {booking.booking_status === "confirmed"
                            ? "מאושר"
                            : booking.booking_status}
                        </span>
                      </div>
                    </div>

                    {booking.customer_phone && (
                      <a
                        href={`tel:${booking.customer_phone}`}
                        dir="ltr"
                        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-blue-50 font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        {booking.customer_phone}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Customer mode */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white font-black text-slate-700 transition hover:bg-slate-50"
        >
          <MapPin size={18} className="text-blue-600" />
          מעבר לצד הלקוח
        </button>
      </div>
    </main>
  );
}
