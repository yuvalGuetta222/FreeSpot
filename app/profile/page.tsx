"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronLeft,
  CircleHelp,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Settings,
  UserRound,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import CustomerBottomNav from "../../components/customer/CustomerBottomNav";

type UserInfo = {
  email: string;
} | null;

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({
          email: user.email ?? "",
        });
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setUser(null);

    router.refresh();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] pb-10 text-slate-950"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          >
            <ArrowRight size={20} />
          </Link>

          <h1 className="absolute left-1/2 -translate-x-1/2 font-black">
            פרופיל
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* User card */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserRound size={29} />
            </div>

            <div className="flex-1">
              {loading ? (
                <>
                  <h2 className="text-xl font-black">טוען...</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    בודק את החשבון שלך
                  </p>
                </>
              ) : user ? (
                <>
                  <p className="text-sm font-bold text-blue-600">
                    מחובר ל-FreeSpot
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    החשבון שלי
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {user.email}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black">
                    האזור האישי שלך
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    התחבר כדי לשמור הזמנות, מועדפים והתראות בכל המכשירים.
                  </p>
                </>
              )}
            </div>
          </div>

          {!loading &&
            (user ? (
              <button
                onClick={handleLogout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 font-black text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut size={18} />
                התנתק
              </button>
            ) : (
              <Link
                href="/auth"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-black text-white transition hover:bg-blue-700"
              >
                <LogIn size={18} />
                התחברות או הרשמה
              </Link>
            ))}
        </section>

        {/* Preferences */}
        <section className="mt-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white">
          <ProfileItem
            icon={<MapPin size={19} />}
            title="המיקום שלי"
            subtitle="רמת גן"
          />

          <ProfileItem
            icon={<Bell size={19} />}
            title="ההתראות שלי"
            subtitle="ניהול חיפושים והתראות"
          />

          <Link href="/favorites">
            <ProfileItem
              icon={<Heart size={19} />}
              title="המועדפים שלי"
              subtitle="התורים והעסקים ששמרת"
            />
          </Link>
        </section>

        {/* Settings */}
        <section className="mt-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white">
          <ProfileItem
            icon={<Settings size={19} />}
            title="הגדרות"
            subtitle="חשבון, פרטיות והעדפות"
          />

          <ProfileItem
            icon={<CircleHelp size={19} />}
            title="עזרה ותמיכה"
            subtitle="שאלות נפוצות ויצירת קשר"
          />
        </section>

        <p className="mt-6 text-center text-xs font-semibold text-slate-400">
          FreeSpot · גרסת פיתוח
        </p>
      </div>
      <CustomerBottomNav />
    </main>
  );
}

function ProfileItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="flex-1">
        <p className="font-black">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <ChevronLeft size={18} className="text-slate-300" />
    </div>
  );
}