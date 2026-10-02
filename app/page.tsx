"use client";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { createClient } from "../lib/supabase/client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { categories as appCategories } from "../data/categories";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  Heart,
  Home,
  MapPin,
  Navigation,
  Search,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";


type Appointment = {
  id: number;
  service: string;
  category: string;
  business: string;
  rating: number;
  reviews: number;
  time: string;
  duration: string;
  distance: string;
  area: string;
  price: number;
  oldPrice?: number;
  urgency: string;
  cover: string;
  businessId: string;
  startsAt: string | null;
};

const categories = [
  {
    name: "הכל",
    icon: Sparkles,
  },
  ...appCategories.map((category) => ({
    name: category.name,
    icon:
      category.id === "haircut"
        ? Scissors
        : Sparkles,
  })),
];
function getAppointmentCover(category: string) {
  const normalized = normalizeCategory(category);

  switch (normalized) {
    case "haircut":
      return "cover-barber";

    case "nails":
      return "cover-nails";

    case "eyebrows":
    case "cosmetics":
    case "massage":
      return "cover-beauty";

    default:
      return "cover-beauty";
  }
}

function formatAppointmentDate(startsAt: string | null) {
  if (!startsAt) {
    return "היום";
  }

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(startsAt));
}

function formatAppointmentTime(
  startsAt: string | null,
  fallbackTime: string
) {
  if (!startsAt) {
    return fallbackTime;
  }

  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}
function normalizeCategory(category: string) {
  const value = category.trim().toLowerCase();

  const categoryMap: Record<string, string> = {
    haircut: "haircut",
    "תספורת": "haircut",
    "תספורות": "haircut",

    nails: "nails",
    "ציפורניים": "nails",

    eyebrows: "eyebrows",
    "גבות": "eyebrows",

    cosmetics: "cosmetics",
    "קוסמטיקה": "cosmetics",

    massage: "massage",
    "מסאז׳": "massage",
    "עיסוי": "massage",
  };

  return categoryMap[value] ?? value;
}
function formatAppointmentUrgency(
  startsAt: string | null,
  fallbackUrgency: string,
  now: number
) {
  if (!startsAt) {
    return fallbackUrgency;
  }

  const diffMs =
    new Date(startsAt).getTime() - now;

  if (diffMs <= 0) {
    return "התור כבר לא זמין";
  }

  const minutes = Math.ceil(
    diffMs / (1000 * 60)
  );

  if (minutes <= 1) {
    return "מתחיל בעוד פחות מדקה";
  }

  if (minutes < 60) {
    return `מתחיל בעוד ${minutes} דק׳`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return hours === 1
        ? "מתחיל בעוד שעה"
        : `מתחיל בעוד ${hours} שעות`;
    }

    return `מתחיל בעוד ${hours} שעות ו-${remainingMinutes} דק׳`;
  }

  const days = Math.ceil(hours / 24);

  return days === 1
    ? "מתחיל מחר"
    : `מתחיל בעוד ${days} ימים`;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const favoriteLocksRef =
  useRef<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const router = useRouter();
const searchParams = useSearchParams();
const selectedBusinessId =
  searchParams.get("business");
const [appointments, setAppointments] =
  useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] =
  useState(true);
  const [now, setNow] = useState(() => Date.now());
const [favorites, setFavorites] = useState<string[]>([]);
const [preferredArea, setPreferredArea] =
  useState<string | null>(null);

const [preferredCategories, setPreferredCategories] =
  useState<string[]>([]);
useEffect(() => {
  const interval = setInterval(() => {
    setNow(Date.now());
  }, 10000);

  return () => clearInterval(interval);
}, []);


// ואז ממשיך מה שכבר יש לך
useEffect(() => {
  async function loadFavorites() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFavorites([]);
      return;
    }

    const { data, error } = await supabase
      .from("business_favorites")
      .select("business_id");

    if (error) {
      console.error(
        "Error loading business favorites:",
        error
      );
      return;
    }

    setFavorites(
      (data ?? []).map(
        (favorite: { business_id: string }) =>
          favorite.business_id
      )
    );
  }

  loadFavorites();
}, []);
useEffect(() => {
  async function loadPreferences() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "preferred_area, preferred_categories"
      )
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(
        "Error loading preferences:",
        error
      );
      return;
    }

    setPreferredArea(
      data.preferred_area ?? null
    );

    setPreferredCategories(
      data.preferred_categories ?? []
    );
  }

  loadPreferences();
}, []);
useEffect(() => {
  async function loadAppointments() {
    setAppointmentsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          service,
          category,
          business,
          business_id,
          rating,
          reviews,
          time,
          duration,
          distance,
          area,
          address,
          price,
          old_price,
          starts_at,
          urgency
          `
        )
       .eq("is_available", true)
       .eq("is_published", true)
       .not("business_id", "is", null)
.not("starts_at", "is", null)
.gt("starts_at", new Date().toISOString())
.order("starts_at", { ascending: true });

      if (error) {
        console.error(
          "Error loading appointments:",
          error
        );
        
        return;
        
      }

      const formattedAppointments: Appointment[] =
        (data ?? []).map((item) => {
          return {
            id: Number(item.id),
            service: item.service,
            category: item.category,
            business: item.business,
            businessId: item.business_id ?? "",
            rating: Number(item.rating ?? 0),
            reviews: Number(item.reviews ?? 0),
            time: item.time,
            duration: item.duration,
            distance: item.distance ?? "",
            area: item.area ?? "",
            price: Number(item.price),
            oldPrice:
              item.old_price !== null
                ? Number(item.old_price)
                : undefined,
            urgency: item.urgency ?? "",
            cover: getAppointmentCover(
              item.category
            ),
            startsAt: item.starts_at ?? null,
          };
        });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error(
        "Unexpected appointments error:",
        error
      );

      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }

  loadAppointments();
}, []);
  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

 return appointments
  .filter((appointment) => {
    if (
      appointment.startsAt &&
      new Date(appointment.startsAt).getTime() <= now
    ) {
      return false;
    }
if (
  selectedBusinessId &&
  appointment.businessId !== selectedBusinessId
) {
  return false;
}
   const categoryMatch =
  selectedCategory === "הכל" ||
  normalizeCategory(appointment.category) ===
    normalizeCategory(selectedCategory);

    const searchMatch =
      normalizedSearch === "" ||
      appointment.service
        .toLowerCase()
        .includes(normalizedSearch) ||
      appointment.business
        .toLowerCase()
        .includes(normalizedSearch) ||
      appointment.area
        .toLowerCase()
        .includes(normalizedSearch);

    return categoryMatch && searchMatch;
  })
 .sort((a, b) => {
  const aAreaMatch =
    preferredArea !== null &&
    a.area.trim().toLowerCase() ===
      preferredArea.trim().toLowerCase();

  const bAreaMatch =
    preferredArea !== null &&
    b.area.trim().toLowerCase() ===
      preferredArea.trim().toLowerCase();

  const aCategoryMatch =
    preferredCategories.some(
      (category) =>
        normalizeCategory(category) ===
        normalizeCategory(a.category)
    );

  const bCategoryMatch =
    preferredCategories.some(
      (category) =>
        normalizeCategory(category) ===
        normalizeCategory(b.category)
    );

  const aPreferenceScore =
    Number(aAreaMatch) * 2 +
    Number(aCategoryMatch) * 2;

  const bPreferenceScore =
    Number(bAreaMatch) * 2 +
    Number(bCategoryMatch) * 2;

  if (aPreferenceScore !== bPreferenceScore) {
    return bPreferenceScore - aPreferenceScore;
  }

  if (!a.startsAt && !b.startsAt) {
    return 0;
  }

  if (!a.startsAt) {
    return 1;
  }

  if (!b.startsAt) {
    return -1;
  }

  return (
    new Date(a.startsAt).getTime() -
    new Date(b.startsAt).getTime()
  );
});
 }, [
  appointments,
  selectedCategory,
  search,
  now,
  preferredArea,
  preferredCategories,
  selectedBusinessId,
]);

const hasPersonalMatches = filteredAppointments.some(
  (appointment) => {
    const areaMatch =
      preferredArea !== null &&
      appointment.area.trim().toLowerCase() ===
        preferredArea.trim().toLowerCase();

    const categoryMatch =
      preferredCategories.some(
        (category) =>
          normalizeCategory(category) ===
          normalizeCategory(appointment.category)
      );

    return areaMatch || categoryMatch;
  }
);

async function toggleFavorite(
  businessId: string
) {
  if (
    !businessId ||
    favoriteLocksRef.current.has(businessId)
  ) {
    return;
  }

  favoriteLocksRef.current.add(businessId);

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const isFavorite =
      favorites.includes(businessId);

    if (isFavorite) {
      const { error } = await supabase
        .from("business_favorites")
        .delete()
        .eq("business_id", businessId);

      if (error) {
        console.error(
          "Remove business favorite error:",
          error
        );
        return;
      }

      setFavorites((current) =>
        current.filter(
          (id) => id !== businessId
        )
      );
    } else {
      const { error } = await supabase
        .from("business_favorites")
        .insert({
          business_id: businessId,
        });

      if (error) {
        if (error.code === "23505") {
          setFavorites((current) =>
            current.includes(businessId)
              ? current
              : [...current, businessId]
          );
          return;
        }

        console.error(
          "Add business favorite error:",
          error
        );
        return;
      }

      setFavorites((current) =>
        current.includes(businessId)
          ? current
          : [...current, businessId]
      );
    }
  } finally {
    favoriteLocksRef.current.delete(
      businessId
    );
  }
}

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f8fb] pb-32 text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm">
                F
              </div>

              <span className="text-xl font-black tracking-tight text-blue-600">
                FreeSpot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 sm:flex">
              <MapPin size={17} className="text-blue-600" />
              רמת גן
              <ChevronDown size={15} />
            </button>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50">
              <Bell size={19} />
              <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile location */}
        <div className="mt-4 sm:hidden">
          <button className="flex items-center gap-1 text-sm font-bold text-slate-600">
            <MapPin size={16} className="text-blue-600" />
            רמת גן
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Hero */}
        <section className="pt-5 sm:pt-12">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              תורים שמתפנים עכשיו
            </div>

            <h1 className="text-3xl font-black leading-[1.15] tracking-tight sm:text-5xl">
              מצא את התור
              <span className="text-blue-600"> שמתאים לך עכשיו.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              תורים שהתפנו ברגע האחרון אצל עסקים קרובים אליך, בלי לחכות ימים.
            </p>
          </div>

          {/* Search */}
          <div className="mt-7 flex max-w-3xl gap-2">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="תספורת, לק ג׳ל, מסאז׳..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              aria-label="פילטרים"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-7">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.name;

              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick filters */}
        <section className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["בשעה הקרובה", "היום", "מחר", "עד 100 ₪", "עד 3 ק״מ"].map(
            (filter) => (
              <button
                key={filter}
                className="min-w-fit rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
              >
                {filter}
              </button>
            ),
          )}
        </section>

        {/* Results */}
        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-base">
                  ⚡
                </span>

               <h2 className="text-xl font-black sm:text-2xl">
  {hasPersonalMatches
    ? "תורים שמתאימים לך"
    : "תורים פנויים עכשיו"}
</h2>
              </div>

            <p className="mt-1.5 text-sm text-slate-500">
  {hasPersonalMatches
    ? "סידרנו קודם תורים לפי האזור והקטגוריות שבחרת."
    : "התורים הזמינים הקרובים ביותר כרגע."}
</p>
            </div>

            <button className="hidden text-sm font-black text-blue-600 sm:block">
              הצג הכל
            </button>
          </div>
{appointmentsLoading ? (
  <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center">
    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

    <p className="mt-4 text-sm font-bold text-slate-500">
      מחפש תורים פנויים...
    </p>
  </div>
) : filteredAppointments.length === 0 ? (
  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <CalendarDays size={38} className="mx-auto text-slate-300" />

    <h3 className="mt-4 text-xl font-black">אין כרגע תורים זמינים</h3>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      כרגע לא מצאנו תורים שמתאימים לחיפוש שלך.
      תורים חדשים מתפרסמים לאורך היום, אז שווה לבדוק שוב בהמשך.
    </p>

    {(selectedCategory !== "הכל" || search.trim() !== "") && (
      <button
        type="button"
        onClick={() => {
          setSelectedCategory("הכל");
          setSearch("");
        }}
        className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
      >
        הצג את כל התורים
      </button>
    )}
  </div>
) : (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAppointments.map((appointment) => {
              const isFavorite = favorites.includes(
  appointment.businessId
);
const matchesPreferredArea =
  preferredArea !== null &&
  appointment.area.trim().toLowerCase() ===
    preferredArea.trim().toLowerCase();

const matchesPreferredCategory =
  preferredCategories.some(
    (category) =>
      normalizeCategory(category) ===
      normalizeCategory(appointment.category)
  );
              return (
                <article
                  key={appointment.id}
                  className="appointment-card overflow-hidden rounded-[26px] border border-slate-200 bg-white"
                >
                  {/* Visual header */}
                  <div
                    className={`relative flex h-36 items-end p-4 ${appointment.cover}`}
                  >
                    <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent" />

                    <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm backdrop-blur">
                      {formatAppointmentUrgency(
                        appointment.startsAt,
                        appointment.urgency,
                        now
                      )}
                    </div>

                    <button
                      aria-label={
  isFavorite
    ? "הסר את העסק מהמועדפים"
    : "שמור את העסק במועדפים"
}
                      onClick={() =>
  toggleFavorite(appointment.businessId)
}
                      className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
                    >
                      <Heart
                        size={18}
                        className={
                          isFavorite
                            ? "fill-red-500 text-red-500"
                            : "text-slate-700"
                        }
                      />
                    </button>

                    <div className="relative z-10 text-white">
                      <div className="mb-1 text-sm font-bold text-white/80">
                        {formatAppointmentDate(appointment.startsAt)}
                      </div>

                      <div className="text-4xl font-black tracking-tight">
                        {formatAppointmentTime(
                          appointment.startsAt,
                          appointment.time
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-white/90">
                        <Clock3 size={14} />
                        {appointment.duration}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-blue-600">
                          {appointment.category}
                        </p>
                        {(matchesPreferredArea ||
  matchesPreferredCategory) && (
  <div className="mt-2 flex flex-wrap gap-2">
    {matchesPreferredArea && (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
        באזור שלך
      </span>
    )}

    {matchesPreferredCategory && (
      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
        מעניין אותך
      </span>
    )}
  </div>
)}
                        <h3 className="mt-1 text-xl font-black">
                          {appointment.service}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {appointment.business}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-slate-800">
                        <Star
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />
                        {appointment.rating}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Navigation size={17} className="text-blue-600" />

                        <div>
                          <p className="text-sm font-black">
                            {appointment.distance}
                          </p>
                          <p className="text-xs text-slate-500">
                            {appointment.area}
                          </p>
                        </div>
                      </div>

                      <div className="text-left text-xs text-slate-400">
                        {appointment.reviews} ביקורות
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">
                          מחיר לתור
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black">
                            ₪{appointment.price}
                          </span>

                          {appointment.oldPrice && (
                            <span className="text-sm font-semibold text-slate-400 line-through">
                              ₪{appointment.oldPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/appointment/${appointment.id}`}
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                      >
                        הזמן עכשיו
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </section>

        {/* Alert CTA */}
        <section className="relative mt-10 overflow-hidden rounded-[30px] bg-[#0d3b82] p-6 text-white sm:p-9">
          <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative max-w-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Bell size={20} />
            </div>

            <h2 className="mt-5 text-2xl font-black sm:text-3xl">
              לא מצאת משהו שמתאים?
            </h2>

            <p className="mt-2 max-w-lg leading-7 text-blue-100">
              שמור חיפוש ו-FreeSpot תעדכן אותך כשמתפנה תור שמתאים למחיר, למיקום
              ולזמן שבחרת.
            </p>

            <button className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50">
              צור התראה
            </button>
          </div>
        </section>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(9px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <Home size={21} />
            <span className="text-[11px] font-black">בית</span>
          </button>

          <Link
            href="/bookings"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <CalendarDays size={21} />
            <span className="text-[11px] font-bold">הזמנות</span>
          </Link>

          <Link
            href="/favorites"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <Heart size={21} />
            <span className="text-[11px] font-bold">מועדפים</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <UserRound size={21} />
            <span className="text-[11px] font-bold">פרופיל</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
