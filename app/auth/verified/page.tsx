"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MapPin,
} from "lucide-react";

export default function VerifiedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 text-slate-950"
    >
      <style>{`
        @keyframes verifiedPop {
          0% {
            opacity: 0;
            transform: scale(0.55);
          }

          60% {
            opacity: 1;
            transform: scale(1.12);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes verifiedFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .verified-pop {
          animation: verifiedPop 500ms cubic-bezier(.2,.8,.2,1) both;
        }

        .verified-fade {
          animation: verifiedFade 500ms 250ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .verified-pop,
          .verified-fade {
            animation: none;
          }
        }
      `}</style>

      <div className="text-center">
        <div className="verified-pop mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
          <Check size={48} strokeWidth={3} />
        </div>

        <div className="verified-fade">
          <h1 className="mt-6 text-3xl font-black">
            האימייל אומת!
          </h1>

          <p className="mt-2 text-slate-500">
            החשבון שלך מוכן. מכניסים אותך ל־FreeSpot...
          </p>

          <div className="mt-7 flex items-center justify-center gap-2 text-sm font-black text-blue-600">
            <MapPin size={18} />
            מוצאים לך תור פנוי, ברגע הנכון
          </div>
        </div>
      </div>
    </main>
  );
}