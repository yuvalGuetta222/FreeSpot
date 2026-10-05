"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  Heart,
  Home,
  UserRound,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "בית",
    icon: Home,
  },
  {
    href: "/bookings",
    label: "הזמנות",
    icon: CalendarDays,
  },
  {
    href: "/favorites",
    label: "מועדפים",
    icon: Heart,
  },
  {
    href: "/saved-businesses",
    label: "שמורים",
    icon: Bookmark,
  },
  {
    href: "/profile",
    label: "פרופיל",
    icon: UserRound,
  },
];

export default function CustomerBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-slate-200 bg-white/95 px-2 pb-[max(9px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl min-[768px]:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active
                  ? "text-blue-600"
                  : "text-slate-400"
              }`}
            >
              <Icon
                size={21}
                fill={
                  active &&
                  (item.href === "/favorites" ||
                    item.href === "/saved-businesses")
                    ? "currentColor"
                    : "none"
                }
              />

              <span
                className={`text-[11px] ${
                  active
                    ? "font-black"
                    : "font-bold"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}