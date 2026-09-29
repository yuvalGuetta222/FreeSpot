"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
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
};

const categories = [
  { name: "הכל", icon: Sparkles },
  { name: "תספורת", icon: Scissors },
  { name: "ציפורניים", icon: Sparkles },
  { name: "גבות", icon: Sparkles },
  { name: "קוסמטיקה", icon: Sparkles },
  { name: "מסאז׳", icon: Sparkles },
];

const appointments: Appointment[] = [
  {
    id: 1,
    service: "תספורת גבר",
    category: "תספורת",
    business: "Barber House",
    rating: 4.9,
    reviews: 128,
    time: "17:30",
    duration: "40 דקות",
    distance: "1.2 ק״מ",
    area: "רמת גן",
    price: 80,
    oldPrice: 100,
    urgency: "מתחיל בעוד 48 דק׳",
    cover: "cover-barber",
  },
  {
    id: 2,
    service: "לק ג׳ל",
    category: "ציפורניים",
    business: "Luna Nails",
    rating: 4.8,
    reviews: 94,
    time: "18:15",
    duration: "60 דקות",
    distance: "2.1 ק״מ",
    area: "גבעתיים",
    price: 110,
    urgency: "התפנה עכשיו",
    cover: "cover-nails",
  },
  {
    id: 3,
    service: "עיצוב גבות",
    category: "גבות",
    business: "Maya Beauty",
    rating: 4.7,
    reviews: 76,
    time: "19:00",
    duration: "30 דקות",
    distance: "2.8 ק״מ",
    area: "תל אביב",
    price: 70,
    oldPrice: 90,
    urgency: "מתחיל בעוד שעתיים",
    cover: "cover-beauty",
  },
];
function subscribeToFavorites(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("freespot-favorites-changed", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("freespot-favorites-changed", callback);
  };
}

function getFavoritesSnapshot() {
  return localStorage.getItem("freespot-favorites") ?? "[]";
}

function getServerFavoritesSnapshot() {
  return "[]";
}
export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [search, setSearch] = useState("");
  const favoritesString = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );

  const favorites = useMemo<number[]>(() => {
    try {
      return JSON.parse(favoritesString);
    } catch {
      return [];
    }
  }, [favoritesString]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const categoryMatch =
        selectedCategory === "הכל" || appointment.category === selectedCategory;

      const searchMatch =
        normalizedSearch === "" ||
        appointment.service.toLowerCase().includes(normalizedSearch) ||
        appointment.business.toLowerCase().includes(normalizedSearch) ||
        appointment.area.toLowerCase().includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });
  }, [selectedCategory, search]);

  function toggleFavorite(id: number) {
    const updatedFavorites = favorites.includes(id)
      ? favorites.filter((favoriteId) => favoriteId !== id)
      : [...favorites, id];

    localStorage.setItem(
      "freespot-favorites",
      JSON.stringify(updatedFavorites),
    );

    window.dispatchEvent(new Event("freespot-favorites-changed"));
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
                  התפנה עכשיו לידך
                </h2>
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                תורים זמינים שאפשר לתפוס עכשיו
              </p>
            </div>

            <button className="hidden text-sm font-black text-blue-600 sm:block">
              הצג הכל
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAppointments.map((appointment) => {
              const isFavorite = favorites.includes(appointment.id);

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
                      {appointment.urgency}
                    </div>

                    <button
                      aria-label="הוסף למועדפים"
                      onClick={() => toggleFavorite(appointment.id)}
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
                      <div className="text-4xl font-black tracking-tight">
                        {appointment.time}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-white/90">
                        <Clock3 size={14} />
                        היום · {appointment.duration}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-blue-600">
                          {appointment.category}
                        </p>

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

          {filteredAppointments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <Search size={28} className="mx-auto text-slate-300" />

              <p className="mt-3 font-black">לא מצאנו תור מתאים כרגע</p>

              <p className="mt-1 text-sm text-slate-500">
                נסה לחפש שירות או אזור אחר
              </p>
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
