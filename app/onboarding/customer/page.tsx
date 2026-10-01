"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, MapPin, Sparkles } from "lucide-react";

import { createClient } from "../../../lib/supabase/client";
import { categories } from "../../../data/categories";
import { cities } from "../../../data/cities";
export default function CustomerOnboardingPage() {
  const router = useRouter();

  const [preferredArea, setPreferredArea] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.role === "business") {
        router.replace("/");
        return;
      }

      if (profile?.onboarding_completed) {
        router.replace("/");
        return;
      }

      setCheckingUser(false);
    }

    checkUser();
  }, [router]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      return [...current, categoryId];
    });
  }

  async function completeOnboarding() {
    setMessage("");

    if (!preferredArea.trim()) {
      setMessage("בחר אזור שבו תרצה לחפש תורים.");
      return;
    }

    if (selectedCategories.length === 0) {
      setMessage("בחר לפחות תחום אחד שמעניין אותך.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        preferred_area: preferredArea.trim(),
        preferred_categories: selectedCategories,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Onboarding error:", error);

      setMessage("לא הצלחנו לשמור את ההעדפות. נסה שוב.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (checkingUser) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f5f7fb]"
      >
        <LoaderCircle size={28} className="animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950"
    >
      <div className="mx-auto w-full max-w-md">
        {/* Brand */}
        <div className="text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin size={32} strokeWidth={2.5} />

            <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-white" />
          </div>

          <h1 className="mt-3 text-3xl font-black">
            Free<span className="text-blue-600">Spot</span>
          </h1>
        </div>

        {/* Heading */}
        <section className="mt-8">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles size={18} />

            <span className="text-sm font-black">כמעט סיימנו</span>
          </div>

          <h2 className="mt-2 text-3xl font-black">
            בוא נתאים את FreeSpot אליך
          </h2>

          <p className="mt-2 leading-7 text-slate-500">
            ספר לנו איפה ומה מעניין אותך, כדי שנוכל להציג לך תורים רלוונטיים
            יותר.
          </p>
        </section>

        {/* Area */}
        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">איפה לחפש עבורך?</h3>

          <p className="mt-1 text-sm text-slate-500">
            כרגע מספיק לבחור עיר או אזור מועדף.
          </p>

          <div className="relative mt-4">
            <select
              id="preferredArea"
              value={preferredArea}
              onChange={(event) => setPreferredArea(event.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            >
              <option value="">בחר עיר</option>

              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <MapPin
              size={19}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-600"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">מה מעניין אותך?</h3>

          <p className="mt-1 text-sm text-slate-500">
            אפשר לבחור יותר מתחום אחד.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const selected = selectedCategories.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`relative min-h-16 rounded-2xl border p-4 text-right font-black transition active:scale-[0.98] ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {selected && (
                    <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}

                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={completeOnboarding}
          disabled={loading}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-blue-400"
        >
          {loading ? (
            <>
              <LoaderCircle size={20} className="animate-spin" />
              שומר...
            </>
          ) : (
            "סיימתי, בוא נמצא תור"
          )}
        </button>
      </div>
    </main>
  );
}
