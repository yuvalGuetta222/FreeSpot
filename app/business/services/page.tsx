"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Clock3,
  LoaderCircle,
  Plus,
  Save,
  Scissors,
  X,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Business = {
  id: string;
  category: string;
  verification_status: "pending" | "verified" | "rejected";
};

type ServiceTemplate = {
  id: string;
  category: string;
  code: string;
  service_group: string;
  name: string;
  suggested_duration_minutes: number | null;
  sort_order: number;
};

type BusinessService = {
  id: string;
  business_id: string;
  service_template_id: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  sort_order: number;
};

type DraftService = {
  templateId: string;
  duration: string;
  price: string;
};

export default function BusinessServicesPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [services, setServices] = useState<BusinessService[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addingTemplateId, setAddingTemplateId] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftService | null>(null);
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
        .select("id, category, verification_status")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (businessError || !businessData) {
        console.error("Business load error:", businessError);
        router.replace("/business/pending");
        return;
      }

      if (businessData.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      setBusiness(businessData);

      const [
        { data: templateData, error: templateError },
        { data: serviceData, error: serviceError },
      ] = await Promise.all([
        supabase
          .from("service_templates")
          .select(
            "id, category, code, service_group, name, suggested_duration_minutes, sort_order",
          )
          .eq("category", businessData.category)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("business_services")
          .select(
            "id, business_id, service_template_id, duration_minutes, price, is_active, sort_order",
          )
          .eq("business_id", businessData.id)
          .order("sort_order", { ascending: true }),
      ]);

      if (templateError) {
        console.error("Template load error:", templateError);
        setMessage("לא הצלחנו לטעון את קטלוג השירותים.");
      }

      if (serviceError) {
        console.error("Services load error:", serviceError);
        setMessage("לא הצלחנו לטעון את השירותים שלך.");
      }

      setTemplates(templateData ?? []);
      setServices(serviceData ?? []);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  const selectedTemplateIds = useMemo(
    () => new Set(services.map((service) => service.service_template_id)),
    [services],
  );

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active),
    [services],
  );

  const groupedTemplates = useMemo(() => {
    const groups = new Map<string, ServiceTemplate[]>();

    templates.forEach((template) => {
      const current = groups.get(template.service_group) ?? [];

      groups.set(template.service_group, [...current, template]);
    });

    return Array.from(groups.entries());
  }, [templates]);

  function getTemplate(templateId: string) {
    return templates.find((template) => template.id === templateId);
  }

  function startAdding(template: ServiceTemplate) {
    setAddingTemplateId(template.id);

    setDraft({
      templateId: template.id,
      duration: String(template.suggested_duration_minutes ?? 30),
      price: "",
    });

    setMessage("");
  }

  function cancelAdding() {
    setAddingTemplateId(null);
    setDraft(null);
  }

  async function addService() {
    if (!business || !draft) {
      return;
    }

    const duration = Number(draft.duration);
    const price = Number(draft.price);

    if (!duration || duration <= 0) {
      setMessage("יש לבחור משך שירות תקין.");
      return;
    }

    if (!price || price <= 0) {
      setMessage("יש להזין מחיר תקין.");
      return;
    }

    setSavingId(draft.templateId);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("business_services")
      .insert({
        business_id: business.id,
        service_template_id: draft.templateId,
        duration_minutes: duration,
        price,
        is_active: true,
      })
      .select(
        "id, business_id, service_template_id, duration_minutes, price, is_active, sort_order",
      )
      .single();

    if (error) {
      console.error("Add service error:", error);

      setMessage("לא הצלחנו להוסיף את השירות. נסה שוב.");
      setSavingId(null);
      return;
    }

    setServices((current) => [...current, data]);

    setAddingTemplateId(null);
    setDraft(null);
    setSavingId(null);
  }

  async function updateService(
    serviceId: string,
    updates: Partial<
      Pick<BusinessService, "duration_minutes" | "price" | "is_active">
    >,
  ) {
    setSavingId(serviceId);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("business_services")
      .update(updates)
      .eq("id", serviceId)
      .select(
        "id, business_id, service_template_id, duration_minutes, price, is_active, sort_order",
      )
      .single();

    if (error) {
      console.error("Update service error:", error);
      setMessage("לא הצלחנו לעדכן את השירות.");
      setSavingId(null);
      return;
    }

    setServices((current) =>
      current.map((service) => (service.id === serviceId ? data : service)),
    );

    setSavingId(null);
  }

  async function removeService(serviceId: string) {
    setSavingId(serviceId);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("business_services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      console.error("Remove service error:", error);
      setMessage("לא הצלחנו להסיר את השירות.");
      setSavingId(null);
      return;
    }

    setServices((current) =>
      current.filter((service) => service.id !== serviceId),
    );

    setSavingId(null);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fc]"
      >
        <LoaderCircle size={30} className="animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-md bg-[#f6f8fc] px-4 pb-8 pt-6 text-slate-950"
    >
      <header className="mb-6">
        <p className="text-sm font-black text-blue-600">FreeSpot לעסקים</p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          השירותים שלי
        </h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          הגדר פעם אחת את השירותים, המחיר והמשך שלהם. אחר כך פרסום תור שהתפנה
          יהיה מהיר בהרבה.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-bold text-slate-300">שירותים פעילים</p>

          <p className="mt-2 text-3xl font-black">{activeServices.length}</p>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
          <p className="text-xs font-bold text-slate-400">אפשרויות בקטלוג</p>

          <p className="mt-2 text-3xl font-black">{templates.length}</p>
        </div>
      </section>

      {message && (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {message}
        </div>
      )}

      {services.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">השירותים שבחרת</h2>

            <span className="text-xs font-bold text-slate-400">
              {services.length} שירותים
            </span>
          </div>

          <div className="space-y-3">
            {services.map((service) => {
              const template = getTemplate(service.service_template_id);

              if (!template) {
                return null;
              }

              return (
                <article
                  key={service.id}
                  className={`rounded-[26px] bg-white p-4 shadow-sm ring-1 transition ${
                    service.is_active
                      ? "ring-slate-200/80"
                      : "opacity-60 ring-slate-200/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black text-blue-600">
                        {template.service_group}
                      </p>

                      <h3 className="mt-1 text-base font-black">
                        {template.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateService(service.id, {
                          is_active: !service.is_active,
                        })
                      }
                      disabled={savingId === service.id}
                      className={`flex h-9 items-center rounded-full px-3 text-xs font-black transition ${
                        service.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {service.is_active ? "פעיל" : "מושהה"}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label>
                      <span className="text-xs font-bold text-slate-500">
                        משך
                      </span>

                      <div className="relative mt-1.5">
                        <select
                          value={service.duration_minutes}
                          onChange={(event) =>
                            updateService(service.id, {
                              duration_minutes: Number(event.target.value),
                            })
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"
                        >
                          {[15, 20, 30, 45, 60, 75, 90, 120, 150, 180].map(
                            (minutes) => (
                              <option key={minutes} value={minutes}>
                                {minutes} דק׳
                              </option>
                            ),
                          )}
                        </select>

                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </label>

                    <label>
                      <span className="text-xs font-bold text-slate-500">
                        מחיר רגיל
                      </span>

                      <div className="relative mt-1.5">
                        <input
                          type="number"
                          min="1"
                          defaultValue={service.price}
                          onBlur={(event) => {
                            const value = Number(event.target.value);

                            if (value > 0 && value !== Number(service.price)) {
                              updateService(service.id, {
                                price: value,
                              });
                            }
                          }}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pl-8 text-sm font-bold outline-none focus:border-blue-500"
                        />

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          ₪
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock3 size={14} />
                      נשמר לפרסום מהיר
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      disabled={savingId === service.id}
                      className="flex items-center gap-1 text-xs font-black text-red-500"
                    >
                      <X size={14} />
                      הסר
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black">הוסף שירותים</h2>

          <p className="mt-1 text-sm text-slate-500">
            מוצגים רק שירותים שמתאימים לסוג העסק שלך.
          </p>
        </div>

        {groupedTemplates.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
            <Scissors size={28} className="mx-auto text-slate-300" />

            <p className="mt-3 font-black">
              עדיין אין קטלוג שירותים לקטגוריה הזאת
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTemplates.map(([groupName, groupTemplates]) => (
              <div key={groupName}>
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-sm font-black text-slate-700">
                    {groupName}
                  </h3>

                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-2">
                  {groupTemplates.map((template) => {
                    const alreadySelected = selectedTemplateIds.has(
                      template.id,
                    );

                    const isAdding = addingTemplateId === template.id;

                    return (
                      <div
                        key={template.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70"
                      >
                        <div className="flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="font-black">{template.name}</p>

                            {template.suggested_duration_minutes && (
                              <p className="mt-1 text-xs font-bold text-slate-400">
                                זמן מומלץ: {template.suggested_duration_minutes}{" "}
                                דק׳
                              </p>
                            )}
                          </div>

                          {alreadySelected ? (
                            <div className="flex h-9 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-700">
                              <Check size={14} />
                              נוסף
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startAdding(template)}
                              className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 text-xs font-black text-blue-700"
                            >
                              <Plus size={14} />
                              הוסף
                            </button>
                          )}
                        </div>

                        {isAdding && draft && (
                          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                            <div className="grid grid-cols-2 gap-3">
                              <label>
                                <span className="text-xs font-bold text-slate-500">
                                  משך
                                </span>

                                <select
                                  value={draft.duration}
                                  onChange={(event) =>
                                    setDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            duration: event.target.value,
                                          }
                                        : current,
                                    )
                                  }
                                  className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
                                >
                                  {[
                                    15, 20, 30, 45, 60, 75, 90, 120, 150, 180,
                                  ].map((minutes) => (
                                    <option key={minutes} value={minutes}>
                                      {minutes} דק׳
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                <span className="text-xs font-bold text-slate-500">
                                  מחיר
                                </span>

                                <div className="relative mt-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    value={draft.price}
                                    onChange={(event) =>
                                      setDraft((current) =>
                                        current
                                          ? {
                                              ...current,
                                              price: event.target.value,
                                            }
                                          : current,
                                      )
                                    }
                                    placeholder="80"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pl-8 text-sm font-bold outline-none focus:border-blue-500"
                                  />

                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                                    ₪
                                  </span>
                                </div>
                              </label>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={addService}
                                disabled={savingId === template.id}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white disabled:bg-blue-400"
                              >
                                {savingId === template.id ? (
                                  <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Save size={17} />
                                )}
                                שמור שירות
                              </button>

                              <button
                                type="button"
                                onClick={cancelAdding}
                                className="h-11 rounded-xl bg-white px-4 text-sm font-black text-slate-500 ring-1 ring-slate-200"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
