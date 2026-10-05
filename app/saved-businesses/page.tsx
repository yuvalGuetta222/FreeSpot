"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import CustomerBottomNav from "../../components/customer/CustomerBottomNav";

type SavedBusiness = {
  favorite_id: string;
  business_id: string;
  favorited_at: string;

  business_name: string;
  category: string;
  city: string | null;
  address: string;
  phone: string;
  description: string | null;

  available_appointments: number;
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

export default function SavedBusinessesPage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSavedBusinesses() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_my_favorite_businesses",
      );

      if (error) {
        console.error(
          "Saved businesses load error:",
          error,
        );

        setLoading(false);
        return;
      }

      setBusinesses(data ?? []);
      setLoading(false);
    }

    loadSavedBusinesses();
  }, [router]);

  async function removeSavedBusiness(
    businessId: string,
  ) {
    setRemovingId(businessId);

    const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return;
}
    const { error } = await supabase
  .from("business_favorites")
  .delete()
  .eq("user_id", user.id)
  .eq("business_id", businessId);

    if (error) {
      console.error(
        "Remove saved business error:",
        error,
      );

      setRemovingId(null);
      return;
    }

    setBusinesses((current) =>
      current.filter(
        (business) =>
          business.business_id !== businessId,
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
              onClick={() => router.replace("/")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              aria-label="חזרה לבית"
            >
              <ArrowRight size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-blue-600">
                <Bookmark
                  size={17}
                  fill="currentColor"
                />

                <p className="text-sm font-black">
                  FreeSpot
                </p>
              </div>

              <h1 className="mt-1 text-3xl font-black">
                עסקים שמורים
              </h1>
            </div>
          </div>

          <p className="mt-3 text-slate-500">
            העסקים ששמרת כדי לחזור אליהם במהירות
            ולראות תורים חדשים.
          </p>
        </header>

        {businesses.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center">
            <Bookmark
              size={40}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-black">
              עדיין לא שמרת עסקים
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              לחץ על סימן השמירה ליד עסק שמעניין אותך
              והוא יופיע כאן.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 font-black text-white"
            >
              מצא עסקים ותורים
            </Link>
          </section>
        ) : (
          <div className="mt-7 space-y-4">
            {businesses.map((business) => (
              <article
                key={business.favorite_id}
                className="rounded-[26px] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-blue-600">
                      {getCategoryLabel(
                        business.category,
                      )}
                    </span>

                    <h2 className="mt-1 text-xl font-black">
                      {business.business_name}
                    </h2>

                    {(business.address ||
                      business.city) && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <span>
                          {business.address}

                          {business.address &&
                          business.city
                            ? ", "
                            : ""}

                          {business.city}
                        </span>
                      </div>
                    )}
                  </div>

                 <button
  type="button"
  onClick={() =>
    removeSavedBusiness(
      business.business_id,
    )
  }
  disabled={
    removingId ===
    business.business_id
  }
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
  aria-label="הסר עסק מהשמורים"
>
  {removingId ===
  business.business_id ? (
    <LoaderCircle
      size={18}
      className="animate-spin"
    />
  ) : (
    <Bookmark
      size={20}
      fill="currentColor"
    />
  )}
</button>
                </div>

                {business.description && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {business.description}
                  </p>
                )}

                <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-700">
                    {business.available_appointments >
                    0
                      ? `${business.available_appointments} תורים פנויים כרגע`
                      : "אין תורים פנויים כרגע"}
                  </p>
                </div>

                <Link
                  href={`/b/${business.business_id}`}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 font-black text-white"
                >
                  לעמוד העסק
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </main>
  );
}