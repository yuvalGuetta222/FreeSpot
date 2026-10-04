"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  Scissors,
  Tag,
} from "lucide-react";

import { createClient } from "../../../../lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  address: string;
  verification_status: "pending" | "verified" | "rejected";
};

type BusinessServiceRow = {
  id: string;
  service_template_id: string;
  duration_minutes: number;
  price: number;
};

type ServiceTemplate = {
  id: string;
  name: string;
  service_group: string;
};

type BusinessService = {
  id: string;
  templateId: string;
  name: string;
  group: string;
  durationMinutes: number;
  price: number;
};

export default function NewAppointmentPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [freespotPrice, setFreespotPrice] = useState("");
  const [description, setDescription] = useState("");

  const [checkingBusiness, setCheckingBusiness] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
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
          verification_status
          `,
        )
        .eq("owner_id", user.id)
        .single();

      if (businessError || !businessData) {
        console.error("Business loading error:", businessError);
        router.replace("/business/pending");
        return;
      }

      if (businessData.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      setBusiness(businessData);

      const { data: serviceRows, error: servicesError } = await supabase
        .from("business_services")
        .select("id, service_template_id, duration_minutes, price")
        .eq("business_id", businessData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (servicesError) {
        console.error("Business services error:", servicesError);
        setMessage("לא הצלחנו לטעון את השירותים שלך.");
        setCheckingBusiness(false);
        return;
      }

      const typedServiceRows = (serviceRows ?? []) as BusinessServiceRow[];

      if (typedServiceRows.length === 0) {
        setServices([]);
        setCheckingBusiness(false);
        return;
      }

      const templateIds = typedServiceRows.map(
        (service) => service.service_template_id,
      );

      const { data: templatesData, error: templatesError } = await supabase
        .from("service_templates")
        .select("id, name, service_group")
        .in("id", templateIds);

      if (templatesError) {
        console.error("Service templates error:", templatesError);
        setMessage("לא הצלחנו לטעון את פרטי השירותים.");
        setCheckingBusiness(false);
        return;
      }

      const typedTemplates = (templatesData ?? []) as ServiceTemplate[];

      const templateMap = new Map(
        typedTemplates.map((template) => [template.id, template]),
      );

      const mappedServices: BusinessService[] = typedServiceRows
        .map((service) => {
          const template = templateMap.get(service.service_template_id);

          if (!template) {
            return null;
          }

          return {
            id: service.id,
            templateId: service.service_template_id,
            name: template.name,
            group: template.service_group,
            durationMinutes: service.duration_minutes,
            price: Number(service.price),
          };
        })
        .filter((service): service is BusinessService => service !== null);

      setServices(mappedServices);

      if (mappedServices.length === 1) {
        setSelectedServiceId(mappedServices[0].id);
      }

      setCheckingBusiness(false);
    }

    loadPage();
  }, [router]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!business || !selectedServiceId || !date || !time) {
      setMessage("יש לבחור שירות, תאריך ושעה.");
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);

    if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      setMessage("יש לבחור מועד עתידי לתור.");
      return;
    }

    if (freespotPrice) {
      const discountPrice = Number(freespotPrice);

      if (
        !selectedService ||
        discountPrice <= 0 ||
        discountPrice >= selectedService.price
      ) {
        setMessage("מחיר FreeSpot צריך להיות נמוך מהמחיר הרגיל.");
        return;
      }
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("create_my_appointment_from_service", {
      p_business_service_id: selectedServiceId,
      p_starts_at: startsAt.toISOString(),
      p_freespot_price: freespotPrice ? Number(freespotPrice) : null,
      p_description: description.trim() ? description.trim() : null,
    });

    if (error) {
      console.error("Create appointment error:", error);

      const errorMessage = error.message ?? "";

      if (errorMessage.includes("BUSINESS_SERVICE_NOT_AVAILABLE")) {
        setMessage("השירות הזה אינו זמין יותר. בדוק את השירותים שלך.");
      } else if (errorMessage.includes("INVALID_APPOINTMENT_TIME")) {
        setMessage("מועד התור חייב להיות בעתיד.");
      } else if (errorMessage.includes("FREESPOT_PRICE_MUST_BE_LOWER")) {
        setMessage("מחיר FreeSpot חייב להיות נמוך מהמחיר הרגיל.");
      } else if (errorMessage.includes("INVALID_PRICE")) {
        setMessage("המחיר שהוזן אינו תקין.");
      } else {
        setMessage("לא הצלחנו לפרסם את התור. נסה שוב.");
      }

      setLoading(false);
      return;
    }

    router.replace("/business/appointments");
    router.refresh();
  }

  if (checkingBusiness || !business) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle size={30} className="animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950"
    >
      <div className="mx-auto w-full max-w-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
          aria-label="חזרה"
        >
          <ArrowRight size={20} />
        </button>

        <section className="mt-6">
          <p className="text-sm font-black text-blue-600">FreeSpot לעסקים</p>

          <h1 className="mt-1 text-3xl font-black">פרסם תור שהתפנה</h1>

          <p className="mt-2 leading-7 text-slate-500">
            בחר שירות שכבר הגדרת, הוסף מועד והתור מוכן לפרסום.
          </p>
        </section>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Building2 size={20} />
          </div>

          <div>
            <p className="font-black">{business.business_name}</p>

            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} />

              {business.address}
              {business.city ? `, ${business.city}` : ""}
            </div>
          </div>
        </div>

        {services.length === 0 ? (
          <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Scissors size={27} />
            </div>

            <h2 className="mt-4 text-lg font-black">קודם מגדירים שירותים</h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              כדי לפרסם תור במהירות, צריך להגדיר לפחות שירות אחד עם מחיר ומשך.
            </p>

            <Link
              href="/business/services"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white"
            >
              עבור לשירותים שלי
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <label className="block text-sm font-black">
              איזה שירות התפנה?
            </label>

            <select
              value={selectedServiceId}
              onChange={(event) => {
                setSelectedServiceId(event.target.value);
                setFreespotPrice("");
              }}
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="">בחר שירות</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            {selectedService && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock3 size={15} />
                    משך השירות
                  </div>

                  <p className="mt-2 text-lg font-black">
                    {selectedService.durationMinutes} דק׳
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Tag size={15} />
                    מחיר רגיל
                  </div>

                  <p className="mt-2 text-lg font-black">
                    ₪{selectedService.price}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-black">תאריך</label>

                <div className="relative mt-2">
                  <input
                    type="date"
                    min={getToday()}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-500"
                  />

                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black">שעה</label>

                <div className="relative mt-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-500"
                  />

                  <Clock3
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {selectedService && (
              <div className="mt-5">
                <label className="block text-sm font-black">
                  מחיר FreeSpot
                  <span className="mr-1 font-normal text-slate-400">
                    אופציונלי
                  </span>
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  רוצה למלא את התור מהר יותר? אפשר להציע מחיר מיוחד שנמוך מהמחיר
                  הרגיל.
                </p>

                <div className="relative mt-2">
                  <input
                    type="number"
                    min="1"
                    max={Math.max(selectedService.price - 1, 1)}
                    value={freespotPrice}
                    onChange={(event) => setFreespotPrice(event.target.value)}
                    placeholder={`פחות מ-₪${selectedService.price}`}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-10 outline-none transition focus:border-blue-500 focus:bg-white"
                  />

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₪
                  </span>
                </div>

                {freespotPrice &&
                  Number(freespotPrice) > 0 &&
                  Number(freespotPrice) < selectedService.price && (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      <CheckCircle2 size={17} />
                      הלקוח יראה ₪{freespotPrice} במקום ₪{selectedService.price}
                    </div>
                  )}
              </div>
            )}

            <div className="mt-5">
              <label className="block text-sm font-black">
                הערה ללקוחות
                <span className="mr-1 font-normal text-slate-400">
                  אופציונלי
                </span>
              </label>

              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="לדוגמה: התור התפנה בעקבות ביטול של הרגע האחרון."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            {message && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedServiceId}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  מפרסם תור...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  פרסם את התור
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
