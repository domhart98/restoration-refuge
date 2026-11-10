import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#F8F6FC]">
      <header className="border-b border-[#E8E0F0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#78966A]">
              Restoration Refuge
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#30283D]">
              Studio Dashboard
            </h1>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-[#D9D0E8] px-4 py-2 text-sm font-medium text-[#625080] transition hover:bg-[#F8F6FC]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="text-sm text-gray-600">
            Signed in as {user.email}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#30283D]">
            Welcome to your dashboard
          </h2>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage appointments, services, and availability for your massage
            studio from one place.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Appointments"
            description="View and manage customer bookings."
            status="Coming next"
          />

          <DashboardCard
            title="Availability"
            description="Set the days and times customers can book."
            status="Coming next"
          />

          <DashboardCard
            title="Services"
            description="Review your massage treatments, durations, and prices."
            status="Coming next"
          />
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="text-sm font-medium text-[#6B5A8E] hover:text-[#51416F]"
          >
            ← View public website
          </Link>
        </div>
      </div>
    </main>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  status: string;
}

function DashboardCard({
  title,
  description,
  status,
}: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-[#E8E0F0] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#30283D]">{title}</h3>

      <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600">
        {description}
      </p>

      <span className="mt-5 inline-flex rounded-full bg-[#F0EBF7] px-3 py-1 text-xs font-medium text-[#625080]">
        {status}
      </span>
    </article>
  );
}
