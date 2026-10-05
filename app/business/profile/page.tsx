"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  AtSign,
  LoaderCircle,
  MapPin,
  Phone,
  Save,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  address: string;
  phone: string;
  description: string | null;
  instagram_url: string | null;
  verification_status: "pending" | "verified" | "rejected";
};

function normalizeInstagram(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  const handle = trimmed
    .replace(/^@/, "")
    .replace(/^instagram\.com\//, "")
    .replace(/^www\.instagram\.com\//, "")
    .replace(/\/+$/, "");

  return `https://www.instagram.com/${handle}`;
}

export default function BusinessProfilePage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBusiness() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
          id,
          business_name,
          category,
          city,
          address,
          phone,
          description,
          instagram_url,
          verification_status
          `,
        )
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        console.error("Business profile load error:", error);
        setMessage("לא הצלחנו לטעון את פרופיל העסק.");
        setLoading(false);
        return;
      }

      if (data.verification_status !== "verified") {
        router.replace("/business/pending");
        return;
      }

      setBusiness(data);
      setDescription(data.description ?? "");
      setInstagram(data.instagram_url ?? "");
      setLoading(false);
    }

    loadBusiness();
  }, [router]);

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!business) {
      return;
    }

    setSaving(true);
    setMessage("");
    setSuccess(false);

    const normalizedInstagram =
      normalizeInstagram(instagram);

    const supabase = createClient();

    const { error } = await supabase
      .from("businesses")
      .update({
        description: description.trim()
          ? description.trim()
          : null,
        instagram_url: normalizedInstagram,
      })
      .eq("id", business.id);

    if (error) {
      console.error("Business profile update error:", error);
      setMessage("לא הצלחנו לשמור את השינויים.");
      setSaving(false);
      return;
    }

    setInstagram(normalizedInstagram ?? "");
    setSuccess(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fc]"
      >
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-600"
        />
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-screen max-w-md bg-[#f6f8fc] px-4 pb-8 pt-6 text-slate-950"
    >
      <header className="mb-6">
        <p className="text-sm font-black text-blue-600">
          FreeSpot לעסקים
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          פרופיל העסק
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          המידע הזה יהפוך בהמשך לדף העסק שהלקוחות יראו ב-FreeSpot.
        </p>
      </header>

      <section className="mb-5 rounded-[28px] bg-slate-950 p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Building2 size={26} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-black">
                {business.business_name}
              </h2>

              <BadgeCheck
                size={18}
                className="shrink-0 text-blue-400"
              />
            </div>

            <p className="mt-1 text-sm font-bold text-slate-300">
              {business.category}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
        <h2 className="font-black">
          פרטי העסק
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          כרגע הפרטים המאומתים מוצגים לקריאה בלבד.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin
              size={18}
              className="mt-0.5 text-blue-600"
            />

            <div>
              <p className="text-xs font-bold text-slate-400">
                כתובת
              </p>

              <p className="mt-1 text-sm font-black">
                {business.address}
                {business.city
                  ? `, ${business.city}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone
              size={18}
              className="mt-0.5 text-blue-600"
            />

            <div>
              <p className="text-xs font-bold text-slate-400">
                טלפון
              </p>

              <p className="mt-1 text-sm font-black">
                {business.phone}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
      >
        <h2 className="font-black">
          איך העסק שלך יוצג?
        </h2>

        <div className="mt-5">
          <label className="block text-sm font-black">
            תיאור העסק
          </label>

          <textarea
            rows={5}
            maxLength={500}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="ספר קצת על העסק, הסגנון שלך ומה מיוחד אצלך..."
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-500 focus:bg-white"
          />

          <p className="mt-1 text-left text-[11px] font-bold text-slate-400">
            {description.length}/500
          </p>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-black">
            Instagram
          </label>

          <div className="relative mt-2">
            <input
              type="text"
              value={instagram}
              onChange={(event) =>
                setInstagram(event.target.value)
              }
              placeholder="@your_business"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <AtSign
  size={18}
  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
/>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            השינויים נשמרו בהצלחה.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white transition active:scale-[0.98] disabled:bg-blue-400"
        >
          {saving ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
              שומר...
            </>
          ) : (
            <>
              <Save size={19} />
              שמור שינויים
            </>
          )}
        </button>
      </form>
    </main>
  );
}