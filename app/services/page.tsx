"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-BB", {
    style: "currency",
    currency: "BBD",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      try {
        const response = await fetch("/api/services");

        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const data: { services: Service[] } = await response.json();

        if (isMounted) {
          setServices(data.services);
        }
      } catch (err) {
        console.error("Failed to load services:", err);

        if (isMounted) {
          setError("We couldn't load our services. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedServices = services.reduce<Record<string, Service[]>>(
    (groups, service) => {
      if (!groups[service.name]) {
        groups[service.name] = [];
      }

      groups[service.name].push(service);
      return groups;
    },
    {}
  );

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-emerald-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-lg font-semibold uppercase tracking-[0.25em] text-purple-700">
            Our Treatments
          </p>

          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-purple-950 sm:text-5xl lg:text-6xl">
            Find the right massage for you
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Take time to relax, recover, and restore your wellbeing with a
            treatment suited to your needs.
          </p>

          <a
            href="/book"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-purple-700 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Book Your Massage
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        {isLoading ? (
          <p className="py-12 text-center text-gray-600">
            Loading our treatments...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="text-sm text-red-700">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#75619B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#625080]"
            >
              Try again
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-[#E8E0F0] bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-[#30283D]">
              No services are currently available
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedServices).map(([name, options]) => (
              <article
                key={name}
                className="group flex h-full flex-col rounded-2xl border border-purple-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-xl hover:shadow-purple-900/10"
              >
                <div className="flex-1 pb-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0EBF7] text-xl text-[#75619B]">
                    ✧
                  </div>

                  <h2 className="text-xl font-semibold text-[#30283D]">
                    {name}
                  </h2>

                  {options[0].description && (
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {options[0].description}
                    </p>
                  )}

                  <div className="mt-6 space-y-3">
                    {options.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3"
                      >
                        <span className="text-sm text-gray-600">
                          {service.duration_minutes} minutes
                        </span>

                        <span className="font-semibold text-[#625080]">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/book?serviceId=${options[0].id}`}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-purple-200 px-4 py-3 text-sm font-semibold text-purple-800 transition hover:bg-purple-700 hover:text-white"
                >
                  Book this treatment
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
