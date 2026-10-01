"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, MapPin } from "lucide-react";

import { createClient } from "../../../lib/supabase/client";

export default function VerifiedPage() {
  const router = useRouter();

  const [message, setMessage] = useState("בודקים את החשבון שלך...");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function continueAfterVerification() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile after verification error:", profileError);

        setMessage("לא הצלחנו לטעון את החשבון.");

        timer = setTimeout(() => {
          router.replace("/auth");
        }, 1800);

        return;
      }

      if (profile.role === "business") {
        setMessage("החשבון העסקי אומת!");

        timer = setTimeout(() => {
          router.replace("/business/pending");
          router.refresh();
        }, 1400);

        return;
      }

      setMessage("האימייל אומת!");

      timer = setTimeout(() => {
        if (profile.onboarding_completed) {
          router.replace("/");
        } else {
          router.replace("/onboarding/customer");
        }

        router.refresh();
      }, 1400);
    }

    continueAfterVerification();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
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
          <h1 className="mt-6 text-3xl font-black">{message}</h1>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black text-blue-600">
            <LoaderCircle size={17} className="animate-spin" />
            מכינים את FreeSpot עבורך
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-sm font-black text-slate-400">
            <MapPin size={17} />
            מוצאים לך תור פנוי, ברגע הנכון
          </div>
        </div>
      </div>
    </main>
  );
}
