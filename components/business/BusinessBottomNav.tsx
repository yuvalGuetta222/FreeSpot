"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  BriefcaseBusiness,
} from "lucide-react";

export default function BusinessBottomNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/business";
  const isAppointments = pathname === "/business/appointments";
  const isPublish = pathname === "/business/appointments/new";
  const isServices = pathname.startsWith("/business/services");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-around px-3 py-2">
        <Link
          href="/business"
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold ${
            isDashboard ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <LayoutDashboard size={22} />
          <span>דשבורד</span>
        </Link>

        <Link
          href="/business/appointments"
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold ${
            isAppointments ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <CalendarDays size={22} />
          <span>תורים</span>
        </Link>

        <Link
          href="/business/appointments/new"
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold ${
            isPublish ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <CalendarPlus size={22} />
          <span>פרסום</span>
        </Link>
        <Link
          href="/business/services"
          className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold ${
            isServices ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <BriefcaseBusiness size={22} />
          <span>שירותים</span>
        </Link>
      </div>
    </nav>
  );
}
