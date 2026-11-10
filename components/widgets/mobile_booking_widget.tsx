
"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";

export default function MobileBookingWidget() {
  return (
    <div className="sm:hidden">
      <Link
        href="/book"
        aria-label="Book an appointment"
        title="Book an appointment"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-1 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <CalendarCheck size={24} strokeWidth={2} />
      </Link>
    </div>
  );
}
