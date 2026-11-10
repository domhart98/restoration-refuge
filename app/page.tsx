import SiteNavigation from "@/components/site_navigation";
import Footer from "@/components/footer";

export default function Home() {

  const services = [
    {
      name: "Swedish Massage",
      description:
        "A relaxing full-body massage designed to help you unwind.",
      duration: "60, 90 or 120 minutes",
      price: "From BBD $100",
      imageSource: "/images/swedish-massage.webp",
    },
    {
      name: "Deep Tissue Massage",
      description:
        "Focused massage using deeper pressure to address muscle tension.",
      duration: "60, 90 or 120 minutes",
      price: "From BBD $120",
      imageSource: "/images/deep-tissue-massage.webp",
    },
    {
      name: "Sports Massage",
      description:
        "Targeted massage for active individuals and hardworking muscles.",
      duration: "60, 90 or 120 minutes",
      price: "From BBD $140",
      imageSource: "/images/sports-massage.webp",
    },
    {
      name: "Express Massage",
      description:
        "A shorter treatment focused on your back, arms and upper body.",
      duration: "30 minutes",
      price: "BBD $65",
      imageSource: "/images/massage.webp",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-800 md:pb-0">

      {/* Hero */}
      <section className="relative px-12 py-12 md:px-24 md:py-16 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-emerald-50">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-purple-700">
              Your space to unwind
            </p>

            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-purple-950 sm:text-5xl lg:text-6xl">
              Restore your body.
              <span className="mt-2 block italic text-purple-700">
                Refresh your mind.
              </span>
            </h1>

            <p className="my-6 max-w-xl text-lg leading-8 text-slate-600">
              Take time for yourself at Restoration Refuge Massage Studio.
              Discover a welcoming space dedicated to relaxation, recovery
              and your wellbeing.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="/book"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-purple-700 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Book Your Massage
              </a>

              <a
                href="/services"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-purple-200 bg-white px-7 py-3 font-semibold text-purple-800 transition hover:bg-purple-50"
              >
                Explore Services
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
              <span>✓ Convenient appointment booking</span>
              <span>✓ Personalised massage options</span>
              <span>✓ Verified & Certified Massage Therapists</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-purple-200/40 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-purple-200/50">
              <img
                src="/images/oil-massage.webp"
                alt="A peaceful massage treatment room"
                className="h-72 w-full rounded-2xl object-cover sm:h-96 md:h-[480px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section id="about" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Welcome to Restoration Refuge
          </p>

          <h2 className="mt-5 font-serif text-3xl leading-snug text-purple-950 md:text-4xl">
            Make time to feel your best.
          </h2>
        </div>

        <div className="mt-8 px-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <span className="text-2xl text-purple-700" aria-hidden="true">✧</span>
            <h3 className="mt-3 font-semibold text-purple-950">
              Personalised Care
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Massage experiences tailored to your needs and preferences.
            </p>
          </div>

          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <span className="text-2xl text-purple-700" aria-hidden="true">♡</span>
            <h3 className="mt-3 font-semibold text-purple-950">
              Relax & Restore
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Take time away from everyday stress and focus on your wellbeing.
            </p>
          </div>

          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <span className="text-2xl text-purple-700" aria-hidden="true">◷</span>
            <h3 className="mt-3 font-semibold text-purple-950">
              Convenient Booking
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose your preferred service and appointment time online.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-purple-50/70 px-10 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-700">
                Our treatments
              </p>

              <h2 className="mt-3 font-serif text-3xl text-purple-950 md:text-4xl">
                Find your moment of relief.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Choose from a selection of massage treatments to suit
                your preferences.
              </p>
            </div>

            <a
              href="/services"
              className="text-purple-700 transition hover:text-purple-900"
            >
              View all services →
            </a>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              
              <article
                key={service.name}
                className="group flex h-full flex-col rounded-2xl border border-purple-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5"
              >
                <img
                  src={service.imageSource}
                  alt="A peaceful massage treatment room"
                  className="rounded-2xl object-cover"
                />
                <div className="p-5 sm:p-6">
                  <h3 className="text-xl font-bold text-purple-950 sm:text-2xl">
                    {service.name}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {service.description}
                  </p>

                  <div className="mt-6 border-t border-purple-100 pt-5">
                    <p className="text-sm text-slate-500">
                      {service.duration}
                    </p>

                    <p className="mt-4 text-2xl tracking-tight text-purple-800">
                      {service.price}
                    </p>

                    <a
                      href="/book"
                      className="mt-5 block rounded-full border border-purple-200 px-4 py-3 text-center text-sm text-purple-800 transition hover:bg-purple-700 hover:text-white"
                    >
                      Book this service
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Booking call to action */}
      <section className="px-6 py-12 md:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 to-purple-600 px-8 py-12 text-center shadow-xl shadow-purple-200 md:px-16 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-200">
            Your time, your wellbeing
          </p>

          <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
            Ready to book your appointment?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-purple-100">
            Choose your preferred treatment and find a suitable
            appointment time.
          </p>

          <a
            href="/book"
            className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-semibold text-purple-800 transition hover:bg-purple-50"
          >
            Book an Appointment
          </a>
        </div>
      </section>
    </main>
  );
}