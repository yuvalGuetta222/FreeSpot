import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
} from "lucide-react";
import { appointments } from "../../../../data/appointments";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SuccessPage({ params }: PageProps) {
  const { id } = await params;

  const appointment = appointments.find(
    (item) => item.id === Number(id)
  );

  if (!appointment) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-black">התור לא נמצא</h1>

          <Link
            href="/"
            className="mt-4 inline-block font-black text-blue-600"
          >
            חזרה לעמוד הבית
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] px-4 py-10 text-slate-950"
    >
      <div className="mx-auto max-w-xl">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={42} />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            ההזמנה אושרה
          </h1>

          <p className="mt-2 leading-7 text-slate-500">
            התור נשמר עבורך ב-FreeSpot.
          </p>

          <div className="mt-7 rounded-3xl bg-slate-50 p-5 text-right">
            <p className="text-xs font-black text-blue-600">
              {appointment.category}
            </p>

            <h2 className="mt-1 text-xl font-black">
              {appointment.service}
            </h2>

            <p className="mt-1 font-bold text-slate-500">
              {appointment.business}
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-blue-600" />

                <div>
                  <p className="text-xs text-slate-400">תאריך</p>
                  <p className="font-black">היום</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock3 size={18} className="text-blue-600" />

                <div>
                  <p className="text-xs text-slate-400">
                    שעה ומשך
                  </p>

                  <p className="font-black">
                    {appointment.time} · {appointment.duration}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-blue-600" />

                <div>
                  <p className="text-xs text-slate-400">מיקום</p>

                  <p className="font-black">
                    {appointment.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-sm font-black transition hover:bg-slate-50">
            <Navigation size={17} className="text-blue-600" />
            פתח ניווט
          </button>

          <Link
            href="/"
            className="mt-3 block w-full rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700"
          >
            חזרה למסך הבית
          </Link>
        </section>
      </div>
    </main>
  );
}