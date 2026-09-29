import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
} from "lucide-react";
import { appointments } from "../../../data/appointments";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AppointmentPage({ params }: PageProps) {
  const { id } = await params;

  const appointment = appointments.find(
    (item) => item.id === Number(id)
  );

  if (!appointment) {
    notFound();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] pb-32 text-slate-950"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          >
            <ArrowRight size={20} />
          </Link>

          <span className="font-black">פרטי התור</span>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Heart size={19} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <section className="relative mt-4 overflow-hidden rounded-[28px] bg-linear-to-br from-blue-950 via-blue-800 to-blue-500 p-6 text-white sm:p-8">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
              {appointment.urgency}
            </div>

            <p className="mt-8 text-sm font-bold text-blue-100">היום</p>

            <div className="mt-1 text-6xl font-black tracking-tight sm:text-7xl">
              {appointment.time}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-100">
              <Clock3 size={17} />
              {appointment.duration}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5">
          <p className="text-xs font-black text-blue-600">
            {appointment.category}
          </p>

          <h1 className="mt-1 text-2xl font-black">
            {appointment.service}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold text-slate-600">
              {appointment.business}
            </span>

            <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black">
              <Star
                size={14}
                className="fill-amber-400 text-amber-400"
              />
              {appointment.rating}
            </span>

            <span className="text-xs text-slate-400">
              {appointment.reviews} ביקורות
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <CalendarDays size={19} className="text-blue-600" />
              <p className="mt-2 text-xs text-slate-500">מועד</p>
              <p className="font-black">
                היום, {appointment.time}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3 size={19} className="text-blue-600" />
              <p className="mt-2 text-xs text-slate-500">משך</p>
              <p className="font-black">
                {appointment.duration}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MapPin size={20} />
            </div>

            <div className="flex-1">
              <h2 className="font-black">מיקום</h2>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {appointment.address}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {appointment.distance} מהמיקום שלך
              </p>
            </div>
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-black transition hover:bg-slate-50">
            <Navigation size={17} className="text-blue-600" />
            פתח ניווט
          </button>
        </section>

        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black">על העסק</h2>

          <p className="mt-2 leading-7 text-slate-600">
            {appointment.description}
          </p>

          <button className="mt-4 text-sm font-black text-blue-600">
            הצג את העסק
          </button>
        </section>

        <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-black">
                מדיניות הזמנה וביטול
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                בשלב זה לא מתבצע חיוב אמיתי. בהמשך נציג כאן את תנאי הפיקדון,
                הביטול ואי-הגעה לפני אישור ההזמנה.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              מחיר לתור
            </p>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black">
                ₪{appointment.price}
              </span>

              {appointment.oldPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ₪{appointment.oldPrice}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/appointment/${appointment.id}/confirm`}
            className="flex-1 rounded-2xl bg-blue-600 px-6 py-4 text-center text-base font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] sm:max-w-xs"
          >
            הזמן עכשיו
          </Link>
        </div>
      </div>
    </main>
  );
}